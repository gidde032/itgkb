import { useCallback, useEffect, useRef } from 'react';
import type { Article, Constellation } from '../content/types';
import type { MatchResult } from '../search/types';

export interface SearchDropdownProps {
  matches: MatchResult[];
  articlesById: ReadonlyMap<string, Article>;
  constellationsById: ReadonlyMap<string, Constellation>;
  onSelect: (id: string) => void;
  onClose: () => void;
}

export function SearchDropdown({
  matches,
  articlesById,
  constellationsById,
  onSelect,
  onClose,
}: SearchDropdownProps): JSX.Element {
  const listRef = useRef<HTMLUListElement>(null);

  const onKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }
      const list = listRef.current;
      if (!list) return;
      const items = list.querySelectorAll<HTMLButtonElement>('button');
      const focused = document.activeElement as HTMLElement;
      const idx = Array.from(items).indexOf(focused as HTMLButtonElement);

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = idx < items.length - 1 ? idx + 1 : 0;
        items[next]?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = idx > 0 ? idx - 1 : items.length - 1;
        items[prev]?.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    const searchInput = document.getElementById('article-search');
    if (!searchInput) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const first = listRef.current?.querySelector<HTMLButtonElement>('button');
        first?.focus();
      }
    };
    searchInput.addEventListener('keydown', handler);
    return () => searchInput.removeEventListener('keydown', handler);
  }, []);

  return (
    <div
      className="search-dropdown"
      role="listbox"
      aria-label="Search results"
      onKeyDown={onKeyDown}
    >
      <ul ref={listRef}>
        {matches.map((m) => {
          const a = articlesById.get(m.id);
          if (!a) return null;
          const c = constellationsById.get(a.constellation);
          return (
            <li key={a.id} role="option" aria-selected={false}>
              <button type="button" onClick={() => onSelect(a.id)}>
                <span className="search-dropdown__title">{a.title}</span>
                {c && (
                  <span className="search-dropdown__constellation" style={{ color: c.color }}>
                    {c.name}
                  </span>
                )}
                <span className="search-dropdown__summary">{a.summary}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
