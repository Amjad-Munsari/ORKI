# Phase 8: Cart, Checkout State & Order Flow — Pattern Map

**Mapped:** 2026-05-09
**Files analyzed:** 27 (5 modify, 22 new)
**Analogs found:** 21 / 27 (6 net-new — no in-repo analog, must follow RESEARCH.md verbatim)

This map tells the planner exactly which existing files to mirror when authoring each new/modified file in Phase 8. Excerpts below are the load-bearing sections to copy from. **Halalas-based money (`*_cents` integer columns) and Server-Action checkout submission are NEW patterns** — no analog exists yet; planner must follow the RESEARCH.md examples for those.

---

## File Classification

### NEW — schema & data layer

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/db/schema.ts` (extend) | model | CRUD | `src/lib/db/schema.ts` (existing products section) | exact (extension) |
| `src/lib/db/migrations/0001_*.sql` | migration | batch | `src/lib/db/migrations/0000_furry_ink.sql` | exact (drizzle-kit generates) |

### NEW — server libs (read-only product API analog: `src/lib/products.ts`)

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/cart/session.ts` | service (cookie + DB) | request-response | `src/lib/db/client.ts` (singleton + `'server-only'`) | role-match |
| `src/lib/cart/server.ts` | service (cart CRUD) | CRUD | `src/lib/products.ts` | role-match |
| `src/lib/cart/migrate.ts` | utility (one-shot) | transform | `src/app/api/seed/route.ts` (bulk insert pattern) | partial |
| `src/lib/orders/state-machine.ts` | utility (pure) | transform | `src/lib/products-logic.ts` (pure helper alongside data layer) | role-match |
| `src/lib/orders/pricing.ts` | utility (pure) | transform | `src/lib/products-logic.ts` | role-match |
| `src/lib/orders/errors.ts` | utility (error classes) | — | (no analog — net new) | none |
| `src/lib/orders/server.ts` | service (txn + orchestration) | request-response | `src/lib/products.ts` (data access conventions) + `src/app/actions/admin.ts` (`updateSizeInventory` flow) | role-match |
| `src/lib/orders/reference.ts` | utility (pure) | transform | (no analog — net new, nanoid) | none |
| `src/lib/email/client.ts` | config (singleton) | — | `src/lib/db/client.ts` (singleton with `'server-only'`) | role-match |
| `src/lib/email/send.ts` | service (external API) | event-driven | `src/app/actions/admin.ts` (post-mutation side effects) | partial |
| `src/lib/email/templates/OrderConfirmation.tsx` | component (email RSC) | — | (no analog — net new, react-email) | none |
| `src/lib/email/templates/OrderShipped.tsx` | component (email RSC) | — | (no analog — net new) | none |
| `src/lib/email/templates/OrderCancelled.tsx` | component (email RSC) | — | (no analog — net new) | none |
| `src/lib/email/templates/OrderRefunded.tsx` | component (email RSC) | — | (no analog — net new) | none |
| `src/lib/checkout/schemas.ts` | utility (zod) | transform | `src/lib/env.ts` (z.object pattern) | role-match |

### NEW — Server Actions (`'use server'` analog: `src/app/actions/admin.ts`)

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/actions/cart.ts` | controller (Server Action) | request-response | `src/app/actions/admin.ts` | exact |
| `src/app/actions/orders.ts` | controller (Server Action) | request-response | `src/app/actions/admin.ts` | role-match (mutation, no `revalidatePath`) |

### NEW — Route handlers

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/api/cart/route.ts` | controller (route handler) | request-response | `src/app/api/checkout/mock/route.ts` + `src/app/api/seed/route.ts` (try/catch + JSON envelope) | role-match |

