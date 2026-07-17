# IT Knowledge Galaxy — Spec & Phase Outline

Status: APPROVED v1 (2026-07-17) with amendments: budgets softened to sanity
checks; no AI/semantic features in any near-term version; prototype speed
prioritized.
Maintainer: solo (Carlson IT Service Center student employee)
Repo visibility: private. No hosting. Sharing model: coworkers get repo access
and run locally (`git clone` → `npm install` → `npm run dev`); README must
make this a 3-command experience.

---

## 1. Overview

**Vision.** An explorable, wiki-style IT knowledge base rendered as a 2.5D galaxy:
each article is a glowing star, stars cluster into named constellations by
category, proximity reflects topical similarity, and a search bar dims
non-matching stars in place. Part Wikipedia, part star chart — visually inspired
by Constellate, adapted from imported chat logs to curated IT support articles.

**Target user.** The maintainer (and eventually coworkers at the Carlson IT
Service Center): student IT support employees looking up procedures mid-ticket
and new hires ramping up.

**Success criteria (MVP).** All 20 seed articles render as stars in 6
constellations; stub articles are visually distinct; clicking a star opens the
full article with rendered markdown; search filters/dims in place across
title/tags/summary/body; the galaxy pans and zooms smoothly; content is
authored in plain markdown files that are trivial to add/edit.

**Explicitly out of MVP scope** (extensibility hooks — architecture must not
block them): AI/semantic search, auto-suggested related articles, TDX
integration, AI authoring assistant, analytics, multi-user contribution flow.

## 2. Stack

| Layer | Choice | Rationale |
|---|---|---|
| Build/runtime | Vite + React 18 + TypeScript | Fastest path to working; standard for maintainer's prior projects; extensibility hooks (AI search, TDX) need a real app structure, not a single-file build |
| Galaxy rendering | HTML `<canvas>` 2D, custom renderer | Glow, dimming, constellation lines, and labels are crisp and cheap in canvas; no WebGL/Three.js risk in MVP. Depth cues via z-jitter, parallax on pan, size/brightness falloff ("2.5D") |
| Layout simulation | `d3-force` (+ `d3-zoom` for pan/zoom) | Battle-tested force simulation; curated anchors + tag-similarity links; runs once at load, positions cached |
| Article content | Markdown files with YAML frontmatter, one per article, loaded via Vite `import.meta.glob(..., { query: '?raw' })` | Human-editable, git-diffable, zero build script; natural path to PR-based contribution later |
| Frontmatter parsing | Tiny in-repo parser (or `js-yaml` if edge cases demand) | Frontmatter schema is small and controlled |
| Markdown rendering | `react-markdown` | Standard, safe (no `dangerouslySetInnerHTML`) |
| State | React state + context; no state library | 20–100 articles; keep it light |
| Testing | Vitest + React Testing Library | Vite-native, fast |
| Lint/format | ESLint + Prettier | Standard gates |

**Rendering-swap contract:** the layout engine outputs plain
`{ id, x, y, z }` positions consumed by a renderer interface. A future 3D
"showcase mode" (react-three-fiber) is a new renderer against the same
positions, not a rewrite.

## 3. Functional requirements

- **FR-1** The tool must load all articles from `content/articles/*.md` at
  startup and reject none silently (invalid articles produce a visible console
  error and are excluded with a warning).
- **FR-2** Each article must carry frontmatter: `id`, `title`, `constellation`,
  `tags[]`, `summary`, `stub` (bool, default false), `related[]` (article ids).
  Body sections follow the article template (Diagnostic Steps, Resolution
  Steps, Notes/Edge Cases as applicable).
- **FR-3** The galaxy view must render one star per article, clustered into its
  constellation's region, with constellation labels and intra-cluster
  connecting lines between closely related stars (constellation line art).
- **FR-4** Star proximity within a constellation must reflect tag overlap
  (shared tags attract). Cross-constellation placement is curated via a
  per-constellation anchor config.
- **FR-5** Hover (desktop) must show a preview: title + summary. Click must
  open a side panel with the full rendered article.
- **FR-6** Stub articles must be visually distinct (dimmer star, dashed ring)
  and labeled "Stub — procedure to be filled in" in the article panel.
- **FR-7** The article panel's Related Articles must be clickable and navigate
  the galaxy to the target star (pan/zoom transition + open panel).
- **FR-8** A search bar overlaid on the galaxy must, as the user types, dim
  non-matching stars and highlight matches in place — no separate list view.
  Matching covers title, tags, summary, and full body text (case-insensitive
  substring at minimum; simple relevance ranking of matches is a plus).
- **FR-9** The galaxy must be pannable and zoomable with smooth transitions
  (wheel/trackpad zoom, drag pan, double-click or button to reset view).
- **FR-10** Layout and search must sit behind provider interfaces
  (`LayoutProvider`, `SearchProvider`) so semantic/embedding versions can be
  swapped in without UI changes.
- **FR-11** A content-validation script (`npm run validate:content`) must check
  every article for required frontmatter fields, unique ids, known
  constellation ids, and that every `related` id resolves. It must exit
  non-zero on any violation.
- **FR-12** The MVP ships with the 20 seed articles: 14 rich (drafted from
  seed summaries, marked for red-pen review) and 6 stubs (7–9, 18–20).

## 4. Non-functional budgets

Maintainer direction (kickoff round 2): budgets are **sanity checks, not
strict gates** — the bar is "works and performs reasonably well on regular
computers." Numbers below are targets to measure against the Phase 1 walking
skeleton; only test coverage and content validation are hard gates.

- **NF-1** Cold load to interactive galaxy: **< 2.0 s** on dev laptop,
  production build served locally. PROVISIONAL.
