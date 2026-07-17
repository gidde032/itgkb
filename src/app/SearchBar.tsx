import type { ChangeEvent, KeyboardEvent } from 'react';

export interface SearchBarProps {
  query: string;
  matchCount: number | null;
  onChange: (query: string) => void;
  onOpenTopMatch: () => void;
  onClear: () => void;
}

export function SearchBar({
  query,
  matchCount,
  onChange,
  onOpenTopMatch,
  onClear,
}: SearchBarProps): JSX.Element {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') onOpenTopMatch();
    if (e.key === 'Escape') onClear();
  };
  return (
    <div className="search-bar">
      <input
        type="search"
        value={query}
        placeholder="Search articles…"
        aria-label="Search articles"
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
      />
      {matchCount !== null && (
        <span className="search-bar__count" role="status">
          {matchCount === 0
            ? 'No matching stars'
            : `${matchCount} star${matchCount === 1 ? '' : 's'} — Enter opens the top match`}
        </span>
      )}
    </div>
  );
}
