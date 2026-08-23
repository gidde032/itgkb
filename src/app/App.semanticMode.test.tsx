import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { App } from './App';
import { loadContent } from '../content/load';
import { loadSemanticMap } from '../content/semanticMap';

// #29 decisions 3a + 5a: the semantic artifact is the default grouping and
// layout; the curated force layout is the fallback when the artifact is
// unusable. The mock lets tests kill the artifact without touching the
// committed file; every other export passes through untouched.
const semanticState = vi.hoisted(() => ({ usable: true }));
vi.mock('../content/semanticMap', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../content/semanticMap')>();
  return {
    ...actual,
    loadSemanticMap: () => (semanticState.usable ? actual.loadSemanticMap() : null),
  };
});

// A genuinely migrated article (authored ≠ mapped) from the real artifact.
// Static during a test run; the suite skips if curation and semantics ever
// fully agree — the assertions only make sense for a migrated star.
const { articles, constellations } = loadContent();
const realMap = loadSemanticMap();
const migrated = realMap
  ? articles
      .map((a) => ({
        article: a,
        mapped: realMap.stars.find((s) => s.id === a.id)?.constellation,
      }))
      .find((x) => x.mapped !== undefined && x.mapped !== x.article.constellation)
  : undefined;
const describeIfMigrated = migrated ? describe : describe.skip;

function openListView(): void {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /List/ }));
}

function groupSectionHeading(constellationId: string): HTMLElement {
  const name = constellations.find((c) => c.id === constellationId)!.name;
  const heading = screen.getByRole('heading', { level: 2, name });
  return heading.closest('section')!;
}

describeIfMigrated('semantic layout wiring (#29)', () => {
  beforeEach(() => {
    semanticState.usable = true;
  });

  it('groups a migrated article under its semantic constellation', () => {
    openListView();
    expect(groupSectionHeading(migrated!.mapped!).textContent).toContain(migrated!.article.title);
    expect(groupSectionHeading(migrated!.article.constellation).textContent).not.toContain(
      migrated!.article.title,
    );
  });

  it('falls back to authored grouping when the artifact is unusable (5a)', () => {
    semanticState.usable = false;
    openListView();
    expect(groupSectionHeading(migrated!.article.constellation).textContent).toContain(
      migrated!.article.title,
    );
    expect(groupSectionHeading(migrated!.mapped!).textContent).not.toContain(
      migrated!.article.title,
    );
  });

  it('still renders the galaxy without content errors while the artifact is unusable', () => {
    semanticState.usable = false;
    render(<App />);
    expect(
      screen.getByRole('img', { name: 'Interactive galaxy map of IT knowledge articles' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
