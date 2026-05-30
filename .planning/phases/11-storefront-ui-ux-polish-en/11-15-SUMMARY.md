---
phase: 11-storefront-ui-ux-polish-en
plan: "15"
subsystem: ui
tags: [verification, uat, finalization, whatsapp, copy]

# Dependency graph
requires:
  - phase: 11-01..11-14
    provides: All EN-scope storefront polish code (24 audit findings closed)
provides:
  - 11-VERIFICATION.md finalized (per-finding closure + UAT decisions + automated suite)
  - WA_NUMBER set to real number 905539339440 (ContactClient.tsx)
  - Legacy Shop.emptyHeading/emptyBody removed from en.json + ar.json
affects: [phase-11-completion]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WA_NUMBER typed as string (widened) to preserve defensive 'TBD' guard without TS2367"

key-files:
  created:
    - .planning/phases/11-storefront-ui-ux-polish-en/11-15-SUMMARY.md
  modified:
    - src/app/[locale]/contact/ContactClient.tsx
    - messages/en.json
    - messages/ar.json
    - .planning/phases/11-storefront-ui-ux-polish-en/11-VERIFICATION.md

key-decisions:
  - "WhatsApp number: 905539339440 (user provided +90 5539339440 → wa.me format)"
  - "Shop empty / Home ethos / EN 404 copy: user confirmed Candidate A for all three (already live)"
  - "WA_NUMBER annotated `: string` to keep the 'TBD' fallback branch type-valid (TS2367 fix)"
  - "Legacy emptyHeading/emptyBody removed from both en.json and ar.json (orphaned, 0 src refs)"
  - "Live-dev visual walk left as user-owned manual gate — sandbox has no DB/browser access"

requirements-completed: [SC-1, SC-2, SC-3, SC-4, SC-5, SC-6]

# Metrics
duration: 12min
completed: 2026-05-30
---

# Phase 11 Plan 15: Final-Mile UAT + Verification Summary

**Closed Phase 11's EN scope: captured all four UAT decisions, set the real WhatsApp number, removed orphaned legacy copy keys, and finalized 11-VERIFICATION.md. Live-dev visual walk remains a user-owned manual gate.**

## Performance

- **Duration:** ~12 min
- **Completed:** 2026-05-30
- **Tasks:** 6 (Tasks 1–2 automated; Tasks 3–5 human checkpoints resolved via AskUserQuestion; Task 6 applied + finalized)

## Accomplishments

- **Automated suite captured:** `tsc` ✓ 0, `lint` ✓ 0 (2 pre-existing warnings). `test` and `build` exit non-zero **only** because the Supabase Postgres tenant is unreachable from the execution sandbox (12 DB tests + `/sitemap.xml` prerender) — zero Phase 11 regressions; compile + types green.
- **UAT decisions (Tasks 3–5)** resolved by the user:
  - D-16 WhatsApp number → `905539339440`
  - D-06 Shop empty → Candidate A (drop-cycle)
  - D-07 Home ethos → Candidate A (Riyadh-confident)
  - D-08 EN 404 → Candidate A (NO DROP HERE)
- **WA_NUMBER** swapped from `'TBD'` to `'905539339440'` in `ContactClient.tsx`; the CTA now renders enabled and deep-links `https://wa.me/905539339440`. Constant annotated `: string` to keep the defensive `'TBD'` guard type-valid.
- **Legacy keys removed:** `Shop.emptyHeading` / `Shop.emptyBody` deleted from `messages/en.json` and `messages/ar.json` (orphaned post-11-14; 0 references in `src/`). `_candidates` blocks confirmed already absent.
- **11-VERIFICATION.md finalized:** 23/26 findings closed + 3 deferred (AR-side, photography, DB-connected suite re-run), UAT decisions table filled, automated-suite caveat documented, sign-off updated.

## UAT Decisions

| Decision | Value |
|---|---|
| D-16 WhatsApp number | `905539339440` |
| D-06 Shop empty copy | A_dropCycle |
| D-07 Home ethos line | A_voice |
| D-08 EN 404 voice | A_voice |

## Automated Suite Exit Codes

| Command | Exit | Cause if non-zero |
|---|---|---|
| `tsc --noEmit` | 0 | — |
| `lint` | 0 | — |
| `test` | 1 | 12 DB/env failures (Supabase tenant unreachable in sandbox); 82 pass |
| `build` | 1 | `/sitemap.xml` prerender — DB-backed query, tenant unreachable; compile + types ✓ |

## Deviations from Plan

- Tasks 1–2 (automated suite + dev-server HTTP smoke) could not fully execute against a live DB — the Supabase tenant is unreachable from the sandbox. Captured tsc/lint green + documented the DB-connectivity caveat instead of an HTTP smoke pass.
- Task 3 (live visual/keyboard/RTL/reduced-motion walk) is inherently a human browser task and is recorded as a user-owned manual sign-off gate rather than executed here.
- `_candidates` blocks were already removed by a prior session; only the legacy `emptyHeading/emptyBody` keys remained and were cleaned.

## Deferred / User-Owned Follow-ups

1. Live-dev visual walkthrough (every surface × desktop/mobile × EN/AR/RTL × reduced-motion/throttled-network/keyboard) — run against DB-connected `.env.local`.
2. Confirm `https://wa.me/905539339440` resolves to ORKI's WhatsApp chat target.
3. Re-run `npm test` + `npm run build` against a DB-connected environment to confirm fully green.
4. AR-side copy voice review (404, Shop.empty, Home.ethos, About numbering) → Phase 999.11.

## Self-Check

### Files exist:
- src/app/[locale]/contact/ContactClient.tsx — modified (WA_NUMBER = '905539339440')
- messages/en.json — modified (legacy keys removed; parses)
- messages/ar.json — modified (legacy keys removed; parses)
- .planning/phases/11-storefront-ui-ux-polish-en/11-VERIFICATION.md — finalized
- .planning/phases/11-storefront-ui-ux-polish-en/11-15-SUMMARY.md — this file

### Acceptance criteria:
- `_candidates` removed from all three blocks ✓ (already absent)
- Chosen candidates reflected in live keys ✓ (all Candidate A, already live)
- en.json + ar.json parse ✓
- `grep -rn "emptyHeading\|emptyBody" src/` returns 0 ✓
- 11-VERIFICATION.md UAT + per-finding tables filled ✓
- tsc + lint green ✓

## Self-Check: PASSED

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-30*
