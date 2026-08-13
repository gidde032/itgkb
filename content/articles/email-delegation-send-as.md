---
id: email-delegation-send-as
title: 'Email delegation and send-as'
constellation: workspace-email
tags: [email, delegation, send-as, shared-mailbox, permissions]
summary:
  Granting someone access to read or send from your mailbox, and the confusing "who is this
  from" behavior that generates follow-up tickets.
stub: false
related: [gcal-event-couldnt-update, workspace-session-auth]
---

## Summary

Delegation lets an assistant or teammate read and send mail on behalf of another mailbox. The
mechanics are simple; the confusion is the "from" line — delegated mail is typically stamped
"sent by X on behalf of Y," which recipients and senders both misread as a spoof or a mistake.

## Diagnostic Steps

1. Clarify what's actually needed: read-only access, send-on-behalf, or full send-as (appears to
   come straight from the mailbox with no "on behalf of").
2. Confirm where it's configured — personal mailbox delegation settings vs an admin-managed
   shared mailbox — since the setup path and permissions differ.

## Resolution Steps

1. For an assistant: the mailbox owner adds the delegate in their mail settings; the delegate then
   adds the delegated mailbox to their client.
2. For a team address everyone sends from: use a proper shared mailbox / group rather than
   personal delegation, so membership (not one owner) controls access.
3. Set expectations about the "on behalf of" stamp up front; true send-as (no stamp) is usually
   an admin-granted permission, not self-service.

## Notes / Edge Cases

- Removing a delegate does not recall mail they already sent or read — treat delegation like
  handing over a key.
- Calendar delegation is separate from mail delegation; granting one does not grant the other.
