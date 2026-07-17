---
id: workspace-service-status
title: 'Google Workspace: Checking service status'
constellation: google-workspace
tags: [google-workspace, outage, status-dashboard, triage]
summary:
  How to use the Google Workspace Status Dashboard to separate a known Google outage from a
  local or user-specific problem.
stub: false
related: [gcal-event-couldnt-update]
---

## Summary

Before deep-diving a Workspace issue, check whether Google is already reporting it. The status
dashboard at workspace.google.com/status lists service-level incidents for Gmail, Calendar,
Drive, Meet, and the rest of the suite.

## Diagnostic Steps

1. Open the Google Workspace Status Dashboard (workspace.google.com/status).
2. Look for an active or recent incident on the affected service.
3. If an incident is listed and matches the symptom window, attribute the ticket to it and
   monitor.
4. If nothing is listed, keep in mind what the dashboard does NOT show: per-user rate limits,
   single-datacenter hiccups, and expired/stale sessions all look like outages to the user but
   never appear on the dashboard.

## Resolution Steps

1. Known incident: inform the user, link the incident, and close or hold the ticket per team
   practice once Google marks it resolved.
2. No incident: continue local diagnosis — new browser session, different account, different
   network — before escalating.

## Notes / Edge Cases

- A clean dashboard does not prove the problem is local, but it shifts the odds strongly toward
  session, policy, or user-specific causes.