### NEW — Components

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/checkout/CheckoutSteps.tsx` | component (presentational) | — | inline step indicator in `src/app/[locale]/checkout/page.tsx` lines 73-114 | role-match |
| `src/components/checkout/TrustSignals.tsx` | component (presentational) | — | `src/components/footer/Footer.tsx` (icon row) — minor | partial |
| `src/components/checkout/CheckoutShell.tsx` | component (client orchestrator) | event-driven | `src/app/[locale]/checkout/page.tsx` (current shell — extract & replace) | exact |

### MODIFY

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/checkout/ShippingForm.tsx` | component (form) | request-response | `src/components/admin/ProductEditor.tsx` (form-with-server-action pattern) | partial — RHF is NEW |
| `src/components/checkout/OrderSummary.tsx` | component | — | self (existing) — replace integer-SAR math with halalas + `formatSAR` | exact |
| `src/components/checkout/PaymentGrid.tsx` | component | — | self (existing) — add `min-h-[88px]` + `:focus-visible` | exact |
| `src/store/cartStore.ts` | client store | event-driven | self (existing) — remove `persist`, add hydrate-from-server | exact (strip-down) |
| `src/store/StoreHydration.tsx` | client provider | — | self — replace persist rehydrate with `/api/cart` fetch + setState | exact |
| `src/app/[locale]/checkout/page.tsx` | page (client) | event-driven | self (existing) — rewire submit to Server Action | exact |
| `src/app/[locale]/checkout/confirmation/page.tsx` | page | request-response | `src/app/[locale]/admin/inventory/page.tsx` (server-side data read) | role-match (convert to Server Component) |
| `src/lib/env.ts` | config | — | self — add `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `ORKI_BASE_URL` | exact |
| `src/components/cart/CartItem.tsx` | component | event-driven | self — swap Zustand mutators for Server Action calls in `useTransition` | exact |
| `src/components/cart/CartDrawer.tsx` | component | — | self — minor (subtotal computation moves to halalas) | exact |
| `src/app/api/checkout/mock/route.ts` | controller (deprecate) | — | n/a — leave file but mark deprecated; planner decides delete timing | n/a |

### NEW — Admin orders (Phase 6 admin extension)

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/[locale]/admin/orders/page.tsx` | page (admin list) | request-response | `src/app/[locale]/admin/inventory/page.tsx` | exact |
| `src/app/[locale]/admin/orders/[reference]/page.tsx` | page (admin detail) | request-response | `src/app/[locale]/admin/inventory/page.tsx` | role-match |
| `src/components/admin/OrdersTable.tsx` | component | event-driven | `src/components/admin/InventoryTable.tsx` | exact |
| `src/components/admin/OrderStateControls.tsx` | component | event-driven | `src/components/admin/ProductEditor.tsx` (state mutators in `useTransition`) | role-match |

### NEW — Tests (no in-repo analog yet — Wave 0 establishes scaffolding)

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `vitest.config.ts`, `tests/setup.ts`, `tests/helpers/test-db.ts`, `tests/helpers/factories.ts` | test config | — | (no analog — net new) | none |
| `tests/orders/*.test.ts`, `tests/checkout/*.test.tsx`, `tests/email/*.test.ts` | test | — | (no analog — net new) | none |

### NEW — i18n message keys (additive)

| File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `messages/en.json`, `messages/ar.json` (extend) | config | — | self (existing namespaces `Nav`, `Shop`, `Footer`) — add `Checkout`, `Order`, `Email` namespaces | exact |

---

## Pattern Assignments

### `src/lib/db/schema.ts` (extension — model, CRUD)

**Analog:** `src/lib/db/schema.ts` (existing `products` / `productSizes` / `productImages` blocks).

**Imports pattern** (lines 10-19) — extend with `pgEnum`, `uniqueIndex`, `jsonb`:
```typescript
import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
  index,
  // ADD for Phase 8:
  pgEnum,
  uniqueIndex,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
```

**Table-with-indexes pattern** (lines 23-48 — `products`):
```typescript
export const products = pgTable(
  'products',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),
    /* ... */
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('products_category_idx').on(table.category),
    index('products_in_stock_idx').on(table.inStock),
  ]
);
```
Apply identical shape to `carts`, `cartItems`, `orders`, `orderItems`, `orderEvents` per RESEARCH.md lines 261-385. Use `uuid('...').primaryKey().defaultRandom()` for the new tables (matches `productSizes` line 58).

**FK + onDelete pattern** (lines 60-62 — `productSizes.productId`):
```typescript
productId: text('product_id')
  .notNull()
  .references(() => products.id, { onDelete: 'cascade' }),
```

**Relations pattern** (lines 50-53 + 69-74):
```typescript
export const productsRelations = relations(products, ({ many }) => ({
  sizes: many(productSizes),
  images: many(productImages),
}));
```
Mirror for `carts → cartItems`, `orders → orderItems → orderEvents`.

**Type-export tail pattern** (lines 99-102):
```typescript
export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
```
Add `CartRow`, `CartItemRow`, `OrderRow`, `OrderItemRow`, `OrderEventRow` (+ `New*` variants).

**NEW pattern (no analog) — money columns:** Use `integer('subtotal_cents').notNull()` for ALL monetary columns on `orders` and `orderItems`. The existing `products.price` is `integer` whole SAR (line 37) — Phase 8 introduces halalas. Per RESEARCH.md line 390, do NOT migrate `products.price` this phase; convert at the boundary (`product.price * 100`).

**NEW pattern — pgEnum:** Per RESEARCH.md line 297:
```typescript
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'
]);
// usage: status: orderStatusEnum('status').notNull().default('pending'),
```

---

### `src/lib/db/migrations/0001_*.sql` (migration)

