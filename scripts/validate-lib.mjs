// Shared content-validation logic (FR-11). Used by BOTH the CLI gate
// (scripts/validate-content.mjs) and the app's runtime loader (FR-1), so the
// rules cannot drift between them. Plain ESM JS so Node can run it unbundled.

/**
 * @typedef {{ id: string, title: string, constellation: string, tags: string[],
 *   summary: string, stub: boolean, related: string[] }} Frontmatter
 */

import yaml from 'js-yaml';

export const FRONTMATTER_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Split and YAML-parse a markdown file's frontmatter block. Single source of
 * truth for BOTH the CLI gate and the app loader (review finding F3: the
 * parse step had drifted into two copies).
 * @param {string} raw
 * @param {string} sourceName
 * @returns {{ fm: Record<string, unknown> | null, body: string, errors: string[] }}
 */
export function parseFrontmatterBlock(raw, sourceName) {
  const match = raw.match(FRONTMATTER_RE);
  if (!match)
    return { fm: null, body: raw, errors: [`${sourceName}: no YAML frontmatter block found`] };
  let fm;
  try {
    fm = yaml.load(match[1]);
  } catch (e) {
    return {
      fm: null,
      body: raw,
      errors: [`${sourceName}: YAML parse error — ${e.message.split('\n')[0]}`],
    };
  }
  if (typeof fm !== 'object' || fm === null || Array.isArray(fm)) {
    return { fm: null, body: raw, errors: [`${sourceName}: frontmatter is not a mapping`] };
  }
  return { fm, body: raw.slice(match[0].length), errors: [] };
}

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
  if (
    fm.related !== undefined &&
    (!Array.isArray(fm.related) || fm.related.some((r) => typeof r !== 'string'))
  ) {
    errors.push(`${sourceName}: "related" must be an array of article ids when present`);
  }
  return errors;
}

/**
 * Verify an article's frontmatter `id` matches its filename (sans `.md`).
 * Enforces the SPEC §5 convention so the app's id-based addressing and the
 * filesystem stay in sync; drift here confuses contributors and tooling.
 * @param {string} filename e.g. "gcal-event-couldnt-update.md"
 * @param {unknown} id parsed frontmatter id
 * @param {string} sourceName
 * @returns {string[]}
 */
export function validateFilenameId(filename, id, sourceName) {
  const expected = filename.replace(/\.md$/, '');
  if (typeof id !== 'string' || id !== expected) {
    return [`${sourceName}: id "${id}" does not match filename "${expected}"`];
  }
  return [];
}

/**
 * Validate the constellations.json schema. The layout engine and renderer both
 * read `anchor`/`color`/`prefix`/`name`, so a malformed entry must fail the
 * content gate rather than crash the app at runtime.
 * @param {unknown} constellations
 * @returns {string[]}
 */
export function validateConstellations(constellations) {
  const errors = [];
  if (!Array.isArray(constellations) || constellations.length === 0) {
    return ['constellations.json: must be a non-empty array'];
  }
  const seen = new Set();
  const entryName = (i) => `constellations.json[${i}]`;
  const isNonEmptyString = (v) => typeof v === 'string' && v.trim() !== '';
  constellations.forEach((c, i) => {
    const src = entryName(i);
    if (typeof c !== 'object' || c === null || Array.isArray(c)) {
      errors.push(`${src}: entry must be an object`);
      return;
    }
    if (!isNonEmptyString(c.id)) errors.push(`${src}: missing or empty "id"`);
    else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(c.id))
      errors.push(`${src}: id "${c.id}" is not kebab-case`);
    if (seen.has(c.id)) errors.push(`${src}: duplicate constellation id "${c.id}"`);
    else if (typeof c.id === 'string') seen.add(c.id);
    if (!isNonEmptyString(c.name)) errors.push(`${src}: missing or empty "name"`);
    if (!isNonEmptyString(c.prefix)) errors.push(`${src}: missing or empty "prefix"`);
    if (!isNonEmptyString(c.color)) errors.push(`${src}: missing or empty "color"`);
    const a = c.anchor;
    if (
      typeof a !== 'object' ||
      a === null ||
      Array.isArray(a) ||
      typeof a.x !== 'number' ||
      typeof a.y !== 'number'
    ) {
      errors.push(`${src}: "anchor" must be { x: number, y: number }`);
    }
    // #31: optional showcase depth placement — type-checked only when present
    // (same optional-with-defaults pattern as tags/stub/related).
    const dep = c.depth;
    if (dep !== undefined) {
      if (
        typeof dep !== 'object' ||
        dep === null ||
        Array.isArray(dep) ||
        typeof dep.z !== 'number' ||
        !Number.isFinite(dep.z) ||
        typeof dep.spread !== 'number' ||
        !Number.isFinite(dep.spread) ||
        dep.spread < 0
      ) {
        errors.push(`${src}: "depth" must be { z: number, spread: number >= 0 } when present`);
      }
    }
  });
  return errors;
}

