---
phase: 08-cart-checkout-orders
plan: 02
type: execute
wave: 1
depends_on: [08-01]
files_modified:
  - src/lib/cart/session.ts
  - src/lib/cart/server.ts
  - src/lib/cart/migrate.ts
  - src/app/actions/cart.ts
  - src/app/api/cart/route.ts
  - src/store/cartStore.ts
  - src/store/StoreHydration.tsx
  - src/components/cart/CartItem.tsx
  - src/components/cart/CartDrawer.tsx
  - package.json
  - package-lock.json
autonomous: true
requirements: [UX-08]
must_haves:
  truths:
    - "First cart mutation mints httpOnly cookie 'orki_sid' (SameSite=Lax, Path=/, 30-day expiry)"
    - "Cart items persist in Postgres carts/cart_items tables across browser refresh"
    - "Add/update/remove from cart syncs to DB via Server Actions"
    - "On client mount, Zustand hydrates from /api/cart GET (single source of truth = DB)"
    - "If localStorage['orki-cart'] exists with items at hydration, those items are migrated to DB once then localStorage is cleared"
    - "Cart preserved on payment failure (failure path of Plan 08-05 does NOT clear cartItems)"
  artifacts:
    - path: "src/lib/cart/session.ts"
      provides: "getOrCreateCart() — cookie mint + DB cart row resolve"
      contains: "orki_sid"
    - path: "src/lib/cart/server.ts"
      provides: "getCart, addItem, updateQuantity, removeItem, clearCart (server-only DB ops)"
    - path: "src/app/actions/cart.ts"
      provides: "addToCartAction, updateQtyAction, removeItemAction, migrateLocalCartAction Server Actions"
      contains: "'use server'"
    - path: "src/app/api/cart/route.ts"
      provides: "GET handler returning the active cart for the orki_sid cookie holder"
    - path: "src/store/cartStore.ts"
      provides: "Zustand store WITHOUT persist middleware, with setItems(items) hydrate action"
  key_links:
    - from: "src/components/cart/CartItem.tsx"
      to: "src/app/actions/cart.ts"
      via: "useTransition + Server Action call alongside Zustand optimistic mutation"
      pattern: "startTransition.*updateQtyAction|removeItemAction"
    - from: "src/store/StoreHydration.tsx"
      to: "/api/cart"
      via: "fetch on mount → setItems"
      pattern: "fetch\\(['\"]\\/api\\/cart"
    - from: "src/app/actions/cart.ts"
      to: "src/lib/cart/session.ts"
      via: "getOrCreateCart() per action"
      pattern: "getOrCreateCart\\("
---

<objective>
Replace the Phase 3 localStorage-only cart with a Postgres-backed cart keyed by an httpOnly cookie. Zustand stays as UI source of truth but mutations sync to the DB via Server Actions; on mount, the store rehydrates from the server. localStorage cart from Phase 3 is migrated once and dropped.

Purpose: UX-08 requires the cart to survive payment failure / refresh / device switch (within the cookie session). Auth deferred to Phase 10 — userId stays nullable.

Output: Functional cart that reads from and writes to Postgres, transparently to existing components.
</objective>

<execution_context>
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/workflows/execute-plan.md
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-cart-checkout-orders/08-CONTEXT.md
@.planning/phases/08-cart-checkout-orders/08-RESEARCH.md
@.planning/phases/08-cart-checkout-orders/08-PATTERNS.md
@CLAUDE.md
@src/lib/db/schema.ts
@src/lib/products.ts
@src/lib/db/client.ts
@src/app/actions/admin.ts
@src/store/cartStore.ts
@src/store/StoreHydration.tsx
@src/components/cart/CartItem.tsx
@src/components/cart/CartDrawer.tsx

<interfaces>
After Plan 08-01, the following are exported from `@/lib/db/schema`:
```typescript
export const carts: PgTable<...>
export const cartItems: PgTable<...>
export const cartsRelations, cartItemsRelations
export type CartRow, NewCartRow, CartItemRow, NewCartItemRow
```
And from `@/types/domain`:
```typescript
export interface Cart { id, sessionId, userId, locale, items, updatedAt }
export interface ServerCartItem { id, productId, sizeId, sizeLabel, quantity, product }
```

