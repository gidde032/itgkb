---
id: connecting-shared-network-printer
title: 'Printers: Connect to a shared or network printer'
constellation: hardware-endpoints
tags: [printers, network-printing, print-server, windows, macos]
summary: How to add a shared or network printer on Windows or macOS when the printer has not yet been installed or mapped.
stub: false
related: [printer-troubleshooting]
---

## Summary

A shared printer is usually connected through a print server or an organizational printer directory rather than added as a directly attached device. Before adding it, confirm the printer name or queue path, verify that the computer is on the required network or VPN, and use the organization account format expected by the print service. This article covers first-time printer setup; see the related printer troubleshooting article for printers that are already installed but fail to print.

## Diagnostic Steps

1. Confirm whether the printer is shared through a print server, published in a printer directory, or available by a direct network address.
2. Obtain the exact printer name, queue name, or server path. Do not guess similar printer names.
3. Verify that the computer is connected to the organization’s network or VPN if remote access is required.
4. Confirm that the account has permission to use the printer. An access-denied prompt usually indicates a permissions or account-format problem rather than a printer hardware problem.
5. Identify the operating system and whether it requests a printer driver during setup.

## Resolution Steps

### Windows: Connect through a print server

1. Open the Run dialog or File Explorer.
2. Enter the shared printer server path, such as:

   ```text
   \\print-server\
   ```

   If the queue name is known, use the complete path:

   ```text
   \\print-server\printer-queue
   ```

3. Locate the printer, right-click it, and select **Connect**.
4. If prompted to sign in, use the organization account format required by the print service. This may require the full organizational identity, rather than the local computer username.
5. Allow the printer driver to install if the prompt comes from a trusted organizational or manufacturer source.
6. Print a test page or a small document.

### Windows: Find the printer in a directory

1. Search Windows for **Printers** and open **Printers & scanners**.
2. Select **Add device** or **Add a printer or scanner**.
3. If the printer does not appear, choose **The printer that I want isn’t listed**.
4. Select **Find a printer in the directory** and continue.
5. Search by printer name, department, building, or location.
6. Select the correct printer and choose **Connect**.
7. Install the driver if Windows requests it.
8. If access is denied, confirm the required account format and request access to that specific printer from the organization’s support team or printer owner.
9. Print a test page.

### macOS: Add a shared printer manually

1. Open **System Settings** or, on older macOS versions, **System Preferences**.
2. Open **Printers & Scanners** and choose **Add Printer**.
3. If the **Advanced** option is not visible in an older macOS interface, customize the toolbar and add the **Advanced** control.
4. Choose the Windows or SMB shared-printer option. The label may appear as **Windows printer via spools** or **Windows printer via spoolss**, depending on the macOS version.
5. Enter the shared printer address using this format:

   ```text
   smb://print-server/printer-queue
   ```

6. Select the appropriate driver or printer software and add the printer.
7. When prompted for credentials, use the organization account—not the local Mac username or password.
8. Print a test page or a small document.

## Notes / Edge Cases

- Windows shared-printer paths use backslashes, such as `\\server\queue`; macOS SMB paths use `smb://server/queue`.
- Printer names, menu labels, and authentication prompts vary by operating-system version.
- A printer appearing in a directory does not necessarily mean the user has permission to connect to it.
- If setup succeeds but print jobs fail, the problem has moved from connection setup to printer troubleshooting, driver, queue, or hardware diagnosis.
- Do not place passwords in printer addresses or save them in unsecured notes.
