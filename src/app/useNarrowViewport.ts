import { useEffect, useState } from 'react';

/**
 * NF-7: below this width the pan/zoom canvas is a poor experience, so the app
 * swaps to a grouped list. 900px chosen to catch tablets-portrait and phones.
 */
export const NARROW_BREAKPOINT_PX = 900;

export function useNarrowViewport(breakpointPx: number = NARROW_BREAKPOINT_PX): boolean {
  const query = `(max-width: ${breakpointPx - 1}px)`;
  const [narrow, setNarrow] = useState<boolean>(() => window.matchMedia(query).matches);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => setNarrow(e.matches);
    mql.addEventListener('change', onChange);
    setNarrow(mql.matches);
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}
