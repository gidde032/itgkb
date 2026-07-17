---
id: icloud-node-modules
title: 'macOS: iCloud Drive sync conflicts with node_modules'
constellation: dev-environment
tags: [macos, icloud, node-modules, filesystem, sync]
summary:
  rm -rf or mv hangs on large node_modules folders because iCloud is actively syncing them.
  Move projects out of Desktop/Documents.
stub: false
related: [esbuild-missing-arm64]
---

## Summary

On Macs with default settings, Desktop and Documents are iCloud-synced. A `node_modules` tree
(tens of thousands of small files) makes iCloud churn constantly, and deleting or moving the
folder can hang while the sync daemon holds files.

## Diagnostic Steps

1. Check where the project lives: anything under `~/Desktop` or `~/Documents` is iCloud-synced
   by default.
2. Confirm the symptom: `rm -rf node_modules` or `mv` sits for minutes; Finder shows sync
   progress badges on the folder.

## Resolution Steps

1. Pause iCloud sync (System Settings → Apple ID → iCloud → iCloud Drive), then retry the
   delete/move.
2. Permanent fix: keep code in a non-synced location — `~/Projects/` works well — and reserve
   Desktop/Documents for documents.

## Notes / Edge Cases

- This also quietly wastes iCloud storage quota and battery on constant sync.
- University-managed machines may have iCloud disabled entirely — then this article does not
  apply; look elsewhere for the hang.
