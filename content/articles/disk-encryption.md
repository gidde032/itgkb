---
id: disk-encryption
title: 'Disk encryption (FileVault / BitLocker)'
constellation: hardware-endpoints
tags: [encryption, filevault, bitlocker, recovery-key, security]
summary:
  What full-disk encryption protects against, why the recovery key matters, and the "locked out
  asking for a recovery key" scenario.
stub: false
related: [handling-sensitive-data, slow-computer-triage]
---

## Summary

Full-disk encryption (FileVault on macOS, BitLocker on Windows) protects data if the device is
lost or stolen — without the key, the drive is unreadable. The trade-off is that the **recovery
key** becomes critical: lose it and get locked out, and the data is genuinely unrecoverable.

## Diagnostic Steps

1. Confirm whether encryption is on and who holds the recovery key — the user, or (on managed
   devices) an admin/management system that escrows it.
2. For a lockout, read the exact prompt: a request for a recovery key after a firmware update,
   hardware change, or forgotten password is the common trigger.

## Resolution Steps

1. **Turning it on:** enable FileVault/BitLocker and **store the recovery key** somewhere safe —
   for managed devices this is escrowed centrally; for personal devices, save it off the device.
2. **Locked out asking for a recovery key:** retrieve the escrowed key (managed devices) or the
   user's saved copy; enter it to unlock, then resolve the underlying password/firmware cause.
3. **No key available:** be honest — without the recovery key the encrypted data cannot be
   recovered; the path is to erase and reinstall.

## Notes / Edge Cases

- A BitLocker recovery prompt after a BIOS/firmware update or hardware change is expected — the
  key proves it's still an authorized device; it's not a compromise.
- Encryption has negligible performance cost on modern hardware — don't disable it to "speed
  things up"; look at the real bottleneck (see slow computer triage).
