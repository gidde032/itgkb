# itgkb — Design System (M2 ratified contract)

Status: **RATIFIED** 2026-08-11 (M2 · design confirmation). Source of truth for
M3 visual refinement. `design/tokens.css` is the ratified design reference;
`src/styles.css` holds the implemented token subset (kept in agreement by hand).
Reference mockups in `design/mockups/`.

Method: `agentic-product-discovery` design lane — visual brief → direction panel
→ controlled refinement rounds (typography, shape, instrument type, accent hue,
accent split) → ratified tokens. The concept/IA were already validated by the
shipped MVP, so persona/IA-from-zero was skipped.

---

## 1. Visual direction

Deepened **cool-cosmic** dark theme; the **star field is the hero** and the
chrome recedes. Character comes from two signatures: a **cartographic instrument
layer** (catalog IDs on stars, a coordinate HUD) and an **editorial serif**
identity — a refined antique star-atlas rather than a generic dark SaaS UI.
Dark-only for v1.0.0. Deliberately avoids: system-ui sameness, monospace-for-
everything, and rounded "pill" components.

## 2. Color

Base (cool navy):

| token                 | hex                   | role                                           |
| --------------------- | --------------------- | ---------------------------------------------- |
| `--ink`               | `#060A14`             | app background                                 |
| `--haze`              | `#0E1626`             | panels / raised surfaces                       |
| `--line` / `--line-2` | `#1D2942` / `#2A3860` | hairlines / borders                            |
| `--starlight`         | `#E9EEF8`             | headings                                       |
| `--text`              | `#D3DCF0`             | body                                           |
| `--dim` / `--faint`   | `#8593B0` / `#6B7A9A` | secondary / tertiary (`--faint` lifted for AA) |

**Two-accent split (V1 — "warm brand / cool telemetry"):**

| token                       | hex       | used for                                                                          |
| --------------------------- | --------- | --------------------------------------------------------------------------------- |
| `--brand` (coral)           | `#F2A0A6` | wordmark accent, eyebrow, search glyph, **selection/active**, related-link arrows |
| `--instrument` (bright sky) | `#8FC2EE` | **catalog IDs + HUD readout only** (the data/telemetry layer)                     |

The split is semantic: warm = brand & interaction, cool = machine/catalog data.
Do not use `--instrument` for interactive affordances, or `--brand` for catalog
telemetry — the meaning is the point.

**Constellations (7)** — used for star fill, halo, constellation lines, labels:

| id                       | name                     | token               | hex       |
| ------------------------ | ------------------------ | ------------------- | --------- |
| `workspace-email`        | Workspace & Email        | `--c-workspace`     | `#E4B363` |
| `collaboration-meetings` | Collaboration & Meetings | `--c-collaboration` | `#E2985C` |
| `files-storage`          | Files & Storage          | `--c-files`         | `#7CC97A` |
| `networking`             | Networking               | `--c-networking`    | `#4FC2B0` |
| `accounts-identity`      | Accounts & Identity      | `--c-accounts`      | `#7E8CE8` |
| `hardware-endpoints`     | Hardware & Endpoints     | `--c-hardware`      | `#C77FD0` |
| `security`               | Security                 | `--c-security`      | `#DD6070` |

> M4 update: the M2-era `ticketing-itsm` and `dev-environment` clusters were
> retired; **Collaboration & Meetings** and **Files & Storage** took their
> palette slots. See §7 for the id history.

Contrast: all text/instrument colors target **WCAG AA** on `--ink`/`--haze` at
their used sizes. `--instrument` and `--brand` verified legible at the 11px
catalog-ID size. Constellation hues are chosen distinct from each other and
offset from `--brand`/`--instrument`.

## 3. Typography

Self-host in M3 (Fontsource/woff2). **Do not ship the Google Fonts CDN** used in
the mockups.

| role                                                | family                 | token            | notes                                                                                                              |
| --------------------------------------------------- | ---------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| Display — wordmark, article titles, related links   | **Newsreader** (serif) | `--font-display` | 600; editorial, sturdy at title sizes                                                                              |
| Body — summaries, UI, reading                       | **Hanken Grotesk**     | `--font-body`    | 400/500/600                                                                                                        |
| Instrument — catalog IDs, HUD, section labels, tags | **Archivo Narrow**     | `--font-chart`   | 600/700, UPPERCASE, tracked `--tracking-label`. This replaces monospace entirely (the "cartographic label" voice). |

Wordmark: `itgkb` in Newsreader; the leading `it` is italic in `--brand`.

## 4. Shape & layout

- **No pills.** Fields/buttons use `--radius` (3px), squared. Search field is a
  hairline box with a 2px bottom border.
- **Tags** are bracketed instrument caps: `[CALENDAR]` (Archivo Narrow, `--faint`
  brackets, `--dim` text; selected = `--brand`).
- **Rules** are hairlines / left-to-transparent gradients, not boxes.
- Article panel docks right (`min(384px, 92vw)`), glass over `--haze`.

## 5. Motion

All gated by `prefers-reduced-motion` (hard off when requested).