**Analog:** `src/lib/db/migrations/0000_furry_ink.sql` (4 lines reviewed):
```sql
CREATE TABLE "product_images" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"product_id" text NOT NULL,
	"url" text NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL
```
**Generation:** never hand-write. Run `npx drizzle-kit generate` after schema edits. Drizzle-kit emits the matching SQL + `meta/` snapshot. The existing `meta/_journal.json` and `meta/0000_snapshot.json` show the layout the new migration must preserve.

---

### `src/lib/cart/session.ts` (service, request-response)

**Analog:** `src/lib/db/client.ts` (lines 1-34) — `'server-only'` import + singleton-style helper.

**Imports + `'server-only'` pattern** (lines 10-14):
```typescript
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';
```
Apply identical top-of-file convention to `cart/session.ts`:
```typescript
import 'server-only';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { db } from '@/lib/db/client';
import { carts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
```

**Body:** follow RESEARCH.md lines 405-438 verbatim (no in-repo analog for `cookies()` + DB lookup yet).

---

### `src/lib/cart/server.ts` (service, CRUD)

**Analog:** `src/lib/products.ts` (entire file, 144 lines).

**Imports + `'server-only'`** (lines 17-22):
```typescript
import 'server-only';
import { db } from '@/lib/db/client';
import { products, productSizes, productImages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { Product, Size } from '@/types/domain';
export { getStockState, type StockState } from './products-logic';
```

**Drizzle relational query pattern** (lines 70-81 — `getAllProducts`):
```typescript
export async function getAllProducts(): Promise<Product[]> {
  const result = await db.query.products.findMany({
    with: {
      sizes: true,
      images: {
        orderBy: (images, { asc }) => [asc(images.sortOrder)],
      },
    },
  });
  return result.map(toProduct);
}
```
Apply to `getCartItems(cartId)`:
```typescript
const items = await db.query.cartItems.findMany({
  where: eq(cartItems.cartId, cartId),
  with: { /* product join via FK or manual join */ },
});
```

**Row-to-domain mapper convention** (lines 33-63 — `toProduct`): keep DB column names (`nameEn`) inside the mapper; expose domain shape (`name.en`) outward. Phase 8 must add a `toCartItem` and `toOrder` mapper following the same pattern; export domain types via `src/types/domain.ts`.

**Single-row lookup with `findFirst`** (lines 86-99):
```typescript
const result = await db.query.products.findFirst({
  where: eq(products.slug, slug),
  with: { sizes: true, images: { orderBy: (i, { asc }) => [asc(i.sortOrder)] } },
});
if (!result) return undefined;
return toProduct(result);
```

---

### `src/lib/orders/state-machine.ts` (utility, pure)

**Analog:** `src/lib/products-logic.ts` (re-exported by `products.ts` line 22).

**Pattern:** pure functions, no DB imports, exported types, paired with the data-access file. Apply to state machine — body follows RESEARCH.md lines 454-477 verbatim. Add `'cancelled'` from `'shipped' | 'delivered'` per CONTEXT.md decisions (CONTEXT supersedes RESEARCH).

---

### `src/lib/orders/pricing.ts` (utility, pure)

**Analog:** `src/lib/products-logic.ts` (pure helper alongside data layer).

**Body:** RESEARCH.md lines 891-925 verbatim. Halalas-only. `Intl.NumberFormat('ar-SA-u-nu-latn', …)` per CLAUDE.md.

---

### `src/lib/orders/server.ts` (service, request-response — checkout submit)

**Analog (orchestration shape):** `src/app/actions/admin.ts` lines 59-107 (`updateSizeInventory` — read-then-write, conditional update, FK navigation):
```typescript
export async function updateSizeInventory(
  sizeId: string,
  data: { stock?: number; inStock?: boolean }
) {
  // ... pre-write transformation
  await db.update(productSizes).set(updateData).where(eq(productSizes.id, sizeId));
  const size = await db.query.productSizes.findFirst({
    where: eq(productSizes.id, sizeId),
    with: { product: true },
  });
  if (size?.product) { /* derived updates */ }
  revalidatePath('/[locale]/admin/inventory', 'page');
}
```

**Analog (top-of-file imports):** `src/lib/products.ts` lines 17-22 + `src/app/actions/admin.ts` lines 1-5.

**NEW pattern (no in-repo analog) — `db.transaction(...)` with `.for('update')`:** No transaction or pessimistic-lock call exists anywhere in the repo. Phase 8 owns this. Body follows RESEARCH.md lines 506-589 verbatim. Use `inArray(productSizes.id, sizeIds).for('update')` (NOT row-by-row select).

**Imports to add (no in-repo precedent):**
```typescript
import 'server-only';
import { db } from '@/lib/db/client';
import {
  productSizes, orders, orderItems, orderEvents, cartItems,
} from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { computeOrderTotals } from './pricing';
import { generateOrderReference } from './reference';
import { assertTransition } from './state-machine';
import { OrderError } from './errors';
import { getOrCreateCart } from '@/lib/cart/session';
```

