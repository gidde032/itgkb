---
id: chrome-forced-dark-rendering
title: 'Chrome: pages stuck in dark mode or unreadable colors'
constellation: hardware-endpoints
tags: [chrome, dark-mode, browser-rendering, macos, local-state]
summary: Chrome renders websites, documents, or slides in dark or unreadable colors while other browsers remain normal. When the problem survives settings changes, incognito, profile changes, and reinstalling Chrome, corrupted browser-wide state may be responsible.
stub: false
related: []
---

## Summary

Chrome can become stuck in a dark, inverted, or otherwise unreadable color
scheme across websites and web applications. If macOS is using light
appearance and the same pages render normally in another browser, the problem
is probably not ordinary site dark mode. When the issue also survives
incognito, a new Chrome profile, extension removal, flag resets, and a Chrome
reinstall, corrupted browser-wide state—especially the `Local State` file—may
be responsible.

## Diagnostic Steps

1. Compare the affected page in another browser. If Safari or another browser
   renders it normally, narrow the investigation to Chrome rather than the
   website or the Mac display.
2. Check macOS Appearance and accessibility display settings, then check
   Chrome's appearance settings. Also review `chrome://flags` for experiments
   related to dark mode, forced colors, or rendering.
3. Test the page in an incognito window and in a separate Chrome profile. If
   the same color problem appears in both, a single extension, profile, or
   saved page preference is less likely to be the cause.
4. If the Mac is managed, inspect `chrome://policy` and the device-management
   settings for enforced appearance or rendering policies. A managed setting
   can return after local changes.
5. Treat reinstalling Chrome as an incomplete test unless the user also
   removes or resets Chrome's saved application data. A reinstall may leave
   the browser-wide state that caused the problem in place.

## Resolution Steps

1. Quit every Chrome window with **Command + Q**. Make sure Chrome is no
   longer running before changing its files.
2. In Finder, press **Command + Shift + G** to open **Go to Folder**, then
   enter:

   ```text
   ~/Library/Application Support/Google/Chrome/
   ```

3. Locate the browser-wide `Local State` file. Make a backup copy or rename it
   to something such as `Local State.backup` instead of deleting the entire
   Chrome folder or a profile directory.
4. Reopen Chrome. It should create fresh browser-wide state. Test the pages,
   documents, and slides that previously rendered with unreadable colors.
5. If the problem remains, quit Chrome and restore the backup if necessary.
   Recheck Chrome policies and escalate a persistent managed-device issue to
   the device administrator.
6. Use another browser as a temporary workaround while the Chrome profile or
   device policy is being repaired.

## Notes / Edge Cases

- `Local State` is stored above individual Chrome profile folders. That is why
  the problem can survive profile changes and may not be fixed by reinstalling
  the application alone.
- Renaming or removing `Local State` can reset browser-wide preferences,
  experiments, and profile metadata. The backup makes the change reversible;
  do not delete the entire `~/Library/Application Support/Google/Chrome/`
  directory as a first step.
- If only one website is affected, check that site's own theme or accessibility
  settings before resetting Chrome-wide state.
- A managed policy or extension may reapply a dark-mode or forced-color
  setting after the reset. Record the policy output and extension list when
  escalating.
- Closure language: "The issue was isolated to Chrome-wide browser state.
  Chrome was fully quit, the `Local State` file was backed up and regenerated,
  and affected documents were retested successfully."
