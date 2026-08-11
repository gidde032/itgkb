---
id: gcal-cannot-be-shown
title: 'Google Calendar: "Calendar cannot be shown" warning'
constellation: workspace-email
tags: [google-calendar, sharing, external-domains, visibility, guests]
summary:
  An asterisk / warning that an external guest's calendar "cannot be shown" when adding them to
  an event. Visibility-only; the invite still works.
stub: false
related: [gcal-event-couldnt-update]
---

## Summary

When adding an external guest to an event, Google Calendar may mark the guest with an asterisk
and a warning that their calendar cannot be shown. Users often read this as the invite failing.
It is a visibility-only limitation: the organizer cannot see the guest's free/busy information.
The invitation itself is delivered normally.

## Diagnostic Steps

1. Confirm the warning text refers to calendar visibility (free/busy), not delivery failure.
2. Confirm the guest address is external to UMN's Workspace domain — this is expected for
   external guests whose calendars are not shared across domains.

## Resolution Steps

1. Reassure the user: the guest can still receive the invite, RSVP, and join any attached
   meeting link. No fix is required.
2. If the organizer genuinely needs free/busy visibility for an external collaborator, that is
   a cross-domain calendar sharing question — refer to the external domain sharing policy
   (admin-level) rather than treating it as a bug.

## Notes / Edge Cases

- Good ticket framing: "expected behavior, informational warning" — resolve rather than
  escalate.
- Draft note: authored from summarized ticket history; red-pen against the original ticket.
