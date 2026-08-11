# IT Knowledge Galaxy

[![CI](https://github.com/gidde032/carlson-IT-galactic-wiki/actions/workflows/ci.yml/badge.svg)](https://github.com/gidde032/carlson-IT-galactic-wiki/actions/workflows/ci.yml)

**▶ Live demo: https://gidde032.github.io/carlson-IT-galactic-wiki/**

An explorable IT knowledge base for the Carlson IT Service Center, rendered as
a galaxy: every article is a star, stars cluster into constellations by
category, and proximity means topical similarity.

## Run it

```bash
git clone https://github.com/gidde032/carlson-IT-galactic-wiki.git
cd carlson-IT-galactic-wiki
npm install
npm run dev
```

Open the printed localhost URL.

**Finding articles fast:** type in the search bar — non-matching stars dim in
place. Press Enter to jump to the top match, Escape to clear. On desktop, the
"List view" button switches to a flat searchable list grouped by constellation.
On narrow screens (<900 px) the list is shown automatically.

Click a star to read its article. Drag to pan, scroll to zoom, "Reset view" to
return home.

## Add or edit an article

1. Copy `content/TEMPLATE.md` into `content/articles/<your-id>.md`.
2. Fill in the frontmatter (id, title, constellation, tags, summary) and the
   body sections. Leave `related` empty (`[]`) or list ids of articles that
   already exist — unresolvable ids fail validation.
3. `npm run validate:content` — fix anything it flags.
4. Reload the dev server. Your star is in the galaxy.

Constellations live in `content/constellations.json` (id, name, map position,
color).

## Development

- `npm run gates` — full quality gate: typecheck, lint, tests + coverage
  floor, content validation, production build. Must be green before merging.
  CI (`.github/workflows/ci.yml`) runs the same gate on every push and PR.
- `npm test` — test suite only.

## Architecture

Three layers, deliberately decoupled so the visual front end never depends on
where positions or search results come from:

- **Content pipeline.** Articles are markdown files in `content/articles/` with
  validated YAML frontmatter (schema in `SPEC.md` §5). `npm run validate:content`
  is the gate; nothing hardcodes article bodies in components.
- **Provider seams.** Layout and search sit behind provider interfaces
  (`src/layout/types.ts`) — a `LayoutProvider` yields star positions and a
  `SearchProvider` yields match state. Smarter backends can be swapped in later
  without touching the UI.
- **Renderer.** The galaxy consumes positions and match state only; it never
  inspects article bodies. This keeps the near-term build to text search with no
  AI/semantic features.

See `SPEC.md` for full scope and the extensibility contracts.
