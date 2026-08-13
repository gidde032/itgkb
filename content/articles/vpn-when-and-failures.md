---
id: vpn-when-and-failures
title: 'VPN: when you need it and common failures'
constellation: networking
tags: [vpn, remote-access, split-tunnel, dns, connectivity]
summary:
  What a VPN is actually for, why "connected but can't reach internal resources" happens, and the
  standard reconnect/split-tunnel/DNS checks.
stub: false
related: [enterprise-wifi-8021x, dns-problems]
---

## Summary

A VPN exists to reach resources that are only available from inside the organization's network
(internal apps, file shares, licensed services). If a resource is public, the VPN adds nothing but
latency. The most confusing failure is "connected, but internal things still don't load," which is
usually routing/DNS, not authentication.

## Diagnostic Steps

1. Confirm the task actually needs the VPN: public sites and most cloud apps do not. Unnecessary
   VPN use just slows things down.
2. For "connected but nothing internal works": suspect split-tunnel routing (internal traffic not
   going through the tunnel) or DNS resolving internal names to nothing.
3. For repeated drops: check wifi stability underneath (the VPN rides on the connection) and
   whether the client's session expired.

## Resolution Steps

1. Fully disconnect and reconnect the client — it re-establishes routes and DNS, fixing most
   "half-working" states.
2. If only internal names fail, it's a DNS problem on the tunnel — see the DNS article; flushing
   the resolver cache after connecting often helps.
3. If the connection drops on wifi roaming, prefer a stable connection (wired or a single strong
   access point) for VPN sessions.

## Notes / Edge Cases

- Two VPNs or a corporate VPN plus a personal one will fight over routing — run one at a time.
- Calls and video over VPN can suffer; if quality is the goal and the resource is public, drop
  the VPN for that task.
