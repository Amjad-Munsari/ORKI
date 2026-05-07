---
plan: 02-03
phase: 02-core-shopping
status: complete
wave: 2
tasks_completed: 2
tasks_total: 2
self_check: PASSED
---

# Plan 02-03 Summary — CartStore, StoreHydration, Layout Wiring

## What Was Built

**CartStore** (`src/store/cartStore.ts`): Zustand v5 cart store using `create<CartState>()()` curried form with `persist` middleware. `skipHydration: true` prevents SSR hydration mismatch on Next.js App Router. Store key `orki-cart` in localStorage. Implements `addItem` (increments quantity on duplicate product+size, creates new item otherwise), `removeItem`, `clearCart`, `getTotalCount`.

**StoreHydration** (`src/store/StoreHydration.tsx`): `'use client'` component that calls `useCartStore.persist.rehydrate()` inside `useEffect` with empty dependency array. Renders null — exists solely to trigger client-side rehydration after mount. Placed inside `NextIntlClientProvider` in layout so it runs before any consumer component renders.

**Layout wiring** (`src/app/[locale]/layout.tsx`): Added `import { StoreHydration }` and rendered `<StoreHydration />` as first child inside `<NextIntlClientProvider>`.

**shadcn Dialog** (`src/components/ui/dialog.tsx`): Installed via `npx shadcn add dialog`. Required by `SizeGuideModal` in Wave 4 (02-06).

**Zustand** (`package.json`): Installed `zustand@^5.0.13` as a runtime dependency.

## Key Files

- `src/store/cartStore.ts` — Zustand cart store
- `src/store/StoreHydration.tsx` — SSR-safe hydration trigger
- `src/app/[locale]/layout.tsx` — wired (2 occurrences of StoreHydration)
- `src/components/ui/dialog.tsx` — shadcn Dialog primitive

## Commits

- `3de7b66` — feat(02-03): CartStore with Zustand persist + skipHydration, StoreHydration, shadcn dialog
- `d61b3c2` — feat(02-03): wire StoreHydration into root layout inside NextIntlClientProvider

## Acceptance Criteria

- [x] `skipHydration: true` in cartStore.ts (count: 1)
- [x] `orki-cart` storage key in cartStore.ts (count: 1)
- [x] `persist.rehydrate` in StoreHydration.tsx (count: 1)
- [x] `StoreHydration` in layout.tsx (count: 2 — import + usage)
- [x] `src/components/ui/dialog.tsx` exists
- [x] TypeScript: no errors in store files

## Deviations

None. Plan executed exactly as specified.

## Self-Check: PASSED
