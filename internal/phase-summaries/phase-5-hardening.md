# Phase 5 (hardening) — audit slices A1–A4

Date: 2026-07-17 (session 3). Status: fixes complete; MAINTAINER RED-PEN
PENDING; v0.1.0 tag held until red-pen content lands.

## Audit verdicts
Spec-drift: all FRs conform; both provider contracts in place; budgets met
(bundle ~127 KB gzip). Accepted/documented: committed internal docs
(deliberate), P2-F1 manual-verify gap, F4 dev-only double-log, related-link
asymmetry allowed.

## Slices (maintainer-approved) & regression tests
- A1 MED: prefers-reduced-motion now reaches canvas — motionDuration() wraps
  both d3 transitions (fly-to 500, reset 450 → 0 when reduced).
  Test: motion.test.ts. Test infra: matchMedia stub made query-aware.
- A2 MED: search rewritten — normalizeSearchText (apostrophes removed,
  punctuation → space) on query AND haystacks; AND pass first; zero-result
  multi-term queries fall back to matched-term-count ranking flagged
  partial:true; SearchBar labels these "close matches". MatchResult gained
  optional `partial` (backward-compatible; SearchProvider contract intact).
  Tests: textSearch.test.ts (A2 suite), SearchBar labeling, App end-to-end
  ("calendar wont update" → opens the couldn't-be-updated article).
- A3 LOW: star-title threshold 0.9 → 0.75 with earlier alpha ramp; titles
  legible at initial k=0.8. Test: drawLabels.test.ts via recording ctx.
- A4 LOW: desktop "List view" toggle (folded in — ListView pre-existed, ~30
  lines; no ROADMAP.md needed). Hidden on narrow where list is forced.
  Tests: toggle round-trip + narrow-hides-toggle.

## Notes
- Search normalizes all haystacks per keystroke (~60 KB regex work at current
  content size) — fine now; memoize normalized haystacks if content grows 10x.
