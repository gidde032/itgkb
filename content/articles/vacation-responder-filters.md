---
id: vacation-responder-filters
title: 'Vacation responder and mail filter gotchas'
constellation: workspace-email
tags: [email, vacation-responder, filters, rules, auto-reply]
summary:
  Why auto-replies don't fire for some senders and how mail filters silently move or delete
  messages users then report as "missing."
stub: false
related: [email-delegation-send-as, recovering-deleted-mail-calendar]
---

## Summary

Two adjacent features cause quiet confusion: the vacation/out-of-office responder (which
deliberately doesn't reply to everyone) and mail filters/rules (which move, archive, or delete
mail before the user ever sees it, then get reported as lost messages).

## Diagnostic Steps

1. Vacation responder "not working": confirm the date range is active, and remember it usually
   replies **once per sender**, and often only to your organization or to people in contacts —
   not to every message. Mailing lists are typically skipped by design.
2. "Missing" mail: check the account's filters/rules for anything that archives, labels, marks as
   read, forwards, or deletes matching messages — a broad rule catches far more than intended.

## Resolution Steps

1. Set the responder's start/end dates explicitly and choose the audience scope deliberately;
   explain that a single sender won't get repeated replies.
2. Audit filters top to bottom: disable or narrow any over-broad rule, and search all mail
   (including spam and trash) to find where the "missing" messages landed.
3. For a rule that deletes, recover recent matches from trash before they age out (see recovering
   deleted mail).

## Notes / Edge Cases

- Auto-reply loops between two out-of-office systems are prevented on purpose — that's why some
  auto-responses never arrive.
- Filters run in order and can stop processing early; a message can be caught by a rule the user
  forgot was above the one they're looking at.
