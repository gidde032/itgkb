---
id: workspace-session-auth
title: 'Google Workspace: Session and auth token issues'
constellation: workspace-email
tags: [google-workspace, session, auth, browser, incognito]
summary:
  Stale browser sessions can masquerade as permission or quota errors across Workspace apps.
  The new-session test separates them.
stub: false
related: [workspace-service-status, gcal-transient-errors]
---

## Summary

An expired or stale auth session can produce errors that look like permission problems, quota
limits, or feature breakage. Because the error text rarely says "your session is stale," this
cause hides behind more alarming explanations.

## Diagnostic Steps

1. Try the same action in an incognito/private window (fresh session, no extensions).
2. If incognito works: the problem is session or extension state, not the account or policy.
3. If incognito fails too: try a different browser entirely, then a different account if
   available — this separates browser-level from account-level causes.

## Resolution Steps

1. Session state: sign fully out and back in, or clear the site's cookies; re-test.
2. Extension interference: re-enable extensions in batches to find the culprit.
3. If a fresh session in a second browser still fails: stop — this is account- or
   service-side. Check the status dashboard and escalate with the evidence collected.

## Notes / Edge Cases

- The incognito test is the highest-information single step for "weird Workspace behavior" —
  run it before deep-diving anything.
- When to advise waiting instead: if the status dashboard shows an incident, no local fix will
  help.
