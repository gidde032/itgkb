# IT Knowledge Galaxy — Operating Rules (compressed)

Read SPEC.md for scope. Read internal/handoff.md for current state. Solo
maintainer, public GitHub repo with a live GitHub Pages demo. Sharing = clone +
npm install + npm run dev. Planning truth lives in GitHub Issues/PRs/milestones.

## Non-negotiables

- No AI/semantic features in near-term versions. Text search only.
- Content = markdown files in content/articles/ with YAML frontmatter (schema in
  SPEC §5). NEVER hardcode article content in components.
- Extensibility seams are contracts: LayoutProvider, SearchProvider, renderer
  consumes positions + match state only (never inspects article bodies).
- Hard gates: format:check, typecheck (0 errors), lint (0 errors), tests green,
  build passes, npm run validate:content passes. `npm run gates` runs all of
  these; `npm run gates:quality` is the chain without the build (used by the
  Pages deploy). Perf budgets are sanity checks, not gates.
- Weakening a gate requires maintainer sign-off. Never an agent decision.
- Every accepted review finding gets a regression test.
- Public content is vendor-generic (M4 line): no organization-specific data
  (employer/team names, internal hostnames, intranet URLs), no PII/emails, and
  no unresolved `(verify)` / `[NEEDS VERIFICATION]` markers in shipped articles.
  `npm run check:sensitivity` reports violations; it is advisory now and becomes
  a hard gate once the seed articles are generalized (M4 #24). Do not invent
  organization-specific facts (hostnames, exact policy text) — mark uncertain
  details with "(verify)" until verified.

## Workflow

- Per-phase loop: implement → review → triage → fix+regression-test → summary
  (agentic-phase-workflow). Phase summaries in internal/phase-summaries/, each
  with a Deviations subsection filled at decision time.
- ADAPTATION: no subagent tool in this environment → reviews are same-session
  persona passes done AFTER implementation, against files only (open question
  OQ-W1 in internal/open-questions.md).
- Checkpoints: phase boundaries only. Batch questions; don't micro-ask.
- Session continuity: filesystem resets between sessions. At every phase
  boundary: update internal/handoff.md, zip the repo to /mnt/user-data/outputs.
  Internal docs (internal/) are gitignored — the repo is public, so continuity
  material stays local and travels via the zip+handoff mechanism, not the public
  history. Losing internal docs would break continuity, so keep the local copies.
- Cost: don't re-read large files; batch doc updates to phase boundaries.
