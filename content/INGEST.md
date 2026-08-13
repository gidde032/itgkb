# Content Ingestion Playbook

How to turn source material into a gate-passing IT Knowledge Galaxy article.

## Inputs

You need:

1. **Source material** — pasted text, notes, documentation, or summarized link
   content describing an IT support topic.
2. **Optional overrides** — a preferred title, target constellation, or specific
   tags. These override the heuristics below.

## Constellation routing

Use the table below to route the article to the correct constellation. Match the
topic's primary theme against the keywords column. If multiple constellations
seem plausible, pick the one that matches the _root cause_ of the issue rather
than the symptom surface.

| Constellation ID         | Name                     | Prefix | Representative keywords / topics                                                        |
| ------------------------ | ------------------------ | ------ | --------------------------------------------------------------------------------------- |
| `workspace-email`        | Workspace & Email        | GW     | email, mailbox, delegation, send-as, filters, spam, inbox, calendar invites via email   |
| `collaboration-meetings` | Collaboration & Meetings | MTG    | video calls, meetings, screen sharing, chat, notifications, conferencing, lobby, audio  |
| `files-storage`          | Files & Storage          | FLS    | cloud storage, file sharing, sync clients, quotas, version history, shared drives       |
| `networking`             | Networking               | NET    | DNS, VPN, wifi, ethernet, traceroute, latency, connectivity, network architecture       |
| `accounts-identity`      | Accounts & Identity      | IAM    | passwords, MFA, SSO, account lockout, sessions, authentication, identity providers      |
| `hardware-endpoints`     | Hardware & Endpoints     | HW     | laptops, printers, displays, docking, bluetooth, drivers, performance, software install |
| `security`               | Security                 | SEC    | phishing, incident response, encryption, data handling, account compromise, awareness   |

**This suggestion should be confirmed or overridden.** Edge cases exist — an
article about calendar sharing lives in `workspace-email` (not
`collaboration-meetings`) because the root object is a calendar/email feature.

## Drafting steps

### 1. Copy the template

Start from `content/TEMPLATE.md`. The file structure is:

```
---
id: kebab-case-unique-id
title: 'Area: Short problem statement'
constellation: <one of the 7 IDs above>
tags: [tag-one, tag-two]
summary: One to two sentences shown on hover.
stub: false
related: []
---

## Summary
## Diagnostic Steps
## Resolution Steps
## Notes / Edge Cases
```

### 2. Fill in frontmatter

- **`id`** — kebab-case, must match the filename (without `.md`). Use
  lowercase letters, digits, and hyphens only.
- **`title`** — format: `'Area: Short problem statement'`. Keep it concise.
- **`constellation`** — one of the 7 IDs from the routing table above.
- **`tags`** — 3-5 lowercase tags. Reuse existing tags from the corpus where
  possible. Check what tags sibling articles in the same constellation use.
- **`summary`** — one to two sentences describing the issue and who hits it.
  This text appears on hover in the galaxy view.
- **`stub`** — set to `true` only for placeholder articles with minimal content;
  otherwise `false`.
- **`related`** — an array of article IDs that are topically related. **Only
  reference IDs of articles that already exist in `content/articles/`.** Check
  the directory listing before adding related links; a dead reference fails the
  content gate.

### 3. Write the body

Fill in the four sections:

- **Summary** — one short paragraph: what the user reports, what is actually
  going on.
- **Diagnostic Steps** — numbered list of checks to narrow down the cause.
- **Resolution Steps** — numbered list of actions to fix the issue.
- **Notes / Edge Cases** — bullet list of unusual situations, escalation
  boundaries, or closure-note language.

### 4. Content rules

- **Vendor-generic** — no organization names, employer names, team names,
  internal hostnames, intranet URLs, or email addresses. Write as if for any
  organization.
- **No unresolved markers** — `(verify)` and `[NEEDS VERIFICATION]` may appear
  while drafting but must be resolved before the article ships. The sensitivity
  gate rejects them.
- **Save the file** as `content/articles/<id>.md` where `<id>` exactly matches
  the frontmatter `id` field.

## Gate checklist

Run these commands and fix any failures before considering the article done:

1. **Content schema validation**

   ```
   npm run validate:content
   ```

   Checks: YAML frontmatter schema, filename matches `id`, constellation exists
   in `constellations.json`, all `related` IDs resolve to existing articles.

2. **Sensitivity check**

   ```
   npm run check:sensitivity
   ```

   Checks: no organization-specific names, no internal hostnames, no email
   addresses, no unresolved `(verify)` / `[NEEDS VERIFICATION]` markers.

3. **Full gate suite**
   ```
   npm run gates
   ```
   Runs format, typecheck, lint, tests, content validation, sensitivity check,
   and build. This is the final confirmation that nothing is broken.

Fix any failures and re-run until all gates pass.

## Example run

This end-to-end example demonstrates the full process.

### Source input

> Users report that Bluetooth peripherals (headsets, keyboards, mice) on managed
> laptops frequently refuse to pair, drop connections, or pair but do not
> function correctly. Common causes include stale pairing records, USB 3.0
> interference, and OS power-management settings suspending the radio.

### Routing decision

Primary theme: peripherals, hardware, drivers, bluetooth. Best match:
**`hardware-endpoints`** (Hardware & Endpoints).

### Drafted article

Saved as `content/articles/bluetooth-pairing-issues.md`:

```yaml
---
id: bluetooth-pairing-issues
title: 'Bluetooth pairing failures and dropped connections'
constellation: hardware-endpoints
tags: [bluetooth, pairing, peripherals, wireless, hardware]
summary: A Bluetooth device refuses to pair, repeatedly disconnects, or pairs but does not function
  correctly — common with headsets, keyboards, and mice on managed laptops.
stub: false
related: [display-docking-issues, video-call-no-audio]
---
```

Body sections cover:

- **Summary** — three failure buckets (won't scan, pairs then drops, pairs but
  no function) and common root causes.
- **Diagnostic Steps** — adapter recognition, discovery mode, stale entries,
  USB 3 interference.
- **Resolution Steps** — forget + re-pair, power management, driver updates.
- **Notes / Edge Cases** — multipoint peripherals, dock Bluetooth radios.

### Gate results

```
$ npm run validate:content
Content validation passed: 41 articles, 7 constellations.

$ npm run check:sensitivity
Content-sensitivity check passed: no organization-specific data found.

$ npm run gates
# All gates pass.
```

The article is now part of the corpus at `content/articles/bluetooth-pairing-issues.md`.
