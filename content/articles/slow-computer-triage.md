---
id: slow-computer-triage
title: 'Slow computer triage'
constellation: hardware-endpoints
tags: [performance, troubleshooting, memory, disk, startup]
summary:
  A repeatable first pass for a "my computer is slow" ticket — find the actual bottleneck (CPU,
  RAM, disk, startup, or heat) before reaching for a reimage.
stub: false
related: [software-install-self-service, disk-encryption]
---

## Summary

"It's slow" is a symptom, not a cause. A quick, ordered triage finds which resource is actually
saturated so you fix the real bottleneck instead of reimaging on a hunch. Most cases are a
runaway process, low free disk, too many startup items, or a failing/old drive.

## Diagnostic Steps

1. Open the activity/resource monitor (macOS Activity Monitor; Windows Task Manager) and see what
   is pinned: CPU, memory, or disk. That single reading points at the cause.
2. **CPU pinned** by one process — a stuck app, a runaway background updater, or a browser tab.
3. **Memory full / heavy swapping** — too many apps/tabs for the installed RAM.
4. **Disk at 100% or nearly full** — low free space (aim to keep headroom), or an aging spinning
   drive that's dying.
5. **Slow only when warm** — thermal throttling from blocked vents/dust.

## Resolution Steps

1. Quit or restart the offending process; reboot if it won't release resources.
2. Free disk space and trim startup/login items (each cause is common and cheap to fix).
3. Reduce concurrent apps/tabs, or flag the machine for a RAM upgrade if the workload genuinely
   exceeds it.
4. Replace a failing or spinning hard drive with an SSD — the biggest real-world speedup on older
   hardware.

## Notes / Edge Cases

- A machine slow right after login only is usually startup items; slow all the time under load is
  hardware or disk.
- Pending OS updates and a reboot fix a surprising share of "suddenly slow" reports — restart
  before deeper diagnosis.
