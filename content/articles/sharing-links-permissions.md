---
id: sharing-links-permissions
title: 'Sharing links & permission levels'
constellation: files-storage
tags: [cloud-storage, sharing, permissions, links, access-control]
summary:
  Viewer vs commenter vs editor, and why "anyone with the link" quietly over-shares. How to give
  the right access without opening a file to the world.
stub: false
related: [cloud-storage-personal-vs-shared, sync-client-wont-sync]
---

## Summary

Sharing has two independent dials: **who** can access (specific people, your organization, or
anyone with the link) and **what** they can do (view, comment, edit). Most access problems are a
mismatch — either too tight (the person genuinely can't open it) or too loose ("anyone with the
link" on something sensitive).

## Diagnostic Steps

1. Have the owner open the share dialog and read both dials aloud: the audience scope and the
   role granted to each person.
2. For "they can't open it": check whether the person is added specifically, is inside the
   allowed audience, and whether the link scope matches how they're opening it.
3. For "too many people can see it": look for an "anyone with the link" setting, which travels
   anywhere the link is forwarded.

## Resolution Steps

1. Grant the minimum role that works: viewer for read-only, commenter for feedback, editor only
   when they must change the file.
2. Prefer sharing with **specific people or your organization** over "anyone with the link";
   reserve link-sharing for genuinely public material.
3. Removing access takes effect going forward — anyone who already downloaded a copy still has it.

## Notes / Edge Cases

- "Anyone with the link" is not searchable but is fully accessible to anyone the link reaches —
  treat a forwarded link as a forwarded file.
- Inherited folder permissions can override what you set on a single file; check the parent
  folder when access seems wrong.
