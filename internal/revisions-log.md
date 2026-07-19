# Workflow revisions log (append-only)

## Revision 1: First contextless review cycle (2026-07-19)

**What changed:** Three Sonnet-class subagents ran independent parallel reviews
of the full codebase (spec-drift lens, user-friction/adversarial-user lens,
skeptical-senior-engineer lens) — the first time any reviewer started cold
without implementation context.

**Evidence:** Found 2 CRITICAL + 2 HIGH issues in code/config that had been
reviewed in 4+ same-session persona passes across P1–P5 without detection.
The gate-integrity hole (A1) is the strongest signal: it proved the gate was
decorative, and four phase summaries unknowingly asserted a claim the gate
command couldn't have checked.

**Status:** OQ-W1 promoted from OPEN to CANDIDATE. One more cycle needed
before adopting as a standing practice (per the "baseline → candidate →
compare → sign-off" promotion bar).
