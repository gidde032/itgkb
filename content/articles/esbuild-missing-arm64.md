---
id: esbuild-missing-arm64
title: 'Node.js: Missing esbuild-darwin-arm64 dependency'
constellation: dev-environment
tags: [nodejs, esbuild, apple-silicon, npm, optional-dependencies]
summary:
  The error when node_modules were installed on a different platform (Intel → Apple Silicon) or
  with --omit=optional. One clean reinstall fixes it.
stub: false
related: [node-vite-version-mismatch, icloud-node-modules]
---

## Summary

esbuild ships its binary as per-platform optional dependencies. If `node_modules` was installed
on an Intel Mac and copied to Apple Silicon (or installed with `--omit=optional`), the
`esbuild-darwin-arm64` package is missing and the build fails with an error naming exactly that
package.

## Diagnostic Steps

1. Read the error: it names the missing platform package (e.g. `@esbuild/darwin-arm64`).
2. Ask how node_modules got there: copied from another machine, restored from a sync service,
   or installed with omitted optional deps — any of these explains it.

## Resolution Steps

1. `rm -rf node_modules package-lock.json && npm install --include=optional`
2. Re-run the build. If the delete hangs on a Mac, the folder is probably iCloud-synced — see
   the iCloud sync conflicts article before fighting it.

## Notes / Edge Cases

- Never copy `node_modules` between machines of different architectures; reinstall instead.
- CI caches keyed only on the lockfile can hit this when runner architecture changes — include
  platform in the cache key.
