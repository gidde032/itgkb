---
id: tdx-closure-notes
title: 'TDX: Writing effective ticket closure notes'
constellation: tdx
tags: [tdx, closure-notes, tickets, templates, documentation]
summary:
  Structure and template language for closing tickets cleanly — spontaneous resolution, user
  error, configuration change, and referral, with anti-patterns to avoid.
stub: false
related: [tdx-creating-tickets, tdx-escalation, gcal-transient-errors, workspace-service-status]
---

## Summary

A good closure note answers four questions for whoever reads the ticket later: what was
reported, what was tried, what resolved it, and what the user should do if it recurs. The
templates below cover the common resolution types.

## Closure Note Structure

Every closure note should include:

1. **What was reported** — the symptom in the user's terms, searchable wording.
2. **What was tried** — the diagnostics that mattered (not every dead end).
3. **What resolved it** — the actual cause and fix, or "resolved without intervention."
4. **Recurrence path** — what the user should do if it comes back.

## Template: Spontaneous Resolution

> "Resolved spontaneously. No Google Workspace incidents reported. Likely a momentary backend
> error. User advised to report if issue recurs."

Use when an issue clears overnight with no intervention: confirm the status dashboard was
clean for the symptom window, confirm it no longer reproduces, and leave the recurrence
invitation explicit. This wording was refined from a real Calendar ticket — see the
anti-patterns section for what was cut from earlier drafts.

## Template: User Error

> "User was [what they were doing]. Correct procedure is [the procedure]. Walked user through
> the correct approach and confirmed they can complete it independently."

[NEEDS VERIFICATION] — pattern is sound; align tone and phrasing with Carlson closure-note
conventions before treating as standard.

## Template: Configuration Change

> "Changed [setting name] at [location, e.g. Admin Console path] from [old] to [new] because
> [reason]. Expected behavior now: [behavior]."

[NEEDS VERIFICATION] — confirm which configuration changes student employees may make and
record themselves vs. reference from an escalation.

## Template: Referred to Another Team

> "Tried [in-tier steps] without resolution. Escalating to [team] because [reason]. Handoff
> includes: steps tried, exact error messages, screenshots, user impact."

[NEEDS VERIFICATION] — insert actual Carlson team names and handoff channel. See the
escalation procedures article for what belongs in the handoff.

## Anti-Patterns

- **Overcomplication:** an early draft of the spontaneous-resolution note above speculated
  about rate limiting; it was cut once it was clear a single user clicking through the UI
  essentially cannot hit rate limits. Don't ship speculative causes.
- **Vagueness:** "fixed it" helps nobody six months later. Name the cause and the fix.
- **Dead-end dumping:** diagnostics that were ruled out don't belong in the closure note —
  they belong in the ticket's working notes, if anywhere.
