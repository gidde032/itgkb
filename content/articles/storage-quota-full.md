---
id: storage-quota-full
title: 'Storage quota is full'
constellation: files-storage
tags: [cloud-storage, quota, cleanup, email, attachments]
summary:
  Finding what actually fills a cloud account — large files, shared items you own, hidden trash,
  and email attachments — and freeing space safely.
stub: false
related: [sync-client-wont-sync, restoring-deleted-file-version]
---

## Summary

A full quota blocks new uploads and can stop mail delivery, but the space is rarely where users
expect. The usual culprits are a few very large files, items the user owns but shared into other
people's spaces, the trash (which still counts), and — on suites that pool storage — email and
its attachments.

## Diagnostic Steps

1. Sort the account's files by size to find the handful of large items that dominate usage.
2. Check the trash/bin — deleted files count against quota until the trash is emptied or its
   retention window passes.
3. On a pooled suite (storage shared across mail + files), check large mail attachments too.
4. Remember ownership: files the user created and shared elsewhere still count against *their*
   quota, even inside someone else's folder.

## Resolution Steps

1. Remove or archive the largest unneeded files first — biggest wins for least effort.
2. Empty the trash after confirming nothing there is needed; expect quota to update within
   minutes, not instantly.
3. Offload rarely-touched large files to a team drive or an archive location instead of deleting.
4. If the account is legitimately at its limit, request a quota increase rather than forcing the
   user to delete working files.

## Notes / Edge Cases

- Quota figures lag; wait a few minutes after cleanup before judging whether it worked.
- Shared files can only be *fully* removed from your quota by the owner — reassigning ownership
  moves the storage cost with the file.
