---
audit_type: storefront-cross-phase
scope: ar-locale-copy-and-rtl
audit_date: 2026-05-16
split_date: 2026-05-16
parent_audit: STOREFRONT-UI-REVIEW.md (split into EN/AR at creation; full audit data preserved across both files)
sibling_file: STOREFRONT-UI-REVIEW-EN.md
status: deferred
target_phase: future "storefront-ui-ar-polish" (post-Phase-11)
total_findings: 5
---

# Storefront UI Review — ORKI (AR scope, deferred)

Pure AR copy reconciliation, AR-native voice review, and AR-only RTL/typographic concerns peeled off from the cross-phase storefront audit. **Not in Phase 11 scope.** Will become the brief for a future `storefront-ui-ar-polish` phase once the EN polish is shipped and the brand voice is locked in EN.

## Why deferred

User direction 2026-05-16: "let's continue with fixing all the UX/UI but for the english version for now because the arabic one is full of issues, so let's tackle them later." Splitting the audit avoids polluting Phase 11 acceptance criteria with AR-copy work that requires a separate review pass (ideally with a native AR speaker / brand voice consultant).

## Deferred findings

### Copywriting

- **[MAJOR] AR translations diverge from EN intent in Nav and Shop tabs.**
  - Evidence: `messages/en.json:4-5` → `"tops": "Tops"`, `"bottoms": "Bottoms"`. `messages/ar.json:4-5` → `"الأعلى"`, `"الأسفل"` (literally "the up" / "the down"). `Shop.tabTops` AR is `"التيشيرتات"` (T-shirts) while EN is `"Tops"`. `Meta.shopTops.title` AR is `"القمم"` — a third different word.
  - Fix: Decide on `بلايز` (tops) vs `تيشيرتات` (tees) and use it consistently across `Nav.tops`, `Shop.tabTops`, the breadcrumb JSON-LD (`shop/[category]/[slug]/page.tsx:108-110`), and `Meta.shopTops.title`. Same exercise for bottoms.

- **[OPEN] AR translation for home hero needs native review.**
  - Evidence: Phase 11 EN commit shipped AR draft `صُنع في صخب الرياض.` + `البس صوت المدينة.` + `(صيف ٢٦ — الإصدار ٠١)`. These are direct EN-to-AR translations of the new voice; AR-native review may surface a more idiomatic Riyadh-noir phrasing.

- **[MINOR] About page numbering EN vs AR.**
  - Evidence: EN uses `01 — Vision / 02 — Heritage / 03 — Quality`; AR drops the number (`رؤيتنا / جذورنا / الجودة`).
  - AR-side fix: After EN decides whether to keep numbering, mirror in AR using Arabic-Indic numerals (`٠١ — رؤيتنا`) or Western (`01 — رؤيتنا`).

- **[OPEN] AR-side copy review for Footer benefit bar + nav + help groups.**
  - Evidence: Phase 11 pivot commit added AR keys for `Footer.benefits.*`, `Footer.nav.*`, `Footer.help.*`. Keys were filled with direct translations; AR-native review for tone, idiom, and consistency with brand voice still pending.

### Visuals / RTL

- **[OPEN] AR-side RTL leaks in shadcn primitives (`ui/dialog.tsx`, `ui/sheet.tsx`, `ui/navigation-menu.tsx`).**
  - The structural fix (`left-0` → `start-0`) is being handled in Phase 11 EN scope because the impact is bidirectional, but AR-side verification — visual mirroring, focus order, screen-reader path — belongs in the AR pass.

### Experience Design

- **[OPEN] AR-side 404 copy.**
  - Evidence: `Errors.notFound.*` keys are unaudited for AR tone. EN side rewrites to brand voice in Phase 11; AR side gets a parallel rewrite from a native speaker in the AR phase.

## Pending review items inherited from Phase 9 + 10

- **AR legal copy `[AR-LEGAL-REVIEW]` markers** in `messages/ar.json` (Privacy, Terms, Cookies) — needs native-speaker legal reviewer sign-off; CI guard `grep -E '\\[AR-LEGAL-REVIEW\\]|\\[USER-CONFIRM' messages/ar.json` must return 0 lines pre-launch. (Flagged in Phase 9-02 as deferred-to-launch.)

## Entry criteria for the AR polish phase

1. Phase 11 (EN polish) shipped and merged.
2. Brand voice locked in EN (so AR has a stable target to mirror).
3. Native AR speaker available for copy review and tone sign-off.
4. AR-legal reviewer engaged for `[AR-LEGAL-REVIEW]` clearance.
