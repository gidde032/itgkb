---
id: printer-troubleshooting
title: 'Printer troubleshooting and setup'
constellation: hardware-endpoints
tags: [printers, drivers, print-queue, network-printing, hardware]
summary:
  A diagnostic framework for the recurring printer problems — drivers, discovery, stuck queues,
  jams — plus how to add a network printer on macOS and Windows.
stub: false
related: []
---

## Summary

Printer issues cluster into four buckets: driver installation, network discovery, stuck queues,
and physical problems. Work them in that order, and reproduce from a second machine early — one
machine failing points at drivers/queue, all machines failing points at the printer or network.

## Diagnostic Framework

1. **Driver installation** — a wrong or missing driver shows up as garbled output, missing
   trays/duplex options, or an "unable to install" error. macOS usually pulls the right driver
   automatically over AirPrint/IPP; Windows uses a built-in class driver or the manufacturer's
   package. If features are missing, install the manufacturer's full driver rather than the
   generic one.
2. **Network discovery** — a printer that never appears usually means the client is on a
   different network/VLAN from the printer, or a discovery protocol (Bonjour/mDNS, WSD) is
   blocked. Adding the printer by IP address bypasses discovery entirely and is the reliable
   fallback (see setup below).
3. **Stuck queue** — a job wedged at the front blocks everything behind it. macOS/Linux: `lpq`
   to inspect, `lprm -` to clear the queue. Windows: `net stop spooler && net start spooler`,
   then delete files in `C:\Windows\System32\spool\PRINTERS` if a job won't clear.
4. **Physical issues** — jams, low/empty toner, and paper-feed faults. Clear the paper path
   fully (front and rear access), reseat consumables, and power-cycle; a printer that reports a
   jam after the path is clear usually has a sensor flag stuck by a torn scrap.

## Adding a network printer

### macOS

System Settings → Printers & Scanners → **Add Printer, Scanner, or Fax**. Pick the printer from
the Default (Bonjour) list, or use the **IP** tab and enter the address with the right protocol
(IPP is the safe default; LPD or HP JetDirect/Socket for older devices), then choose the driver.

### Windows — via the printer directory

Settings → Bluetooth & devices → **Printers & scanners → Add device**. When it doesn't appear,
choose **"The printer that I want isn't listed" → "Find a printer in the directory"** and search
the shared printer directory by name or location, then add it.

### Windows — via a print server

In the Run dialog or File Explorer address bar, enter `\\print-server\printer-name` to connect to
a shared queue and install its driver automatically. Alternatively use Add Printer → **"Select a
shared printer by name"** and type the `\\server\queue` path.

## Notes / Edge Cases

- Adding by IP is the most robust setup when discovery is flaky, but it pins the printer to an
  address — if the printer is on DHCP without a reservation, the queue breaks when the lease
  changes. Prefer a hostname or a reserved address.
