---
id: choppy-video-quality
title: 'Choppy video or poor call quality'
constellation: collaboration-meetings
tags: [video-conferencing, bandwidth, wifi, performance, quality]
summary:
  Freezing, robotic audio, and blur are bandwidth or local-resource problems. A short triage —
  wired vs wifi, camera off, close background apps — fixes most of it.
stub: false
related: [cant-join-meeting, video-call-no-audio]
---

## Summary

Freezing video, robotic/garbled audio, and sudden blur are symptoms of not enough sustained
bandwidth or a maxed-out machine. The service usually degrades gracefully (drops your video
first), so quality problems point at the local connection or computer, not the platform.

## Diagnostic Steps

1. Check the connection: wifi (especially far from the access point or on a congested network)
   vs wired. Wifi is the most common cause.
2. Check the machine: CPU pinned by other apps, a low battery in power-saving mode, or many
   browser tabs all compete with real-time video.
3. Note whether it's everyone or just one participant — one person choppy is their side; everyone
   choppy is the shared network or the host.

## Resolution Steps

1. Move closer to the access point or switch to a wired connection; this alone resolves most
   quality complaints.
2. Turn off your outgoing camera — video is the most bandwidth-hungry stream and dropping it
   usually restores clean audio immediately.
3. Close bandwidth- and CPU-heavy apps (large downloads, other streams, extra tabs), and take the
   laptop off battery-saver.

## Notes / Edge Cases

- Audio is prioritized over video by design — if audio is fine but video freezes, that's the
  system working as intended under constrained bandwidth.
- A VPN can add latency and reduce throughput for calls; if quality is poor only on VPN, that's
  the likely cause.
