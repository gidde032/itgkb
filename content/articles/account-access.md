---
id: account-access
title: 'Account access: scope and routing'
constellation: accounts-identity
tags: [accounts, passwords, two-factor, box, escalation]
summary:
  What to route to the help desk, what users self-serve, and what to ticket across the common
  account-access requests — password resets, MFA devices, email, and app accounts.
stub: false
related: []
---

## Summary

Account-access requests are a predictable, high-frequency category. The useful knowledge is
routing: most requests are **not** self-service and belong at the organization's main help desk,
while multi-factor device management is genuinely self-service, and a few app accounts are
ticketed. Getting the routing right saves the user a round trip.

## Password resets & general account support

There is no self-service reset form. Route **all** password-reset requests and general account
support to the organization's main help desk — do not attempt resets directly.

## Multi-factor (MFA) device management

Adding, removing, and reactivating MFA devices is self-service through the MFA provider. For a
Duo-based setup:

1. **Add or remove a device** — from a Duo authentication prompt, choose "Other options" →
   "Manage devices" (Universal Prompt), then add or remove; see
   <https://guide.duo.com/universal-prompt#add-or-manage-devices>.
2. **Reactivate a previously connected device** (new phone, same number, or a reinstalled app) —
   use the same "Manage devices" flow to reactivate the existing enrollment rather than starting
   over.

Point the user at the self-service flow first; only escalate if they can't reach a prompt at all
(e.g. no working device and no backup method).

## Email domain requests

Route email domain requests to the organization's main help desk.

## Application accounts

- **Box (or similar cloud storage)** — first check whether the user is already enrolled /
  provisioned; if they are not, submit a ticket to have access provisioned.
- **Research software / database accounts** — submit a ticket; these are provisioned per system,
  not at the desk.

## Notes / Edge Cases

- When routing out, write the handoff like an escalation note: scenario, what was already
  checked, and the exact error text.