Server Action analog (`src/app/actions/admin.ts`):
```typescript
'use server';
import { revalidatePath } from 'next/cache';
export async function toggleProductStock(productId: string, inStock: boolean) {
  await db.update(products).set({ inStock, updatedAt: new Date() }).where(eq(products.id, productId));
  revalidatePath('/[locale]/admin/inventory', 'page');
}
```

Existing Zustand store (`src/store/cartStore.ts`) public action surface (must stay):
```typescript
addItem(product, selectedSize), removeItem(productId, selectedSize),
updateQuantity(productId, selectedSize, delta), setDrawerOpen(isOpen),
clearCart(), getTotalCount()
```
ADD: `setItems(items)` for hydration.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Install nanoid + create src/lib/cart/{session,server,migrate}.ts and /api/cart GET handler</name>
  <files>package.json, package-lock.json, src/lib/cart/session.ts, src/lib/cart/server.ts, src/lib/cart/migrate.ts, src/app/api/cart/route.ts</files>
  <read_first>
    - src/lib/db/client.ts (singleton + 'server-only' pattern lines 10-33)
    - src/lib/products.ts (full file — data-access layer pattern, toProduct mapper lines 33-63)
    - src/app/api/seed/route.ts (try/catch envelope for route handlers)
    - src/app/api/checkout/mock/route.ts (existing route handler shape)
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 396-444 (cart session pattern)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md lines 193-265 (cart/session.ts and cart/server.ts mappings)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Persistence model" + "Cart merge on auth" sections
  </read_first>
  <behavior>
    - `nanoid@5.x` is installed (latest minor; if 5.1.11 specifically pinned in research, use that)
    - `src/lib/cart/session.ts` exports `getOrCreateCart(): Promise<{ id: string; sessionId: string; locale: 'en'|'ar' }>`. If cookie missing OR cookie present but DB row missing, mints new sessionId via `nanoid(32)`, inserts a carts row, sets cookie with httpOnly/SameSite=Lax/Path=/ /Max-Age=2592000/Secure-in-prod. Cookie name MUST be exactly `orki_sid`.
    - `src/lib/cart/server.ts` exports: `getCart(cartId: string): Promise<Cart>`, `addItemToCart(cartId, productId, sizeId, qty)`, `updateCartItemQuantity(cartId, cartItemId, qty)` (qty<=0 deletes), `removeCartItem(cartId, cartItemId)`, `clearCartItems(cartId)`. All take cartId AS-IS (don't re-resolve cookie inside lib — Server Actions do that). Includes a `toCart` mapper that joins with products+sizes+images (mirrors `toProduct` shape from products.ts).
    - `src/lib/cart/migrate.ts` exports `migrateLocalStorageCart(cartId: string, items: Array<{productId, selectedSize, quantity}>): Promise<void>`. Resolves each `selectedSize` (label) to a sizeId via productSizes lookup. Skips items whose product or size no longer exists. Inserts via `cartItems` UPSERT (ON CONFLICT on the unique composite — sum quantity).
    - `src/app/api/cart/route.ts` exports `GET` only. Calls `getOrCreateCart()` → `getCart(cart.id)` → `NextResponse.json({ ok: true, cart })`. Catches errors, returns `{ ok: false, code: 'UNKNOWN' }` with 500.
  </behavior>
  <action>
    Install nanoid:

    ```bash
    npm install nanoid@^5.1.11
    ```

    Create `src/lib/cart/session.ts`:

    ```typescript
    import 'server-only';
    import { cookies } from 'next/headers';
    import { nanoid } from 'nanoid';
    import { eq } from 'drizzle-orm';
    import { db } from '@/lib/db/client';
    import { carts } from '@/lib/db/schema';
    import type { Locale } from '@/types/domain';

    const COOKIE_NAME = 'orki_sid';
    const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days per CONTEXT.md decision

    export async function getOrCreateCart(
      locale: Locale = 'en'
    ): Promise<{ id: string; sessionId: string; locale: Locale }> {
      const jar = await cookies(); // Next 15 async API
      let sessionId = jar.get(COOKIE_NAME)?.value;

      if (sessionId) {
        const existing = await db.query.carts.findFirst({
          where: eq(carts.sessionId, sessionId),
        });
        if (existing) {
          return {
            id: existing.id,
            sessionId,
            locale: (existing.locale as Locale) ?? locale,
          };
        }
        // Cookie present but row missing (DB reset). Fall through to mint a new one
        // BUT keep the same sessionId so localStorage migration still keys correctly.
      } else {
        sessionId = nanoid(32);
      }

      const [cart] = await db
        .insert(carts)
        .values({ sessionId, locale })
        .returning();

      jar.set(COOKIE_NAME, sessionId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: COOKIE_MAX_AGE,
      });

      return { id: cart.id, sessionId, locale };
    }

    export async function readCartSessionId(): Promise<string | null> {
      const jar = await cookies();
      return jar.get(COOKIE_NAME)?.value ?? null;
    }
    ```

    Create `src/lib/cart/server.ts`. Mirror `src/lib/products.ts` mapper conventions. Public surface:

    ```typescript
    import 'server-only';
    import { db } from '@/lib/db/client';
    import { cartItems, carts, productSizes } from '@/lib/db/schema';
    import { and, eq, sql } from 'drizzle-orm';
    import type { Cart, ServerCartItem, Locale } from '@/types/domain';
    import { getProductBySlug, /* or product-by-id helper */ } from '@/lib/products';
    // Implement as needed: get product by id (joined). If src/lib/products.ts has no getById,
    // ADD getProductById(id) there in this task — keep it simple, mirror getProductBySlug.

    export async function getCart(cartId: string): Promise<Cart | null> {
      const cart = await db.query.carts.findFirst({
        where: eq(carts.id, cartId),
        with: {
          items: {
            with: {
              product: { with: { sizes: true, images: true } },
              size: true,
            },
          },
        },
      });
      if (!cart) return null;
      return toCart(cart);
    }

    export async function addItemToCart(
      cartId: string, productId: string, sizeId: string, quantity: number
    ): Promise<void> {
      // UPSERT on (cartId, productId, sizeId) unique composite
      await db
        .insert(cartItems)
        .values({ cartId, productId, sizeId, quantity })
        .onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.productId, cartItems.sizeId],
          set: { quantity: sql`${cartItems.quantity} + ${quantity}` },
        });
      await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
    }

    export async function updateCartItemQuantity(
      cartId: string, cartItemId: string, quantity: number
    ): Promise<void> {
      if (quantity <= 0) {
        await db.delete(cartItems)
          .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));
      } else {
        await db.update(cartItems)
          .set({ quantity })
          .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));
      }
      await db.update(carts).set({ updatedAt: new Date() }).where(eq(carts.id, cartId));
    }

    export async function removeCartItem(cartId: string, cartItemId: string): Promise<void> {
      await db.delete(cartItems)
        .where(and(eq(cartItems.id, cartItemId), eq(cartItems.cartId, cartId)));
    }

    export async function clearCartItems(cartId: string): Promise<void> {
      await db.delete(cartItems).where(eq(cartItems.cartId, cartId));
    }

    function toCart(row: any): Cart {
      // Use the same domain-mapping discipline as src/lib/products.ts toProduct.
      // Convert nested product+sizes+images to the Product domain shape.
      // ServerCartItem.product MUST be the full Product type (already used by storefront).
      return {
        id: row.id,
        sessionId: row.sessionId,
        userId: row.userId,
        locale: row.locale,
        items: (row.items ?? []).map((it: any): ServerCartItem => ({
          id: it.id,
          productId: it.productId,
          sizeId: it.sizeId,
          sizeLabel: it.size?.label ?? '',
          quantity: it.quantity,
          product: mapProductRow(it.product), // helper below or imported from products.ts
        })),
        updatedAt: row.updatedAt,
      };
    }

    // mapProductRow: copy from src/lib/products.ts toProduct or re-export it.
    ```

    For `mapProductRow`: the existing `src/lib/products.ts` defines `toProduct` privately. EXPORT it from products.ts (rename if needed) so `cart/server.ts` can reuse it — DO NOT duplicate the row→domain mapping logic.

    Create `src/lib/cart/migrate.ts`:

    ```typescript
    import 'server-only';
    import { db } from '@/lib/db/client';
    import { cartItems, productSizes } from '@/lib/db/schema';
    import { and, eq, sql } from 'drizzle-orm';

    export interface LegacyCartItem {
      productId: string;
      selectedSize: string; // size label, e.g. 'M'
      quantity: number;
    }

    export async function migrateLocalStorageCart(
      cartId: string,
      legacy: LegacyCartItem[]
    ): Promise<{ migrated: number; skipped: number }> {
      let migrated = 0, skipped = 0;
      for (const li of legacy) {
        const size = await db.query.productSizes.findFirst({
          where: and(
            eq(productSizes.productId, li.productId),
            eq(productSizes.label, li.selectedSize),
          ),
        });
        if (!size) { skipped++; continue; }
        await db.insert(cartItems).values({
          cartId, productId: li.productId, sizeId: size.id, quantity: li.quantity,
        }).onConflictDoUpdate({
          target: [cartItems.cartId, cartItems.productId, cartItems.sizeId],
          set: { quantity: sql`${cartItems.quantity} + ${li.quantity}` },
        });
        migrated++;
      }
      return { migrated, skipped };
    }
    ```

    Create `src/app/api/cart/route.ts`:

    ```typescript
    import { NextResponse } from 'next/server';
    import { getOrCreateCart } from '@/lib/cart/session';
    import { getCart } from '@/lib/cart/server';

    export async function GET() {
      try {
        const session = await getOrCreateCart();
        const cart = await getCart(session.id);
        return NextResponse.json({ ok: true, cart });
      } catch (err) {
        const e = err as { message?: string };
        console.error('[/api/cart GET]', e?.message);
        return NextResponse.json(
          { ok: false, code: 'UNKNOWN' },
          { status: 500 }
        );
      }
    }
    ```

    If `src/lib/products.ts` does not yet export a `getProductById`, add one mirroring `getProductBySlug` (lines 86-99) and EXPORT `toProduct`. cart/server.ts must NOT re-implement the row mapper.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&amp;1 | grep -E "cart/(session|server|migrate)\.ts|api/cart" | grep -i error; test $? -ne 0</automated>
  </verify>
  <acceptance_criteria>
    - `npm ls nanoid` shows nanoid version 5.x
    - `grep -c "import 'server-only'" src/lib/cart/session.ts` outputs 1
    - `grep -c "import 'server-only'" src/lib/cart/server.ts` outputs 1
    - `grep -c "import 'server-only'" src/lib/cart/migrate.ts` outputs 1
    - `grep -c "orki_sid" src/lib/cart/session.ts` outputs at least 1
    - `grep -c "httpOnly: true" src/lib/cart/session.ts` outputs 1
    - `grep -c "sameSite: 'lax'" src/lib/cart/session.ts` outputs 1
    - `grep -c "60 \* 60 \* 24 \* 30" src/lib/cart/session.ts` outputs 1 (30-day max-age per CONTEXT.md, NOT 90)
    - `grep -c "export async function getCart" src/lib/cart/server.ts` outputs 1
    - `grep -c "onConflictDoUpdate" src/lib/cart/server.ts` outputs at least 1
    - `grep -c "export async function GET" src/app/api/cart/route.ts` outputs 1
    - `npx tsc --noEmit` exits 0 with no errors in `src/lib/cart/**` or `src/app/api/cart/**`
  </acceptance_criteria>
  <done>Cart session + DB layer + GET handler exist, type-check, and use the canonical 'server-only' + Drizzle conventions.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Create src/app/actions/cart.ts Server Actions (add/update/remove/migrate)</name>
  <files>src/app/actions/cart.ts</files>
  <read_first>
    - src/app/actions/admin.ts (entire file — Server Action conventions)
    - src/lib/cart/session.ts (just-created)
    - src/lib/cart/server.ts (just-created)
    - src/lib/cart/migrate.ts (just-created)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "Server Action 'use server' + revalidatePath" section + ActionResult envelope (lines 824-833)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Error UX (UX-06)" section
  </read_first>
  <behavior>
    - File starts with `'use server';` directive on line 1
    - Exports: `addToCartAction`, `updateQtyAction`, `removeItemAction`, `migrateLocalCartAction`
    - Every action returns the canonical envelope `{ ok: true, data: Cart } | { ok: false, code, messageKey, fields? }`
    - Every action calls `getOrCreateCart()` first, then mutates via `cart/server.ts` helpers, then returns the fresh `Cart` snapshot
    - Each action calls `revalidatePath('/[locale]/checkout', 'page')` so OrderSummary on the checkout page sees fresh data
    - `migrateLocalCartAction(items)` calls `migrateLocalStorageCart` and returns the merged cart; idempotent if items array is empty
    - All actions wrap the body in try/catch — caught errors are logged with `console.error` (full message + stack) and return `{ ok: false, code: 'UNKNOWN', messageKey: 'Checkout.errors.unknown' }` to the client. NEVER re-throw raw errors.
  </behavior>
  <action>
    Create `src/app/actions/cart.ts`:

    ```typescript
    'use server';

    import { revalidatePath } from 'next/cache';
    import type { Cart, Locale } from '@/types/domain';
    import { getOrCreateCart } from '@/lib/cart/session';
    import {
      getCart, addItemToCart, updateCartItemQuantity, removeCartItem,
    } from '@/lib/cart/server';
    import { migrateLocalStorageCart, type LegacyCartItem } from '@/lib/cart/migrate';

    export type ActionResult<T = unknown> =
      | { ok: true; data: T }
      | {
          ok: false;
          code: 'INSUFFICIENT_STOCK' | 'PRODUCT_NOT_FOUND' | 'VALIDATION' | 'UNKNOWN';
          fields?: Record<string, string>;
          messageKey: string;
        };

    function fail(code: 'UNKNOWN' | 'PRODUCT_NOT_FOUND' | 'VALIDATION' | 'INSUFFICIENT_STOCK',
                  messageKey: string): ActionResult<never> {
      return { ok: false, code, messageKey };
    }

    export async function addToCartAction(
      productId: string, sizeId: string, quantity: number = 1
    ): Promise<ActionResult<Cart>> {
      try {
        const session = await getOrCreateCart();
        await addItemToCart(session.id, productId, sizeId, quantity);
        const cart = await getCart(session.id);
        if (!cart) return fail('UNKNOWN', 'Checkout.errors.unknown');
        revalidatePath('/[locale]/checkout', 'page');
        return { ok: true, data: cart };
      } catch (err) {
        console.error('[addToCartAction]', err);
        return fail('UNKNOWN', 'Checkout.errors.unknown');
      }
    }

    export async function updateQtyAction(
      cartItemId: string, quantity: number
    ): Promise<ActionResult<Cart>> {
      try {
        const session = await getOrCreateCart();
        await updateCartItemQuantity(session.id, cartItemId, quantity);
        const cart = await getCart(session.id);
        if (!cart) return fail('UNKNOWN', 'Checkout.errors.unknown');
        revalidatePath('/[locale]/checkout', 'page');
        return { ok: true, data: cart };
      } catch (err) {
        console.error('[updateQtyAction]', err);
        return fail('UNKNOWN', 'Checkout.errors.unknown');
      }
    }

    export async function removeItemAction(
      cartItemId: string
    ): Promise<ActionResult<Cart>> {
      try {
        const session = await getOrCreateCart();
        await removeCartItem(session.id, cartItemId);
        const cart = await getCart(session.id);
        if (!cart) return fail('UNKNOWN', 'Checkout.errors.unknown');
        revalidatePath('/[locale]/checkout', 'page');
        return { ok: true, data: cart };
      } catch (err) {
        console.error('[removeItemAction]', err);
        return fail('UNKNOWN', 'Checkout.errors.unknown');
      }
    }

    export async function migrateLocalCartAction(
      items: LegacyCartItem[], locale?: Locale
    ): Promise<ActionResult<Cart>> {
      try {
        const session = await getOrCreateCart(locale);
        if (items.length > 0) {
          await migrateLocalStorageCart(session.id, items);
        }
        const cart = await getCart(session.id);
        if (!cart) return fail('UNKNOWN', 'Checkout.errors.unknown');
        return { ok: true, data: cart };
      } catch (err) {
        console.error('[migrateLocalCartAction]', err);
        return fail('UNKNOWN', 'Checkout.errors.unknown');
      }
    }
    ```
  </action>
  <verify>
    <automated>grep -c "'use server'" src/app/actions/cart.ts &amp;&amp; npx tsc --noEmit 2>&amp;1 | grep "actions/cart" | grep -i error; test $? -ne 0</automated>
  </verify>
  <acceptance_criteria>
    - `head -n 1 src/app/actions/cart.ts | grep -c "'use server'"` outputs 1
    - `grep -c "export async function addToCartAction" src/app/actions/cart.ts` outputs 1
    - `grep -c "export async function updateQtyAction" src/app/actions/cart.ts` outputs 1
    - `grep -c "export async function removeItemAction" src/app/actions/cart.ts` outputs 1
    - `grep -c "export async function migrateLocalCartAction" src/app/actions/cart.ts` outputs 1
    - `grep -c "ok: false" src/app/actions/cart.ts` outputs at least 4 (one per action)
    - `grep -c "revalidatePath" src/app/actions/cart.ts` outputs at least 3
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Server Actions wired through `cart/server.ts` and `cart/session.ts`, returning canonical envelope, type-check clean.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Strip persist from cartStore, rewire StoreHydration to /api/cart, migrate localStorage once, update CartItem to call Server Actions</name>
  <files>src/store/cartStore.ts, src/store/StoreHydration.tsx, src/components/cart/CartItem.tsx, src/components/cart/CartDrawer.tsx</files>
  <read_first>
    - src/store/cartStore.ts (current persist-based store — strip down)
    - src/store/StoreHydration.tsx (current rehydrate)
    - src/components/cart/CartItem.tsx (lines 50-65 — Zustand mutator calls)
    - src/components/cart/CartDrawer.tsx (subtotal computation line ~23)
    - src/components/admin/InventoryTable.tsx lines 17, 23-27 (`useTransition` + Server Action pattern)
    - src/app/actions/cart.ts (just-created)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "src/store/cartStore.ts" + "StoreHydration" + "CartItem & CartDrawer" sections (lines 517-545, 632-639)
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md "Pitfall 3" (Zustand hydration race) and "Runtime State Inventory" (localStorage migration)
  </read_first>
  <behavior>
    - `src/store/cartStore.ts` no longer imports `persist` or `createJSONStorage` from `zustand/middleware`
    - Public action surface preserved: `addItem`, `removeItem`, `updateQuantity`, `setDrawerOpen`, `clearCart`, `getTotalCount`
    - NEW action: `setItems(items: CartItem[])` for hydration
    - Each cart item now also stores `id` (server cartItem id) and `sizeId` so components can call Server Actions by id. EXISTING client `CartItem` interface in src/types/domain.ts must be extended (add optional `id?: string` and `sizeId?: string`) to keep backward-compat for any code paths not yet rewired.
    - `src/store/StoreHydration.tsx`: on mount, reads `localStorage['orki-cart']`. If exists with items, calls `migrateLocalCartAction(legacyItems, locale)`, then removes the localStorage key, then `setItems(result.data.items.map(...))`. If no localStorage entry, just fetches `/api/cart` and `setItems`.
    - `src/components/cart/CartItem.tsx`: each quantity change / removal calls the Zustand mutator (optimistic) AND the corresponding Server Action inside `useTransition`. On Server Action failure, refetch `/api/cart` and `setItems` to reconcile.
    - `src/components/cart/CartDrawer.tsx`: subtotal still computed from Zustand items (UI only). NO breaking change to drawer UX.
    - `npm run build` (or `npx next build`) succeeds end-to-end.
  </behavior>
  <action>
    Replace `src/store/cartStore.ts` body with a non-persistent store. Keep all action signatures. Add `setItems`. Map server `ServerCartItem` → existing client `CartItem` (carries `id` + `sizeId` as new optional fields):

    ```typescript
    import { create } from 'zustand';
    import type { CartItem, Product } from '@/types/domain';

    interface CartState {
      items: CartItem[];
      isDrawerOpen: boolean;
      setItems: (items: CartItem[]) => void;
      addItem: (product: Product, selectedSize: string) => void;
      removeItem: (productId: string, selectedSize: string) => void;
      updateQuantity: (productId: string, selectedSize: string, delta: number) => void;
      setDrawerOpen: (isOpen: boolean) => void;
      clearCart: () => void;
      getTotalCount: () => number;
    }

    export const useCartStore = create<CartState>()((set, get) => ({
      items: [],
      isDrawerOpen: false,

      setItems: (items) => set({ items }),

      addItem: (product, selectedSize) =>
        set(state => {
          const existing = state.items.find(
            i => i.product.id === product.id && i.selectedSize === selectedSize
          );
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product.id === product.id && i.selectedSize === selectedSize
                  ? { ...i, quantity: i.quantity + 1 } : i
              ),
            };
          }
          return { items: [...state.items, { product, selectedSize, quantity: 1 }] };
        }),

      removeItem: (productId, selectedSize) =>
        set(state => ({
          items: state.items.filter(
            i => !(i.product.id === productId && i.selectedSize === selectedSize)
          ),
        })),

      updateQuantity: (productId, selectedSize, delta) =>
        set(state => ({
          items: state.items.map(i =>
            i.product.id === productId && i.selectedSize === selectedSize
              ? { ...i, quantity: Math.max(1, i.quantity + delta) } : i
          ),
        })),

      setDrawerOpen: (isOpen) => set({ isDrawerOpen: isOpen }),

      clearCart: () => set({ items: [] }),

      getTotalCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }));
    ```

    Also extend the `CartItem` interface in `src/types/domain.ts` (add `id?: string; sizeId?: string;` as optional). DO NOT break existing references.

    Replace `src/store/StoreHydration.tsx` body:

    ```tsx
    'use client';
    import { useEffect } from 'react';
    import { useParams } from 'next/navigation';
    import { useCartStore } from './cartStore';
    import { migrateLocalCartAction } from '@/app/actions/cart';
    import type { Locale, CartItem, Product } from '@/types/domain';

    interface LegacyEntry { productId: string; selectedSize: string; quantity: number; }

    export function StoreHydration() {
      const params = useParams<{ locale?: string }>();
      const locale: Locale = params?.locale === 'ar' ? 'ar' : 'en';

      useEffect(() => {
        let cancelled = false;

        const run = async () => {
          let legacy: LegacyEntry[] = [];
          try {
            const raw = typeof window !== 'undefined'
              ? window.localStorage.getItem('orki-cart')
              : null;
            if (raw) {
              const parsed = JSON.parse(raw);
              const items = parsed?.state?.items ?? [];
              legacy = items
                .filter((i: any) => i?.product?.id && i?.selectedSize && i?.quantity > 0)
                .map((i: any) => ({
                  productId: i.product.id,
                  selectedSize: i.selectedSize,
                  quantity: i.quantity,
                }));
            }
          } catch {
            legacy = [];
          }

          if (legacy.length > 0) {
            const result = await migrateLocalCartAction(legacy, locale);
            try { window.localStorage.removeItem('orki-cart'); } catch {}
            if (cancelled) return;
            if (result.ok) {
              useCartStore.getState().setItems(toClientItems(result.data.items));
              return;
            }
            // Fall through to GET /api/cart on failure
          }

          try {
            const res = await fetch('/api/cart', { cache: 'no-store' });
            const json = await res.json();
            if (!cancelled && json?.ok && json.cart) {
              useCartStore.getState().setItems(toClientItems(json.cart.items));
            }
          } catch {
            // Leave the store empty on error — user will see an empty cart, not a crash.
          }
        };

        run();
        return () => { cancelled = true; };
      }, [locale]);

      return null;
    }

    function toClientItems(serverItems: any[]): CartItem[] {
      return (serverItems ?? []).map(si => ({
        id: si.id,
        sizeId: si.sizeId,
        product: si.product as Product,
        selectedSize: si.sizeLabel,
        quantity: si.quantity,
      }));
    }
    ```

    Modify `src/components/cart/CartItem.tsx`. Wherever the component currently calls `updateQuantity(productId, selectedSize, ±1)` or `removeItem(productId, selectedSize)`, ALSO dispatch the corresponding Server Action inside `useTransition`. The Server Action takes the cartItem `id` (now available on the client item via the hydration shape):

    ```tsx
    'use client';
    import { useTransition } from 'react';
    import { useCartStore } from '@/store/cartStore';
    import { updateQtyAction, removeItemAction } from '@/app/actions/cart';
    import type { CartItem as CartItemType } from '@/types/domain';

    interface Props { item: CartItemType; locale: 'en' | 'ar'; }

    export function CartItem({ item, locale }: Props) {
      const { updateQuantity, removeItem, setItems } = useCartStore(s => ({
        updateQuantity: s.updateQuantity, removeItem: s.removeItem, setItems: s.setItems,
      }));
      const [isPending, startTransition] = useTransition();

      const refetch = async () => {
        try {
          const res = await fetch('/api/cart', { cache: 'no-store' });
          const json = await res.json();
          if (json?.ok) setItems((json.cart.items ?? []).map((si: any) => ({
            id: si.id, sizeId: si.sizeId, product: si.product,
            selectedSize: si.sizeLabel, quantity: si.quantity,
          })));
        } catch {}
      };

      const handleDelta = (delta: 1 | -1) => {
        // optimistic
        updateQuantity(item.product.id, item.selectedSize, delta);
        if (!item.id) return; // pre-hydration items (legacy) — skip server until hydrated
        startTransition(async () => {
          const newQty = Math.max(0, item.quantity + delta);
          const result = await updateQtyAction(item.id!, newQty);
          if (!result.ok) await refetch();
        });
      };

      const handleRemove = () => {
        removeItem(item.product.id, item.selectedSize);
        if (!item.id) return;
        startTransition(async () => {
          const result = await removeItemAction(item.id!);
          if (!result.ok) await refetch();
        });
      };

      // ... existing render JSX retained verbatim, but bind handleDelta/handleRemove to existing buttons.
    }
    ```

    Preserve the existing `CartItem.tsx` JSX/CSS/RTL handling completely — only the click handlers + the new `useTransition` import are added. Use logical CSS properties (`me-`, `ps-`, etc. — DO NOT introduce `ml-`/`mr-`/`pl-`/`pr-`).

    `CartDrawer.tsx`: only modification is to `import { useEffect }` if needed; subtotal continues to use Zustand items (server-authoritative subtotal happens at checkout, per CONTEXT.md).
  </action>
  <verify>
    <automated>grep -L "from 'zustand/middleware'" src/store/cartStore.ts &amp;&amp; grep -c "fetch('/api/cart'" src/store/StoreHydration.tsx &amp;&amp; grep -c "useTransition" src/components/cart/CartItem.tsx &amp;&amp; npx next build 2>&amp;1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "from 'zustand/middleware'" src/store/cartStore.ts` outputs 0
    - `grep -c "persist(" src/store/cartStore.ts` outputs 0
    - `grep -c "setItems:" src/store/cartStore.ts` outputs 1
    - `grep -c "fetch('/api/cart'" src/store/StoreHydration.tsx` outputs at least 1
    - `grep -c "migrateLocalCartAction" src/store/StoreHydration.tsx` outputs at least 1
    - `grep -c "localStorage.removeItem('orki-cart')" src/store/StoreHydration.tsx` outputs 1
    - `grep -c "useTransition" src/components/cart/CartItem.tsx` outputs at least 1
    - `grep -c "updateQtyAction\|removeItemAction" src/components/cart/CartItem.tsx` outputs at least 2
    - `grep -E "\\b(ml-|mr-|pl-|pr-|left-|right-)" src/components/cart/CartItem.tsx src/components/cart/CartDrawer.tsx | grep -v "// " | wc -l` outputs 0 (no directional Tailwind classes; only logical properties)
    - `npx next build` exits 0
  </acceptance_criteria>
  <done>Cart is DB-backed end-to-end. Refresh the page → cart contents survive. Open in another tab (same browser) → same cart. Clear localStorage manually → cart is still there.</done>
</task>

</tasks>

<verification>
- `npx next build` exits 0
- After adding an item to cart and refreshing, the cart drawer still shows the item (manual UAT)
- `localStorage` no longer holds an `orki-cart` key after a refresh on a fresh browser session
- DB has rows in `carts` and `cart_items` matching the user's actions
</verification>

<success_criteria>
Cart writes go to Postgres via Server Actions. Reads come from Postgres via /api/cart. Zustand is the UI mirror. Cart preserved across refreshes within the cookie's 30-day window. Cart preserved when payment fails (verified by Plan 08-05).
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-02-SUMMARY.md`
</output>
