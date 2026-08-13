---
id: reporting-suspicious-email
title: 'Reporting a suspicious email'
constellation: security
tags: [phishing, reporting, email, security, incident]
summary:
  How and where to report a phish, and why forwarding it as an attachment (not inline) preserves
  the headers responders need.
stub: false
related: [recognizing-phishing, clicked-phishing-response]
---

## Summary

Reporting a phish does two things: it protects colleagues (responders can pull the same message
from other inboxes) and it feeds filtering. The one technical detail that matters is *how* you
forward it — as an attachment, so the original headers survive.

## Resolution Steps

1. Use the built-in **"Report phishing"** button if the mail client has one — it packages the
   message with its headers automatically and routes it correctly.
2. If reporting by forward, **forward as an attachment** (attach the original message) rather than
   a normal inline forward. Inline forwarding strips the headers responders need to trace it.
3. Send it to the organization's designated reporting address / security team, then delete the
   original from the inbox.

## Notes / Edge Cases

- Don't click links or open attachments "to check" before reporting — report first, investigate
  never (leave that to the responders).
- If you already interacted with it (clicked, entered credentials, approved a prompt), reporting
  isn't enough — follow the "I clicked it" response steps immediately.
- Reporting benefits everyone even if you didn't fall for it; a single report can get a campaign
  pulled from many mailboxes.
