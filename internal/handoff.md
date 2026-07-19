# Handoff — current state

Updated: 2026-07-19 (session 3, Claude Fable 5 in Claude Code)
State: Phases 1–6 COMPLETE. First independent contextless review cycle done
(13 findings, all fixed with regression tests). 89 tests green, coverage
94%/91%/88% (floor 85/85/75/70). Gates now actually enforce coverage (P6-A1).

v0.1.0 tag still HELD: maintainer to answer [NEEDS VERIFICATION] markers in
3 stub articles (account-access, printer, hardware-intake) and give go-ahead.

## What changed this session
- Gates: coverage enforcement wired in (`test` → `test:coverage` in gates script)
- Content loader: collection-invalid articles (unknown constellation, dup id)
  now excluded per FR-1, not just logged
- TEMPLATE.md: placeholder related id removed; validates out of the box
- Parallax: driven by pan delta from rest, not absolute transform
- README: documents search, Enter/Escape, list toggle, Reset view
- SPEC/CLAUDE.md: stub count corrected (3 not 6), renderer contract aligned,
  FR-8/NF-7 clarified, desktop list toggle documented
- Search: en/em dashes normalized, duplicate query terms deduplicated
- Canvas: devicePixelRatio re-read on resize
- Test file renamed: drawLabels.test.ts → drawGalaxy.test.ts

## Known issues
- 3 stub articles carry [NEEDS VERIFICATION] markers — maintainer answers needed
- D1 declined: `npm install` shows 6 vulnerabilities; dependency bumps deferred
- OQ-W1 at CANDIDATE: contextless review proved valuable (one cycle); needs ≥1
  more before adopting as standing practice

## Sanity check
```bash
git log --oneline | head -7   # expect P6 commits at HEAD
npm run gates                  # 0 errors, 89 tests, coverage above floor, build ✓
```

## Concrete next step
Maintainer answers [NEEDS VERIFICATION] in stub articles → red-pen pass 2
(fill stubs or mark as intentionally thin) → maintainer cuts v0.1.0 tag.
