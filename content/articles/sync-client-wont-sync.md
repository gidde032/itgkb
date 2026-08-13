---
id: sync-client-wont-sync
title: "Desktop sync client won't sync"
constellation: files-storage
tags: [cloud-storage, sync, desktop-client, onedrive, drive]
summary:
  A cloud desktop client (Drive/OneDrive/Box) stuck "syncing" or paused. The standard
  pause/resume, re-link, and path/quota checks before reinstalling.
stub: false
related: [storage-quota-full, sharing-links-permissions]
---

## Summary

Desktop sync clients wedge for a handful of predictable reasons: the client is paused, the
account got signed out, a single file is blocking the queue, the path is too long/illegal, or the
account is out of space. Work those before reinstalling.

## Diagnostic Steps

1. Open the client's status: is it paused, signed out, or reporting an error on a specific file?
2. Check free space both locally and in the cloud account (a full cloud quota stalls uploads;
   a full disk stalls downloads).
3. Look for a problem file: illegal characters, an over-long path (common on Windows), or an
   open/locked file the client can't write.

## Resolution Steps

1. Pause and resume sync — it clears a surprising number of transient stalls.
2. Sign out and back in to re-establish the account link if it shows signed-out or auth errors.
3. Rename/remove the offending file or shorten a deep folder path, then let the queue drain.
4. Only if all else fails: quit the client, and reinstall/re-link; the cloud copy is the source
   of truth, so local re-download is safe.

## Notes / Edge Cases

- "Online-only"/on-demand files show in the folder but aren't downloaded until opened — a missing
  file may just be dehydrated, not gone.
- Two machines editing the same file offline produce a conflict copy rather than data loss —
  reconcile the two versions rather than deleting one blindly.
