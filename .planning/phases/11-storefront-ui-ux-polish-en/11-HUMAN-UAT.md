---
status: complete
phase: 11-storefront-ui-ux-polish-en
source: [11-VERIFICATION.md]
started: 2026-05-30
updated: 2026-05-30
---

## Current Test

[testing complete]

## Tests

### 1. Live-dev surface walk (SC-2)
expected: With `npm run dev` running against a DB-connected env, every changed surface (Home, Shop + category, Shop empty, PDP, About, Contact, 404, global Navbar/Footer/ShopDropdown) renders correctly at BOTH desktop (1440px+) AND mobile-emulator (375px) viewports, in BOTH EN AND AR. Specifically: dark Navbar (`bg-black/80 backdrop-blur`), no search icon, ShopDropdown panel matches CategoryDropdown chrome, typographic-only Home category splats, 4-variant product placeholders, PDP vertical thumb strip (desktop) + scroll-snap dots (mobile), Contact WhatsApp callout (not a form), About single body + single pull-quote style, 404 "NO DROP HERE".
result: pass

### 2. Keyboard-only focus traversal (SC-4)
expected: Tab through Home → Shop → PDP → Contact → 404. EVERY interactive (logo, nav links, ShopDropdown trigger + items, language switcher, cart trigger, drawer trigger, product cards, sort select, PDP thumbs, PDP dots, WhatsApp anchors, 404 CTAs) shows a visible white focus ring.
result: pass

### 3. Reduced-motion (SC-5)
expected: OS-level `prefers-reduced-motion` ON → ScrollReveal renders content instantly (no entrance), PDPGallery thumb-click scrolls instantly, MobileNavDrawer slides without spring.
result: pass

### 4. RTL parity (SC-3)
expected: `/ar/...` for every surface — PDP thumb strip mirrors to inline-start (right edge in AR), Footer benefit borders / ShopDropdown panel / Contact callout all use logical-prop spacing with no physical-direction leak.
result: pass

### 5. Throttled-network skeletons (SC-5)
expected: DevTools → Slow 3G → reload `/en/shop`: the 8-card 3:4 skeleton shows before products render. Hard-reload a PDP: the 4:5 gallery skeleton shows on slow load.
result: pass

### 6. WhatsApp deep-link (D-16)
expected: `https://wa.me/905539339440` opens a WhatsApp chat target for ORKI's customer channel; the Contact CTA is enabled (no "not yet configured" preview note).
result: pass

### 7. DB-connected suite + build (SC-6)
expected: `npm test` and `npm run build` run fully green against a DB-connected `.env.local`.
result: pass
note: "Confirmed 2026-06-09 against the resumed Supabase tenant: npm test = 119 passed / 0 failed / 8 skipped (25 files; the 12 DB/RLS/auth tests exercised green after a cold-start warm-up — first run showed 4 cold-instance 5s timeouts that cleared on re-run); npm run build = exit 0, 'Compiled successfully', /sitemap.xml prerendered. tsc + lint green (1 pre-existing isRtl warning)."

## Summary

total: 7
passed: 7
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps
