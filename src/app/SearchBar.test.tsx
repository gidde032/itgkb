import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SearchBar } from './SearchBar';

describe('SearchBar', () => {
  it('reports typed queries and shows a match count (FR-8)', () => {
    const onChange = vi.fn();
    render(
      <SearchBar query="" matchCount={3} onChange={onChange} onOpenTopMatch={() => {}} onClear={() => {}} />,
    );
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search articles' }), {
      target: { value: 'calendar' },
    });
    expect(onChange).toHaveBeenCalledWith('calendar');
    expect(screen.getByRole('status')).toHaveTextContent('3 stars');
  });

  it('shows an actionable empty state', () => {
    render(
      <SearchBar query="zz" matchCount={0} onChange={() => {}} onOpenTopMatch={() => {}} onClear={() => {}} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('No matching stars');
  });

  it('opens the top match on Enter and clears on Escape', () => {
    const onOpenTopMatch = vi.fn();
    const onClear = vi.fn();
    render(
      <SearchBar query="q" matchCount={2} onChange={() => {}} onOpenTopMatch={onOpenTopMatch} onClear={onClear} />,
    );
    const input = screen.getByRole('searchbox', { name: 'Search articles' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onOpenTopMatch).toHaveBeenCalledOnce();
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('hides the count when no search is active', () => {
    render(
      <SearchBar query="" matchCount={null} onChange={() => {}} onOpenTopMatch={() => {}} onClear={() => {}} />,
    );
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
