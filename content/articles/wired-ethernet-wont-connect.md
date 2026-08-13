---
id: wired-ethernet-wont-connect
title: "Wired ethernet won't connect"
constellation: networking
tags: [ethernet, wired, vlan, nac, adapters]
summary:
  A wired port that stays dark — cable/adapter, the switch port, or network-access-control
  registration that must happen before the port passes traffic.
stub: false
related: [enterprise-wifi-8021x, dns-problems]
---

## Summary

Wired connections fail for a short list of reasons: a bad cable or USB-C/Thunderbolt adapter, a
switch port that's disabled or on the wrong VLAN, or a network-access-control (NAC) system that
holds the port until the device is registered/authenticated. The link light tells you which half
to look at.

## Diagnostic Steps

1. Check the physical link light on the port/adapter. No light = cable, adapter, or dead port;
   light but no network = higher-layer (VLAN, DHCP, or NAC).
2. Swap the cable and, on laptops, the adapter — USB/Thunderbolt ethernet adapters are a common
   silent failure.
3. Look for a captive/registration step: some wired networks quarantine an unregistered device
   until you authenticate in a browser or the device is enrolled.

## Resolution Steps

1. Replace the cable/adapter and try a known-good port to isolate hardware.
2. If you get a link but no address, renew DHCP (reconnect the interface); a wrong-VLAN or
   disabled port needs the network team.
3. If the network requires registration, complete the NAC enrollment for the device's MAC address,
   then re-plug.

## Notes / Edge Cases

- Docking stations add two failure points (the dock's own ethernet chip and its firmware) — test
  the laptop's direct port or a simple adapter to rule the dock out.
- A port that worked yesterday and died today, with a good cable, is often a switch-side change —
  escalate rather than swapping hardware indefinitely.
