---
id: video-call-no-audio
title: 'Video call: no audio or microphone'
constellation: collaboration-meetings
tags: [video-conferencing, audio, microphone, permissions, devices]
summary:
  The standard device-permission and device-selection checklist to run before blaming the network
  when a caller can't hear or be heard.
stub: false
related: [screen-sharing-fails, choppy-video-quality]
---

## Summary

"No audio" is almost always a device selection or OS permission problem, not the meeting service.
Two separate paths exist — output (can't hear others) and input (can't be heard) — and they fail
independently, so check them separately.

## Diagnostic Steps

1. Separate the symptom: can't *hear* (output/speaker) or can't *be heard* (input/microphone)?
2. Check the OS microphone permission — the meeting app must be allowed to use the mic
   (macOS: System Settings → Privacy & Security → Microphone; Windows: Settings → Privacy →
   Microphone). A brand-new app or a recent OS update commonly resets this.
3. Check the in-app device pickers: the right speaker and microphone are selected, not a
   disconnected headset or the wrong monitor's speakers.
4. Confirm the mic isn't muted in two places — the app *and* a hardware mute on the headset.

## Resolution Steps

1. Grant the OS permission, then fully quit and reopen the meeting app (permission changes often
   need a restart of the app).
2. In the app's audio settings, explicitly pick the intended input and output devices and use
   the built-in mic/speaker test.
3. Unplug and replug (or re-pair) a Bluetooth/USB headset; switching a headset mid-call often
   leaves the app pointed at the old device.

## Notes / Edge Cases

- Bluetooth headsets drop to low-quality "call mode" when the mic is active — expected, not a
  fault. Wired or dedicated USB audio avoids it.
- If a browser-based meeting has no audio, check the browser's site permissions in addition to
  the OS.
