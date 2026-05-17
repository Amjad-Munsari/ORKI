---
phase: 11-storefront-ui-ux-polish-en
plan: "03"
subsystem: ui
tags: [a11y, focus-visible, wcag, tailwind, keyboard-navigation]

requires:
  - phase: 11-storefront-ui-ux-polish-en plan 01
    provides: design token foundation (--container-max, display-1..4, near-black vars)

provides:
  - Canonical focus-visible ring on all storefront Nav chrome interactives
  - Canonical focus-visible ring on ShopHeader category tabs and sort select
  - Canonical focus-visible ring on Contact WhatsApp anchor

affects:
  - 11-04 (search icon removal — Navbar search button left untouched per plan; 11-04 deletes it)
  - 11-10 (Contact form replacement — form inputs intentionally skipped; WhatsApp anchor already has ring)
  - 11-12 (ShopHeader sort select replacement — ring added defensively for standalone shippability)
  - 11-16 (live-dev verification — Tab-through focus audit will confirm all rings visible)

tech-stack:
  added: []
  patterns:
    - "Canonical focus-visible string: focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black"
    - "focus-visible:outline-none required because globals.css sets * { outline-ring/50 } — omitting it would cause competing half-opacity outline"
    - "ShopHeader tab className uses array .join() pattern — focus string added as dedicated array entry"

key-files:
  created: []
  modified:
    - src/components/nav/Navbar.tsx
    - src/components/nav/LanguageSwitcher.tsx
    - src/components/nav/MobileNavDrawer.tsx
    - src/components/nav/ShopDropdown.tsx
    - src/components/nav/CartTrigger.tsx
    - src/components/shop/ShopHeader.tsx
    - src/app/[locale]/contact/ContactClient.tsx

key-decisions:
  - "CartTrigger button had no pre-existing focus-visible declaration; canonical ring added (no pre-existing ring decision)"
  - "Navbar search button intentionally skipped — Plan 11-04 deletes it; adding ring is waste"
  - "ContactClient form inputs (Name, Email, Message, Submit) intentionally skipped — Plan 11-10 replaces entire form region with WhatsApp callout"
  - "ShopHeader sort select ring added defensively — Plan 11-12 replaces with shadcn Select but this plan is independently shippable"

patterns-established:
  - "Pattern: append canonical focus string as last token in existing className string for simple elements"
  - "Pattern: for array .join() classNames (ShopHeader tabs), add focus string as a dedicated array entry"

requirements-completed: [SC-4, SC-6]

duration: 8min
completed: 2026-05-17
---

# Phase 11 Plan 03: Focus-Visible Rings Summary

**Canonical focus-visible:ring-1 ring-white ring-offset-black applied to all 12 storefront interactives in the coverage matrix, closing audit finding F-Exp-1**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-17T12:30:00Z
- **Completed:** 2026-05-17T12:38:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Added canonical focus-visible ring to all Nav chrome interactives (Navbar logo + about/contact links, LanguageSwitcher button, MobileNavDrawer trigger + 5 inner nav links, ShopDropdown trigger + item links, CartTrigger button)
- Added canonical focus-visible ring to ShopHeader category tabs (via array.join pattern) and sort select
- Added canonical focus-visible ring to Contact WhatsApp anchor
- F-Exp-1 closed in code; live-dev Tab-through verification deferred to Plan 11-16 per plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Nav + Drawer + ShopDropdown + LanguageSwitcher + CartTrigger** - `d3e19da` (feat)
2. **Task 2: ShopHeader tabs + sort select + Contact WhatsApp anchor** - `9b17d05` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/components/nav/Navbar.tsx` — logo Link + about/contact .map Links: +2 focus rings
- `src/components/nav/LanguageSwitcher.tsx` — language toggle button: +1 focus ring
- `src/components/nav/MobileNavDrawer.tsx` — SheetTrigger button + shop Link + tops Link + bottoms Link + about Link + contact Link: +6 focus rings
- `src/components/nav/ShopDropdown.tsx` — trigger Link + dropdown item Links: +2 focus rings
- `src/components/nav/CartTrigger.tsx` — cart button (no pre-existing ring): +1 focus ring
- `src/components/shop/ShopHeader.tsx` — category tab buttons (via .join array) + sort select: +2 focus ring occurrences
- `src/app/[locale]/contact/ContactClient.tsx` — WhatsApp anchor: +1 focus ring

## Coverage Matrix — Disposition per Element

| Interactive | File | Action |
|---|---|---|
| Nav text Links (.map) | Navbar.tsx | DONE |
| Logo Link | Navbar.tsx | DONE |
| Search button | Navbar.tsx | SKIPPED — Plan 11-04 deletes |
| LanguageSwitcher button | LanguageSwitcher.tsx | DONE |
| MobileNavDrawer trigger | MobileNavDrawer.tsx | DONE |
| Drawer shop Link | MobileNavDrawer.tsx | DONE |
| Drawer tops Link | MobileNavDrawer.tsx | DONE |
| Drawer bottoms Link | MobileNavDrawer.tsx | DONE |
| Drawer about Link | MobileNavDrawer.tsx | DONE |
| Drawer contact Link | MobileNavDrawer.tsx | DONE |
| ShopDropdown trigger Link | ShopDropdown.tsx | DONE |
| ShopDropdown inner Links | ShopDropdown.tsx | DONE |
| CartTrigger button | CartTrigger.tsx | DONE (no pre-existing ring) |
| ShopHeader category tabs | ShopHeader.tsx | DONE |
| ShopHeader native sort select | ShopHeader.tsx | DONE (defensive; 11-12 replaces) |
| Contact WhatsApp anchor | ContactClient.tsx | DONE |
| Contact form inputs | ContactClient.tsx | SKIPPED — Plan 11-10 deletes form |

## Decisions Made

- **CartTrigger pre-existing ring:** CartTrigger.tsx had no `focus-visible:` token in its button className. Canonical ring added. (Decision recorded per plan output spec.)
- **Navbar search button:** Intentionally skipped — Plan 11-04 removes the search icon entirely. Adding ring is waste.
- **Contact form inputs:** Intentionally skipped — Plan 11-10 replaces the entire form region with a WhatsApp callout. Form inputs (Name, Email, Message, Submit) will be deleted; adding rings to them is waste.
- **ShopHeader sort select:** Ring added defensively even though Plan 11-12 replaces it with a shadcn Select. This ensures Plan 11-03 is independently shippable.

## Deviations from Plan

None — plan executed exactly as written. No unexpected issues encountered.

## Issues Encountered

None.

## Known Stubs

None — this plan is a pure className-addition pass. No data rendering, no copy, no stubs.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- F-Exp-1 closed in code; Plan 11-16 (live-dev verification) will Tab through every surface to confirm rings are visible
- Plan 11-04 (Navbar search icon removal) can safely proceed — search button left untouched per plan
- Plan 11-10 (Contact form → WhatsApp callout) can safely proceed — form inputs not touched; WhatsApp anchor already has ring
- Plan 11-12 (ShopHeader sort select → shadcn Select) can safely proceed — will inherit the focus-visible pattern

---
*Phase: 11-storefront-ui-ux-polish-en*
*Completed: 2026-05-17*
