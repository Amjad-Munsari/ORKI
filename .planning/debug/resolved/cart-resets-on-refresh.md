---
slug: cart-resets-on-refresh
status: resolved
trigger: "Cart resets on full-page refresh in EN at /en/shop. Likely Plan 08-02 cookie-backed hydration regression. See .planning/phases/08-cart-checkout-orders/08-UAT.md Test 1 + Gaps section."
created: 2026-05-10
updated: 2026-05-10
resolved: 2026-05-10
phase: 08-cart-checkout-orders
related_plan: 08-02-cart-persistence
related_uat_test: 1
severity: major
specialist_hint: react
---

# Debug Session: cart-resets-on-refresh

## Symptoms

- **Expected behavior:** Adding a product+size to the cart in EN at `/en/shop`, then performing a full-page refresh, should leave the cart drawer populated with the same items (cart persists across refresh per UX-08; Plan 08-02 cookie-backed cart hydration).
- **Actual behavior:** After a full-page refresh, the cart is empty — items added pre-refresh are gone.
- **Locale / route:** Reproduced in EN at `/en/shop` (AR not yet tested per UAT Test 2 pending).
- **Error messages:** None reported; cart silently empties.
- **Timeline:** Surfaced during Phase 08 UAT (2026-05-10) Test 1 (EN happy path). Plan 08-02 (cart-persistence, cookie-backed hydration) is the prime suspect — regression likely introduced or never landed correctly there.
- **Reproduction:**
  1. Open `/en/shop` in a fresh session.
  2. Add a product (with size) to cart; confirm drawer shows the item.
  3. Hard refresh the browser (Cmd/Ctrl+R or full reload).
  4. Open the cart drawer → expected: item present; actual: empty.

## References

- `.planning/phases/08-cart-checkout-orders/08-UAT.md` — Test 1 (result: issue, severity: major), Gaps entry tagged `Plan 08-02`.
- `.planning/phases/08-cart-checkout-orders/08-02-cart-persistence-PLAN.md`
- `.planning/phases/08-cart-checkout-orders/08-02-SUMMARY.md`

## Current Focus

- hypothesis: AddToCartButton never invokes the addToCartAction Server Action — items live only in Zustand and are never persisted to Postgres. On refresh, /api/cart returns an empty cart and Zustand is replaced with [].
- test: Grep for `addToCartAction` call sites across `src/` and inspect `AddToCartButton.tsx`.
- expecting: 0 call sites of `addToCartAction` outside its own definition file (CONFIRMED).
- next_action: apply fix — wire AddToCartButton to call addToCartAction via useTransition (mirroring CartItem.tsx pattern from Plan 08-02 Task 3).

## Evidence

- timestamp: 2026-05-10
  observation: src/store/cartStore.ts has no `persist` middleware import. setItems action present.
  source: src/store/cartStore.ts (full file read).
  conclusion: Hypothesis 1a (Zustand persist overwrites on rehydrate) ELIMINATED.

- timestamp: 2026-05-10
  observation: <StoreHydration /> is mounted in src/app/[locale]/layout.tsx line 53, above <main>{children}</main>. It runs in both /en and /ar layout trees (single locale-routed layout).
  source: src/app/[locale]/layout.tsx lines 10, 53.
  conclusion: Hypothesis 1b (StoreHydration not mounted) ELIMINATED.

- timestamp: 2026-05-10
  observation: src/store/StoreHydration.tsx fetches `/api/cart` with `cache: 'no-store'` and calls `useCartStore.getState().setItems(toClientItems(json.cart.items ?? []))`.
  source: src/store/StoreHydration.tsx lines 82-92.
  conclusion: Hydration path looks correct on its own — IF the DB has items, they will load.

- timestamp: 2026-05-10
  observation: src/app/api/cart/route.ts GET handler delegates to getOrCreateCart() then getCart(). Cookie write happens in getOrCreateCart via `jar.set('orki_sid', ...)`. Next 15 allows cookie writes from Route Handlers.
  source: src/app/api/cart/route.ts lines 12-24.
  conclusion: Hypothesis 2 (cookie write throws inside GET handler) NOT triggered — Next 15 permits this.

- timestamp: 2026-05-10
  observation: ROOT CAUSE — `grep -rn addToCartAction src/` returns ONLY the action definition itself (src/app/actions/cart.ts:39, line 52 in console.error). Zero call sites elsewhere. Conversely, the only `addItem` invocation in app code is src/components/pdp/AddToCartButton.tsx:25 which calls `addItem(product, selectedSize)` on the Zustand store and nothing else. There is NO Server Action call, NO useTransition, NO DB write on the add path.
  source: grep results + src/components/pdp/AddToCartButton.tsx full file.
  conclusion: Hypothesis 3 CONFIRMED. The add-to-cart click never reaches the DB. Items live only in Zustand memory. On refresh, /api/cart returns an empty cart (cart row exists for the cookie, but cart_items has 0 rows for it), StoreHydration calls setItems([]), and the user sees an empty drawer. Plan 08-02 Task 3 explicitly listed CartItem.tsx + CartDrawer.tsx as the components to wire to Server Actions and OMITTED AddToCartButton.tsx — this is the regression-introduced gap.

## Eliminated

- Zustand persist middleware regression (no persist present)
- StoreHydration not mounted (mounted in [locale]/layout.tsx for both en and ar)
- Cookie write fails inside GET /api/cart (Next 15 allows it; no error reported)
- Locale partition (single layout, single store, locale only changes the params)

## Resolution

- root_cause: "src/components/pdp/AddToCartButton.tsx never calls the addToCartAction Server Action. The Add-to-Cart click only mutates Zustand in-memory; nothing is written to Postgres. On refresh, /api/cart correctly returns the empty cart row from DB and StoreHydration replaces Zustand with []. Plan 08-02 Task 3 wired CartItem.tsx (drawer quantity/remove) to Server Actions but missed the PDP add path. The Server Action `addToCartAction` is defined but had zero call sites in src/."
- fix: "Wired src/components/pdp/AddToCartButton.tsx to call addToCartAction(product.id, sizeId, 1) inside useTransition, mirroring the optimistic-Zustand + Server-Action pattern from src/components/cart/CartItem.tsx. sizeId is resolved via product.sizes.find(s => s.label === selectedSize)?.id. On success, the returned Cart snapshot replaces Zustand state via setItems (giving items their real id/sizeId for subsequent server actions). On failure, refetch /api/cart and reconcile via setItems."
- verification: "Typecheck passes for the changed file and its dependency graph (npx tsc --noEmit; remaining errors are pre-existing in tests/, vitest.config.ts, and checkout/page.tsx — all unrelated). Manual UAT (Phase 08 UAT Test 1) pending re-run: add item at /en/shop, refresh, drawer must still show item; DB cart_items must have a row keyed to the orki_sid cookie."
- files_changed: ["src/components/pdp/AddToCartButton.tsx"]

## Specialist Review

(pending dispatch — react/Next.js App Router specialist should confirm the optimistic+Server-Action pattern matches CartItem.tsx exactly, and that useTransition is the right primitive vs. useOptimistic for this UI.)
