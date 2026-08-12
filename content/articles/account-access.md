---
id: account-access
title: 'Account access: scope and escalation'
constellation: accounts-identity
tags: [accounts, passwords, two-factor, lockouts, escalation]
summary:
  Common account-access scenarios — resets, 2FA, lockouts — with the in-scope /
  refer-to-central-IT boundary for front-line technicians.
stub: true
related: []
---

## Summary

Account-access requests are a predictable high-frequency category. The critical knowledge is
the scope boundary: which actions a front-line technician performs directly, and which get
referred to central IT / the identity team. Getting the boundary wrong either wastes the user's
time or touches systems the service desk shouldn't.

## Common Scenarios

1. **Password reset** — organizations standardly provide a self-service reset portal; the first
   move is directing the user there. Organization detail to fill in: the self-service reset URL,
   and whether any reset action is in-scope at the service desk beyond directing to it.
2. **Two-factor problems** — new device enrollment, lost device, no backup codes. Organization
   detail to fill in: your MFA provider and which 2FA actions (e.g. re-enrollment) require
   central IT.
3. **Account lockout** — standard patterns are a cooldown wait or a central-IT unlock.
   Organization detail to fill in: the actual lockout policy and unlock path.
4. **New account provisioning** — organization detail to fill in: whether the service desk has
   any local provisioning procedure or if it is entirely central.

## Scope Boundary

Organization-specific: the definitive list of account actions in-scope at the service desk vs.
referred to central IT, and the referral path (queue, contact, expected SLA).

## Verification Before Helping

Organization-specific: identity-verification requirements before discussing any account with a
walk-in or remote user (what ID or confirmation is required, per policy).

## Notes / Edge Cases

- When referring out, write the handoff like an escalation note: scenario, what was already
  checked, exact error text.
