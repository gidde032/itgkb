---
id: printer-troubleshooting
title: 'Printer troubleshooting: common issues'
constellation: hardware-endpoints
tags: [printers, drivers, print-queue, network-printing, hardware]
summary:
  General diagnostic framework for the recurring printer problems — drivers, discovery, stuck
  queues, jams — pending organization-specific hardware details.
stub: true
related: []
---

## Summary

Printer issues cluster into four buckets: driver installation, network discovery, stuck queues,
and physical problems (jams, toner). The general diagnostics below hold anywhere; your
organization's specifics (models, hostnames, print management) are the part to fill in.

## Diagnostic Framework

1. **Driver installation** — standard flows: macOS System Settings → Printers & Scanners →
   add by IP or Bonjour; Windows Settings → Bluetooth & devices → Printers. Organization detail
   to fill in: driver sources and whether a deployment tool pushes drivers.
2. **Network discovery** — a printer not appearing usually means the wrong network/VLAN or a
   blocked discovery protocol; adding by IP bypasses discovery. Organization detail to fill in:
   printer IPs/hostnames and whether a managed print service (e.g. PaperCut or Pharos) fronts
   them, which changes the entire setup flow.
3. **Stuck queue** — macOS/Linux: `lpq` to inspect, `lprm -` to clear; Windows:
   `net stop spooler && net start spooler`, then clear `C:\Windows\System32\spool\PRINTERS`
   if needed.
4. **Physical issues** — jams and toner. Organization detail to fill in: whether front-line
   staff clear jams / replace toner directly or submit a facilities/hardware request, per model.

## Resolution Steps

Organization-specific: a per-model quick reference once your deployed printer makes and models
are documented (each model's jam-clearing path and consumables differ).

## Notes / Edge Cases

- Reproduce from a second machine before blaming the user's device: one machine failing =
  driver/queue; all machines failing = printer or network side.