- **NF-2** Pan/zoom frame rate: **≥ 50 fps** with 100 stars. PROVISIONAL.
- **NF-3** Search keystroke-to-visual-update: **< 50 ms** at 100 articles.
  PROVISIONAL.
- **NF-4** Production JS bundle: **< 400 KB gzipped**. PROVISIONAL.
- **NF-5** Test coverage floor: set by measuring after Phase 1, then ratcheted
  (floor recorded in gate config with rationale inline).
- **NF-6** Scale target: the design must stay within budgets at **100
  articles** (5× seed set) without architectural change.
- **NF-7** Graceful degradation: below 900 px viewport width, fall back to a
  searchable list view grouped by constellation (galaxy hidden). Desktop is
  primary.

## 5. Schema / design

### Article frontmatter schema

```yaml
id: gcal-event-couldnt-update        # unique, kebab-case
title: 'Google Calendar: "Event couldn''t be updated" error'
constellation: google-workspace       # one of the constellation ids
tags: [google-calendar, sharing, external-domains, admin-console]
summary: One-to-two sentence summary shown on hover.
stub: false
related: [gcal-cannot-be-shown, gcal-external-sharing]
```

Body: markdown with conventional H2 sections — `## Diagnostic Steps`,
`## Resolution Steps`, `## Notes / Edge Cases`. Not machine-enforced in MVP
(validation checks frontmatter only); template lives in
`content/TEMPLATE.md`.

### Constellations (6, per kickoff decision)

| id | Name | Seed stars |
|---|---|---|
| google-workspace | Google Workspace | 1–6 |
| tdx | TDX Ticketing | 7–9 (stubs) |
| dev-environment | Development Environment | 10–14, **17** (moved from Networking per kickoff) |
| networking | Networking & Connectivity | 15–16 |
| account-access | Account & Access | 18 (stub) |
| hardware | Hardware & Peripherals | 19–20 (stubs) |

Constellation config (`content/constellations.json`): id, display name, anchor
position (curated), accent color.

### Module boundaries

```
src/
  content/        loader + frontmatter parser + validation logic (shared with script)
  layout/         LayoutProvider interface; CuratedForceLayout (d3-force) impl
  search/         SearchProvider interface; TextSearch impl
  galaxy/         canvas renderer, interaction (d3-zoom), hover/click hit-testing
  article/        article panel, markdown rendering, related-link navigation
  app/            shell, state, list-view fallback
content/
  articles/*.md   the knowledge base
  constellations.json
  TEMPLATE.md
scripts/
  validate-content.mjs
```

**Contracts:** `LayoutProvider.layout(articles, constellations) →
Position[]`; `SearchProvider.search(query, articles) → MatchResult[]` (id +
score + matched fields). The galaxy renderer consumes positions + match state
only — it never inspects article bodies.

## 6. Phase outline (each ends usable)

- **Phase 1 — Walking skeleton.** Scaffold (Vite/React/TS, ESLint, Prettier,
  Vitest), content pipeline (loader, parser, validation script), 5 real
  articles authored, basic galaxy: stars at curated-force positions, pan/zoom,
  click opens panel with rendered markdown. Gates defined and measured here
  (Step 3 of bootstrap folds in). *Usable: browse a mini-KB in a galaxy.*
- **Phase 2 — Constellations & star craft.** Cluster regions, labels, accent
  colors, intra-cluster line art, glow rendering, hover previews, stub
  styling, depth cues (z-jitter, parallax, brightness falloff), reset-view.
  *Usable: the galaxy looks like the vision.*
- **Phase 3 — Search.** Overlay search bar, in-place dim/highlight across all
  fields, keystroke budget met, related-article navigation (FR-7).
  *Usable: find any article in seconds.*
- **Phase 4 — Full content + list-view fallback.** All 20 seed articles
  authored (14 rich + 6 stubs), narrow-viewport list fallback, content
  validation wired into gates. *Usable: the real KB, anywhere.*
- **Phase 5 — Hardening pass (end-of-version).** Not a phase: dual-lens audit
  (spec-drift + user-friction), ranked findings, maintainer picks slices.
  Ends with v0.1.0 tag. Red-pen content review by maintainer happens here or
  after.

Bundling note: Phases 2 and 3 share the renderer surface (dimming touches star
drawing), so they stay serial per the bundling precondition.

## 7. Risks

- **Canvas hit-testing + hover on overlapping stars** — mitigate with minimum
  star spacing in the force sim (collision force).
- **Force layout instability** (positions shift run-to-run) — seed the RNG /
  cache positions after first settle so the galaxy is stable across loads.
- **Article drafting fidelity** — articles are drafted from seed summaries,
  not source conversations (kickoff decision 0b); maintainer red-pens
  post-MVP and will supply conversation-history reports to re-anchor content.
- **Session boundaries** — container filesystem resets between sessions; the
  handoff file + repo zip delivered at every checkpoint is the continuity
  mechanism.

## 8. Open questions (deferred, labeled)

- OQ-1: 3D showcase renderer (react-three-fiber) — later version.
- OQ-2: Embedding/TF-IDF layout provider — worthwhile at ~50+ articles.
- OQ-3: Semantic search provider (Anthropic API or local embeddings).
- OQ-4: TDX integration, analytics, authoring assistant, multi-user
  contribution — all post-MVP, architecture keeps the door open (provider
  interfaces, markdown-file content, validation script as the contribution
  gate).
- OQ-5: Deployment target if/when coworkers get access (GitHub Pages private
  or internal host).

## 9. Definition of done

A feature is done when: implemented + typed with no `any` leaks at module
boundaries; unit-tested; all gates green (typecheck, lint, tests+coverage
floor, build, content validation); reviewed via the per-phase contextless
review loop with accepted findings fixed and regression-tested; phase summary
written including a deviations subsection.
