---
plan: 02-06
title: PDP Components
status: complete
commit_task1: 6b37098
commit_task2: d00d136
---

## What was built

**Task 1 — Server Components (6b37098):**
- `src/components/pdp/PDPGallery.tsx` — 3 stacked PlaceholderImage at 4:5 aspect, first slot `priority={true}`, bilingual alt text
- `src/components/pdp/PDPLayout.tsx` — `md:grid-cols-[55%_45%]` desktop two-column grid; right column `sticky top-16 self-start` (self-start required for sticky to work in grid)
- `src/components/pdp/RelatedProducts.tsx` — calls `getRelatedProducts(id, category, 4)`, renders `ProductGrid`, returns null when empty

**Task 2 — Client Components (d00d136):**
- `src/components/pdp/SizeSelector.tsx` — OOS buttons: `aria-disabled="true"` + `tabIndex={-1}` + diagonal strikethrough via `before:bg-[linear-gradient(to_bottom_right,...)]` CSS arbitrary variant; selected state: `bg-white text-black`; `SizeGuideModal` rendered in label row
- `src/components/pdp/SizeGuideModal.tsx` — base-ui `Dialog` with `DialogTrigger render={<button>}`, `DialogContent showCloseButton={false}`, `DialogClose render={<button>}`; 5×5 measurements table (XS–XL, chest/waist/hip/length in cm); Saudi streetwear unisex sizing
- `src/components/pdp/AddToCartButton.tsx` — `AnimatePresence mode="wait" initial={false}`; `useReducedMotion()` skips opacity transition under prefers-reduced-motion; `useCartStore(s => s.addItem)`; `animationPresets.successState` (0.15s ease); 1500ms setTimeout reset per D-11; import from `motion/react`

## Verification
- `npx tsc --noEmit` — passed (0 errors)
- Contract tests in `tests/SizeSelector.test.tsx` and `tests/AddToCartButton.test.tsx` will activate in Wave 6 full test run
