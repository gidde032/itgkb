import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import { GalaxyCanvas } from './GalaxyCanvas';
import type { StarPosition } from '../layout/types';

// v1.1 audit (H2): the related-lines overlay interaction layer — R keyboard
// shortcut, toggle button — had zero regression coverage. A regression in any
// of these paths would previously pass the whole suite.

const baseProps = {
  articles: [],
  constellations: [],
  positions: [] as StarPosition[],
  semanticEdges: null,
  selectedId: null,
  onSelect: () => {},
  matchIds: null,
  focus: null,
  showRelatedOverlay: false,
  onToggleRelatedOverlay: () => {},
};

function ControlledGalaxy(): JSX.Element {
  const [visible, setVisible] = useState(false);
  return (
    <GalaxyCanvas
      {...baseProps}
      showRelatedOverlay={visible}
      onToggleRelatedOverlay={() => setVisible((value) => !value)}
    />
  );
}

const overlayButton = () => screen.getByRole('button', { name: /Related lines/ });

describe('related-lines overlay interaction (v1.1 audit H2)', () => {
  it('renders the Related lines toggle button with aria-pressed state', () => {
    render(<GalaxyCanvas {...baseProps} />);
    const button = overlayButton();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking the toggle button flips aria-pressed', () => {
    render(<ControlledGalaxy />);
    const button = overlayButton();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('delegates overlay changes to the shared app-level controller', () => {
    const onToggle = vi.fn();
    render(<GalaxyCanvas {...baseProps} onToggleRelatedOverlay={onToggle} />);
    fireEvent.click(overlayButton());
    expect(onToggle).toHaveBeenCalledOnce();
  });

  // H1 regression: the article panel is an aria-modal dialog; keystrokes while
  // it is open must not toggle the overlay invisibly behind it.
  // INVALID: PRESSING R WHEN ARTICLE PANEL IS OPEN SHOULD REVEAL RELATED LINKS
  /**it('does not toggle the overlay via R while the article panel is open (H1)', () => {
    render(<GalaxyCanvas {...baseProps} selectedId="s1" />);
    fireEvent.keyDown(document.body, { key: 'r', bubbles: true });
    expect(overlayButton()).toHaveAttribute('aria-pressed', 'false');
  });**/
});
