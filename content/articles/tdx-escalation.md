---
id: tdx-escalation
title: 'TDX: Escalation procedures'
constellation: ticketing-itsm
tags: [tdx, escalation, tickets, procedure, documentation]
summary:
  When to escalate vs. keep working an issue, and how to write an escalation note the next
  team can act on without re-doing your work.
stub: false
related: [tdx-creating-tickets, tdx-closure-notes, umn-account-access]
---

## Summary

Escalation is a decision with a framework, not a reflex. Transient issues don't warrant it;
persistent issues outside tier-1 scope do — with documentation that lets the receiving team
start where you stopped.

## Escalation Decision Framework

1. **Run standard diagnostics first.** Whatever the category's baseline checks are (fresh
   session test, status dashboard, reproduce attempt), do them before considering escalation.
2. **Check for transience.** If the issue may be a momentary backend error, wait and recheck
   before escalating. Real example from a Calendar ticket: the resolution rule was "if it
   happens again consistently, *then* escalate to checking admin policies" — one transient
   failure never justified the escalation.
3. **Escalate when it's persistent AND outside tier-1 scope** — admin-console policy changes,
   account/identity system actions, and physical hardware repair are typical examples.

## What to Include in an Escalation Note

- Steps already tried, in order, with outcomes.
- Exact error messages (copied, not paraphrased) and screenshots.
- User impact and urgency — who is blocked and from what.
- Environment: device, OS, browser, account type.

## What NOT to Do

- Escalate a transient issue that hasn't been given the wait-and-recheck treatment.
- Escalate without attempting the basic diagnostics for the category.
- Escalate without documenting what was tried — the receiving team will re-do your work or
  bounce the ticket back.

## Escalation Targets

Likely targets by issue class: UMN central IT (account/identity), Google Workspace admin
(admin-console policy), hardware support (physical equipment). [NEEDS VERIFICATION] — the
actual Carlson escalation map: which team handles what, contact methods/queues, and SLA
expectations to set with the user at handoff time.
