---
id: node-vite-version-mismatch
title: 'Node.js: Version mismatch errors with Vite/esbuild'
constellation: dev-environment
tags: [nodejs, vite, esbuild, nvm, version-management]
summary:
  Newer Node versions (v24+) can break older Vite/esbuild configs built for v18/v20. Diagnose
  with node --version; fix with nvm and a clean reinstall.
stub: false
related: []
---

## Summary

A project that worked before suddenly fails to start (`npm run dev` errors from Vite or
esbuild) after a Node upgrade. Older Vite toolchains pinned against Node v18/v20 can break
under v24+.

## Diagnostic Steps

1. `node --version` and `npm --version` — compare against the version the project was built
   for (check `engines` in package.json, CI config, or README).
2. Read the first error in the stack: esbuild/Vite version complaints or native binding errors
   point at a runtime mismatch rather than project code.

## Resolution Steps

1. Install nvm (if not present) and switch: `nvm install 20 && nvm use 20`.
2. Clean reinstall: `rm -rf node_modules package-lock.json && npm install`.
3. Re-run `npm run dev` and confirm the original error is gone.

## Notes / Edge Cases

- On machines where node_modules lives in an iCloud-synced folder, the `rm -rf` step can hang —
  see the iCloud sync conflicts article (added in a later content batch).
- Consider adding an `engines` field or `.nvmrc` to the project so the next person hits a clear
  message instead of a cryptic esbuild error.
