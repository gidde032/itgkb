---
id: screen-sharing-fails
title: 'Screen sharing fails or shows a black screen'
constellation: collaboration-meetings
tags: [video-conferencing, screen-share, permissions, macos, gpu]
summary:
  Screen share that won't start or shows black is usually an OS screen-recording permission (macOS)
  or a GPU/secure-content block, not the meeting tool.
stub: false
related: [video-call-no-audio, cant-join-meeting]
---

## Summary

When screen sharing fails outright or presents a black rectangle to everyone else, the cause is
almost always outside the meeting app: an OS screen-recording permission (especially on macOS),
hardware-accelerated rendering, or protected content refusing to be captured.

## Diagnostic Steps

1. macOS: check Screen Recording permission (System Settings → Privacy & Security → Screen
   Recording) for the meeting app. Missing/greyed permission is the top cause of a black share.
2. Identify what's black: the whole screen, or just one window (e.g. a video/DRM-protected app or
   a browser tab)? Protected content is capture-blocked by design.
3. Note whether it's a specific app window vs full-desktop share — window capture and full-screen
   capture can behave differently.

## Resolution Steps

1. Grant Screen Recording permission, then **quit and reopen** the meeting app — macOS won't
   apply it to a running app.
2. For a black window, share the full desktop instead of that single window, or disable
   hardware acceleration in the app/browser doing the rendering.
3. If a second monitor won't share, try sharing the specific screen rather than "all displays."

## Notes / Edge Cases

- Protected/DRM video (some streaming and rights-managed apps) will always show black to viewers —
  that's intentional copy protection, not a bug.
- On multi-GPU laptops, forcing the meeting app to the integrated GPU sometimes fixes a black
  share caused by the discrete GPU's capture path.
