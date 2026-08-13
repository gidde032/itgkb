---
id: mfa-new-device
title: 'MFA: enrolling a new device or a lost phone'
constellation: accounts-identity
tags: [mfa, two-factor, duo, enrollment, lost-device]
summary:
  Adding a new phone, replacing a lost one, and the fallback when you have no working second
  factor at all. Mostly self-service; escalate only when locked out.
stub: false
related: [account-access, suspected-account-compromise]
---

## Summary

Multi-factor enrollment is usually self-service: users add, remove, and reactivate devices through
the MFA provider's device-management page. The one genuine dead end is having no working second
factor **and** no backup method — that's the case that needs help-desk recovery.

## Diagnostic Steps

1. Determine the state: adding an additional device, replacing one they still have access to, or
   completely locked out with no way to approve a prompt.
2. Check for existing fallbacks — backup codes, a second enrolled device, or a phone-call/SMS
   option — before treating it as a lockout.

## Resolution Steps

1. **New/replacement device, still able to authenticate:** use the provider's "Manage devices"
   flow to add the new device, then remove the old one. For Duo, see
   <https://guide.duo.com/universal-prompt#add-or-manage-devices>.
2. **Reactivating after a reinstall/new phone (same number):** reactivate the existing enrollment
   rather than starting over — same flow.
3. **Fully locked out (no device, no codes):** this is not self-service — route to the help desk
   for identity-verified recovery (see account access).

## Notes / Edge Cases

- Encourage saving backup codes at enrollment; nearly every "locked out" ticket is someone who
  never generated them.
- A new phone with the *same* number still needs reactivation — carrying the SIM over does not
  move the authenticator app's enrollment.
