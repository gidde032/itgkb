# Phase 2 summary — Constellations & star craft

Date: 2026-07-17 (session 2)

## Work
- Constellation line art: computeConstellationLinks — shared-tag pairs ranked
  by strength, greedy degree-2 cap → sparse sky-chart figures (FR-3).
- Region halos per constellation (accent color, low alpha) + letterspaced
  atlas labels moved above the halo.
- Hover previews: tooltip (title + summary) anchored to the star's screen
  position; pointer cursor; emphasized star on hover (FR-5 hover half).
- Depth: parallax via displayPositions — ONE function feeds both drawing and
  hit-testing (guards against F1-class divergence); deterministic background
  dust (140 points) on the same parallax transform.
- Reset view button with 450 ms d3-transition (FR-9). New dep: d3-transition.

## Review findings & fixes
- P2-F1 MED fixed: tooltip detached from its star when zooming/panning while
  hovered. Fix: shared clearHover() called from zoom handler + mouseleave.
  Regression note: jsdom can't drive d3-zoom wheel events; the shared
  clearing path is exercised via the mouseleave route in component behavior,
  and the zoom-handler branch is manual-verify — recorded as an accepted
  coverage gap (verification-discipline honesty rule) rather than papered
  over with a sham test.
- P2-F2 LOW fixed: dust drawn without the parallax it claimed. Fix: dust runs
  through displayPositions. Regression: display.test.ts "(P2-F2)".

## Deviations
- None beyond the recorded P2-F1 coverage gap.

## Gates
46 tests green; coverage above floor; bundle 126 KB gzip; validation ✓.