- **Parallax** — star depth layers drift subtly on pan (2.5D cue).
- **Fly-to** — eased pan+zoom to a selected star / related link, `--motion-flyto`
  (520ms) `--ease-out`.
- **Hover** — gentle halo bloom, `--motion-hover` (160ms).
- **Twinkle/drift** — very subtle, slow; tasteful, never busy.

## 6. Signature elements

1. **Catalog IDs** — per-constellation prefixed ids (`GW-001`, `SEC-001`, …),
   numbered per constellation. Prefixes: GW/MTG/FLS/NET/IAM/HW/SEC. On the
   canvas they render beside stars **bracketed, in the constellation colour,
   body font** (refined in M3 #16 for legibility). The panel eyebrow uses the
   `--instrument` sky colour. On-star label behaviour: the bracketed id shows
   once labels are on; the article title is appended (dimmed, truncated with `…`)
   only on hover/selection or a deeper zoom, so the zoomed field stays clean.
   Reference: `design/mockups/labels.html`.
2. **Coordinate HUD** — a bottom readout (`RA … · DEC … · N OBJECTS · N FIELDS`)
   in instrument caps, object count highlighted in `--instrument`.
3. **Catalog eyebrow** — article panel opens with `ITG-014 · CONSTELLATION`.

## 7. Handoff to M4 (content) — constellation id remap

Existing → new ids (M4 remaps article frontmatter + `content/constellations.json`;
NOT changed in M2 to keep the 20 current articles valid):

- `google-workspace` → `workspace-email`
- `tdx` → `ticketing-itsm`
- `dev-environment` → `dev-environment` (unchanged)
- `networking` → `networking` (unchanged)
- `account-access` → `accounts-identity`
- `hardware` → `hardware-endpoints`
- _(new)_ `security` — no articles yet; M4 authors them.

M4 delivery diverged from this M2 plan: `ticketing-itsm` (from `tdx`) and
`dev-environment` were **retired**, **Files & Storage** (`files-storage`, FLS)
and **Collaboration & Meetings** (`collaboration-meetings`, MTG) were **added**,
and the seed set was generalized and expanded to 40 vendor-generic articles. The
§2 table is the shipped taxonomy.

## 8. Line-drawing methodology (#39)

### Constellation lines (FR-3)

Intra-constellation links produce the chain-like figures of real star charts.

1. **Semantic default (#29).** Revision-pinned MiniLM embeddings are computed at
   build time. A sparse global semantic similarity graph drives placement only.
   The displayed line art is a separate similarity-favoured open path inside
   each computed cluster: every member is connected, endpoints have one line,
   interior stars have two, and no line crosses mapped constellations. Computed
   clusters map one-to-one onto the curated names, colors, and catalog prefixes;
   the same semantic grouping and path topology drive the 2D galaxy and 3D
   globe. The 2D renderer applies a deterministic presentation reflow for
   constellation spacing and label clearance; the 3D renderer retains the
   canonical positions.
2. **Curated fallback.** If the committed semantic artifact is missing,
   malformed, or incomplete, same-constellation pairs are ranked by
   shared-tag count and accepted greedily while both endpoints have degree < 2.
3. **Fallback orphan rescue.** Curated fallback mode connects any degree-zero
   star to its spatially nearest sibling. Semantic mode needs no runtime rescue:
   connected paths are enforced in artifact generation, validation, and CI.

### 2D readability and growth

The 2D galaxy has a presentation layer whose purpose is legibility as the
article base grows. It is deterministic and 2D-only:

- Constellation footprints expand with their local star spread and article
  count, then separate from one another while treating authored anchors as
  preferred locations rather than fixed coordinates.
- Constellation names are placed in screen space from the actual group bounds,
  after stars and solid lines, using candidate slots, dark haze plates, and
  keepouts for stars, glows, lines, and other labels.
- Article-label zoom thresholds remain unchanged. At eligible zoom levels,
  labels try alternate slots around their star and avoid protected geometry;
  focused labels remain visible as the fallback.
- Reset/overview framing is computed from the resulting 2D bounds. The
  canonical semantic positions, z values, group membership, edge topology, and
  the 3D globe renderer are unchanged.

### Related-article lines (#39)

Cross-article links derived from `related` frontmatter arrays. Visually
distinct from constellation lines:

- **Dashed stroke** (constellation lines are solid).
- **Gradient color** from source constellation accent to target constellation
  accent, making cross-constellation relationships visually legible.
- **Higher base opacity** than constellation lines (0.2 vs 0.18) so the sparse
  dashed strokes stay legible over the solid constellation web.
- **Two visibility modes:**
  - _On-selection:_ when a star is clicked, its related lines are drawn with
    emphasized weight/opacity (0.55, 1.8px).
  - _Toggle-able overlay:_ a button (top-right, below the list-view toggle)
    or the `R` keyboard shortcut shows all related lines at baseline
    opacity. One default-off setting follows the user between 2D and 3D. When
    both overlay and selection are active, the selected star's lines are
    emphasized over the baseline.
- **Dimming during search:** if either endpoint is outside the match set, the
  related line dims (same behavior as constellation lines).
- **Deduplication:** bidirectional frontmatter references (A lists B, B lists A)
  produce a single drawn line.

## 9. Deferred to implementation (not decided in M2)

- Exact star glow/bloom/depth rendering params (M3, canvas).
- Whether catalog IDs show always vs on hover/zoom (M3 interaction).
- `content/constellations.json` + article remap and the Security cluster's
  content (M4).

## 10. Reference mockups (`design/mockups/`)

- `directions.html` — the 3-direction panel (A Deep Field / B Observatory / C Vivid).
- `refined-a.html` — base A + first typography/shape refinement (Fraunces era).
- `explore.html` — instrument / accent / serif axis exploration.
- `refined-final.html` — Newsreader + amber + cartographic (pre-accent-final).
- `accent-explore.html`, `accent-explore-2.html`, `accent-split.html` — accent hue + split rounds.
- `final.html` — **the ratified system**, whole (V1 accents + 7 constellations).

## 11. Decision register| decision | state | note |

| --------------------------------------------------- | -------- | -------------------------------------------- |
| Base direction A (Deep Field) | RATIFIED | over B Observatory / C Vivid |
| Serif = Newsreader | RATIFIED | over Fraunces / Instrument Serif |
| Body = Hanken Grotesk | RATIFIED | |
| Instrument = Archivo Narrow (non-mono cartographic) | RATIFIED | monospace rejected as the "AI tell" |
| Accents = coral `#F2A0A6` + sky `#8FC2EE`, V1 split | RATIFIED | over amber; navy/mint/powder/forest rejected |
| Shape: no pills, bracketed tags, squared fields | RATIFIED | |
| 7 constellations, neutral names + Security | RATIFIED | |
| Motion language | RATIFIED | parallax / fly-to / hover / subtle twinkle |
| Dark-only for v1.0.0 | RATIFIED | light mode deferred |
| Light/daytime theme | DEFERRED | post-1.0 |
| 3D showcase = third view, active segment coral | RATIFIED | #31 decision record 2026-08-20; amber re-rejected for UI state (`#E4B363` is Workspace & Email data color) |
| Related lines share one default-off 2D/3D setting | RATIFIED | dashed gradient arcs; `R` and either view's control update the same state |
| 3D star glow = additive sprites, no postprocessing | RATIFIED | over bloom (dependency weight, generic glow look) |

## 12. 3D showcase view (#31)

Third view mode — the "3D" segment of the List · Galaxy · 3D control. Full
design contract: issue #31 decision record (2026-08-20). Key surface rules:

- **Active state.** Active segment carries the coral `--brand` accent; the
  palette's only amber (`#E4B363`) stays reserved as Workspace & Email's data
  color. Squared segments in the previous single-toggle's position, house
  button language (Archivo Narrow caps, icon + label).
- **Globe.** Celestial-globe projection (starglobe reference): each
  constellation sits ON the sphere, direction derived from its curated anchor;
  local force-layout offsets become tangent-plane figure spread (tag affinity
  preserved); shell thickness from the hash parallax z. Downstream of the
  `LayoutProvider` seam so a semantic layout (#29) composes unchanged.
  Supersedes the earlier flat-with-depth-offsets plan (maintainer direction,
  2026-08-21 — no config surface change; anchors drive it).
- **Lines.** Constellation paths stay solid. Related-article lines are dashed
  gradient arcs (source → target constellation color); arc elevation varies
  with chord length and intervening stars (hash-seeded, deterministic). Their
  shared 2D/3D overlay defaults off; selection still reveals that star's arcs.
  Both views expose the control and `R` changes the same persistent setting.
  Three.js vertex samples are converted from the same display-space sRGB
  gradient used in 2D, then encoded as linear-light buffer colors. Opacity and
  width match 2D exactly. Selected lines emphasize and search dims them.
- **Stars.** Additive sprite glow from math-generated DataTextures — no
  post-processing; per-star states mirror the 2D grammar (search dim, stub =
  dimmer core + dashed ring, selection = solid coral ring).
- **Labels.** Bracketed catalog ids (`[GW-001]`) as DOM overlays anchored to
  3D positions, with the 2D-parity reveal rules: id on hover/selection/close
  camera, title appended on hover/selection, suppressed for search
  non-matches. Constellation name chips are clickable framing targets.
- **Instrument layer.** The HUD reads AZ/EL (camera azimuth/elevation about
  the orbit target) in place of the galaxy's RA/DEC; object/field counts
  unchanged.
- **Motion.** Idle auto-orbit (on by default, house-style toggle) yields
  instantly to input, resumes after ~2s stillness, hard-off under
  `prefers-reduced-motion` (live-subscribed). Fly-to and framing moves ease
  ~0.7s or snap under reduced motion. Render loop drops to on-demand at rest —
  a still showcase burns no GPU.
- **Availability.** Lazy chunk (~230 KB gz measured after the maintainer
  removed the solid inner sphere; sanity ceiling ~275 KB — NF-4 measures
  initial payload only). Fallback is an announced status region. Without WebGL
  the 3D segment is disabled with a visually-hidden reason; the control is
  hidden under 900px (NF-7 list override).
