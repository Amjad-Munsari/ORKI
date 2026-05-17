---
phase: 11-storefront-ui-ux-polish-en
plan: 13
subsystem: ui
tags: [copy, i18n, 404, brand-voice, uat-candidates]

# Dependency graph
requires:
  - phase: 11-storefront-ui-ux-polish-en
    provides: phase context + audit findings (F-Exp-8 EN 404 voice)
provides:
  - EN 404 page editorial-confident copy (Candidate A live)
  - Three 404 copy candidates preserved in messages/en.json for UAT swap in Plan 11-16
affects: [11-16-plan (UAT candidate swap)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "_candidates sibling object in messages/en.json for storing UAT-pending copy alternatives without breaking JSON parsing"

key-files:
  created: []
  modified:
    - messages/en.json

key-decisions:
  - "D-08: EN 404 copy deferred to UAT — 3 candidates drafted, Candidate A selected as default live value per plan spec"
  - "Candidate A (404 / NO DROP HERE) matches voice register of locked hero copy (Made in the noise of Riyadh)"
  - "_candidates sub-object used instead of JSON comments to preserve UAT alternatives in a parseable form"

patterns-established:
  - "_candidates pattern: store UAT-pending copy alternatives as a sibling object under the live key; Plan 11-16 executor renames chosen candidate to top-level and deletes _candidates"

requirements-completed: [SC-1, SC-6]

# Metrics
duration: 5min
completed: 2026-05-17
---

# Phase 11 Plan 13: EN 404 Voice Copy — Candidate A Live + 3 UAT Candidates Summary

**EN 404 page rewritten in editorial-confident brand voice ("404 / NO DROP HERE") with three candidates embedded in messages/en.json for live UAT selection in Plan 11-16**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-05-17T13:47:37Z
- **Completed:** 2026-05-17T13:52:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Replaced generic unaudited 404 copy ("404 — Lost in the noise.") with editorial-confident Candidate A matching the project's locked hero voice register
- Embedded all three UAT candidates under `Errors.notFound._candidates` in a parseable JSON structure (A_voice, B_locative, C_minimal) so Plan 11-16 can swap without code archaeology
- AR `Errors.notFound` untouched — Phase 999.11 owns AR voice review
- TypeScript check passes cleanly (no new errors)

## 404 Copy Candidates

### Candidate A (LIVE — default)
- **heading:** `404 / NO DROP HERE`
- **body:** `That page isn't on the rack. The shop is.`
- **Voice register:** Drop-cycle-coded, declarative, on-brand with hero copy

### Candidate B (UAT alternate — B_locative)
- **heading:** `404 / OFF THE MAP`
- **body:** `This street doesn't run through ORKI. Take the shop instead.`
- **Voice register:** Riyadh streetwear noir, locale-coded

### Candidate C (UAT alternate — C_minimal)
- **heading:** `404`
- **body:** `Page not here. Shop is.`
- **Voice register:** Stripped minimal, maximum brevity

### CTA labels (constant across all candidates)
- `browseShop`: `Browse shop`
- `returnHome`: `Return home`

## UAT Instructions for Plan 11-16

1. Visit `/en/non-existent-path` in `npm run dev`
2. Observe live Candidate A copy
3. User selects preferred candidate (A, B, or C)
4. Executor opens `messages/en.json` → `Errors.notFound`
5. Replace `heading` and `body` values with the chosen candidate's values from `_candidates`
6. Delete the entire `_candidates` key
7. Verify JSON valid, commit

## Task Commits

1. **Task 1: Update messages/en.json Errors.notFound with Candidate A + candidates** - `4354bdb` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified
- `messages/en.json` - Errors.notFound: Candidate A live (heading/body), _candidates block with A/B/C for UAT

## Decisions Made
- Candidate A selected as live default per plan specification (D-08, plan context)
- `_candidates` sub-object pattern chosen over top-level siblings to keep candidates scoped under `notFound` namespace
- `_comment` key inside `_candidates` explains UAT protocol inline for future executor

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- F-Exp-8 provisionally closed: EN 404 reads in brand voice
- Plan 11-16 (UAT) finalises candidate selection — executor will swap `_candidates` chosen values to top-level and delete `_candidates`
- AR 404 voice remains at Phase 999.11

## Self-Check

### Files exist:
- messages/en.json — modified (not a new file)
- .planning/phases/11-storefront-ui-ux-polish-en/11-13-SUMMARY.md — this file

### Commits exist:
- 4354bdb — feat(11-13): 404 EN voice — Candidate A live + 3 candidates for UAT

## Self-Check: PASSED

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
