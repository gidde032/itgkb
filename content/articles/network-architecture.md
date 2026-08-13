---
id: network-architecture
title: 'Network architecture basics'
constellation: networking
tags: [network-architecture, routing, traceroute, latency, isp]
summary:
  How packets travel from an organization machine through internal routers to the outside world,
  and what that looks like in a traceroute.
stub: false
related: [traceroute-reading-output]
---

## Summary

Understanding the first few hops of an organization's network makes internal traceroutes
readable: which hops are internal routers, where load balancing appears, and where the latency
changes from "internal" to "internet."

## Diagnostic Steps

1. Run a traceroute from the machine to an external destination.
2. Expect internal routers in the early hops — the backbone/edge routers named in those hops
   identify your organization's network before traffic leaves it.
3. Hop 2 commonly shows load balancing: alternating router names or IPs across the three probes
   is normal, not instability.
4. Watch for the latency step where traffic crosses from the internal network to the ISP — a
   sustained jump at the boundary is geography and peering, not a fault.

## Resolution Steps

1. Problem starts inside the internal hops: capture the traceroute and escalate to network
   operations with the failing hop identified.
2. Problem starts after the ISP boundary: outside your organization's control — document, set
   expectations, and advise re-testing later.

## Notes / Edge Cases

- Internal router names and topology are organization-specific; identify your own early hops
  once (from a known-good traceroute) so they're recognizable in future tickets.
