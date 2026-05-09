---
phase: 08-cart-checkout-orders
plan: 02
subsystem: cart
tags: [cart, persistence, server-actions, drizzle, cookies, zustand, phase-8, wave-1]
requires:
  - "Phase 8 Plan 01 schema (carts, cart_items, productSizes)"
  - "nanoid@^5.1.11"
  - "Drizzle ORM + live Supabase Postgres"
provides:
  - "getOrCreateCart() — cookie mint + DB cart row resolve (orki_sid, 30-day, httpOnly, lax)"
  - "Cart server data layer (getCart/addItemToCart/updateCartItemQuantity/removeCartItem/clearCartItems)"
  - "Cart Server Actions (addToCartAction/updateQtyAction/removeItemAction/migrateLocalCartAction) with canonical ActionResult envelope"
  - "GET /api/cart route handler — used by client hydration"
  - "Zustand cart store hydrated from DB (no persist middleware); setItems(items) action"
  - "One-shot Phase 3 localStorage→DB cart migration"
  - "exported toProduct mapper + getProductById helper (reusable for cart/order layers)"
affects:
  - "src/store/cartStore.ts (persist middleware removed; setItems added)"
  - "src/store/StoreHydration.tsx (rewritten — fetches /api/cart on mount; runs one-shot migration)"
  - "src/components/cart/CartItem.tsx (optimistic Zustand + Server Action sync inside useTransition)"
  - "src/components/cart/CartDrawer.tsx (no functional change — subtotal still computed from Zustand items per CONTEXT.md)"
  - "src/types/domain.ts (CartItem extended with optional id + sizeId)"
  - "src/lib/products.ts (toProduct exported; getProductById added)"
tech-stack:
  added:
    - "nanoid 5.1.11"
  patterns:
    - "httpOnly+lax+secure-in-prod session cookie (orki_sid, 30-day MaxAge)"
    - "Cookie write only inside Server Action / Route Handler (Next 15 RSC restriction)"
    - "Drizzle UPSERT via onConflictDoUpdate on (cartId, productId, sizeId) unique composite"
    - "Optimistic Zustand mutation + useTransition Server Action sync; refetch on failure to reconcile"
    - "Canonical ActionResult envelope { ok: true, data } | { ok: false, code, messageKey }"
    - "One-shot localStorage→DB migration (idempotent — clears key after first successful merge)"
key-files:
  created:
    - "src/lib/cart/session.ts"
    - "src/lib/cart/server.ts"
    - "src/lib/cart/migrate.ts"
    - "src/app/api/cart/route.ts"
    - "src/app/actions/cart.ts"
    - ".planning/phases/08-cart-checkout-orders/08-02-SUMMARY.md"
  modified:
    - "src/store/cartStore.ts"
    - "src/store/StoreHydration.tsx"
    - "src/components/cart/CartItem.tsx"
    - "src/types/domain.ts"
    - "src/lib/products.ts"
    - "package.json"
    - "package-lock.json"
decisions:
  - "Cookie max-age fixed at 30 days (CONTEXT.md) — RESEARCH.md said 90 but CONTEXT supersedes"
  - "Cookie present + DB row missing → mint new row reusing same sessionId (preserves localStorage migration keying)"
  - "CartItem domain interface extended with optional id + sizeId rather than introducing a parallel HydratedCartItem type — keeps a single shape across the codebase, optional fields only populated post-hydration"
  - "toProduct exported from src/lib/products.ts (rather than duplicating row→domain logic in cart/server.ts) — single source of truth for Product shape"
  - "Action error path always returns code:'UNKNOWN' + messageKey:'Checkout.errors.unknown' (raw errors logged server-side; never serialized to client)"
  - "CartDrawer subtotal continues to use Zustand items (UI display only) — server-authoritative subtotal happens at checkout per CONTEXT.md"
metrics:
  duration: "~30 min"
  tasks_completed: 3
  files_changed: 12
  completed: 2026-05-10
---

# Phase 8 Plan 02: Cart Persistence Summary

**One-liner:** Replaced the Phase 3 Zustand+localStorage cart with a Postgres-backed cart keyed by an `orki_sid` httpOnly cookie. DB is the source of truth; Zustand is the UI mirror; mutations are optimistic + sync to DB via Server Actions; legacy localStorage payload is migrated once on first hydration then dropped.

