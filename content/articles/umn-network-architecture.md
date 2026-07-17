---
id: umn-network-architecture
title: 'UMN network architecture basics'
constellation: networking
tags: [umn-network, routing, traceroute, campus, latency]
summary:
  How packets travel from a campus machine through UMN's internal routers to the outside world,
  and what that looks like in a traceroute.
stub: false
related: [traceroute-reading-output]
---

## Summary

Understanding the first few hops of UMN's network makes campus traceroutes readable: internal
router names, where load balancing appears, and where the latency changes from "campus" to
"internet."

## Diagnostic Steps

1. Run a traceroute from the campus machine to an external destination.
2. Expect internal UMN routers in the early hops — names like `infotech-bn` and `telecomb-bn`
   (verify current router naming) identify the campus backbone.
3. Hop 2 commonly shows load balancing: alternating router names or IPs across the three
   probes is normal, not instability.
4. Watch for the latency step where traffic crosses from UMN to the ISP — a sustained jump at
   the boundary is geography and peering, not a fault.

## Resolution Steps

1. Problem starts inside the campus hops: capture the traceroute and escalate to network
   operations with the failing hop identified.
2. Problem starts after the ISP boundary: outside UMN's control — document, set expectations,
   and advise re-testing later.

## Notes / Edge Cases

- Draft note: router names and topology summarized from prior diagnostic sessions — verify
  against a fresh campus traceroute before treating specifics as current.