**Stock column note:** schema field is `productSizes.stock` (line 65), NOT `quantity`. RESEARCH.md uses both names interchangeably — match the schema.

---

### `src/lib/email/client.ts` (config, singleton)

**Analog:** `src/lib/db/client.ts` lines 16-33 (singleton + `'server-only'` + env-gated).

**Apply pattern:**
```typescript
import 'server-only';
import { Resend } from 'resend';
import { env } from '../env';

const globalForResend = globalThis as unknown as { resend: Resend | undefined };

export const resend =
  globalForResend.resend ??
  (env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null);

if (env.NODE_ENV !== 'production' && resend) {
  globalForResend.resend = resend;
}
```
The `null` fallback honors RESEARCH.md "Environment Availability" — missing key must not crash dev/PR previews.

---

### `src/lib/checkout/schemas.ts` (zod)

**Analog:** `src/lib/env.ts` lines 9-28 — `z.object({...}).transform(...).refine(...)` chain plus `safeParse` consumer pattern.

**Pattern to copy:** put schemas in their own file, export the inferred TS type alongside. Apply per RESEARCH.md lines 605-617:
```typescript
import { z } from 'zod';
export const shippingSchema = z.object({ /* ... */ });
export type ShippingInput = z.infer<typeof shippingSchema>;
```
Error keys (`'errors.required'`, `'errors.email'`, etc.) must namespace under `Checkout.errors.*` in `messages/{en,ar}.json`.

---

### `src/app/actions/cart.ts` (Server Action)

**Analog:** `src/app/actions/admin.ts` (entire file, 107 lines).

**File header pattern** (lines 1-5):
```typescript
'use server';

import { db } from '@/lib/db/client';
import { products, productSizes } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
```

**Action signature pattern** (lines 12-26 — `toggleProductStock`):
```typescript
export async function toggleProductStock(productId: string, inStock: boolean) {
  await db.update(products).set({ inStock, updatedAt: new Date() }).where(eq(products.id, productId));
  revalidatePath('/[locale]/admin/inventory', 'page');
  revalidatePath('/[locale]/shop', 'page');
}
```

**Apply to** `addToCartAction`, `updateQtyAction`, `removeItemAction`. Each:
1. `'use server'` at top
2. resolves the cart via `getOrCreateCart()` from `src/lib/cart/session.ts`
3. mutates via `db.*`
4. calls `revalidatePath('/[locale]/checkout', 'page')` if relevant
5. returns the new cart snapshot for the client store to setState

**Return shape (NEW — no in-repo precedent):** per CONTEXT.md UX-06 decision:
```typescript
type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; code: 'INSUFFICIENT_STOCK' | 'VALIDATION' | 'UNKNOWN'; fields?: Record<string,string>; messageKey: string };
```

---

### `src/app/actions/orders.ts` (Server Action — checkout submit)

**Analog:** `src/app/actions/admin.ts` (`'use server'` + thin wrapper). The heavy logic stays in `src/lib/orders/server.ts`; this file is a re-export shim:
```typescript
'use server';
export { placeOrderAction, cancelOrderAction, refundOrderAction, transitionOrderAction } from '@/lib/orders/server';
```
This matches the canonical-data-layer rule (CLAUDE.md): "components and actions never import Drizzle tables directly — go through `lib/`".

---

### `src/app/api/cart/route.ts` (route handler)

**Analog:** `src/app/api/checkout/mock/route.ts` (32 lines) + `src/app/api/seed/route.ts` (try/catch envelope, lines 59-78).

**Top-of-file + handler shape** (mock route, lines 1-32):
```typescript
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    /* ... */
    return NextResponse.json({ success: true, /* ... */ });
  } catch {
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
```

**Error envelope** (`src/app/api/seed/route.ts` lines 59-78):
```typescript
} catch (err) {
  const e = err as { message?: string; cause?: unknown; stack?: string };
  /* ... */
  console.error('Seed error:', JSON.stringify(payload, null, 2));
  return NextResponse.json(payload, { status: 500 });
}
```
For `/api/cart` GET: read cookie via `getOrCreateCart()`, return `{ ok: true, cart: {...} }`. Do NOT use this route for mutations — those go through Server Actions per CONTEXT.md.

---

### `src/components/checkout/ShippingForm.tsx` (REWRITE — RHF + zod)

**Existing file (to be replaced):** `src/components/checkout/ShippingForm.tsx` (133 lines) — uncontrolled `useState` + custom `Input` sub-component.

**Existing pattern to KEEP** (the `<Input>` styling primitive, lines 115-132):
```tsx
function Input({ label, className, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <div className={className}>
      <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-transparent border-b border-white/20 py-3 text-white placeholder:text-white/10
                   focus:outline-none focus:border-white transition-colors duration-300 rounded-none"
      />
    </div>
  );
}
```
**Extend** this `<Input>` to accept `error?: string` + auto-wire `aria-invalid` / `aria-describedby` / `id` / error `<p role="alert">` per RESEARCH.md lines 649-662.

