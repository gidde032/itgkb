---
id: clicked-phishing-response
title: 'I clicked it or entered my password'
constellation: security
tags: [phishing, incident-response, credentials, mfa, containment]
summary:
  The containment checklist for a user who already clicked a phishing link, entered credentials,
  or approved a prompt — act fast, in order.
stub: false
related: [suspected-account-compromise, reporting-suspicious-email]
---

## Summary

Once someone has clicked and entered credentials (or approved a prompt), the message is no longer
"be careful" — it's containment. Assume the password is compromised and move quickly: cut off
access, remove attacker persistence, and report.

## Resolution Steps

1. **Change the password immediately** from a known-clean device, and change it anywhere the same
   password was reused.
2. **Revoke active sessions / sign out everywhere** so an already-established session is killed.
3. **Check for persistence:** remove any mail forwarding rules, filters, or MFA devices the user
   didn't set up — these are how attackers keep access after a reset.
4. **Report it** to the security/help-desk path with the details (what was clicked, what was
   entered, when) so they can scope it — see suspected account compromise for the deeper review.
5. If the user ran a downloaded file, disconnect the device from the network and escalate for a
   malware check rather than "seeing if it's fine."

## Notes / Edge Cases

- Speed matters more than certainty — act on suspicion; a needless password change costs minutes,
  a real compromise left open costs far more.
- Entering a password on a fake page means the attacker has it even if "nothing happened" — the
  quiet cases are the dangerous ones.
