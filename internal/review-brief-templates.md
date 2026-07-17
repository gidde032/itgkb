# Reviewer brief templates — IT Knowledge Galaxy

Root: /home/claude/it-knowledge-galaxy. Stack: Vite + React 18 + TS, canvas 2D,
d3-force/d3-zoom, markdown content in content/articles/. Spec: SPEC.md.
Review against files + SPEC only. Cap: 12 findings, each = severity(H/M/L) +
file:line + claim + why it matters. Name false alarms explicitly.

## Standing reviewer (every phase): Skeptical senior engineer
Assume the implementation is hiding at least one real defect. Hunt: state bugs,
race/async issues, hit-testing math, resource leaks (canvas/RAF/listeners),
error handling on malformed content, silent failure paths (FR-1).

## Rotating specialists (pick 2 by surface)
- Frontend/interaction: canvas rendering correctness, zoom/pan transform math,
  event handling, React re-render hygiene, accessibility of panel/list view.
- Data/content-pipeline: frontmatter parsing edge cases, validation completeness
  (FR-11), id resolution, determinism of layout, schema drift.
- Testing/CI: gate coverage, test quality (do tests assert contracts?), smoke
  inventory, coverage floor honesty.

## End-of-version audit lenses
- Spec-drift: SPEC section-by-section vs code → FIX / DOCUMENT / ACCEPT.
- User-friction: cold walkthrough as a student employee mid-ticket; note every
  hesitation.