**NEW pattern (no in-repo precedent) — RHF body:** RESEARCH.md lines 622-647 verbatim. Use `mode: 'onBlur'`, `noValidate` on `<form>`. Wire `register('firstName')` + `formState.errors.firstName?.message` (a translation key) → `t(error)`.

**Bilingual labels:** existing file uses inline `isRtl ? '...' : '...'` ternaries (lines 49-108). **Migrate to `useTranslations('Checkout')`** during the rewrite — match `messages/en.json` namespace pattern (existing `Shop.sizeGuide` etc., reviewed lines 1-49). Add a `Checkout` namespace.

**Form-with-action pattern (analog):** `src/components/admin/ProductEditor.tsx` lines 12-29 — `useTransition` + `startTransition(async () => { await action(); onClose() })`. Apply for the submit handler so the place-order button shows pending state.

---

### `src/components/checkout/OrderSummary.tsx` (MODIFY)

**Existing file:** `src/components/checkout/OrderSummary.tsx` (84 lines).

**Pattern to keep** (visual layout, lines 19-82). **Pattern to change:**
- Lines 15-17: replace `items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)` with `computeOrderTotals(items.map(i => ({ unitPriceCents: i.product.price * 100, quantity: i.quantity })))`.
- Line 46, 56, 70: replace `{subtotal} SAR` / `{total} SAR` etc. with `{formatSAR(totals.subtotalCents, locale)}` from `src/lib/orders/pricing.ts`.
- Add VAT line (per UX-03) + flat-shipping or "Free" (above 300 SAR threshold) — three separate `<div className="flex justify-between text-sm">` rows mirroring lines 52-65.

---

### `src/components/checkout/PaymentGrid.tsx` (MODIFY)

**Existing file:** `src/components/checkout/PaymentGrid.tsx` (83 lines).

**Pattern to keep** (line 60). **Patches per Pitfall 8:**
- Line 60 className: add `min-h-[88px]` and ensure `:focus-visible` ring (currently only hover state). Use the same focus ring `<Button>` ships with: `focus-visible:ring-3 focus-visible:ring-ring/50` (from `src/components/ui/button.tsx` line 7).

---

### `src/components/checkout/CheckoutSteps.tsx` (NEW — extract)

**Analog:** the inline step-indicator markup currently in `src/app/[locale]/checkout/page.tsx` lines 73-78 + 109-114:
```tsx
<h2 className="text-sm font-bold uppercase tracking-widest text-white flex items-center gap-4">
  <span className="size-6 rounded-full bg-white text-black flex items-center justify-center text-[10px]">1</span>
  {isRtl ? 'معلومات الشحن' : 'Shipping Information'}
</h2>
```
Extract into `<CheckoutSteps current={1|2} />`. Add `aria-current="step"` (UX-02) and a sibling `<div role="status" aria-live="polite">` for step-change announcements (UX-09 / Pitfall 9).

---

### `src/components/checkout/TrustSignals.tsx` (NEW)

**Analog:** `src/components/footer/Footer.tsx` for icon-row styling conventions (uppercase tracking-widest white/40). No close functional analog — render lock + return + secure inline-SVG icons in a single horizontal row above the place-order button. Spec: CONTEXT.md "Trust signals (UX-07)".

---

### `src/store/cartStore.ts` (MODIFY — strip persist)

**Existing file:** `src/store/cartStore.ts` (68 lines). **Keep** the action signatures (`addItem`, `removeItem`, `updateQuantity`, `setDrawerOpen`, `clearCart`, `getTotalCount`) — `CartDrawer` and `CartItem` consume them.

**Replace:**
- Lines 16-67: drop `persist(...)` + `createJSONStorage`. Use plain `create<CartState>()((set, get) => ({...}))`.
- Add a `setItems(items)` action so `StoreHydration` can hydrate from server.
- Action implementations stay client-only/optimistic — the *server* sync is performed by the Server Actions which the consuming components dispatch alongside the local mutator.

---

### `src/store/StoreHydration.tsx` (MODIFY)

**Existing file:** `src/store/StoreHydration.tsx` (15 lines):
```tsx
'use client'
import { useEffect } from 'react'
import { useCartStore } from './cartStore'

export function StoreHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate()
  }, [])
  return null
}
```
**Replace body:** `useEffect(() => { fetch('/api/cart').then(r => r.json()).then(({ cart }) => useCartStore.getState().setItems(cart.items)) }, [])`. Then run the one-shot localStorage migration: read `localStorage['orki-cart']`, POST to `migrateLocalStorageCartAction`, `localStorage.removeItem('orki-cart')` (per RESEARCH.md "Runtime State Inventory" line 795).

