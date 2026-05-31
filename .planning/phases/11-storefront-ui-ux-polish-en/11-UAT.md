---
status: complete
phase: 11-storefront-ui-ux-polish-en
source: [11-01-SUMMARY.md, 11-02-SUMMARY.md, 11-03-SUMMARY.md, 11-04-SUMMARY.md, 11-05-SUMMARY.md, 11-06-SUMMARY.md, 11-07-SUMMARY.md, 11-08-SUMMARY.md, 11-09-SUMMARY.md, 11-10-SUMMARY.md, 11-11-SUMMARY.md, 11-12-SUMMARY.md, 11-13-SUMMARY.md, 11-14-SUMMARY.md, 11-15-SUMMARY.md]
started: 2026-05-31T09:47:26Z
updated: 2026-05-31T15:02:43Z
---

## Current Test

[testing complete]

## Tests

### 1. Display typography & container width
expected: Large headings (Home hero, About/Contact headers, Footer ORKI wordmark) scale fluidly with viewport; all storefront pages capped at 1440px; near-black surfaces consistent.
result: pass

### 2. Dark Navbar & ShopDropdown panel
expected: Navbar is dark translucent (bg-black/80 + backdrop-blur, white text, hairline white bottom border); the search icon is gone entirely; the Shop dropdown panel is a dark surface matching the CategoryDropdown chrome.
result: pass

### 3. Keyboard focus rings
expected: Tabbing through Home → Shop → PDP → Contact → 404 shows a visible white focus ring on every interactive (logo, nav links, Shop dropdown trigger + items, language switcher, cart trigger, mobile drawer trigger + links, product cards, sort select, PDP thumbs/dots, WhatsApp anchors, 404 CTAs).
result: pass

### 4. Varied product placeholder imagery
expected: Catalog product cards show 4 distinct dark editorial placeholder treatments (ghost mark / color bands / grain texture / giant typographic wordmark) deterministically per product — not identical grey boxes. Same product always shows the same treatment.
result: pass

### 5. Home editorial polish
expected: Home category splats are typographic-only (a giant category-name wordmark on a near-black field, no overlay wash); Featured-Drops and the product grid share the same spacing; the "Read Our Story" link ends with an arrow icon (not an em-dash).
result: pass

### 6. PDP gallery layout
expected: On desktop the PDP shows a vertical thumbnail strip on the inline-start side with a large main image; on mobile it becomes a horizontal scroll-snap carousel with dot indicators below that track the active image.
result: pass

### 7. Loading skeletons (throttled network)
expected: With DevTools network throttled to Slow 3G, reloading /en/shop shows an 8-card 3:4 skeleton before products appear; hard-reloading a PDP shows the 4:5 gallery skeleton. Skeletons are static (no shimmer/pulse animation).
result: pass

### 8. Shop sort dropdown
expected: The sort control on the shop page is a styled dark dropdown (shadcn Select with dark chrome / white hairline border), not a default native browser select.
result: pass
note: "Was an issue: (1) trigger showed raw value vs translated list labels; (2) popup opened above when a non-first item was selected. Fixed in ShopHeader.tsx (SelectValue render fn + alignItemWithTrigger={false}). User re-verified both good."

### 9. About page typographic rhythm
expected: The About page uses one consistent body-text style throughout and one consistent pull-quote style (light weight, larger size) — no mix of competing body weights/sizes. EN section numbering (01 — Vision, 02 — Heritage, 03 — Quality) is intact.
result: pass
note: "Was an issue: Heritage/Quality used small body style vs Vision's pull-quote. Fixed in about/page.tsx — all sections now use the Vision style; removed section 02 max-w-xl. User re-verified good."

### 10. Contact WhatsApp callout
expected: The Contact page has no input form — instead a WhatsApp callout card. The CTA is enabled (no "not yet configured" note) and opens https://wa.me/905539339440.
result: pass

### 11. PDP stock signals & OOS color
expected: A PDP whose lowest in-stock size is low shows a passive "Limited stock" line near the price (before any size is selected). Out-of-stock text uses neutral white, not red/destructive color.
result: pass

### 12. Brand-voice copy (404, empty-state, ethos)
expected: The 404 page reads "404 / NO DROP HERE" ("That page isn't on the rack. The shop is."); an empty shop category shows the drop-cycle empty-state copy; the Home brand-ethos line reads in ORKI's confident editorial voice ("We don't make clothes. We track what Riyadh sounds like at night.").
result: pass

### 13. RTL parity (Arabic)
expected: Visiting /ar/... for each surface mirrors correctly — PDP thumb strip moves to the inline-start (right edge in AR), Footer benefit borders / ShopDropdown panel / Contact callout all use logical spacing with no physical-direction leaks.
result: pass

### 14. Reduced motion
expected: With OS prefers-reduced-motion ON — ScrollReveal content appears instantly (no entrance animation), PDP thumb/dot clicks scroll instantly (no smooth scroll), and the mobile nav drawer slides without spring.
result: pass

