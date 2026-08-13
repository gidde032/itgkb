---
id: enterprise-wifi-8021x
title: 'Connecting to enterprise (802.1X) wifi'
constellation: networking
tags: [wifi, 8021x, eduroam, certificates, authentication]
summary:
  Enterprise wifi authenticates with your account and a certificate, not a shared password. The
  usual "wrong password" is really a profile, certificate, or username-format problem.
stub: false
related: [vpn-when-and-failures, wired-ethernet-wont-connect]
---

## Summary

Enterprise (802.1X) wifi — including federated networks like eduroam — logs you in with your
account credentials over an encrypted, certificate-validated connection, unlike a home network's
single shared key. Most failures look like "wrong password" but are actually a stale saved
profile, a rejected certificate, or the username entered in the wrong format.

## Diagnostic Steps

1. Confirm the username format the network expects (often the full `user@domain` identity, not
   just the short username) and that the password is the account password, not a wifi key.
2. Check for a stale saved network: an old profile with a changed password or an untrusted
   certificate will keep failing silently.
3. Note any certificate prompt — being asked to trust a server certificate is normal on first
   join; repeatedly failing certificate validation points at a bad or missing profile.

## Resolution Steps

1. Forget/remove the saved network, then rejoin fresh and re-enter credentials.
2. Use the organization's official onboarding profile/configurator if one exists — it installs
   the right certificate and settings in one step and avoids manual mistakes.
3. Enter the identity in the exact format required, and accept the expected server certificate
   when prompted.

## Notes / Edge Cases

- After an account password change, every device's saved enterprise wifi must be updated —
  a suddenly-failing laptop right after a reset is almost always this.
- Federated networks authenticate you against your *home* organization even when you're a guest
  elsewhere; a home-side account problem follows you.