---

### `src/app/[locale]/checkout/page.tsx` (MODIFY — wire to Server Action)

**Existing file:** `src/app/[locale]/checkout/page.tsx` (157 lines).

**Pattern to keep** (lines 21-31, 62-156 — the visual shell). **Replace** the `handlePlaceOrder` (lines 33-60) `fetch('/api/checkout/mock')` block with a Server Action invocation inside `useTransition`:

Adapt from `src/components/admin/InventoryTable.tsx` lines 17, 23-27:
```tsx
const [isPending, startTransition] = useTransition();

const handleStockToggle = async (id: string, currentStatus: boolean) => {
  startTransition(async () => {
    await toggleProductStock(id, !currentStatus);
  });
};
```
Apply:
```tsx
const handlePlaceOrder = () => {
  startTransition(async () => {
    const result = await placeOrderAction(/* shipping + payment */);
    if (!result.ok) {
      setError(t(result.messageKey));
      // focus first invalid field per UX-09
      return;
    }
    router.push(`/checkout/confirmation?ref=${result.data.reference}`);
  });
};
```

Replace `setIsSubmitting`/`isSubmitting` with `isPending`. Lines 124-129 error block layout stays.

---

### `src/app/[locale]/checkout/confirmation/page.tsx` (MODIFY — Server Component read)

**Existing file:** `src/app/[locale]/checkout/confirmation/page.tsx` (88 lines, currently `'use client'`).

**Convert to Server Component** mirroring `src/app/[locale]/admin/inventory/page.tsx` (24 lines):
```tsx
import { getAllProducts } from '@/lib/products';
export const dynamic = 'force-dynamic';
export default async function InventoryPage() {
  const products = await getAllProducts();
  return ( /* ... */ );
}
```
Apply:
```tsx
export const dynamic = 'force-dynamic';
export default async function ConfirmationPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { ref } = await searchParams;
  const order = await getOrderByReference(ref); // new helper in src/lib/orders/server.ts
  if (!order) notFound();
  return ( /* visual layout from existing file lines 28-86 — replace orderId with order.reference */ );
}
```
Cart-clearing was a client `useEffect` on this page (lines 21-26) — REMOVE; server-side `placeOrderAction` already deleted `cartItems` inside the transaction.

---

### `src/lib/env.ts` (MODIFY)

**Existing file:** `src/lib/env.ts` (43 lines).

**Pattern to extend** — append fields to `envSchema` (line 11):
```typescript
const envSchema = z
  .object({
    STORAGE_URL: z.string().url().optional(),
    DATABASE_URL: z.string().url().optional(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    // ADD:
    RESEND_API_KEY: z.string().optional(),
    RESEND_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),
    ORKI_BASE_URL: z.string().url().optional(),
  })
  /* ... */
```
Keep `.transform`, `.refine`, `.safeParse` chain unchanged.

---

### `src/components/cart/CartItem.tsx` & `CartDrawer.tsx` (MODIFY)

**Existing files:** `src/components/cart/CartItem.tsx` (75 lines), `CartDrawer.tsx` (110 lines).

**Pattern to keep:** entire visual layout in both files. **Patches:**
- `CartItem.tsx` lines 50-65: wrap `updateQuantity` / `removeItem` calls in a `useTransition` + Server Action call. Local Zustand mutation remains for optimistic UI; Server Action is authoritative.
- `CartDrawer.tsx` line 23: subtotal calculation continues to use Zustand items (UI display only); the authoritative total is computed server-side at checkout.

---

### `src/app/[locale]/admin/orders/page.tsx` (NEW — admin list)

**Analog:** `src/app/[locale]/admin/inventory/page.tsx` (24 lines, full file):
```tsx
import { getAllProducts } from '@/lib/products';
import InventoryTable from '@/components/admin/InventoryTable';

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const products = await getAllProducts();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter italic">Inventory Control</h1>
        <p className="text-sm font-mono opacity-50 mt-1 uppercase">Real-time stock management and product visibility</p>
      </div>
      <InventoryTable initialProducts={products} />
    </div>
  );
}
```
Apply to `admin/orders/page.tsx` — read via `getAllOrders()` from `src/lib/orders/server.ts`, hand to `<OrdersTable initialOrders={orders} />`.

---

### `src/components/admin/OrdersTable.tsx` (NEW)

**Analog:** `src/components/admin/InventoryTable.tsx` (147 lines).

**Imports + state pattern** (lines 1-27):
```tsx
'use client';
import { useState, useTransition } from 'react';
/* ... */
import { toggleProductStock } from '@/app/actions/admin';

export default function InventoryTable({ initialProducts }: InventoryTableProps) {
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPending, startTransition] = useTransition();
  /* ... */
}
```

