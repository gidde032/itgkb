---
id: kill-localhost-processes
title: 'Killing orphaned localhost processes'
constellation: dev-environment
tags: [nodejs, ports, localhost, processes, dev-server]
summary:
  When npm run dev leaves a port occupied after the terminal closes — find and kill the process
  on Mac/Linux and Windows.
stub: false
related: [node-vite-version-mismatch]
---

## Summary

Closing a terminal doesn't always kill the dev server it launched. The next `npm run dev`
fails with "port already in use." The fix is finding the orphaned process holding the port and
killing it.

## Diagnostic Steps

1. Confirm the symptom: the dev server reports the port (e.g. 3000 or 5173) is in use.
2. Identify the holder — Mac/Linux: `lsof -ti :3000`; Windows: `netstat -ano | findstr :3000`
   (the last column is the PID).

## Resolution Steps

1. Mac/Linux, targeted: `lsof -ti :3000 | xargs kill -9`
2. Windows: `taskkill /PID <pid> /F` using the PID from netstat.
3. Nuclear option (kills every Node process — close things you care about first):
   `killall node` (Mac/Linux).

## Notes / Edge Cases

- If the port re-occupies immediately, something is auto-restarting the process (a watcher,
  IDE integration, or service manager) — find the parent instead of re-killing the child.
- Vite defaults to 5173; Create-React-App era projects default to 3000 — check which port the
  error names before killing.
