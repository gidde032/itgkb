import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';

// Review repair regression (a11y #5): while the 3D chunk is fetching, the
// fallback must be an announced status region, not a silent generic div.
// The showcase module is mocked as a NEVER-resolving promise so the Suspense
// fallback stays mounted.
vi.mock('../showcase/ShowcaseCanvas', () => new Promise<never>(() => {}));
vi.mock('./webgl', () => ({ hasWebGL: () => true }));

import { App } from './App';

describe('3D lazy-load fallback (a11y)', () => {
  it('announces the chunk load as a polite status region', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: '3D' }));
    const status = await screen.findByRole('status');
    expect(status).toHaveTextContent('Loading 3D view');
  });
});
