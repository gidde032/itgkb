# Phase 6 — First Independent (Contextless) Review Cycle

Session: 2026-07-19 (Claude Fable 5 in Claude Code with subagent tool)
Reviewer model: Sonnet-class (3 parallel subagents, no context leakage)

## Lenses

1. **Spec-drift** — SPEC/README/CLAUDE.md claims vs code reality
2. **User-friction / adversarial user** — cold-start student mid-ticket
3. **Skeptical senior engineer** — posture: defects hidden by passing tests

## Findings (13 real, 0 false alarms)

| ID | Severity | Lens | Issue | Fix commit |
|---|---|---|---|---|
| A1 | CRITICAL | spec-drift | `npm run gates` never ran coverage (used `test` not `test:coverage`) | dc83018 |
| A2 | CRITICAL | skeptic | Collection-invalid articles (unknown constellation, dup id) rendered instead of being excluded per FR-1 | 9a591d0 |
| A3 | HIGH | friction | TEMPLATE.md placeholder `related: [other-article-id]` failed validate:content; README step 2 didn't list `related` | 4a93ae5 |
| B1 | HIGH | skeptic | Parallax offset fed absolute transform (including centering), producing window-width-scaled star/halo drift at rest | 2b16dc0 |
| B2 | MEDIUM | friction | README never mentioned search bar, Enter/Escape, list toggle, or Reset view button | 052f640 |
| C1 | MED-LOW | spec-drift | SPEC FR-12 said 6 stubs; 3 were promoted in red-pen pass 1 | 7151a02 |
| C2 | MED-LOW | spec-drift | CLAUDE.md renderer contract "{id,x,y,z} only" contradicted SPEC's correct fuller version | 7151a02 |
| C3 | LOW | spec-drift | FR-8 "no separate list view" vs NF-7 list fallback — spec self-contradiction | 7151a02 |
| C4 | LOW | spec-drift | Desktop list toggle (A4 feature) undocumented in SPEC/README | 7151a02 |
| C5 | LOW | skeptic | `tags` coded as if optional (dead `?? []` fallback) but validator rejects omission | 7151a02 |
| D2a | LOW | skeptic | `devicePixelRatio` captured once at mount; stale on monitor-switch | 21a5418 |
| D2b | LOW | skeptic | en/em dashes not normalized in search | 21a5418 |
| D2c | LOW | skeptic | Duplicate query terms inflated score | 21a5418 |

### Declined

| ID | Issue | Reason |
|---|---|---|
| D1 | `npm install` reports 6 vulnerabilities | Dependency bumps are churn-risky; maintainer deferred |

### False alarms

None — all 13 findings verified against code before triage.

## OQ-W1 verdict

**Yes — contextless review found real issues every same-session persona pass missed.** The gate-integrity hole (A1) survived since Phase 1 while four phase summaries asserted "coverage above floor." The two code-level defects (A2 collection exclusion, B1 parallax drift) were in heavily-reviewed files (load.ts reviewed P1+P3; display.ts/GalaxyCanvas.tsx reviewed P2+P3). Self-agreement bias is the likely mechanism: a reviewer who just wrote the centering transform won't question its use as a parallax input.

Evidence is directional (one cycle, small codebase). The OQ-W1 status moves from OPEN to CANDIDATE with the promotion bar: needs ≥1 more cycle before adopting as a standing practice.

## Deviations

- D1 (npm audit churn) declined by maintainer — deferred, not fixed.
- Reviewer 2 created a test article file during its run; cleaned up (tree clean at commit time).
- No convergent findings (expected given orthogonal surfaces); thematic cluster across all three reviewers on contributor-facing content contract roughness (A3/C1/C5).

## Gate state at cycle end

89 tests green | coverage 94.1/91.2/87.5/94.1 (floor 85/85/75/70) | 20 articles, 6 constellations | bundle 136.9 KB gzip | all gates pass
