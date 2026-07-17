// Shared content-validation logic (FR-11). Used by BOTH the CLI gate
// (scripts/validate-content.mjs) and the app's runtime loader (FR-1), so the
// rules cannot drift between them. Plain ESM JS so Node can run it unbundled.

/**
 * @typedef {{ id: string, title: string, constellation: string, tags: string[],
 *   summary: string, stub: boolean, related: string[] }} Frontmatter
 */

const REQUIRED_STRING_FIELDS = ['id', 'title', 'constellation', 'summary'];

/**
 * Validate a single parsed frontmatter object. Returns error strings (empty = valid).
 * @param {Record<string, unknown>} fm
 * @param {string} sourceName
 * @returns {string[]}
 */
export function validateFrontmatter(fm, sourceName) {
  const errors = [];
  for (const field of REQUIRED_STRING_FIELDS) {
    const v = fm[field];
    if (typeof v !== 'string' || v.trim() === '') {
      errors.push(`${sourceName}: missing or empty required field "${field}"`);
    }
  }
  if (typeof fm.id === 'string' && !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(fm.id)) {
    errors.push(`${sourceName}: id "${fm.id}" is not kebab-case`);
  }
  if (!Array.isArray(fm.tags) || fm.tags.some((t) => typeof t !== 'string')) {
    errors.push(`${sourceName}: "tags" must be an array of strings`);
  }
  if (fm.stub !== undefined && typeof fm.stub !== 'boolean') {
    errors.push(`${sourceName}: "stub" must be a boolean when present`);
  }
  if (fm.related !== undefined && (!Array.isArray(fm.related) || fm.related.some((r) => typeof r !== 'string'))) {
    errors.push(`${sourceName}: "related" must be an array of article ids when present`);
  }
  return errors;
}

/**
 * Validate the collection: unique ids, known constellations, resolvable related links.
 * @param {Array<{ fm: Record<string, unknown>, sourceName: string }>} entries
 * @param {Array<{ id: string }>} constellations
 * @returns {string[]}
 */
export function validateCollection(entries, constellations) {
  const errors = [];
  const constellationIds = new Set(constellations.map((c) => c.id));
  const seen = new Map();
  for (const { fm, sourceName } of entries) {
    if (typeof fm.id === 'string') {
      if (seen.has(fm.id)) {
        errors.push(`${sourceName}: duplicate id "${fm.id}" (also in ${seen.get(fm.id)})`);
      } else {
        seen.set(fm.id, sourceName);
      }
    }
    if (typeof fm.constellation === 'string' && !constellationIds.has(fm.constellation)) {
      errors.push(`${sourceName}: unknown constellation "${fm.constellation}"`);
    }
  }
  for (const { fm, sourceName } of entries) {
    if (Array.isArray(fm.related)) {
      for (const rid of fm.related) {
        if (typeof rid === 'string' && !seen.has(rid)) {
          errors.push(`${sourceName}: related id "${rid}" does not resolve to any article`);
        }
      }
    }
  }
  return errors;
}
