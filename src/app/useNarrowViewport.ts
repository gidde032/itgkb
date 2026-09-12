import { useEffect, useRef, useState } from 'react';

/**
 * NF-7: below this width the pan/zoom canvas is a poor experience, so the app
 * swaps to a grouped list. 900px chosen to catch tablets-portrait and phones.
 */
export const NARROW_BREAKPOINT_PX = 900;

export type NarrowViewportChangeHandler = (narrow: boolean) => void;

export function useNarrowViewport(
  breakpointPx: number = NARROW_BREAKPOINT_PX,
  onViewportChange?: NarrowViewportChangeHandler,
): boolean {
  const query = `(max-width: ${breakpointPx - 1}px)`;
  const [narrow, setNarrow] = useState<boolean>(() => window.matchMedia(query).matches);
  const narrowRef = useRef(narrow);
  const onViewportChangeRef = useRef(onViewportChange);
  narrowRef.current = narrow;
  onViewportChangeRef.current = onViewportChange;

  useEffect(() => {
    const mql = window.matchMedia(query);
    const onChange = (e: MediaQueryListEvent) => {
      // MediaQueryList normally only emits on a real transition. Keeping this
      // guard also makes the hook safe for lightweight test/browser shims that
      // dispatch their listeners when the value is unchanged.
      if (e.matches === narrowRef.current) return;
      narrowRef.current = e.matches;
      // This runs before React swaps the responsive branch, allowing the app
      // to preserve focus while the old DOM surface still exists.
      onViewportChangeRef.current?.(e.matches);
      setNarrow(e.matches);
    };
    mql.addEventListener('change', onChange);
    if (mql.matches !== narrowRef.current) {
      narrowRef.current = mql.matches;
      setNarrow(mql.matches);
    }
    return () => mql.removeEventListener('change', onChange);
  }, [query]);
  return narrow;
}
