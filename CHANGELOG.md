# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

Public, vendor-neutral v1.0.0 line. Work is tracked under milestone v1.0.0
(issues #22–#28). Documentation and the constellation taxonomy now describe the
target vendor-neutral state; the seed articles are being generalized in parallel
(#24) and `npm run check:sensitivity` becomes a hard gate once that lands.

### Added

- **M1 — Live demo.** Static build deployed to GitHub Pages via Actions
  (`.github/workflows/deploy.yml`) with the `/itgkb/` base path. The deploy job
  runs the quality gates before publishing, so a red build can't ship (#8–#10).
- **M2 — Design system.** Ratified visual contract: deep cool-cosmic dark theme,
  Newsreader/Hanken Grotesk/Archivo Narrow type, a coral/sky accent split, and a
  cartographic "instrument" layer (per-constellation catalog IDs, coordinate
  HUD). Reference: `design/DESIGN.md`, `design/tokens.css` (#11–#14).
- **M3 — Visual refinement.** Living-sky twinkle, greedy label collision culling,
  catalog signature on stars, refined article panel and search/list/reset chrome
  (#15–#21).
- **M4 — Vendor-neutral content line.** Content-sensitivity check
  (`npm run check:sensitivity`) and constellation remap to a vendor-neutral
  taxonomy + a Security cluster (#22).
- **Release audit.** Hardening pass against the shipped master tree: idle-gated
  the twinkle render loop (no more perpetual repaint while idle), code-split the
  article panel (lazy `react-markdown`), a full accessibility pass (skip link,
  `<main>` landmark, focus trap on the article dialog, AA contrast, heading
  hierarchy), stronger content validation (constellation JSON schema +
  filename/`id` consistency), and `format:check` wired into the gate.

### Changed

- Constellation taxonomy remapped to vendor-neutral ids for the public line:
  `workspace-email`, `ticketing-itsm`, `dev-environment`, `networking`,
  `accounts-identity`, `hardware-endpoints`, plus a new `security` cluster.
- `npm run gates` now runs `format:check` first and reuses `gates:quality`
  (format · typecheck · lint · test+coverage · content validation) before the
  production build.
- `--faint` token lifted to `#6b7a9a` (4.59:1 on `--ink`) for WCAG AA.

### Notes

- Documentation leads the code on vendor-neutral framing: the taxonomy above is
  the v1.0.0 target and lands in `content/constellations.json` with the M4
  content work (#24).

## [0.1.0] - 2026-08-10

Initial release. An explorable IT knowledge base rendered as a galaxy: every
article is a star, stars cluster into constellations by category, and proximity
signals topical similarity.

### Added

- Content pipeline: articles are markdown files in `content/articles/` with
  validated YAML frontmatter; `npm run validate:content` enforces the schema.
- Galaxy renderer with a curated force layout, constellation line art, halos,
  hover previews, parallax depth, and "Reset view".
- Article reading panel.
- Text search behind a `SearchProvider` seam: in-place dimming of non-matches,
  Enter to fly to the top match, Escape to clear, and a grouped list view
  (automatic on narrow viewports).
- Layout behind a `LayoutProvider` seam so smarter backends can be swapped in
  without UI changes.
- 20 seed articles (17 rich, 3 stubs). Details awaiting maintainer verification
  are marked `(verify)` / `[NEEDS VERIFICATION]`.
- Quality gates (`npm run gates`): typecheck, lint, tests with a coverage floor,
  content validation, and a production build.
- Reduced-motion support and accessibility hardening.

### Notes

- Some seed articles contain `(verify)` / `[NEEDS VERIFICATION]` markers for
  organization-specific details pending maintainer red-pen; the M4 line
  generalizes these (#24).

[Unreleased]: https://github.com/gidde032/itgkb/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/gidde032/itgkb/releases/tag/v0.1.0
