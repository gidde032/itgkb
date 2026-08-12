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

| id                   | name                 | token            | hex       |
| -------------------- | -------------------- | ---------------- | --------- |
| `workspace-email`    | Workspace & Email    | `--c-workspace`  | `#E4B363` |
| `ticketing-itsm`     | Ticketing & ITSM     | `--c-ticketing`  | `#E2985C` |
| `dev-environment`    | Dev Environment      | `--c-dev`        | `#7CC97A` |
| `networking`         | Networking           | `--c-networking` | `#4FC2B0` |
| `accounts-identity`  | Accounts & Identity  | `--c-accounts`   | `#7E8CE8` |
| `hardware-endpoints` | Hardware & Endpoints | `--c-hardware`   | `#C77FD0` |
| `security`           | Security             | `--c-security`   | `#DD6070` |

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
   numbered per constellation. Prefixes: GW/TIX/DEV/NET/IAM/HW/SEC. On the
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

## 8. Deferred to implementation (not decided in M2)

- Exact star glow/bloom/depth rendering params (M3, canvas).
- Whether catalog IDs show always vs on hover/zoom (M3 interaction).
- `content/constellations.json` + article remap and the Security cluster's
  content (M4).

## 9. Reference mockups (`design/mockups/`)

- `directions.html` — the 3-direction panel (A Deep Field / B Observatory / C Vivid).
- `refined-a.html` — base A + first typography/shape refinement (Fraunces era).
- `explore.html` — instrument / accent / serif axis exploration.
- `refined-final.html` — Newsreader + amber + cartographic (pre-accent-final).
- `accent-explore.html`, `accent-explore-2.html`, `accent-split.html` — accent hue + split rounds.
- `final.html` — **the ratified system**, whole (V1 accents + 7 constellations).

## 10. Decision register

| decision                                            | state    | note                                         |
| --------------------------------------------------- | -------- | -------------------------------------------- |
| Base direction A (Deep Field)                       | RATIFIED | over B Observatory / C Vivid                 |
| Serif = Newsreader                                  | RATIFIED | over Fraunces / Instrument Serif             |
| Body = Hanken Grotesk                               | RATIFIED |                                              |
| Instrument = Archivo Narrow (non-mono cartographic) | RATIFIED | monospace rejected as the "AI tell"          |
| Accents = coral `#F2A0A6` + sky `#8FC2EE`, V1 split | RATIFIED | over amber; navy/mint/powder/forest rejected |
| Shape: no pills, bracketed tags, squared fields     | RATIFIED |                                              |
| 7 constellations, neutral names + Security          | RATIFIED |                                              |
| Motion language                                     | RATIFIED | parallax / fly-to / hover / subtle twinkle   |
| Dark-only for v1.0.0                                | RATIFIED | light mode deferred                          |
| Light/daytime theme                                 | DEFERRED | post-1.0                                     |
