---
phase: 11-storefront-ui-ux-polish-en
plan: 10
subsystem: ui
tags: [contact, whatsapp, callout, aria-live, focus-visible, rtl]

# Dependency graph
requires:
  - phase: 11-storefront-ui-ux-polish-en
    plan: 01
    provides: display-3 class + container-max token already applied to contact header
  - phase: 11-storefront-ui-ux-polish-en
    plan: 03
    provides: focus-visible ring token pattern (ring-offset-black) established
provides:
  - WhatsApp callout card in contact right column replacing mock setTimeout form
  - WA_NUMBER = 'TBD' single-constant pattern for UAT swap-in (Plan 11-16)
  - aria-live="polite" on callout region; both WA anchors carry canonical focus-visible ring
  - F-Copy-3 closed (no longer pretends email delivery is live)
  - F-Exp-3 closed (aria-live callout in place of mock form submission)
affects: [11-16]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "WA_NUMBER constant pattern: single module-scope constant holds placeholder, UAT swaps real number"
    - "aside[role=region][aria-live=polite] for live-region callout cards"
    - ".rtl-flip applied to ArrowRight icon in CTA button for direction-aware flip"

key-files:
  created: []
  modified:
    - src/app/[locale]/contact/ContactClient.tsx

key-decisions:
  - "D-14: Mock setTimeout form fully removed; WhatsApp callout card rendered in same right-column visual slot"
  - "D-15: Contact hero/heading (GET IN / TOUCH) preserved; only form region swapped"
  - "D-16: WA_NUMBER = 'TBD' at module scope — single edit point for UAT; intentionally broken wa.me/TBD signals swap required"
  - "D-17 deferral: Form returns when Phase 8 RESEND_API_KEY is provisioned; component archived in this commit"
  - "Inline AR copy retained as placeholder; AR-native review deferred to Phase 999.11"

patterns-established:
  - "Single-constant UAT placeholder pattern: const WA_NUMBER = 'TBD' with instructional comment"

requirements-completed: [SC-1, SC-6]

# Metrics
duration: 8min
completed: 2026-05-17
---

# Phase 11 Plan 10: Contact Form Replacement Summary

**Mock setTimeout form deleted and replaced with WhatsApp callout card (`aria-live="polite"`, `WA_NUMBER='TBD'` constant, dual focus-visible rings) closing F-Copy-3 and F-Exp-3.**

## Performance

- **Duration:** 8 min
- **Started:** 2026-05-17T00:00:00Z
- **Completed:** 2026-05-17T00:08:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Removed all mock form code: `useState`, `setTimeout(1500)` submission, `sent` branch, `<form>` block, `ArrowLeft` import, and the inline `Input` helper function
- Shipped WhatsApp callout card in the right column with `aside[role="region"][aria-live="polite"]` semantics and editorial ORKI voice copy
- `WA_NUMBER = 'TBD'` constant at module scope with clear UAT comment — single edit point for Plan 11-16
- Both WhatsApp anchors carry the canonical focus-visible ring (`focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black`)
- `ArrowRight` in CTA uses `.rtl-flip` for direction-aware icon mirroring
- Build, tsc, and lint all pass clean

## Task Commits

1. **Task 1: Replace mock contact form with WhatsApp callout card** - `fa35f4c` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/app/[locale]/contact/ContactClient.tsx` — Rewritten: mock form removed, WhatsApp callout card with aria-live, WA_NUMBER constant, dual focus-visible rings

## Decisions Made

- D-14: Drop mock form entirely (no archival file needed; git history preserves the old code)
- D-15: Hero `<h1>` with `display-3 font-bold uppercase` and left-column intro copy preserved
- D-16: `WA_NUMBER = 'TBD'` — intentionally non-resolving `wa.me/TBD` URL signals the UAT swap is still required
- D-17 deferral recorded here: the contact form returns when Phase 8's `RESEND_API_KEY` is provisioned; this commit archives the mock version in git history
- Left-column intro copy trimmed from "Reach out via the form or directly through WhatsApp" to "The fastest way to reach us is on WhatsApp" to match the new single-channel direction
- AR copy kept inline (not moved to messages/ar.json) per CONTEXT D-14; placeholder pending Phase 999.11 AR-native review

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None required for this plan. Plan 11-16 (UAT) will prompt the user to replace `WA_NUMBER = 'TBD'` with the real international WhatsApp number (no leading +, no spaces, no dashes, e.g. `966555123456`).

## Known Stubs

- `WA_NUMBER = 'TBD'` in `src/app/[locale]/contact/ContactClient.tsx:13` — intentional; Plan 11-16 UAT provides the real number. The broken `wa.me/TBD` link is a visible signal.
- AR copy strings are placeholder translations pending Phase 999.11 AR-native review.

## D-17 Deferral Note

The mock form (and any real email form) is **deferred, not deleted permanently.** When Phase 8's `RESEND_API_KEY` is provisioned, the contact form can be reintroduced alongside the WhatsApp callout as a secondary channel. The original form code is preserved in git history at the commit prior to `fa35f4c`.

## Next Phase Readiness

- Plan 11-16 (UAT) can now prompt for the real WA_NUMBER and verify the callout on `/en/contact` and `/ar/contact`
- F-Copy-3 and F-Exp-3 are closed; no further contact-page work in Phase 11 unless UAT reveals issues

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