## What was done

### Task 1 — Cart session, server data layer, /api/cart GET (commit `fd93e90`)

- Installed `nanoid@5.1.11` (top-level — `nanoid@3.x` already exists transitively under postcss; both coexist correctly).
- Created `src/lib/cart/session.ts` exporting `getOrCreateCart(locale?)`. Resolves the `orki_sid` cookie, fetches the matching `carts` row, or mints a fresh `nanoid(32)` session id + carts row when needed. Writes the cookie with `httpOnly: true`, `sameSite: 'lax'`, `secure` in production, `path: '/'`, `maxAge: 60 * 60 * 24 * 30` (30 days, per CONTEXT.md). Cookie name is the literal `orki_sid`. Edge case handled: cookie present but DB row missing — re-mint a row using the same sessionId so the localStorage migration still keys correctly.
- Also exports a read-only `readCartSessionId()` for Server Component callers that must not write cookies.
- Created `src/lib/cart/server.ts` with `getCart`, `addItemToCart`, `updateCartItemQuantity`, `removeCartItem`, `clearCartItems`. All take `cartId` AS-IS — no cookie resolution inside the lib (Server Actions own that). UPSERT uses `onConflictDoUpdate` on the `(cartId, productId, sizeId)` unique composite; quantity is summed via `sql\`${cartItems.quantity} + ${quantity}\``. `qty <= 0` deletes the row in `updateCartItemQuantity`. The `toCart` row→domain mapper joins product+sizes+images and reuses the canonical `toProduct` exported from `src/lib/products.ts` (no duplicated row-mapping logic).
- Created `src/lib/cart/migrate.ts` exporting `migrateLocalStorageCart(cartId, legacyItems[])`. For each legacy item it resolves the `selectedSize` label → `productSizes.id` via a lookup; missing products/sizes are silently skipped. UPSERTs onto the same unique composite, summing quantity on conflict. Returns `{ migrated, skipped }`.
- Created `src/app/api/cart/route.ts` with a `GET` handler — calls `getOrCreateCart()` then `getCart(...)` then returns `{ ok: true, cart }`. Errors are logged with the message and surfaced as `{ ok: false, code: 'UNKNOWN' }` with status 500. Stack/SQL never crosses the wire.
- Refactored `src/lib/products.ts`: exported the previously-private `toProduct` row mapper; added `getProductById(id)` mirroring `getProductBySlug` for downstream cart/order layers that need product-by-id resolution.

### Task 2 — Cart Server Actions (commit `bbefb0e`)

- Created `src/app/actions/cart.ts` with `'use server'` on line 1 and four exported actions:
  - `addToCartAction(productId, sizeId, quantity?)`
  - `updateQtyAction(cartItemId, quantity)`
  - `removeItemAction(cartItemId)`
  - `migrateLocalCartAction(items, locale?)`
- Each action: resolves the cart via `getOrCreateCart()` (mints `orki_sid` on first call — Server Action context is the only place Next 15 allows cookie writes), mutates via the Task-1 helpers, then re-reads the full Cart and returns it inside the canonical envelope. Each calls `revalidatePath('/[locale]/checkout', 'page')` so OrderSummary on `/checkout` sees fresh data.
- Error envelope: every catch path returns `{ ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' }`. The full error is logged server-side via `console.error`. Raw errors / stacks never reach the client.
- `migrateLocalCartAction` is idempotent for an empty input array (just returns the current cart).

### Task 3 — Strip persist, rewire hydration, wire CartItem to Server Actions (commit `2cd70f5`)

