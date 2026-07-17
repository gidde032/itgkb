# Phase 1 summary — Walking skeleton

Date: 2026-07-17 (session 2; implementation started session 1)

## Work
- Scaffold: Vite + React 18 + TS strict, ESLint (no-explicit-any as error),
  Prettier, Vitest + RTL, `npm run gates` composite gate.
- Content pipeline: markdown + YAML frontmatter articles loaded via
  import.meta.glob; shared validation library (scripts/validate-lib.mjs) used
  by BOTH the CLI gate and the runtime loader; invalid articles excluded
  loudly (FR-1); 5 articles authored (topics 1, 2, 5, 10, 15).
- Layout: CuratedForceLayout (d3-force, seeded randomSource + hash-based
  initial scatter → fully deterministic; anchors, tag-link attraction within
  constellations, collision). LayoutProvider contract in place (FR-10).
- Galaxy: canvas renderer (bg gradient, glow stars, stub dashed rings,
  zoom-reveal titles, sky-atlas constellation labels), d3-zoom pan/zoom,
  screen-constant hit-testing, selection ring.
- Article panel: markdown body, constellation eyebrow, tags, stub badge,
  related-article navigation, close.
- Gates measured: bundle 124 KB gzip (NF-4 ✓), coverage 89% lines → floor set
  85/85/75/70 with rationale inline in vite.config.ts (NF-5).

## Review findings & fixes (3 lenses: skeptic, frontend/interaction, data-pipeline+testing)
- F1 HIGH fixed: hit radius was world-fixed → unclickable stars zoomed out,
  false grabs zoomed in. Fix: screenHitRadius(k) clamped [6,40]. Regression:
  hitTest.test.ts "screenHitRadius (F1)".
- F2 MED fixed: canvas aria-label promised a nonexistent article list. Fix:
  honest label. Regression: App.test.tsx exact-label assertion.
- F3 MED fixed: frontmatter parsing duplicated CLI vs app (drift risk). Fix:
  parseFrontmatterBlock in validate-lib.mjs, both consumers import.
  Regression: validate-lib.test.ts "parseFrontmatterBlock (F3)".
- F5 LOW fixed: related-field validation branches untested → tests added.
- F4 LOW deferred: duplicate console.error under StrictMode dev double-render.
  Dev-only cosmetic; revisit only if it confuses content debugging.

## Deviations (recorded at decision time)
- Keyboard access to open articles deferred to Phase 4 list view; canvas is
  pointer-only in P1–P3. Spec's a11y quality floor met partially (focus
  styles, reduced-motion, honest labels in place).
- SearchProvider interface not yet created (spec §5 shows it in the tree);
  deliberately deferred to Phase 3 when its first implementation lands, to
  avoid speculative code. Spec-drift audit should confirm it exists by then.
- Internal docs committed rather than gitignored (bootstrap deviation,
  rationale in CLAUDE.md).

## How the agent was used
Single session-spanning agent; reviews were same-session persona passes
(OQ-W1 adaptation — no subagent tool). The lens discipline still surfaced one
High finding (F1) that implementation-mindset missed.
