---
id: gmail-templates-missing
title: 'Gmail: saved templates missing or disappeared'
constellation: workspace-email
tags: [gmail, templates, drafts, canned-responses, google-workspace]
summary: Saved email templates (canned responses) are no longer available in the Compose Templates menu,
  either because the feature was disabled or the saved templates were purged.
stub: false
related: [workspace-session-auth, workspace-service-status, recovering-deleted-mail-calendar]
---

## Summary

A user reports that their saved email templates (Canned Responses) are gone from
Compose → ⋮ → Templates. Two distinct situations cause this: the Templates feature
itself is disabled or hidden, or the feature works but the saved template list is
empty. The root cause differs between the two, so distinguishing them early
matters.

## Diagnostic Steps

1. Confirm which situation applies: is the Templates menu entry missing entirely,
   or is it present but the saved template list is empty?
2. Verify the user is signed into the correct Google account — templates are
   account-specific and switching accounts makes them appear to vanish.
3. Check whether the Templates feature is enabled: Settings ⚙️ → See all
   settings → Advanced → Templates. If "Enable" is not selected, the menu entry
   will not appear.
4. Determine if the account is a Google Workspace (formerly G Suite) account.
   Workspace admins can disable the feature org-wide, which overrides the
   per-user setting.
5. Rule out a browser or session issue: try Gmail in an incognito/private window
   or a different browser to see if the menu reappears.

## Resolution Steps

1. If the Templates feature is disabled: re-enable it under Settings → Advanced →
   Templates → Enable, then save changes.
2. If a Workspace admin has disabled the feature: escalate to the admin team to
   check Admin Console → Apps → Google Workspace → Gmail → End User Access.
3. If the feature is enabled but saved templates are empty: check the Trash folder
   first — deleted drafts can land there and templates may be recoverable.
4. Create a test template to confirm the feature is actually saving. If the test
   template persists, the originals were likely deleted or purged rather than lost
   to a bug.
5. If the test template does not save, the feature may be broken at the account
   level — check the Google Workspace status dashboard for a known incident.
6. Going forward, email yourself important message drafts as a more durable
   workaround — draft-based templates share a 50-item cap with regular drafts
   and can be silently purged.

## Notes / Edge Cases

- Gmail stores templates as invisible drafts. Clearing the Drafts folder (or a
  mobile client doing so automatically) can destroy templates with no separate
  recovery path.
- There is a combined 50-item cap on drafts and templates. Approaching this
  limit can cause older templates to be silently purged to make room.
- On Workspace accounts, the admin policy for Templates takes precedence over
  the per-user setting. A policy change can make templates disappear with no
  action on the user's part.
- Once templates are gone and not in Trash, there is no native recovery.
  Closure language: "Templates are not recoverable once purged and not found in
  Trash. User advised to recreate needed templates and consider emailing
  themselves permanent drafts as a more stable workaround."
