---
id: traceroute-reading-output
title: 'Traceroute: Reading and interpreting output'
constellation: networking
tags: [traceroute, tracert, latency, network-diagnosis, routing]
summary:
  How to run traceroute (Mac/Linux) or tracert (Windows) and read the hops, why "* * *" is
  usually not an error, and what latency jumps mean.
stub: false
related: [network-architecture]
---

## Summary

Traceroute shows the router-by-router path packets take to a destination, with round-trip
latency per hop. It answers "where along the path does slowness or loss begin," not "is the
destination up."

## Diagnostic Steps

1. Run it: `traceroute example.com` (macOS/Linux) or `tracert example.com` (Windows).
2. Read each line as one router hop: hop number, router name/IP, three latency probes.
3. Interpret `* * *`: the router at that hop is dropping or deprioritizing probe packets. If
   later hops respond normally, the path is fine — this is common and not an error.
4. Interpret latency jumps: a sustained increase that persists through all later hops marks a
   real cost — typically geographic distance or a network boundary (e.g., leaving your
   organization's network for the ISP). A spike at one hop that disappears afterward is that
   router deprioritizing probe responses, not path latency.

## Resolution Steps

1. If latency/loss begins inside your organization's network: gather the output and escalate
   with the hop where it starts.
2. If it begins after the ISP boundary: the issue is outside your organization's network —
   document and set expectations with the user.

## Notes / Edge Cases

- Always capture the full output before closing; the hop where trouble starts is the whole
  diagnostic value.
- Related: the network-architecture basics article explains the internal hops you'll typically
  see from an organization machine.