### 15. Navbar hydration integrity (no console errors on load)
expected: Loading any page produces no React hydration mismatch errors in the browser console; the global Navbar (Shop dropdown, account menu, cart, mobile drawer) hydrates cleanly.
result: pass
note: "Was an issue on first load (Base UI useId hydration mismatch). Root cause: react/react-dom pinned to 19.1.0 while Next 15.5.18 renders with vendored React 19.2. Fixed by aligning react/react-dom to ^19.2.0 (resolved 19.2.6). User re-verified clean console after dev restart."

## Summary

total: 15
passed: 15
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Shop sort dropdown: the open-list option labels match the trigger/selected label, and the dropdown opens consistently below the trigger"
  status: resolved
  reason: "User reported: (1) open-list label differs from the post-selection/trigger label; (2) dropdown sometimes opens above instead of below"
  severity: major
  test: 8
  root_cause: "Two causes. (1) Label mismatch: ShopHeader uses <SelectValue/> with no render function and <Select> has no items map, so Base UI renders the raw value key (newest/price-asc/price-desc) on the trigger while SelectItems render translated labels. (2) Opens-above: ui/select.tsx SelectContent defaults alignItemWithTrigger=true (native-style), positioning the popup so the selected item overlays the trigger — shifts the panel upward whenever a non-first item is selected."
  artifacts:
    - path: "src/components/shop/ShopHeader.tsx"
      issue: "<SelectValue/> renders raw value; SelectContent inherits alignItemWithTrigger=true"
    - path: "src/components/ui/select.tsx"
      issue: "SelectContent default alignItemWithTrigger=true causes selected-item-over-trigger positioning"
  missing:
    - "Map selected value -> translated label on the trigger (SelectValue render fn)"
    - "Force the sort popup to open below the trigger (alignItemWithTrigger=false)"
  fix_applied: "ShopHeader.tsx: SelectValue now uses a render fn mapping value->sorts label; SelectContent set alignItemWithTrigger={false} so the sort popup always opens below the trigger. tsc 0 / lint 0. Awaiting user browser re-verify."
  debug_session: ""

- truth: "About page sections share one consistent typographic rhythm — all sections styled like section 1 (Vision)"
  status: resolved
  reason: "User reported: sections are styled differently. Directive: make them all match section 1 (Vision)."
  severity: major
  test: 9
  root_cause: "11-09 intentionally built a two-tier rhythm per D-09: section 01 (Vision) uses the large light pull-quote (font-light text-2xl md:text-4xl tracking-tight text-white leading-tight) while sections 02 (Heritage) and 03 (Quality) use small body (font-normal text-base leading-relaxed text-white/80). User overrides D-09: all sections should use the Vision pull-quote style."
  artifacts:
    - path: "src/app/[locale]/about/page.tsx"
      issue: "Heritage (02) and Quality (03) paragraphs use small body style; section 02 also has max-w-xl that section 01 lacks"
  missing:
    - "Apply Vision's paragraph style to Heritage + Quality; drop section 02 max-w-xl to match section 01"
  fix_applied: "about/page.tsx: Heritage (02) + Quality (03) paragraphs now use Vision's style (font-light text-2xl md:text-4xl tracking-tight text-white leading-tight); removed max-w-xl from section 02 to match section 01. tsc 0 / lint 0. Awaiting user browser re-verify."
  debug_session: ""

- truth: "Loading any page produces no React hydration mismatch errors; the global Navbar hydrates cleanly"
  status: resolved
  reason: "User reported: hydration mismatch on load — server/client `id=\"base-ui-_R_...\"` differ on UserMenu Menu.Trigger and MobileNavDrawer Sheet trigger"
  severity: major
  test: 15
  root_cause: "CONFIRMED: React version skew. Next.js 15.5.18 renders the server tree (RSC+SSR) with its vendored React 19.2.0-canary-0bdb9206-20250818, while the app's client hydrated with react/react-dom pinned at 19.1.0. React 19.2 changed the useId encoding, so the server generated _R_6mr9etb_ (19.2 algorithm) and the client regenerated _R_1ln9etb_ (19.1 algorithm) for an identical tree. Every useId-consuming component (Base UI Menu in UserMenu, Sheet in MobileNavDrawer, etc.) mismatched on its id attribute only — all other attrs matched, proving the tree was structurally identical and the cause was useId determinism, not conditional rendering. CartBadge/useReducedMotionSafe/StoreHydration/SmoothScrollProvider were each read and ruled out (all hydration-stable)."
  artifacts:
    - path: "package.json"
      issue: "react and react-dom exact-pinned to 19.1.0 while Next 15.5.18 vendors React 19.2 → useId server/client skew"
  missing:
    - "Align client react/react-dom to the 19.2 line Next uses internally"
  fix_applied: "package.json react/react-dom 19.1.0 -> ^19.2.0; npm install resolved both to 19.2.6 (single deduped copy). tsc exit 0, lint exit 0 (2 pre-existing warnings). Awaiting user browser re-verify after dev restart."
  debug_session: ""
