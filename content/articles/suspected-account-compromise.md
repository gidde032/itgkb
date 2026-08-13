---
id: suspected-account-compromise
title: 'Suspected account compromise'
constellation: accounts-identity
tags: [security, account-compromise, incident-response, passwords, sessions]
summary:
  The first actions when an account may be compromised — change the password, revoke active
  sessions, check for attacker persistence, and report.
stub: false
related: [password-managers-strong-passwords, clicked-phishing-response]
---

## Summary

If an account may be compromised, speed matters and the order matters. The goals are to lock the
attacker out (new password + revoke sessions), remove any persistence they set up (forwarding
rules, added devices), and report so the org can check for blast radius.

## Diagnostic Steps

1. Gather the signal: unexpected sign-in alerts, sent mail the user didn't send, new mail
   filters/forwarding, or an MFA prompt they didn't trigger.
2. Determine reach: is it just this account, or shared credentials/reused passwords that expose
   others too?

## Resolution Steps

1. **Change the password now** (from a known-clean device), and change it anywhere the same
   password was reused.
2. **Revoke active sessions / sign out everywhere**, so an attacker's existing session is killed,
   not just the password changed.
3. **Check for persistence:** remove unknown mail forwarding rules and filters, and unenrolled/
   unexpected MFA devices — attackers add these to keep access after a reset.
4. **Report it** through the organization's security/help-desk path so they can review logs and
   scope the incident.

## Notes / Edge Cases

- Changing the password without revoking sessions can leave the attacker logged in — do both.
- If the account is the user's primary email, treat every account that uses it for password resets
  as potentially exposed.
