# Phase 4 summary — Full content + list fallback

Date: 2026-07-17 (session 3; article authoring finished in session 2's tail)

## Work
- Content complete: all 20 seed articles across 6 constellations. 14 rich
  (drafted from SPEC seed summaries per kickoff decision 0b, uncertain
  specifics marked "(verify)"), 6 stubs (TDX ×3, account-access, printer,
  hardware-intake) each naming exactly what a Service Center employee must
  fill in. Related-link graph woven across constellations.
- NF-7 fallback: useNarrowViewport (matchMedia, <900px) swaps GalaxyCanvas
  for ListView — grouped by constellation in config order, titles sorted,
  search-filtered by the same matchIds, keyboard-accessible buttons, stub
  badges, empty state. Panel goes full-width on narrow; reset-view hidden.
- App integration test upgraded from ">=5 articles" to exact contract:
  20 articles, 6 stubs, every constellation populated.

## Review findings & fixes
- P4-F2 LOW fixed: asymmetric related graph — gcal-event-couldnt-update now
  forward-links gcal-external-sharing. (Validator passes; symmetry is not
  enforced by design, this was a usefulness fix.)
- P4-F3 LOW fixed: stale "later content batch" phrasing + empty related in
  node-vite-version-mismatch.
- P4-F4 LOW fixed: live media-query switching untested → regression test
  toggles the stubbed matchMedia mid-session and asserts the view swap.
- Accepted behavior (recorded): article opened from the list becomes the
  fly-to target if the user widens to canvas — continuity, not a bug.
- Expected assertion churn: 'traceroute' search count 1 → 2 with the new
  networking article (exact-count update rule, verification-discipline).

## Deviations
- None. P1's keyboard-access deviation is now closed: list view (narrow) +
  search/Enter (wide) give full keyboard paths to every article.

## Gates
67 tests green; coverage above floor; validation ✓ (20/6); build ✓.
