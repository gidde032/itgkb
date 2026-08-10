# IT Knowledge Galaxy — Operating Rules (compressed)

Read SPEC.md for scope. Read internal/handoff.md for current state. Solo
maintainer, public GitHub repo, no hosting: sharing = clone + npm install +
npm run dev. Planning truth lives in GitHub Issues/PRs/milestones.

## Non-negotiables
- No AI/semantic features in near-term versions. Text search only.
- Content = markdown files in content/articles/ with YAML frontmatter (schema in
  SPEC §5). NEVER hardcode article content in components.
- Extensibility seams are contracts: LayoutProvider, SearchProvider, renderer
  consumes positions + match state only (never inspects article bodies).
- Hard gates: typecheck (0 errors), lint (0 errors), tests green, build passes,
  npm run validate:content passes. Perf budgets are sanity checks, not gates.
- Weakening a gate requires maintainer sign-off. Never an agent decision.
- Every accepted review finding gets a regression test.
- Article drafts come from SPEC seed summaries (kickoff 0b); maintainer red-pens
  post-MVP. Do not invent specific UMN facts (hostnames, exact policy text)
  beyond the seed summaries — mark uncertain details with "(verify)".

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
