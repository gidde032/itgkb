---
id: recovering-deleted-mail-calendar
title: 'Recovering deleted mail and calendar events'
constellation: workspace-email
tags: [email, calendar, recovery, trash, retention]
summary:
  Where deleted mail and calendar events go, the recovery window, and when an item is truly gone
  versus recoverable by the user or an admin.
stub: false
related: [gcal-cannot-be-shown, email-delegation-send-as]
---

## Summary

Deleted mail and events aren't immediately destroyed — they sit in a trash/bin with a retention
window. Most "I lost an email/meeting" cases are a straightforward trash restore; the ones that
aren't have usually aged past the window or were removed from a shared resource.

## Diagnostic Steps

1. Identify what and when: a single message, a whole thread, or a recurring meeting — and roughly
   how long ago it was deleted.
2. Check the obvious trash first (mail Bin/Trash, calendar Trash), then consider retention: past
   ~30 days, user-visible recovery usually ends.

## Resolution Steps

1. Mail: open Trash/Bin, find the message, and move it back to the inbox or a folder. A message
   that was archived (not deleted) isn't in trash — search all mail instead.
2. Calendar: use the calendar's Trash to restore deleted events; for a recurring series, confirm
   whether one occurrence or the whole series was removed.
3. Past the window: escalate — admins can sometimes recover within a longer grace period than the
   user sees.

## Notes / Edge Cases

- Archived vs deleted is the frequent mix-up: archived mail is still in the account, just not in
  the inbox — search rather than hunt the trash.
- An event deleted by its *organizer* is removed for all guests; a guest who "deleted" it only
  removed their copy and can often re-add from the original invite.