/**
 * Analyze the collection: unique ids, known constellations, resolvable related
 * links. Besides the error strings, reports which sourceNames the runtime
 * loader must EXCLUDE to honor FR-1 (P6-A2): unknown-constellation articles
 * and second occurrences of a duplicate id. A dead `related` link errors but
 * does NOT exclude the linking article (maintainer-approved policy).
 * @param {Array<{ fm: Record<string, unknown>, sourceName: string }>} entries
 * @param {Array<{ id: string }>} constellations
 * @returns {{ errors: string[], excludedSources: Set<string> }}
 */
export function analyzeCollection(entries, constellations) {
  const errors = [];
  const excludedSources = new Set();
  const constellationIds = new Set(constellations.map((c) => c.id));
  const seen = new Map();
  for (const { fm, sourceName } of entries) {
    if (typeof fm.id === 'string') {
      if (seen.has(fm.id)) {
        errors.push(`${sourceName}: duplicate id "${fm.id}" (also in ${seen.get(fm.id)})`);
        excludedSources.add(sourceName);
      } else {
        seen.set(fm.id, sourceName);
      }
    }
    if (typeof fm.constellation === 'string' && !constellationIds.has(fm.constellation)) {
      errors.push(`${sourceName}: unknown constellation "${fm.constellation}"`);
      excludedSources.add(sourceName);
    }
  }
  for (const { fm, sourceName } of entries) {
    if (Array.isArray(fm.related)) {
      for (const rid of fm.related) {
        if (typeof rid === 'string' && rid === fm.id) {
          // Self-references would render as degenerate zero-length lines (M1).
          errors.push(`${sourceName}: related id "${rid}" is a self-reference`);
        } else if (typeof rid === 'string' && !seen.has(rid)) {
          errors.push(`${sourceName}: related id "${rid}" does not resolve to any article`);
        }
      }
    }
  }
  return { errors, excludedSources };
}

/**
 * Error-strings-only view of analyzeCollection, kept for the CLI gate, which
 * reports every violation and exits non-zero rather than excluding anything.
 * @param {Array<{ fm: Record<string, unknown>, sourceName: string }>} entries
 * @param {Array<{ id: string }>} constellations
 * @returns {string[]}
 */
export function validateCollection(entries, constellations) {
  return analyzeCollection(entries, constellations).errors;
}

/**
 * Content-sensitivity patterns (M4 #22). The public repo must not carry
 * organization-specific data or unresolved authoring markers. Each pattern is
 * global + case-insensitive so every occurrence on a line is reported.
 */
export const SENSITIVITY_PATTERNS = [
  {
    id: 'organization',
    label: 'organization-specific name',
    re: /\b(?:carlson|university of minnesota|umn|teamdynamix|tdx)\b/gi,
  },
  {
    id: 'internal-hostname',
    label: 'internal hostname',
    re: /\b[a-z][a-z0-9-]*-bn\b/gi,
  },
  {
    id: 'verify-marker',
    label: 'unresolved verification marker',
    re: /\(verify\)|\[needs verification\]/gi,
  },
  {
    id: 'email',
    label: 'email address',
    re: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
  },
];

/**
 * Scan one article's raw text for organization-specific data / authoring
 * markers. Returns a finding per match with 1-based line numbers.
 * @param {string} sourceName
 * @param {string} raw
 * @returns {Array<{ sourceName: string, line: number, patternId: string, label: string, match: string }>}
 */
export function findSensitiveMatches(sourceName, raw) {
  const findings = [];
  raw.split(/\r?\n/).forEach((text, index) => {
    for (const pattern of SENSITIVITY_PATTERNS) {
      for (const m of text.matchAll(pattern.re)) {
        findings.push({
          sourceName,
          line: index + 1,
          patternId: pattern.id,
          label: pattern.label,
          match: m[0],
        });
      }
    }
  });
  return findings;
}
