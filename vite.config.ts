/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Served from a project subpath on GitHub Pages, root everywhere else
  // (local dev/preview, CI build). The deploy workflow sets GITHUB_PAGES=true.
  base: process.env.GITHUB_PAGES === 'true' ? '/itgkb/' : '/',
  plugins: [react()],
  server: {
    // Don't reload the running app when the coverage report or build output
    // regenerates (e.g. while `npm run gates` runs in another terminal).
    watch: { ignored: ['**/coverage/**', '**/dist/**'] },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**', 'scripts/validate-lib.mjs'],
      // Entrypoint is DOM bootstrap only; excluded rather than smoke-tested.
      exclude: ['src/main.tsx', 'src/test-setup.ts', '**/*.test.*'],
      // Floor set from Phase 1 measurement (89% lines / 78% branch on 2026-07-17),
      // with headroom so the gate fails on regression, not on noise. Ratchet up,
      // never down without maintainer sign-off (SPEC NF-5, CLAUDE.md gates).
      thresholds: { lines: 85, statements: 85, functions: 75, branches: 70 },
    },
  },
});
