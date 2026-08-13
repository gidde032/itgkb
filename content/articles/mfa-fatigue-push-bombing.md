---
id: mfa-fatigue-push-bombing
title: 'MFA fatigue and push-bombing'
constellation: security
tags: [mfa, push-bombing, social-engineering, awareness, security]
summary:
  Why you never approve an unexpected MFA prompt — attackers spam prompts hoping you tap "approve"
  to make them stop.
stub: false
related: [suspected-account-compromise, recognizing-phishing]
---

## Summary

If an attacker already has your password, the only thing between them and your account is the MFA
prompt. "Push-bombing" (MFA fatigue) is them repeatedly triggering approval prompts, betting that
an annoyed or confused user eventually taps "approve." One tap is the whole compromise.

## The rule

Never approve an MFA prompt you did not personally start. An unexpected prompt is not a glitch —
it means someone is trying to sign in as you **with your password right now**.

## What to do

1. **Deny** the prompt (or ignore it — never approve).
2. Treat an unexpected prompt as a signal your password is already compromised: change it and
   revoke sessions (see suspected account compromise).
3. Report it so the org can see the sign-in attempts.
4. If your MFA supports number-matching or a verified-push style, prefer it — it can't be approved
   by a reflexive tap.

## Notes / Edge Cases

- Attackers sometimes call pretending to be IT and ask you to "approve the prompt to fix an issue"
  — legitimate IT will never ask you to approve an MFA prompt you didn't initiate.
- A burst of prompts at an odd hour is the classic pattern; deny, then change the password.
