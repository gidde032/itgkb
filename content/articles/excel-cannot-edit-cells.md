---
id: excel-cannot-edit-cells
title: 'Excel: cannot type or edit cells'
constellation: hardware-endpoints
tags: [excel, office-365, editing, protected-view, licensing]
summary: Excel opens a workbook but the user cannot type into cells or change their contents. Common causes include a restricted license or network state, a read-only or protected workbook, disabled direct-cell editing, and Windows Protected View.
stub: false
related: [office-365-install-activation-issues, software-install-self-service]
---

## Summary

A user can open Excel and see the workbook contents, but typing does nothing,
the workbook stays read-only, or editing fails only for one particular file.
The cause may be the Office account or network state, the file's access mode,
an Excel editing option, worksheet protection, or Windows Protected View. Test
the scope of the problem first, then work through the fixes from least
disruptive to most disruptive.

## Diagnostic Steps

1. Create a new blank workbook and type a test value. If the blank workbook is
   editable, the original file is the likely source of the problem. If the
   blank workbook is also read-only, continue with application, account, and
   device checks.
2. Confirm that the device is connected to the organization-managed network
   required by its Office subscription or licensing service. Then close all
   Excel windows and restart Excel. If Excel shows an "Unlicensed Product" or
   similar message, note that the account or subscription may be the cause.
3. If the file came from the internet or an email attachment, look for the
   yellow untrusted-source or Protected View banner. This indicates that Excel
   opened the file in a restricted editing mode.
4. Check whether the workbook is read-only or locked for collaboration. Look
   for a read-only indicator in the title bar or File information, and check
   whether another person has the shared file open. A stale lock after a crash
   can also leave a file temporarily unavailable for editing.
5. If the problem occurs when double-clicking a cell, check whether direct
   cell editing is enabled: open File → Options → Advanced and, under Editing
   options, find **Allow editing directly in cells**. The exact path can vary
   slightly between Excel versions and devices.
6. Select the affected worksheet and open the Review tab. If the command says
   **Unprotect Sheet**, the sheet is protected. Editing may be limited to
   specific unlocked cells, or unprotecting it may require a password.
7. On Windows, if the problem continues, check the Protected View settings in
   Excel's Trust Center before repairing or reinstalling the application.

## Resolution Steps

1. Connect the device to the required organization-managed network, close
   Excel completely, and reopen it. If prompted, sign in with the account that
   owns the Office subscription.
2. For a file from a trusted and expected source, select **Enable Editing** on
   the yellow banner. If the source or file is not trusted, do not enable
   editing; obtain a known-good copy or ask the sender or support team to
   verify it.
3. If the workbook is read-only or locked, close any other Excel session using
   it, ask the current editor to close it, or save an authorized copy locally
   and test that copy. Do not overwrite a shared file just to remove a lock.
4. If double-clicking cells does not enter edit mode, go to File → Options →
   Advanced → Editing options and check **Allow editing directly in cells**.
   Close and reopen the workbook, then test again.
5. If the worksheet is protected, select Review → **Unprotect Sheet** and enter
   the password if one is required. If the user is not the owner, ask the file
   owner or support team to unlock the sheet or provide an editable copy.
6. On Windows only, go to File → More → Options → Trust Center → Trust Center
   Settings → Protected View and uncheck all Protected View boxes. Close Excel
   completely, reopen it, and test the workbook again.
7. If the issue affects blank workbooks as well, run Office repair before
   uninstalling anything. In Windows, open the installed Microsoft 365 or
   Office product's Modify options and try **Quick Repair**, followed by
   **Online Repair** if necessary. Restart the computer if prompted.
8. If none of these steps works, uninstall Excel or the Office suite, restart
   the computer, and reinstall the correct software from the organization's
   official portal. Confirm with an IT support worker that the installed
   edition is the correct one and that the user's subscription or plan is
   active.

## Notes / Edge Cases

- **Allow editing directly in cells** controls editing by double-clicking
  inside a cell. It does not necessarily prevent all keyboard entry into a
  selected cell; if single-clicking a cell and typing also fails, continue
  with the other checks.
- Enabling editing for one trusted file does not grant permission to edit every
  workbook. File permissions, shared-file locks, and worksheet passwords are
  separate controls.
- A Protected View setting may be controlled by device policy. If the setting
  is unavailable or immediately resets, the support team may need to change the
  policy or provide a safe copy of the workbook.
- If editing works in a blank workbook but not the original, reinstalling Excel
  is unlikely to fix the file. Escalate the file's permissions, protection,
  or corruption instead.
- Closure language when the network refresh fixes the issue: "Excel editing
  returned after the device reconnected to the required organization network
  and Excel was restarted."
