import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ArticlePanel } from './ArticlePanel';
import type { Article, Constellation } from '../content/types';

const constellation: Constellation = {
  id: 'networking',
  name: 'Networking & Connectivity',
  anchor: { x: 0, y: 0 },
  color: '#7ab8ff',
};

function art(overrides: Partial<Article> = {}): Article {
  return {
    id: 'a1',
    title: 'Test Article',
    constellation: 'networking',
    tags: ['tag-a'],
    summary: 'A summary.',
    stub: false,
    related: [],
    body: '## Diagnostic Steps\n\n1. Run `traceroute`.',
    sourceName: 'a1.md',
    ...overrides,
  };
}

describe('ArticlePanel', () => {
  it('renders title, constellation eyebrow, tags, and markdown body', () => {
    render(
      <ArticlePanel
        article={art()}
        constellation={constellation}
        articlesById={new Map()}
        onNavigate={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('heading', { level: 1, name: 'Test Article' })).toBeInTheDocument();
    expect(screen.getByText('Networking & Connectivity')).toBeInTheDocument();
    expect(screen.getByText('tag-a')).toBeInTheDocument();
    expect(screen.getByText('Diagnostic Steps')).toBeInTheDocument();
    expect(screen.getByText('traceroute')).toBeInTheDocument();
  });

  it('shows the stub badge only for stub articles (FR-6)', () => {
    const { rerender } = render(
      <ArticlePanel
        article={art({ stub: true })}
        constellation={constellation}
        articlesById={new Map()}
        onNavigate={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText(/Stub — procedure to be filled in/)).toBeInTheDocument();
    rerender(
      <ArticlePanel
        article={art({ stub: false })}
        constellation={constellation}
        articlesById={new Map()}
        onNavigate={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.queryByText(/Stub — procedure/)).not.toBeInTheDocument();
  });

  it('navigates via related-article buttons and skips unresolvable ids (FR-7)', () => {
    const target = art({ id: 'a2', title: 'Target Article' });
    const onNavigate = vi.fn();
    render(
      <ArticlePanel
        article={art({ related: ['a2', 'ghost'] })}
        constellation={constellation}
        articlesById={new Map([[target.id, target]])}
        onNavigate={onNavigate}
        onClose={() => {}}
      />,
    );
    const btn = screen.getByRole('button', { name: 'Target Article' });
    fireEvent.click(btn);
    expect(onNavigate).toHaveBeenCalledWith('a2');
    expect(screen.queryByText('ghost')).not.toBeInTheDocument();
  });

  it('calls onClose from the close control', () => {
    const onClose = vi.fn();
    render(
      <ArticlePanel
        article={art()}
        constellation={constellation}
        articlesById={new Map()}
        onNavigate={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Close article' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('moves focus into the panel when it opens (a11y)', () => {
    render(
      <ArticlePanel
        article={art()}
        constellation={constellation}
        articlesById={new Map()}
        onNavigate={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole('complementary', { name: 'Article: Test Article' })).toHaveFocus();
  });

  it('closes on Escape (a11y)', () => {
    const onClose = vi.fn();
    render(
      <ArticlePanel
        article={art()}
        constellation={constellation}
        articlesById={new Map()}
        onNavigate={() => {}}
        onClose={onClose}
      />,
    );
    fireEvent.keyDown(screen.getByRole('complementary', { name: 'Article: Test Article' }), {
      key: 'Escape',
    });
    expect(onClose).toHaveBeenCalled();
  });
});
