---
id: gcal-external-sharing
title: 'Google Calendar: External domain sharing restrictions'
constellation: workspace-email
tags: [google-calendar, sharing, external-domains, admin-console, policy]
summary:
  How your Workspace admin policy controls whether calendar events can be shared with external
  addresses, and where to check it.
stub: false
related: [gcal-event-couldnt-update, gcal-cannot-be-shown]
---

## Summary

Whether a calendar event can be shared with an external address is governed by the Google
Workspace admin policy for your organization's domain, not by anything the individual user
controls. Symptoms of a policy restriction look like per-event errors or missing visibility,
which is why users rarely suspect the real cause.

## Diagnostic Steps

1. Identify the external address type: another organization's Workspace domain, a personal
   Gmail, or a non-Google address (including some international corporate domains).
2. Check the admin policy location: Admin Console → Apps → Google Workspace → Calendar →
   Sharing settings (requires admin access — front-line technicians typically escalate for this).
3. Confirm what the policy allows: external sharing may be limited to free/busy only, or
   allowed with a warning, per organizational unit.

## Resolution Steps

1. If the policy explains the behavior: communicate the limitation to the user; suggest
   workarounds (share the meeting link directly, invite rather than share the calendar).
2. If a policy change is genuinely needed: escalate with the specific scenario documented —
   who, which domain, what failed.

## Notes / Edge Cases

- Common scenarios: sharing with another organization's Workspace addresses usually works (both
  sides are Workspace); personal Gmail works but with visibility warnings; non-Google addresses
  get invites by email only.
