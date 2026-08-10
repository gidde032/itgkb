# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-10

Initial release. An explorable IT knowledge base for the Carlson IT Service
Center, rendered as a galaxy: every article is a star, stars cluster into
constellations by category, and proximity signals topical similarity.

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
- 20 seed articles plus 6 stubs across UMN, Google Workspace, TDX, networking,
  and local-dev-environment constellations. Details awaiting maintainer
  verification are marked `(verify)` / `[NEEDS VERIFICATION]`.
- Quality gates (`npm run gates`): typecheck, lint, tests with a coverage floor,
  content validation, and a production build.
- Reduced-motion support and accessibility hardening.

### Notes
- Some seed articles contain `(verify)` / `[NEEDS VERIFICATION]` markers for
  Carlson/UMN-specific details pending maintainer red-pen.

[0.1.0]: https://github.com/gidde032/carlson-IT-galactic-wiki/releases/tag/v0.1.0
