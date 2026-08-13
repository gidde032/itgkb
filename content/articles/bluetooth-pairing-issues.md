---
id: bluetooth-pairing-issues
title: 'Bluetooth pairing failures and dropped connections'
constellation: hardware-endpoints
tags: [bluetooth, pairing, peripherals, wireless, hardware]
summary:
  A Bluetooth device refuses to pair, repeatedly disconnects, or pairs but does not function
  correctly — common with headsets, keyboards, and mice on managed laptops.
stub: false
related: [display-docking-issues, video-call-no-audio]
---

## Summary

Bluetooth pairing issues fall into three buckets: the device will not appear in the scan list, it
pairs but immediately drops, or it pairs and connects but audio or input does not work. Most are
caused by stale pairing records, interference from USB 3 hubs, or power-management settings that
suspend the radio.

## Diagnostic Steps

1. Confirm Bluetooth is enabled and the adapter is recognized by the OS (device manager on Windows,
   system report on macOS).
2. Check whether the target device is in pairing/discovery mode — many peripherals time out of
   discovery after 30-60 seconds.
3. Look for a stale entry: if the device was previously paired (or paired to a different profile on
   the same machine), the old record can block re-pairing.
4. Rule out interference: USB 3.0 ports and hubs are known to emit 2.4 GHz noise that degrades
   Bluetooth. Move the hub or use a short extension cable to separate it from the Bluetooth radio.

## Resolution Steps

1. Remove ("forget") the device from the OS Bluetooth settings and from the peripheral itself
   (usually a factory-reset or a long press on the pairing button) so both sides start clean.
2. Re-pair with the device in discovery mode and the laptop within one meter, away from USB 3 hubs.
3. If the device pairs but drops under load (audio stutter, keyboard lag), check power-management
   settings — disable "allow the computer to turn off this device to save power" for the Bluetooth
   adapter on Windows, or reset the Bluetooth module on macOS (Shift-Option-click the Bluetooth
   menu icon, then choose the debug reset option).
4. For managed devices where driver updates are restricted, confirm the Bluetooth driver version
   with the endpoint-management team and request an update if it is more than two major versions
   behind.

## Notes / Edge Cases

- Multipoint peripherals (devices that connect to two hosts simultaneously) are a frequent source
  of confusion — the device may be connected to a phone and refusing a second connection because
  its multipoint slot is full.
- Some docking stations have their own Bluetooth radio; if the laptop also has one, the OS may
  switch between them unpredictably. Disable the dock's radio if it is not needed.
