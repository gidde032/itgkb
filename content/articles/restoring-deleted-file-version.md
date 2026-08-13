---
id: restoring-deleted-file-version
title: 'Restoring a deleted file or previous version'
constellation: files-storage
tags: [cloud-storage, version-history, recovery, trash, backups]
summary:
  Two different recoveries — undo a bad edit with version history, or bring back a deleted file
  from the trash — plus the retention windows that decide whether it's still possible.
stub: false
related: [cloud-storage-personal-vs-shared, storage-quota-full]
---

## Summary

"I lost my file" is two different problems: the file was *edited* wrong (use version history) or
the file was *deleted* (use the trash). Both have time limits, so acting sooner is better, and
both depend on who owns the file.

## Diagnostic Steps

1. Clarify which case it is: the file still exists but has wrong content (versioning), or the
   file is gone from its folder (trash).
2. Confirm ownership — a co-editor may need the owner to perform the restore, and shared/team
   drives have their own trash separate from personal trash.

## Resolution Steps

1. **Bad edit:** open the file's version history and restore or copy an earlier version. Named
   versions and autosaved points are both there; restoring makes a new current version rather
   than destroying the later ones.
2. **Deleted file:** open the trash/bin and restore it to its original location. Team-drive
   deletions live in the team-drive trash, not the person's.
3. If it's past the retention window, escalate: admins can sometimes recover within a longer
   grace period than the user-visible trash.

## Notes / Edge Cases

- Trash retention is typically around 30 days but varies by product and plan — treat it as a
  deadline, not a safety net.
- Version history is not a backup: it protects against edits, not against the whole account being
  lost. Genuinely critical data still needs a real backup.
