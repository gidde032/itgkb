---
id: gcal-event-couldnt-update
title: 'Google Calendar: "Event couldn''t be updated" error'
constellation: google-workspace
tags: [google-calendar, sharing, external-domains, admin-console, guests]
summary:
  User gets a "calendar use limit exceeded" style error when adding collaborators or guests to
  an event, often involving external (non-UMN) addresses.
stub: false
related: [gcal-cannot-be-shown, workspace-service-status]
---

## Summary

A user tries to add a collaborator or guest to a Google Calendar event and gets an error such as
"Event couldn't be updated" or a "calendar use limit" message. Despite the wording, this is
usually not a real quota problem — the common causes are guest-count limits, external-domain
sharing policy, or a transient backend error.

## Diagnostic Steps

1. Ask how many guests are on the event. Google enforces a guest limit (around 200 for standard
   events — verify current limit); large recurring meetings can hit it.
2. Check whether the address being added is external (not `@umn.edu`). External addresses are
   subject to the Workspace admin sharing policy.
3. Check whether the external address is a non-Google account (no Google/Workspace identity
   behind it) — behavior differs from external Gmail/Workspace addresses.
4. Rule out a stale session: have the user try a new browser session or incognito window (see
   the session and auth token article).
5. Check the Google Workspace status dashboard for a known Calendar incident (see the service
   status article).

## Resolution Steps

1. If guest count is the cause: trim the guest list or distribute via a Google Group instead of
   individual invites.
2. If external sharing policy is the cause: verify the setting in Admin Console under
   Apps → Google Workspace → Calendar → Sharing settings (requires admin access — escalate if
   you don't have it).
3. If nothing reproduces and no policy applies: treat it as transient. Advise a new browser
   instance and waiting 15–30 minutes, and ask the user to report back if it recurs.

## Notes / Edge Cases

- Transient cases often resolve overnight with no intervention. Suggested closure language:
  "Resolved spontaneously. Likely momentary backend error. User advised to try a new browser
  instance, wait 15–30 minutes, and report if it recurs."
- Draft note: authored from summarized ticket history; details marked "(verify)" or approximate
  should be confirmed against the original ticket before treating as authoritative.