**Table grid layout** (line 55): 7-column grid with `[80px_1fr_120px_100px_100px_140px_100px]`-style template. Adapt for orders columns: `[1fr_1fr_140px_120px_120px_140px_100px]` for `Reference / Email / Placed / Total / Status / Items / Action`.

**Row-click drawer pattern** (lines 65-69 + 138-143): `setSelectedProduct(product)` opens `<ProductEditor product={...} onClose={() => setSelectedProduct(null)} />`. For orders, opens `<OrderStateControls order={...} onClose={...} />`.

---

### `src/components/admin/OrderStateControls.tsx` (NEW)

**Analog:** `src/components/admin/ProductEditor.tsx` (177 lines).

**Slide-over panel pattern** (lines 31-52):
```tsx
<div className="fixed inset-0 z-50 flex justify-end">
  <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
  <div className="relative w-full max-w-xl bg-[#0a0a0a] border-s-4 border-white h-full flex flex-col shadow-2xl text-white">
    {/* header + form + footer */}
  </div>
</div>
```
Note `border-s-4` (logical property, RTL-aware) — keep verbatim.

**State-action pattern** (lines 12-29 — `useTransition` + Server Action call):
```tsx
const [isPending, startTransition] = useTransition();
const handleSaveDetails = async (e: React.FormEvent) => {
  e.preventDefault();
  startTransition(async () => {
    await updateProductDetails(product.id, formData);
    onClose();
  });
};
```
Apply for state-machine buttons:
```tsx
<button onClick={() => startTransition(() => transitionOrderAction(order.id, 'shipped'))}>
  Mark Shipped
</button>
```
Use `canTransition(order.status, 'shipped')` from `state-machine.ts` to enable/disable each button.

---

### `messages/en.json` & `messages/ar.json` (extend)

**Analog:** `messages/en.json` (49 lines, 4 namespaces: `Nav`, `Footer`, `Placeholder`, `Meta`, `Shop`).

**Pattern to apply:**
```json
{
  "Checkout": {
    "title": "Checkout",
    "step1": "Shipping Information",
    "step2": "Payment Method",
    "firstName": "First Name",
    /* ... */
    "errors": {
      "required": "This field is required",
      "email": "Please enter a valid email",
      "phone.ksa": "Enter a Saudi mobile number (+966 5X XXX XXXX)"
    }
  },
  "Order": {
    "confirmedTitle": "Order Confirmed",
    "reference": "Order Reference",
    /* ... */
  },
  "Email": { /* ... */ }
}
```
Mirror in `ar.json` with same keys, AR copy.

---

## Shared Patterns

### Server-only imports

**Source:** `src/lib/db/client.ts` line 10 + `src/lib/products.ts` line 17.
**Apply to:** every file under `src/lib/cart/`, `src/lib/orders/`, `src/lib/email/`, `src/lib/checkout/`.
```typescript
import 'server-only';
```
This guards against accidental client-bundle imports of Resend / DB / cookie helpers.

### Drizzle DB import (canonical)

**Source:** `src/lib/db/client.ts` lines 33 + `src/lib/db/index.ts` lines 1-11.
**Apply to:** all server-side files needing DB access.
```typescript
import { db } from '@/lib/db/client';
import { /* tables */ } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
```
Components and Server Actions must NEVER import Drizzle tables — go through `src/lib/cart/server.ts`, `src/lib/orders/server.ts`, `src/lib/products.ts` (CLAUDE.md data-layer rule).

### Server Action `'use server'` + `revalidatePath`

**Source:** `src/app/actions/admin.ts` lines 1-26.
**Apply to:** `src/app/actions/cart.ts`, `src/app/actions/orders.ts`.
```typescript
'use server';
import { revalidatePath } from 'next/cache';
/* ... */
revalidatePath('/[locale]/checkout', 'page');
revalidatePath('/[locale]/admin/orders', 'page');
```

### `useTransition` + Server Action invocation (client side)

**Source:** `src/components/admin/InventoryTable.tsx` lines 17, 23-27.
**Apply to:** every checkout/cart interactive control after the rewrite — `CartItem` quantity buttons, place-order button, admin transition buttons.
```tsx
const [isPending, startTransition] = useTransition();
const handle = () => startTransition(async () => { await action(); });
```

### Bilingual rendering — `next-intl`

**Source:** `src/app/[locale]/layout.tsx` lines 39-44 (`<html lang dir>`), `messages/{en,ar}.json` namespace structure.
**Apply to:** all NEW `Checkout`, `Order`, `Email` strings. Replace existing inline `isRtl ? 'AR' : 'EN'` ternaries in `ShippingForm.tsx`, `OrderSummary.tsx`, `PaymentGrid.tsx`, `checkout/page.tsx`, `confirmation/page.tsx` with `useTranslations('Checkout')` / `getTranslations('Checkout')` (server) calls.

