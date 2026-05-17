---
phase: 11-storefront-ui-ux-polish-en
plan: "14"
subsystem: ui
tags: [copy, i18n, uat-candidates, empty-state, brand-ethos]

# Dependency graph
requires:
  - phase: 11-07
    provides: Home page structure (brand-ethos h3 in page.tsx)
  - phase: 11-13
    provides: _candidates pattern in messages/en.json
provides:
  - Shop.empty.{heading,body} live copy (Candidate A — drop-cycle-coded)
  - Home.ethos.{line,readStory} live copy (Candidate A — Riyadh-confident voice)
  - Three UAT candidates each preserved under _candidates for Plan 11-16 swap
  - ProductGrid reads Shop.empty via getTranslations (no inline EN/AR ternaries)
  - page.tsx brand-ethos reads Home.ethos via getTranslations (no inline EN/AR ternaries)
  - AR placeholder keys in messages/ar.json (Phase 999.11 owns AR voice review)
affects: [11-16-plan (UAT candidate swap for Shop.empty + Home.ethos)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "_candidates sibling object pattern extended to Shop.empty and Home.ethos"
    - "getTranslations('Shop.empty') in async server component ProductGrid"
    - "getTranslations('Home.ethos') in async server page.tsx for ethos + readStory"

key-files:
  created: []
  modified:
    - messages/en.json
    - messages/ar.json
    - src/components/shop/ProductGrid.tsx
    - src/app/[locale]/page.tsx

key-decisions:
  - "Shop empty-state: Candidate A (drop-cycle-coded) selected as live default per plan spec (D-06)"
  - "Home ethos: Candidate A (Riyadh-confident voice) selected as live default per plan spec (D-07)"
  - "ProductGrid converted to async server component to use getTranslations (not useTranslations)"
  - "Existing emptyHeading/emptyBody keys left in en.json — Plan 11-16 deletes them post-UAT verification"
  - "AR keys use pre-Phase-11 inline string values as placeholder; Phase 999.11 owns AR voice rewrite"
  - "readStory migrated alongside ethos.line since page.tsx was already being touched"

requirements-completed: [SC-1, SC-6]

# Metrics
duration: 6min
completed: 2026-05-17
---

# Phase 11 Plan 14: Shop Empty-State + Home Ethos Copy — UAT Candidates Wired Summary

**Shop empty-state and Home brand-ethos copy wired to next-intl keys with editorial-confident Candidate A live and two UAT alternatives preserved under _candidates for Plan 11-16 swap**

## Performance

- **Duration:** ~6 min
- **Started:** 2026-05-17T13:52:03Z
- **Completed:** 2026-05-17T13:58:00Z
- **Tasks:** 3
- **Files modified:** 4

## Accomplishments

- F-Copy-1 closed: Shop empty-state and Home brand-ethos both read in ORKI's editorial-confident voice, anchored to the locked hero copy register
- Shop.empty.{heading,body} in en.json: Candidate A ("No drops in this category yet." / "Check back Friday. Or browse everything we've shipped so far.")
- Home.ethos.line in en.json: Candidate A ("We don't make clothes. We track what Riyadh sounds like at night.")
- Home.ethos.readStory in en.json: "Read Our Story" (migrated from inline)
- Three UAT candidates each under _candidates (A_dropCycle/B_locale/C_stripped for Shop; A_voice/B_heritage/C_stripped for Home)
- ProductGrid.tsx converted to async server component — inline EN/AR ternary replaced with getTranslations('Shop.empty')
- page.tsx brand-ethos h3 and "Read Our Story" link replaced with tEthos('line') and tEthos('readStory')
- AR placeholder keys added to messages/ar.json for both Shop.empty and Home.ethos (pre-Phase-11 inline strings preserved verbatim)

## Copy Candidates

### Shop Empty-State (D-06)

**Candidate A (LIVE — default):**
- heading: `No drops in this category yet.`
- body: `Check back Friday. Or browse everything we've shipped so far.`
- Voice: Drop-cycle-coded, declarative, schedule-aware

**Candidate B (B_locale):**
- heading: `This rack is empty.`
- body: `Tops, bottoms, the rest of Riyadh's nights — they're all in the main shop.`
- Voice: Scene/locale-coded, Riyadh-atmospheric

**Candidate C (C_stripped):**
- heading: `Empty.`
- body: `Browse all products.`
- Voice: Stripped minimal, maximum brevity

### Home Brand-Ethos (D-07)

**Candidate A (LIVE — default):**
- line: `We don't make clothes. We track what Riyadh sounds like at night.`
- Voice: Riyadh-confident, declarative, sensory — anchored to locked hero

**Candidate B (B_heritage):**
- line: `From Najd to the streets. Documenting a generation in cotton.`
- Voice: Heritage cue, declarative with geographic reference

**Candidate C (C_stripped):**
- line: `Streetwear out of Riyadh. Worn loudly.`
- Voice: Short-stripped, punchy

## Task Commits

1. **Task 1: Add Shop.empty.* + Home.ethos.* to en.json with live + candidates** — `67c9728` (feat)
2. **Task 2: Migrate ProductGrid empty-state to next-intl Shop.empty keys** — `e1efeda` (feat)
3. **Task 3: Migrate Home brand-ethos line to next-intl Home.ethos key** — `dee4aac` (feat)

## Files Created/Modified

- `messages/en.json` — Shop.empty.{heading,body,_candidates} + Home.ethos.{line,readStory,_candidates}
- `messages/ar.json` — Shop.empty.{heading,body} + Home.ethos.{line,readStory} (AR placeholders)
- `src/components/shop/ProductGrid.tsx` — async server component, getTranslations('Shop.empty'), inline ternary removed
- `src/app/[locale]/page.tsx` — getTranslations import + tEthos, inline EN/AR ethos ternaries removed

## UAT Instructions for Plan 11-16

### Shop empty-state:
1. Visit `/en/shop?category=tops` (or any category with 0 results) in `npm run dev`
2. Observe live Candidate A copy
3. User selects preferred candidate (A, B, or C)
4. Executor opens `messages/en.json` → `Shop.empty`
5. Replace `heading` and `body` values with chosen candidate's values from `_candidates`
6. Delete the entire `_candidates` key
7. Verify JSON valid, commit

### Home ethos:
1. Visit `/en` in `npm run dev`, scroll to brand-ethos section
2. Observe live Candidate A line
3. User selects preferred candidate (A, B, or C)
4. Executor opens `messages/en.json` → `Home.ethos`
5. Replace `line` value with chosen candidate's value from `_candidates`
6. Delete the entire `_candidates` key
7. Verify JSON valid, commit

## Decisions Made

- Candidate A selected as live default for both slots per plan specification
- ProductGrid made async server component (was sync Server Component) — enables getTranslations without 'use client' directive
- readStory key migrated alongside ethos.line since page.tsx was already open for the ethos migration
- Existing Shop.emptyHeading / Shop.emptyBody keys left in place — Plan 11-16 cleans them up post-UAT

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None. TypeScript and lint clean on all three tasks. Build succeeds.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- F-Copy-1 closed: Shop empty-state + Home ethos reads in ORKI editorial-confident voice
- Plan 11-16 (UAT) finalises candidate selection — executor swaps _candidates chosen values to top-level and deletes _candidates
- AR voice review for both slots remains at Phase 999.11

## Self-Check

### Files exist:
- messages/en.json — modified (verified Shop.empty.heading + Home.ethos.line)
- messages/ar.json — modified (verified Shop.empty.heading + Home.ethos.line)
- src/components/shop/ProductGrid.tsx — modified (verified async + getTranslations)
- src/app/[locale]/page.tsx — modified (verified tEthos('line') + tEthos('readStory'))
- .planning/phases/11-storefront-ui-ux-polish-en/11-14-SUMMARY.md — this file

### Commits exist:
- 67c9728 — feat(11-14): add Shop.empty.* + Home.ethos.* to en.json with live + UAT candidates
- e1efeda — feat(11-14): migrate ProductGrid empty-state to next-intl Shop.empty keys
- dee4aac — feat(11-14): migrate Home brand-ethos + Read Our Story to next-intl Home.ethos keys

## Self-Check: PASSED

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
