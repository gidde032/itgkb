# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2026-08-21

### Added

- **Constellation line-drawing (issue #39).** Every star is guaranteed at
  least one intra-constellation line: after the greedy tag-overlap pass, orphan
  stars connect to their nearest spatial sibling. Dashed gradient lines between
  `related` articles run from the source constellation color to the target
  constellation color, with two visibility modes — on-selection (clicking a star
  emphasizes its related lines) and a full-overlay toggle via the `R` key or the
  "Related lines" button (top right). Lines dim during search. `DESIGN.md` §8
  documents the line-drawing methodology. 14 new tests.
- **Content ingestion playbook (issue #23).** `content/INGEST.md` — an
  agent-agnostic process document covering inputs, constellation routing with
  keyword mapping, drafting steps, vendor-neutrality rules, the gate checklist,
  and an end-to-end example run. `content/TEMPLATE.md` updated with the current
  7-constellation taxonomy. Example article `bluetooth-pairing-issues.md` added
  (40 → 41 articles).
- **3D showcase renderer (issue #31).** Third view mode behind the
  List · Galaxy · 3D switcher. Stars expand into depth from curated `depth`
  settings in `constellations.json`; related-article lines become arcs curving
  through 3D space; constellation chains carry over from the 2D galaxy via
  shared `links.ts`. Full interaction parity: hover tooltips, click to open the
  article panel, search dimming, camera fly-to. Idle auto-orbit yields to any
  input. AZ/EL HUD tracks camera orientation. WebGL-gated — 3D segment hidden
  if WebGL is unavailable. Renderer is lazy-loaded (~236 KB gz); initial payload
  unchanged. Catalog meta extracted to `src/content/catalog.ts` (behavior-neutral
  refactor shared with the 2D galaxy).
- **Six new articles (41 → 47).** Workspace & Email (10), Hardware & Endpoints
  (8), Networking (7), Files & Storage (6), Security (6), Collaboration &
  Meetings (5), Accounts & Identity (5).

### Fixed

- Modal key guard: `Escape` and `Enter` no longer fire article-panel actions
  when a browser dialog is open.
- Self-referential `related` entries are now rejected by content validation
  instead of silently passing.

## [1.0.0] - 2026-08-13

Public, vendor-neutral release. All seed articles generalized to
organization-agnostic content; `npm run check:sensitivity` is a hard gate.

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
- **Release audit.** Idle-gated the twinkle render loop, code-split the article
  panel (lazy `react-markdown`), a full accessibility pass (skip link, `<main>`
  landmark, focus trap on the article dialog, AA contrast, heading hierarchy),
  stronger content validation (constellation JSON schema + filename/`id`
  consistency), and `format:check` wired into the gate.

### Changed

- Constellation taxonomy remapped to vendor-neutral ids:
  `workspace-email`, `collaboration-meetings`, `files-storage`, `networking`,
  `accounts-identity`, `hardware-endpoints`, `security`.
- `npm run gates` now runs `format:check` first and reuses `gates:quality`
  (format · typecheck · lint · test+coverage · content validation) before the
  production build.
- `--faint` token lifted to `#6b7a9a` (4.59:1 on `--ink`) for WCAG AA.

## [0.1.0] - 2026-07-31

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
- 20 seed articles (17 rich, 3 stubs).
- Quality gates (`npm run gates`): typecheck, lint, tests with a coverage floor,
  content validation, and a production build.
- Reduced-motion support and accessibility hardening.

[Unreleased]: https://github.com/gidde032/itgkb/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/gidde032/itgkb/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/gidde032/itgkb/compare/v0.1.0...v1.0.0
[0.1.0]: https://github.com/gidde032/itgkb/releases/tag/v0.1.0
