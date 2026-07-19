/**
 * A2: search-text normalization shared by query and haystacks. Two moves:
 * 1. Apostrophes (straight and curly) are REMOVED, so "won't"/"wont" and
 *    "couldn't"/"couldnt" collide onto the same token.
 * 2. Other punctuation becomes a space, so "google-calendar" matches the
 *    query "google calendar" and command text like "lsof -ti :3000" stays
 *    findable term-by-term.
 */
export function normalizeSearchText(s: string): string {
  return s
    .toLowerCase()
    .replace(/['\u2018\u2019]/g, '')
    .replace(/[-_/\\.,:;!?()[\]{}"\u201c\u201d`|#*>+=~^&%$@\u2013\u2014]/g, ' ');
}
