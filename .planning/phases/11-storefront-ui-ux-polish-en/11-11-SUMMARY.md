---
phase: 11-storefront-ui-ux-polish-en
plan: 11
subsystem: ui
tags: [pdp, stock, color-token, comment-reconciliation, bilingual]

# Dependency graph
requires:
  - phase: 11-storefront-ui-ux-polish-en
    provides: STOREFRONT-UI-REVIEW-EN.md findings F-Exp-5, F-Color-4, F-Space-4
provides:
  - Passive 'Limited stock' line on PDP near price (pre-size-selection scarcity signal)
  - OOS PDP text using brand-neutral text-white/60 (no text-destructive on storefront)
  - PDPLayout nav-height comment reconciled to actual h-[80px] / top-20

affects: [phase-11-plans, 11-16-verification, pdp-visual-review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "lowestInStock() helper: pure function over Product.sizes — no new fields on Product type"
    - "Passive vs. active low-stock messaging: passive (pre-selection, text-white/60) vs. emphatic (post-selection, text-white/80)"
    - "Destructive token reserved for admin contexts; storefront OOS uses text-white/60"

key-files:
  created: []
  modified:
    - src/components/pdp/PDPInfoPanel.tsx
    - src/components/shop/StockStateBadge.tsx
    - src/components/pdp/PDPLayout.tsx

key-decisions:
  - "Passive limited-stock copy: inline EN ('Limited stock') / AR ('كمية محدودة') — no i18n key added; copy is short and bilingual inline matches the existing per-size pattern"
  - "Helper function lowestInStock() defined at module top-level in PDPInfoPanel.tsx (not extracted to a shared util) — self-contained, no cross-file mutation"
  - "PDPLayout comment fix: choose option (a) — update comment text only, no --nav-height CSS variable introduced (lighter-touch path per CONTEXT.md Claude's Discretion)"
  - "text-destructive reserved for admin contexts; storefront always uses opacity-based white tokens"

patterns-established:
  - "Passive stock line: text-xs text-white/60 font-mono uppercase tracking-widest (distinct from active text-white/80)"
  - "Active stock line (per-size): text-xs text-white/80 font-mono uppercase tracking-widest -mt-4 animate-in"

requirements-completed: [SC-1, SC-6]

# Metrics
duration: 3min
completed: 2026-05-17
---

# Phase 11 Plan 11: PDP Stock Signals, OOS Token Fix, Nav Comment Summary

**Passive 'Limited stock' scarcity line near PDP price, text-destructive removed from storefront OOS, and PDPLayout nav-height comment reconciled to actual 80px.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-17T13:29:08Z
- **Completed:** 2026-05-17T13:32:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- PDPInfoPanel surfaces passive 'Limited stock' / 'كمية محدودة' line near the price whenever the lowest in-stock size is 1-5 units (independent of size selection). The existing per-size gated 'ONLY N LEFT' emphatic line is preserved unchanged.
- StockStateBadge.tsx OOS PDP path (line 55) now uses `text-white/60` — `text-destructive` (warm-red Tailwind token) no longer appears on any storefront surface. Destructive token is reserved for admin contexts.
- PDPLayout.tsx doc-comment reconciled: was `sticky top-16 / h-16 from Phase 1` (64px); updated to reference `sticky top-20 / h-[80px]` (80px), matching Navbar.tsx line 24 and layout.tsx `pt-20`.

## Task Commits

Each task was committed atomically:

1. **Task 1: Passive Limited stock line + per-size gated line** - `8d53a52` (feat)
2. **Task 2: Swap text-destructive on StockStateBadge OOS** - `5f513ae` (fix)
3. **Task 3: Reconcile PDPLayout nav-height comment** - `cbb21e4` (docs)

**Plan metadata:** _(final docs commit — this summary)_

## Files Created/Modified

- `src/components/pdp/PDPInfoPanel.tsx` — Added `lowestInStock()` helper, `showPassiveLowStock` computed value, and passive line JSX after price. Per-size active line unchanged.
- `src/components/shop/StockStateBadge.tsx` — Replaced `text-destructive` with `text-white/60` on the PDP out-of-stock `<p>` (line 55).
- `src/components/pdp/PDPLayout.tsx` — Updated doc-comment referencing stale `h-16` (64px) to match actual `h-[80px]` (80px).

## Decisions Made

- **Passive line copy:** Inline bilingual copy (`'Limited stock'` / `'كمية محدودة'`) rather than next-intl keys — short copy, same pattern as the existing per-size inline strings, avoids i18n key churn.
- **lowestInStock() placement:** Module-level function in PDPInfoPanel.tsx (not a shared utility file) — self-contained, zero cross-file impact.
- **Comment-only fix for PDPLayout:** Option (a) — update comment text only. No `--nav-height` CSS variable introduced. Lighter-touch, no cross-file mutation risk, per CONTEXT.md Claude's Discretion.
- **Color token discipline:** `text-destructive` is now explicitly reserved for admin contexts. Storefront stock messaging uses `text-white/60` (passive) and `text-white/80` (active/emphatic).

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Known Stubs

None - all three changes are complete and functionally wired.

## Threat Flags

None - changes are UI-only (className swaps, comment text, pure display logic). No new network endpoints, auth paths, or trust boundary surfaces introduced.

## Next Phase Readiness

- F-Exp-5 (passive limited stock), F-Color-4 (no text-destructive on storefront), F-Space-4 (nav-height comment) all closed.
- PDP ready for Plan 11-16 visual verification on a product with a low-stock size (set one size stock to 3 in `data/products.ts` to trigger passive line).
- StockStateBadge now fully brand-neutral on all storefront contexts.

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
