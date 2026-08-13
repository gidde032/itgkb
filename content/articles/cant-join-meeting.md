---
id: cant-join-meeting
title: 'Can''t join a meeting or stuck in the lobby'
constellation: collaboration-meetings
tags: [video-conferencing, lobby, waiting-room, guest-access, sign-in]
summary:
  A "waiting for host" message, a locked lobby, or an outright block is usually an access-policy
  or wrong-account problem, not a broken link.
stub: false
related: [screen-sharing-fails, meeting-notifications-missing]
---

## Summary

Being unable to join splits into a few policy-driven cases: the host hasn't admitted you from the
lobby/waiting room, the meeting requires sign-in (and you're signed into the wrong or a personal
account), or external guests are restricted. The link is rarely the actual problem.

## Diagnostic Steps

1. Read the exact state: "waiting for host," "waiting to be admitted," a sign-in wall, or a hard
   "you can't join this meeting."
2. Check which account is signed in — joining with a personal account when the meeting is limited
   to the organization is a very common block.
3. Confirm whether the attendee is external, and whether the meeting allows external/guest join.

## Resolution Steps

1. Lobby/waiting room: the host must admit — message them; there's nothing the attendee can fix.
2. Sign-in required: switch to the correct organizational account (or open the link in a profile/
   browser signed into it) and rejoin.
3. External guest blocked: the host adjusts the meeting's guest settings, or provides a dial-in /
   guest-enabled link.

## Resolution Steps (host side)

1. Admit waiting participants, and if a whole group is external, relax the meeting's join
   restrictions before the meeting rather than during it.

## Notes / Edge Cases

- A meeting link opened in an app vs a browser can resolve to different sign-in states — if one
  path is blocked, try the other.
- Corporate-managed devices sometimes force meetings to open in a specific app; a link that
  "does nothing" may be waiting on that app to launch.
