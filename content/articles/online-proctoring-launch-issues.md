---
id: online-proctoring-launch-issues
title: 'Online proctoring: Respondus or Honorlock will not launch'
constellation: hardware-endpoints
tags: [online-exams, respondus, honorlock, canvas, chrome]
summary: An online exam in Canvas will not start through Respondus LockDown Browser or Honorlock. Respondus uses a course-specific desktop application and Canvas/SSO launch path, while Honorlock uses Google Chrome and a required Chrome extension.
stub: false
related: [software-install-self-service, account-access, mfa-new-device]
---

## Summary

A student opens an online exam in Canvas but the required proctoring tool does
not start, the login screen fails, or the exam link is missing. Respondus
LockDown Browser and Honorlock do not use the same launch mechanism: Respondus
uses an institution-specific desktop application, while the standard Honorlock
flow uses Google Chrome and a required Chrome extension. Identify the product
first and follow only that product's path.

## Diagnostic Steps

1. Confirm which proctoring product the exam requires and whether the exam is
   currently available. If an Honorlock link is missing because the instructor
   has not enabled or released the assessment, there is no local installation
   problem to fix.
2. For Respondus, confirm that the installation link came from the instructor
   or the Canvas course. Do not install LockDown Browser from a generic internet
   search result; the institution-specific link provides the correct build.
3. Confirm that the actual Respondus LockDown Browser desktop application is
   being launched after installation. A normal browser window or an installer
   screen is not the exam application.
4. If Respondus opens but Canvas login fails, make sure the Duo device is ready,
   then restart the application and look for the institution's SSO and Duo
   prompt.
5. For Honorlock, use Google Chrome and open the Honorlock link from Canvas.
   The standard flow does not require a separate desktop application, but it
   does require adding the Honorlock Chrome extension when prompted.
6. Check that other applications, browser windows, and unrelated tabs are
   closed. If Honorlock still does not start, restart Chrome and close the
   other applications again before retrying.

## Resolution Steps

1. Identify the required product and use the matching section below.

### Respondus LockDown Browser

2. In the Canvas course, open the download link provided by the instructor and
   install LockDown Browser from that link. Do not use an installer found by
   searching the internet.
3. After installation, launch the actual LockDown Browser desktop application.
   For the direct-login Canvas flow, sign in to Canvas from inside the
   application and navigate to the exam.
4. If the Canvas login fails, confirm that Duo is ready to approve a sign-in.
   Fully quit and restart LockDown Browser, then watch for the SSO page and Duo
   prompt instead of repeatedly retrying the same failed screen.
5. Some Canvas quiz configurations begin in a regular browser and then hand
   off to LockDown Browser through a **Launch LockDown Browser** button. If
   Canvas displays that launch path, use it and allow the browser to open the
   installed application.

### Honorlock

6. Open the current version of Google Chrome and navigate to the Honorlock link
   in the Canvas course. There is no separate Honorlock desktop application to
   download for the standard flow.
7. When prompted, add the Honorlock Chrome extension and allow the required
   browser permissions. The exam cannot start if the extension is missing or
   blocked.
8. Close all other applications, browser windows, and unrelated tabs. If the
   launch still fails, quit and restart Chrome, close the other applications,
   and open the Canvas Honorlock link again.
9. If the Honorlock link does not appear or the assessment is not usable, ask
   the instructor to confirm that Honorlock has been enabled and that the exam
   is within its available window. The student cannot correct an assessment
   that has not been configured or released.

## Notes / Edge Cases

- Respondus LockDown Browser download links and application builds are
  institution-specific. A generic internet download may be the wrong build
  even if it installs successfully.
- Canvas can use more than one LockDown Browser launch pattern. A direct login
  from the desktop application and a standard-browser handoff are both valid;
  follow the launch instructions shown for the specific exam.
- Honorlock's standard Canvas flow uses Chrome plus the Honorlock extension,
  not a standalone desktop installer. The extension is still a required setup
  step.
- If the instructor has not enabled Honorlock or has not released the exam,
  the missing or unusable link is expected. Escalate that condition to the
  instructor rather than repeatedly reinstalling Chrome.
- Closure language for a Respondus authentication repair: "The student
  launched the institution-provided LockDown Browser application, completed
  the Canvas SSO/Duo prompt, and reached the exam."
- Closure language for an Honorlock setup repair: "The student opened the
  Canvas Honorlock link in Chrome, added the required extension, closed other
  applications and tabs, and relaunched the assessment."
