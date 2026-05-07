---
phase: 2
slug: core-shopping
status: planning-complete
nyquist_compliant: true
wave_0_complete: true
created: 2026-05-07
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest + @testing-library/react (Wave 0 installs) |
| **Config file** | `vitest.config.ts` — Wave 0 creates |
| **Quick run command** | `npx vitest run --reporter=dot` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=dot`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** ~10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 2-setup-01 | W0 | 0 | SHOP-01 | — | N/A | unit | `npx vitest run tests/products.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-setup-02 | W0 | 0 | SHOP-02 | — | N/A | unit | `npx vitest run tests/products.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-setup-03 | W0 | 0 | SHOP-04 | — | N/A | unit | `npx vitest run tests/products.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-setup-04 | W0 | 0 | PDP-08 | — | N/A | unit | `npx vitest run tests/products.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-setup-05 | W0 | 0 | PDP-03 | — | N/A | unit | `npx vitest run tests/formatPrice.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-setup-06 | W0 | 0 | SHOP-03 | — | N/A | unit | `npx vitest run tests/ProductCard.test.tsx -x` | ❌ W0 | ⬜ pending |
| 2-setup-07 | W0 | 0 | PDP-04 | — | aria-disabled="true" on OOS sizes | unit | `npx vitest run tests/SizeSelector.test.tsx -x` | ❌ W0 | ⬜ pending |
| 2-setup-08 | W0 | 0 | PDP-05 | — | N/A | unit | `npx vitest run tests/AddToCartButton.test.tsx -x` | ❌ W0 | ⬜ pending |
| 2-setup-09 | W0 | 0 | — (D-10) | — | CartStore initializes with empty items | unit | `npx vitest run tests/cartStore.test.ts -x` | ❌ W0 | ⬜ pending |
| 2-impl-01 | Shop | 1 | SHOP-01,SHOP-03 | — | N/A | unit | `npx vitest run` | ✅ by W0 | ⬜ pending |
| 2-impl-02 | Shop | 1 | SHOP-02,SHOP-04 | — | N/A | unit | `npx vitest run` | ✅ by W0 | ⬜ pending |
| 2-impl-03 | PDP | 2 | PDP-03,PDP-04 | — | OOS aria-disabled | unit | `npx vitest run` | ✅ by W0 | ⬜ pending |
| 2-impl-04 | PDP | 2 | PDP-05 | — | N/A | unit | `npx vitest run` | ✅ by W0 | ⬜ pending |
| 2-impl-05 | PDP | 2 | PDP-08 | — | N/A | unit | `npx vitest run` | ✅ by W0 | ⬜ pending |
| 2-impl-06 | Cart | 2 | D-10,D-12 | — | Cart state starts empty on SSR | unit | `npx vitest run tests/cartStore.test.ts -x` | ✅ by W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `npm install -D vitest @testing-library/react @testing-library/user-event @vitejs/plugin-react jsdom` — test framework install
- [ ] `vitest.config.ts` — shared vitest config with jsdom environment
- [ ] `tests/setup.ts` — @testing-library/react global setup
- [ ] `tests/products.test.ts` — stubs covering SHOP-01, SHOP-02, SHOP-04, PDP-08 (`getAllProducts`, `getProductsByCategory`, `getRelatedProducts`, filter/sort logic)
- [ ] `tests/formatPrice.test.ts` — SAR price formatter unit test (PDP-03, `'ar-SA-u-nu-latn'` Western numerals)
- [ ] `tests/ProductCard.test.tsx` — renders name + price without crashing (SHOP-03)
- [ ] `tests/SizeSelector.test.tsx` — OOS size buttons have `aria-disabled="true"` and `tabIndex={-1}` (PDP-04)
- [ ] `tests/AddToCartButton.test.tsx` — disabled until size selected; calls `addItem` on click (PDP-05)
- [ ] `tests/cartStore.test.ts` — `addItem` updates items array; quantity increments on duplicate (D-10, partial CART-03)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| PDP image gallery renders 3 stacked 4:5 PlaceholderImage slots | PDP-01 | Visual layout — no DOM assertion covers aspect-ratio CSS | Navigate to any PDP; confirm 3 dark-field images stacked on left (desktop) / above info (mobile) |
| Product name and description switch on locale change | PDP-02 | i18n text content — requires browser locale switching | Toggle `/en/` ↔ `/ar/` URL prefix; confirm name and description update |
| Size guide modal opens and shows measurements table | PDP-06 | Modal interaction + table content — no unit test covers modal open flow | Click "Size Guide" on PDP; confirm modal opens with XS–XL measurements |
| Return policy snippet appears below Add to Cart | PDP-07 | Static copy placement — visual inspection | Inspect PDP below CTA button; confirm bilingual policy copy visible |
| All three stock state badges visually distinct | PDP-09 | Visual design — CSS treatment (colors, opacity, strikethrough) | View in-stock PDP (no badge), partial OOS PDP (inline text), fully OOS PDP (destructive text) and card (pill badge) |
| JSON-LD Product schema present in page source | PDP-10 | Structured data in `<head>` — not in React tree | View source on any PDP URL; confirm `<script type="application/ld+json">` contains Product schema |
| Product card image zooms + name underlines on hover (ANIM-03) | ANIM-03 | CSS group-hover animation — not unit-testable | Hover product card; confirm image scale + underline fire simultaneously; reduced-motion: confirm no transform |
| Shop page filter and sort update grid without page reload | SHOP-04 | URL param + SSR rerender — e2e behavior | Click "Tops" tab on /shop; confirm URL shows `?category=tops`, grid updates, back button works |
| Cart badge live count updates on add to cart | D-12 | Zustand → React re-render chain — cross-component | Add item from PDP; confirm cart icon badge increments immediately |
| RTL layout on all Phase 2 pages | FOUND-02 | Full RTL check — CSS logical properties throughout | Switch to `/ar/`; confirm shop grid, PDP layout, Navbar dropdown all flip to RTL |
| CategoryDropdown hover opens, keyboard Escape closes | D-01 | Hover-intent interaction — not unit-testable | Desktop: hover "Categories" in nav; confirm dropdown opens; press Escape; confirm closes |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
