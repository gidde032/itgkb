---
id: firefox-email-session-expired
title: 'Firefox: email login session repeatedly expires'
constellation: accounts-identity
tags: [firefox, browser, cookies, sessions, authentication]
summary: An email user can sign in but is immediately returned to a session-expired message or an account-selection page in Firefox. The same account often works in another browser when Firefox site data, privacy protections, extensions, or profile state are interfering with authentication.
stub: false
related: [workspace-session-auth, account-access]
---

## Summary

An email user may successfully enter their credentials but then be sent back to a
"user login or session expired" message, or to a page listing accounts to sign
into. If the same account opens normally in another browser, the account and
email service are probably available; the failure is more likely caused by
Firefox site data, privacy settings, an extension, or a damaged browser profile
that prevents the session from being retained.

## Diagnostic Steps

1. Test the same email account in another browser. If it works there, focus on
   the Firefox profile rather than resetting the account or password.
2. Try the email site in a Firefox private window. A successful private-window
   test points to stored site data, an extension, or a saved browser setting.
3. Confirm that the user is selecting the intended account when an account list
   appears. Multiple signed-in accounts can make an authentication loop look
   like a failed password or an expired account.
4. Open Firefox Troubleshoot Mode and try the sign-in again. If the problem
   stops in Troubleshoot Mode, an extension or theme is the most likely cause.
5. If the issue occurs in every browser or private window, check the service
   status and route the problem as an account or service issue instead of a
   Firefox-only problem.

## Resolution Steps

1. Open the email site in Firefox and use the site-information panel at the
   left side of the address bar to choose **Clear cookies and site data**. Clear
   the data for the email site and, if shown separately, its sign-in provider.
2. Quit Firefox completely, reopen it, and sign in again. Clearing site data
   signs the user out of that site but does not delete messages stored by the
   email service.
3. If the sign-in works in Troubleshoot Mode, disable or remove the suspected
   extension, then re-enable extensions one at a time to identify the one
   interfering with authentication. Privacy, ad-blocking, and security
   extensions deserve early attention.
4. Temporarily turn off Enhanced Tracking Protection for the email site and
   test again. If this resolves the problem, keep the exception only when it is
   acceptable under local security policy, and prefer adjusting the responsible
   privacy extension or setting instead of weakening protection broadly.
5. Update Firefox and retry. If the problem continues only in the normal
   profile, test with a new Firefox profile; a clean profile can confirm that
   the original profile is damaged or contains a conflicting setting.
6. Use another browser or a private window as a temporary workaround while the
   Firefox profile or extension issue is being repaired.
7. Escalate if the user still cannot sign in after clearing site data and
   testing Troubleshoot Mode or a clean profile. Include the exact error,
   Firefox version, operating system, whether another browser works, and the
   results of each test.

## Notes / Edge Cases

- A browser cookie-clearing utility may not remove every cookie or storage
  entry used by the email site and its sign-in provider. Clearing site data
  from Firefox's own site-information panel is a more targeted test.
- Private browsing and another browser are diagnostic comparisons as well as
  temporary workarounds; they do not repair the normal Firefox profile.
- Clearing all browser cookies is broader than necessary and signs the user out
  of many unrelated sites. Prefer clearing only the affected site and its
  authentication provider.
- Managed devices may enforce Firefox privacy settings, extensions, or profile
  policies. Do not bypass those controls; route persistent policy-related
  failures to the device or account administrator.
- Closure language: "The email session loop was isolated to Firefox. Site data
  was cleared and the browser was restarted; Troubleshoot Mode was used to
  identify and remove the extension or privacy setting interfering with sign-in."
