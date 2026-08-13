---
id: dns-problems
title: 'DNS problems: names fail but IPs work'
constellation: networking
tags: [dns, resolver, cache, connectivity, troubleshooting]
summary:
  The signature of a DNS issue — sites fail by name but the network is otherwise up — and how to
  flush the resolver cache on each OS.
stub: false
related: [vpn-when-and-failures, traceroute-reading-output]
---

## Summary

DNS turns names into addresses. When it breaks, the network looks "up" (you're connected, other
things work) but specific sites fail to resolve, load intermittently, or resolve to the wrong
place. The tell is that connecting by address works while connecting by name doesn't.

## Diagnostic Steps

1. Confirm the pattern: name-based access fails while the connection is otherwise fine (other
   sites load, or a direct-IP test works).
2. Check whether it's one name or all names — a single failing name is that site/record; all names
   failing is your resolver or cache.
3. On VPN, suspect the tunnel's DNS if only *internal* names fail (see the VPN article).

## Resolution Steps

1. Flush the resolver cache: macOS `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder`;
   Windows `ipconfig /flushdns`; Linux depends on the resolver (`resolvectl flush-caches` on
   systemd).
2. Renew the network connection (toggle wifi / reconnect) so the client picks up correct DNS
   servers from DHCP.
3. If a specific record recently changed, expect propagation delay — the old answer can be cached
   upstream beyond your control for a while.

## Notes / Edge Cases

- A manually set custom DNS server that's unreachable produces exactly these symptoms — revert to
  automatic (DHCP-provided) DNS to test.
- "It works on my phone but not the laptop" often means the laptop cached a stale or wrong record.
