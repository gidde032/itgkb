---
id: vpn-service-unavailable-shared-drive
title: 'VPN: service unavailable when connecting to a shared drive'
constellation: networking
tags: [vpn, shared-drive, vpn-service, windows, network-access]
summary: A user cannot reach a shared drive because the VPN client reports that its service is unavailable. The problem is often a stopped or malfunctioning VPN background service rather than a shared-drive permissions or mapping issue.
stub: false
related: [vpn-when-and-failures]
---

## Summary

A shared drive may be unreachable when the VPN client displays an error such as
"Connect capability is unavailable because the VPN service is unavailable."
Although the user experiences the failure when opening the drive, the immediate
problem is usually that the VPN client’s background service is stopped or not
responding. Without an active VPN connection, resources restricted to the
organization’s network cannot be reached.

## Diagnostic Steps

1. Capture the exact VPN error and confirm that the user is trying to access a
   shared drive or another resource that requires the organization’s network.
2. Confirm that the issue occurs away from the organization’s network or when
   the VPN is disconnected. A shared drive may be unavailable for an unrelated
   reason if it also fails on the internal network.
3. Check whether the VPN client opens but reports that its service is
   unavailable. This points to a client-service problem rather than a drive
   mapping or permissions problem.
4. On Windows, open **Services** by pressing **Windows Key + R**, entering
   `services.msc`, and pressing **Enter**. Find the VPN client service and
   check whether it is running.
5. If the service is missing, immediately stops, or cannot be started, record
   that result. The client installation may be damaged and may require repair
   or reinstallation.

## Resolution Steps

1. In the Windows Services window, right-click the VPN client service and
   select **Restart**. If it is stopped, select **Start** instead. Common VPN
   clients identify this as a VPN service or secure mobility agent.
2. Reopen the VPN client, connect to the organization’s VPN, and retry the
   shared drive. A successful service restart often restores the connection
   without changing the drive mapping.
3. If the service restart does not help, restart the computer and test the VPN
   connection again. This can clear a service that is stuck after an update,
   sleep cycle, or failed client session.
4. If the service is missing or still will not start, perform a complete
   uninstall and reinstall of the approved VPN client. Use the organization’s
   supported download and installation instructions rather than an unofficial
   installer.
5. Reconnect to the VPN after reinstalling and retry the shared drive. If the
   drive was manually mapped, remap it only after confirming that the VPN
   connection is active.
6. Escalate if the VPN service cannot be repaired or the shared drive remains
   unavailable after a successful VPN connection. Include the exact error,
   client version, operating system, service status, and whether other VPN-only
   resources are also affected.

## Notes / Edge Cases

- Restarting the VPN service is a lower-impact first step than uninstalling and
  reinstalling the entire client. Reinstallation is appropriate when the
  service is missing, repeatedly stops, or appears damaged.
- Starting or restarting a Windows service may require administrator access.
  Do not change service permissions or startup settings without approved
  support instructions.
- A drive mapping can remain disconnected after the VPN is repaired. Confirm
  the VPN connection first, then reconnect or remap the drive if necessary.
- If the VPN connects successfully but only one shared drive fails, investigate
  the drive path, permissions, and name-resolution requirements separately.
- Closure language: "The VPN client service was restarted successfully. The
  user reconnected to the VPN and confirmed access to the shared drive."