- `src/store/cartStore.ts`: dropped imports of `persist` and `createJSONStorage` from `zustand/middleware`. Now uses plain `create<CartState>()(...)`. Added `setItems(items)` for hydration. All other action signatures (`addItem`, `removeItem`, `updateQuantity`, `setDrawerOpen`, `clearCart`, `getTotalCount`) preserved verbatim.
- `src/types/domain.ts`: extended the existing client `CartItem` interface with optional `id?: string` (cart_items.id) and `sizeId?: string` (productSizes.id). Optional rather than required to avoid breaking any code path that constructs items locally before hydration.
- `src/store/StoreHydration.tsx`: rewritten end-to-end. On mount, reads `localStorage['orki-cart']` and parses the Phase-3 Zustand persist payload (`{ state: { items: [{ product, selectedSize, quantity }] } }`). If items exist, calls `migrateLocalCartAction(legacy, locale)`, removes the localStorage key, then seeds Zustand with the merged result. If no localStorage entry (or migration failed), falls back to `fetch('/api/cart', { cache: 'no-store' })` and seeds from there. Locale is read from the `[locale]` URL param via `useParams`. Hydration is cancellation-safe across StrictMode double-mount via a `cancelled` flag.
- `src/components/cart/CartItem.tsx`: every quantity/remove handler now does an optimistic Zustand mutation AND a Server Action call inside `useTransition`. On Server Action failure, the component refetches `/api/cart` and replaces the store via `setItems` to reconcile. Pre-hydration items (no `id`) skip the server sync — their state will be reconciled on next refetch. Existing JSX/CSS preserved verbatim. No directional Tailwind classes introduced (logical CSS only — `-me-1`, etc.).
- `src/components/cart/CartDrawer.tsx`: no changes (per plan — subtotal continues to be computed from Zustand items as a UI display value; server is authoritative at checkout).

## Commits

| Hash      | Type | Message                                                              |
| --------- | ---- | -------------------------------------------------------------------- |
| `fd93e90` | feat | add cart session, server data layer, and GET /api/cart                |
| `bbefb0e` | feat | add cart server actions (add/update/remove/migrate)                   |
| `2cd70f5` | feat | rewire cart store, hydration, and CartItem to DB-backed flow          |

## Acceptance criteria — all PASS

### Task 1
- `npm ls nanoid` → `nanoid@5.1.11` (top-level)
- `grep -c "import 'server-only'"` in cart/{session,server,migrate}.ts → 1 each
- `grep -c "orki_sid" src/lib/cart/session.ts` → 2 (≥1 required)
- `grep -c "httpOnly: true" src/lib/cart/session.ts` → 1
- `grep -c "sameSite: 'lax'" src/lib/cart/session.ts` → 1
- `grep -c "60 \* 60 \* 24 \* 30" src/lib/cart/session.ts` → 1 (30-day, not 90)
- `grep -c "export async function getCart" src/lib/cart/server.ts` → 1
- `grep -c "onConflictDoUpdate" src/lib/cart/server.ts` → 1
- `grep -c "export async function GET" src/app/api/cart/route.ts` → 1
- `npx tsc --noEmit` produced 0 new errors in `src/lib/cart/**` or `src/app/api/cart/**` (pre-existing test-file errors documented in deferred-items.md, out of scope per Rule 3)

### Task 2
- `head -n 1 src/app/actions/cart.ts` → `'use server';`
- All four action exports present (1 each)
- `grep -c "ok: false" src/app/actions/cart.ts` → 10 (≥4 required — one per action's catch + one per action's `!cart` guard + the type union)
- `grep -c "revalidatePath" src/app/actions/cart.ts` → 4 (≥3 required)
- `npx tsc --noEmit` produced 0 errors in `src/app/actions/cart.ts`

### Task 3
- `grep -c "from 'zustand/middleware'" src/store/cartStore.ts` → 0
- `grep -c "persist(" src/store/cartStore.ts` → 0
- `grep -c "setItems:" src/store/cartStore.ts` → 2 (interface + impl, ≥1 required)
- `grep -c "fetch('/api/cart'" src/store/StoreHydration.tsx` → 1 (≥1 required)
- `grep -c "migrateLocalCartAction" src/store/StoreHydration.tsx` → 3 (import + call + comment, ≥1 required)
- `grep -c "localStorage.removeItem('orki-cart')" src/store/StoreHydration.tsx` → 1
- `grep -c "useTransition" src/components/cart/CartItem.tsx` → 2 (import + use, ≥1 required)
- `grep -cE "updateQtyAction|removeItemAction" src/components/cart/CartItem.tsx` → 4 (import + 2 call sites + 2 — actually 4 hits for the import line + 2 calls; ≥2 required)
- Directional Tailwind class scan (`ml-|mr-|pl-|pr-|left-|right-`) on CartItem + CartDrawer → 0 hits ✓
- `npx next build` → exits 0; `/api/cart` route registered as dynamic; build summary shows `/[locale]/checkout` and all other pages still building cleanly.

## Deviations from plan

### Out-of-scope changes pulled into Task 2 commit (logged, not fixed)

