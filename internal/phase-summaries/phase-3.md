# Phase 3 summary — Search

Date: 2026-07-17 (session 2)

## Work
- SearchProvider contract (src/search/types.ts) + TextSearch: case-insensitive
  substring over title/tags/summary/body, AND semantics per term, weighted
  scoring (title 4 / tags 3 / summary 2 / body 1), deterministic tie-break
  (FR-8, FR-10 — semantic backend can swap in without UI changes).
- Overlay search bar: live match count, Enter opens top match, Escape clears.
- In-place dimming: non-matching stars drop to 15% alpha, their labels hide,
  links with an unmatched endpoint fade — no separate list view (FR-8).
- FR-7 fly-to: related-article links and search-Enter animate the view to the
  target star (500 ms) and open its panel.

## Review findings & fixes
- P3-F1 MED fixed: matchIds/selectedId in the setup effect's deps caused full
  teardown (zoom, listeners, ResizeObserver, canvas bitmap reset) on every
  keystroke. Fix: draw state in refs + lightweight redraw effect; setup runs
  once per content change. Regression: App.test.tsx asserts ResizeObserver is
  constructed exactly once across 5 keystrokes.
- Accepted behaviors (not defects, recorded): dimmed stars stay hoverable and
  clickable; fly-to centers on pre-parallax position (few-px error).

## Deviations
- Keyboard reach improved beyond plan: search + Enter now opens any article
  without a pointer, partially closing the P1 keyboard-access deviation ahead
  of Phase 4's list view.

## Gates
59 tests green; coverage above floor; validation ✓; build ✓.
