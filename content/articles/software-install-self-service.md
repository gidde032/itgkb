---
id: software-install-self-service
title: 'Software installation and self-service portals'
constellation: hardware-endpoints
tags: [software, installation, self-service, admin-rights, managed-devices]
summary:
  Why "I can't install this" happens on managed devices, and the self-service portal / request
  path that gets approved software on without local admin.
stub: false
related: [slow-computer-triage, disk-encryption]
---

## Summary

On a managed device, users often can't install software directly — that's by design, not a fault.
Organizations push approved software through a self-service portal or a managed catalog so
installs are vetted, licensed, and consistent. The ticket is usually "how do I get X," not "my
installer is broken."

## Diagnostic Steps

1. Determine device management: is this a managed/enrolled device (no local admin) or the user's
   own machine? That decides whether self-service or a direct install applies.
2. Check whether the wanted software is in the organization's self-service catalog, needs a
   request/approval, or isn't offered at all.

## Resolution Steps

1. **Managed device, software in the catalog:** point the user to the self-service portal /
   managed software app to install it themselves — no admin rights needed.
2. **Not in the catalog:** submit a software request; approval may involve licensing or security
   review, so set expectations on time.
3. **Genuine one-off need for admin:** follow the organization's temporary-elevation process
   rather than handing out standing admin rights.

## Notes / Edge Cases

- An installer failing with a permissions/"blocked by administrator" error is the managed-device
  policy working — route to self-service instead of fighting it.
- Licensed software often requires the user be in an entitlement group first; a successful install
  that won't activate is usually a licensing, not an install, problem.