- `tests/setup.ts` and `vitest.config.ts` modifications appeared in the working tree between my Task 1 and Task 2 commits — they are work belonging to a parallel Wave-1 plan (08-03 / 08-04 area). When I ran `git add src/app/actions/cart.ts && git commit`, those tracked-and-modified files were carried into the same commit. They are NOT my changes; they refactor the vitest config to use Vitest 4.x `projects` syntax and add a `webcrypto` polyfill in `tests/setup.ts`. They are clean, sensible changes from the parallel plan and do not break the build.
- **Resolution per Rule 3 / scope boundary:** logged here as a deviation. Did NOT revert (the changes are correct and committing twice would just re-introduce them). The parallel plan's executor will see them as already-committed and adjust.
- No CLAUDE.md violations. No Rule 1/2 auto-fixes triggered. No Rule 4 architectural decisions surfaced.

### Pre-existing TypeScript errors in `tests/**` (unchanged, deferred)

- `tests/products.test.ts`, `tests/SizeSelector.test.tsx`, `tests/AddToCartButton.test.tsx`, `tests/cartStore.test.ts`, etc. show pre-existing TS errors (Size type missing id/stock; Promise array methods). These are NOT introduced by this plan — they exist on `main` and are already documented in `.planning/phases/08-cart-checkout-orders/deferred-items.md` (entries from Plans 08-03 and 08-04). No new errors were introduced by Plan 08-02.
- `tests/cartStore.test.ts` constructs old-shape `Size` objects (missing `id`+`stock`) — this is pre-existing test debt that pre-dates this plan. The plan did NOT touch this file. It will need a refresh in the upcoming test-infra plan referenced in `deferred-items.md`.

## Authentication gates

None encountered.

## Verification (manual UAT — to be run by user)

- After `npm run dev`, visit `/en/shop/tops/<slug>`, add a product to the cart. The browser receives `Set-Cookie: orki_sid=...; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000`.
- Refresh the page → cart drawer still shows the item (DB-backed).
- Open the same site in another tab (same browser, same cookie) → same cart.
- Manually clear `localStorage` → cart still survives (DB has the row).
- DELETE the cookie via DevTools → next mutation mints a fresh `orki_sid` and a fresh `carts` row.
- DB inspection (Drizzle Studio): `carts` has rows; `cart_items` rows reference `carts.id` + `products.id` + `productSizes.id`.

## Known stubs

None. Phase 8 Plan 02 is wiring + persistence — no UI rendering stubs introduced. CartDrawer continues to render the same shape it did pre-plan.

## Threat flags

None. The new surface is:

- One new Route Handler (`GET /api/cart`) — read-only, returns the caller's own cart only (keyed off the caller's own `orki_sid` cookie, no enumeration of other carts possible).
- Four new Server Actions — all operate on the caller's own cart resolved from the same cookie. No userId trust until Phase 10 auth lands; carts are anonymous-by-design this phase, matching CONTEXT.md and ADR-002.

The cookie is `httpOnly` (no JS read), `sameSite=Lax` (no cross-site CSRF on top-level navigations), `secure` in production (HTTPS only). All Server Action boundaries return the canonical error envelope; no raw SQL/stack ever crosses the wire.

## TDD Gate Compliance

Plan declared `type: execute` (not `type: tdd`); per-task TDD was disabled (`tdd="false"`). Gate compliance N/A.

## Self-Check: PASSED

- `src/lib/cart/session.ts` → FOUND
- `src/lib/cart/server.ts` → FOUND
- `src/lib/cart/migrate.ts` → FOUND
- `src/app/api/cart/route.ts` → FOUND
- `src/app/actions/cart.ts` → FOUND
- `src/store/cartStore.ts` → FOUND (modified — `persist` removed)
- `src/store/StoreHydration.tsx` → FOUND (modified — DB hydration)
- `src/components/cart/CartItem.tsx` → FOUND (modified — Server Action sync)
- `src/types/domain.ts` → FOUND (modified — CartItem extended)
- `src/lib/products.ts` → FOUND (modified — toProduct exported, getProductById added)
- Commit `fd93e90` → FOUND
- Commit `bbefb0e` → FOUND
- Commit `2cd70f5` → FOUND
- `npx next build` → exits 0; `/api/cart` route registered.