### Logical CSS properties (CLAUDE.md, hard rule)

**Source:** `src/components/cart/CartItem.tsx` line 38 (`-me-1`), `src/components/admin/AdminLayout.tsx` line 11 (`border-e-2`), `src/components/admin/ProductEditor.tsx` line 41 (`border-s-4`), `OrderSummary.tsx` line 25 (`pe-2`).
**Apply to:** every new component. NEVER `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-`. Direction-aware arrow icons swap via `{isRtl ? <ArrowLeft /> : <ArrowRight />}` (see `src/components/cart/CartDrawer.tsx` lines 92-97).

### Money formatting (NEW — no in-repo analog)

**Source:** RESEARCH.md lines 920-925.
**Apply to:** `OrderSummary.tsx`, `CartItem.tsx`, `CartDrawer.tsx`, `confirmation/page.tsx`, all email templates, `OrdersTable.tsx`.
```typescript
new Intl.NumberFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA', {
  style: 'currency', currency: 'SAR', maximumFractionDigits: 2,
}).format(cents / 100);
```
Wrap in `formatSAR(cents, locale)` helper exported from `src/lib/orders/pricing.ts`.

### Error UX envelope (NEW — no in-repo analog)

**Source:** CONTEXT.md "Error UX (UX-06)" + RESEARCH.md UX-06 row.
**Apply to:** every Server Action in `cart.ts` and `orders.ts`.
```typescript
type ActionResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: 'INSUFFICIENT_STOCK' | 'PAYMENT_FAILED' | 'VALIDATION' | 'CART_EMPTY' | 'UNKNOWN'; fields?: Record<string, string>; messageKey: string };
```
Client maps `messageKey` via `t(messageKey)`. Server logs full error + request id; client only sees the request id.

### A11y wiring (UX-09)

**Source:** RESEARCH.md lines 638-642 + 665-669 (no in-repo analog — current `ShippingForm` lacks ARIA).
**Apply to:** every input in `ShippingForm`, `PaymentGrid` (custom radio group), `OrderStateControls` form fields.
- `aria-invalid={errors.field ? 'true' : undefined}` (omit when valid)
- `aria-describedby={errors.field ? \`${id}-error\` : undefined}`
- Error `<p role="alert" id="{id}-error">`
- Step-change live region: `<div role="status" aria-live="polite">`
- Focus first invalid field in `useEffect(() => firstErrorRef.current?.focus(), [errors])`

---

## No Analog Found

Files where the planner must follow RESEARCH.md verbatim — no existing code in this repo serves the same role:

| File | Role | Data Flow | Reason |
|------|------|-----------|--------|
| `src/lib/orders/server.ts` (the `db.transaction` + `.for('update')` body) | service | request-response | First transaction in the codebase; first pessimistic lock. RESEARCH.md lines 506-589 is authoritative. |
| `src/lib/cart/session.ts` (cookies + nanoid) | service | request-response | First `cookies()` use (admin layout doesn't auth-gate yet); first `nanoid` use. RESEARCH.md lines 405-438. |
| `src/lib/email/send.ts` + `templates/*.tsx` | service / component | event-driven | First Resend integration; first `react-email` template. RESEARCH.md lines 678-752. |
| `src/lib/orders/state-machine.ts` | utility | transform | No FSM precedent. RESEARCH.md lines 454-477. Apply CONTEXT.md transition matrix (adds `shipped → cancelled`, `confirmed/shipped/delivered → refunded`). |
| `src/lib/orders/pricing.ts` | utility | transform | First halalas-based math. RESEARCH.md lines 891-925. |
| `vitest.config.ts`, `tests/setup.ts`, `tests/helpers/test-db.ts` | test config | — | Vitest installed but never wired. RESEARCH.md "Wave 0 Gaps" lines 1003-1009. |

---

## Metadata

**Analog search scope:** `src/`, `messages/`, `scripts/`, `src/lib/db/migrations/`.
**Files scanned:** 67 (full TS/TSX glob result).
**Pattern extraction date:** 2026-05-09.
**CONTEXT.md vs RESEARCH.md conflicts** (CONTEXT wins where they diverge):
- Cart cookie max-age: CONTEXT says 30 days; RESEARCH says 90. Use 30.
- Transition matrix: CONTEXT adds `shipped → cancelled` and `confirmed|shipped|delivered → refunded`. Use CONTEXT.
- Money: CONTEXT mandates halalas-everywhere on new tables; RESEARCH suggested gradual migration. Both agree `products.price` stays whole-SAR this phase.
- Order reference alphabet: CONTEXT specifies `ABCDEFGHJKLMNPQRSTUVWXYZ23456789` (32 chars). Use exactly.

## PATTERN MAPPING COMPLETE
