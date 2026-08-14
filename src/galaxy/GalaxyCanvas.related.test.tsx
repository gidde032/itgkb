import { describe, expect, it } from 'vitest';
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
  selectedId: null,
  onSelect: () => {},
  matchIds: null,
  focus: null,
};

const overlayButton = () => screen.getByRole('button', { name: /Related lines/ });

describe('related-lines overlay interaction (v1.1 audit H2)', () => {
  it('renders the Related lines toggle button with aria-pressed state', () => {
    render(<GalaxyCanvas {...baseProps} />);
    const button = overlayButton();
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('clicking the toggle button flips aria-pressed', () => {
    render(<GalaxyCanvas {...baseProps} />);
    const button = overlayButton();
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(button);
    expect(button).toHaveAttribute('aria-pressed', 'false');
  });

  it('pressing R toggles the overlay', () => {
    render(<GalaxyCanvas {...baseProps} />);
    fireEvent.keyDown(document.body, { key: 'r', bubbles: true });
    expect(overlayButton()).toHaveAttribute('aria-pressed', 'true');
    fireEvent.keyDown(document.body, { key: 'R', bubbles: true });
    expect(overlayButton()).toHaveAttribute('aria-pressed', 'false');
  });

  it('suppresses R while typing in an input field', () => {
    render(<GalaxyCanvas {...baseProps} />);
    const input = document.createElement('input');
    document.body.appendChild(input);
    fireEvent.keyDown(input, { key: 'r', bubbles: true });
    expect(overlayButton()).toHaveAttribute('aria-pressed', 'false');
    input.remove();
  });

  it('suppresses R when modifier keys are held (browser shortcuts)', () => {
    render(<GalaxyCanvas {...baseProps} />);
    for (const mods of [{ ctrlKey: true }, { metaKey: true }, { altKey: true }]) {
      fireEvent.keyDown(document.body, { key: 'r', bubbles: true, ...mods });
    }
    expect(overlayButton()).toHaveAttribute('aria-pressed', 'false');
  });

  // H1 regression: the article panel is an aria-modal dialog; keystrokes while
  // it is open must not toggle the overlay invisibly behind it.
  it('does not toggle the overlay via R while the article panel is open (H1)', () => {
    render(<GalaxyCanvas {...baseProps} selectedId="s1" />);
    fireEvent.keyDown(document.body, { key: 'r', bubbles: true });
    expect(overlayButton()).toHaveAttribute('aria-pressed', 'false');
  });
});
