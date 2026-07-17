---
id: homebrew-library-paths
title: 'macOS: Homebrew library path issues (Pango/WeasyPrint)'
constellation: dev-environment
tags: [macos, homebrew, apple-silicon, python, dyld, weasyprint]
summary:
  Python can't find Homebrew-installed libraries like Pango on Apple Silicon because Homebrew
  moved to /opt/homebrew. Fix the loader path or use conda.
stub: false
related: [zshrc-permissions-path]
---

## Summary

WeasyPrint and similar Python packages load native libraries (Pango, Cairo) at runtime. On
Apple Silicon, Homebrew installs to `/opt/homebrew` instead of the Intel-era `/usr/local`, and
Python's loader doesn't look there by default — so imports fail with "cannot load library"
errors even though `brew list` shows the library installed.

## Diagnostic Steps

1. Confirm the library exists: `ls /opt/homebrew/lib | grep -i pango` (Apple Silicon) vs
   `ls /usr/local/lib` (Intel).
2. Check the error text: a dlopen/"cannot load library" message naming pango or cairo confirms
   a loader-path problem, not a missing install.

## Resolution Steps

1. Point the loader at Homebrew's lib dir for the session:
   `export DYLD_LIBRARY_PATH=/opt/homebrew/lib:$DYLD_LIBRARY_PATH`, then re-run.
2. Make it persistent by adding that export to `~/.zshrc` (see the .zshrc article if the file
   is root-owned).
3. Cleaner long-term alternative: install the Python package under conda, which bundles native
   deps and sidesteps the system loader entirely.

## Notes / Edge Cases

- SIP strips `DYLD_*` variables from some process launches (e.g. through certain shells or
  GUI apps) — if the export seems ignored, that's why; the conda route avoids it.
