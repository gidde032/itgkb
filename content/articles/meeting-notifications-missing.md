---
id: meeting-notifications-missing
title: 'Chat or meeting notifications not arriving'
constellation: collaboration-meetings
tags: [collaboration, chat, notifications, focus-mode, accounts]
summary:
  Missing chat/meeting alerts are usually Focus/Do-Not-Disturb, per-channel muting, or being
  signed into the wrong account — not a broken app.
stub: false
related: [cant-join-meeting, video-call-no-audio]
---

## Summary

Notifications go quiet for layered reasons: the operating system is suppressing them (Focus / Do
Not Disturb), the app's own settings mute a channel or the whole app, or the user is signed into a
different account/tenant than the one where the messages arrive. Check all three layers.

## Diagnostic Steps

1. OS layer: is Focus/Do Not Disturb on, or is the app disallowed from sending notifications
   (macOS: System Settings → Notifications; Windows: Settings → Notifications)?
2. App layer: global "pause notifications," a muted channel/chat, or an away/"in a meeting" status
   that auto-suppresses alerts.
3. Account layer: confirm the user is signed into the account/organization where the messages are
   actually sent — a second personal or guest account is a common trap.

## Resolution Steps

1. Turn off Focus/DND (or add the app as an allowed exception), then confirm the OS lets the app
   post banners and sounds.
2. In the app, re-enable notifications globally and un-mute the specific channels that matter;
   set a sane default (e.g. mentions + direct messages).
3. Sign into the correct account, or sign out of the extra account that's intercepting the
   session.

## Notes / Edge Cases

- Desktop and mobile can be configured to hand off notifications (only alert mobile when desktop
  is idle) — "no desktop alerts" may be that feature working as designed.
- Email-digest settings can replace real-time alerts; a user expecting instant pings may just be
  on a batched digest.
