# IT Knowledge Galaxy

An explorable IT knowledge base for the Carlson IT Service Center, rendered as
a galaxy: every article is a star, stars cluster into constellations by
category, and proximity means topical similarity.

## Run it

```bash
git clone <this-repo>
cd it-knowledge-galaxy
npm install
npm run dev
```

Open the printed localhost URL. Click a star to read its article. Drag to pan,
scroll to zoom.

## Add or edit an article

1. Copy `content/TEMPLATE.md` into `content/articles/<your-id>.md`.
2. Fill in the frontmatter (id, title, constellation, tags, summary) and the
   body sections.
3. `npm run validate:content` — fix anything it flags.
4. Reload the dev server. Your star is in the galaxy.

Constellations live in `content/constellations.json` (id, name, map position,
color).

## Development

- `npm run gates` — full quality gate: typecheck, lint, tests + coverage
  floor, content validation, production build. Must be green before merging.
- `npm test` — test suite only.
- Architecture notes and scope: `SPEC.md`. Layout and search sit behind
  provider interfaces (`src/layout/types.ts`) so smarter backends can be
  swapped in later without UI changes.
