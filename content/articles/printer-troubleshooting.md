---
id: printer-troubleshooting
title: 'Printer troubleshooting: Common Carlson issues'
constellation: hardware
tags: [printers, drivers, print-queue, network-printing, hardware]
summary:
  General diagnostic framework for the recurring printer problems — drivers, discovery,
  stuck queues, jams — pending Carlson-specific hardware details.
stub: true
related: [hardware-intake]
---

## Summary

Printer issues cluster into four buckets: driver installation, network discovery, stuck
queues, and physical problems (jams, toner). The general diagnostics below hold anywhere;
the Carlson specifics (models, hostnames, print management) must be filled in.

## Diagnostic Framework

1. **Driver installation** — standard flows: macOS System Settings → Printers & Scanners →
   add by IP or Bonjour; Windows Settings → Bluetooth & devices → Printers. [NEEDS
   VERIFICATION] — Carlson driver sources and whether a deployment tool pushes drivers.
2. **Network discovery** — printer not appearing usually means wrong network/VLAN or
   discovery protocol blocked; adding by IP bypasses discovery. [NEEDS VERIFICATION] —
   Carlson printer IPs/hostnames and whether a managed print service (PaperCut, Pharos, or
   similar) fronts them, which changes the entire setup flow.
3. **Stuck queue** — macOS/Linux: `lpq` to inspect, `lprm -` to clear; Windows:
   `net stop spooler && net start spooler`, then clear `C:\Windows\System32\spool\PRINTERS`
   if needed.
4. **Physical issues** — jams and toner. [NEEDS VERIFICATION] — whether student employees
   clear jams/replace toner directly or submit a facilities/hardware request, per printer
   model.

## Resolution Steps

[NEEDS VERIFICATION] — per-model quick reference once Carlson's deployed printer makes and
models are documented (each model's jam-clearing path and consumables differ).

## Notes / Edge Cases

- Reproduce from a second machine before blaming the user's device: one machine failing =
  driver/queue; all machines failing = printer or network side.
