# Phase 8: Cart, Checkout State & Order Flow — Research

**Researched:** 2026-05-09
**Domain:** Persistent cart, order state machine, transactional email, checkout UX hardening
**Confidence:** HIGH (stack/architecture), MEDIUM (KSA tax/shipping specifics), LOW (Phase 10 auth refactor surface — speculative)

---

## Summary

Phase 8 converts the existing Phase 3 frontend cart (Zustand + localStorage, mock `/api/checkout/mock`) into a database-backed cart and order pipeline. The work splits into five independent layers:

1. **Schema** — add `carts`, `cart_items`, `orders`, `order_items`, `order_events` tables to Drizzle. `user_id` is nullable to support guest-first checkout (auth deferred to Phase 10).
2. **Cart persistence** — opaque httpOnly session cookie (`orki_sid`, 90-day expiry) maps to a `carts` row. Zustand stays UI source of truth, but mutations sync to the DB via Server Actions. localStorage cart is migrated once on first authenticated request and then deprecated.
3. **Order state machine** — explicit FSM `pending → confirmed → shipped → delivered`, with branches `cancelled` (from `pending`/`confirmed`) and `refunded` (from `delivered`). Enforced in app code (transition table) AND a Postgres `CHECK` constraint on the status column. Every transition writes an `order_events` row (audit trail + idempotency).
4. **Checkout submit** — single transactional Server Action: validate → re-price server-side → reserve stock with `SELECT … FOR UPDATE` → insert `orders` + `order_items` → write `order_events('confirmed')` → send confirmation email (idempotent) → clear cart. Failure preserves cart (UX-08).
5. **Forms & UX** — react-hook-form + zod with bilingual error messages keyed to next-intl, full ARIA wiring (`aria-invalid`, `aria-describedby`), 44×44 tap targets confirmed, focus management on step transitions.

**Primary recommendation:** Build the schema, the Server Action checkout, and the state machine first; layer the email and refund flows on top. Do NOT introduce XState — the state machine is small enough (5 nodes, ~7 transitions) that a hand-written transition table in TypeScript is clearer and removes a dependency. Use Resend for email (already aligned with ecosystem; Postmark has slightly better deliverability but Resend's idempotency-key feature, bilingual templates via React Email, and DX win for this project's scale).

---

## User Constraints (from phase brief)

> Note: There is no Phase 8 CONTEXT.md yet (Phase 8 has not been through `/gsd-discuss-phase`). Constraints below are extracted from CLAUDE.md and the phase brief in this researcher's spawn.

### Locked Decisions
- **No real payment gateway.** Payment remains simulated — extend the existing `/api/checkout/mock` (or replace with Server Action) but model both success and failure paths.
- **Authentication is DEFERRED to Phase 10.** `orders.user_id` and `carts.user_id` MUST be nullable. Cart sessions are cookie-based, not auth-based.
- **Drizzle ORM + Postgres (Neon prod, local dev)** — already set up; reuse `db` client from `@/lib/db/client`.
- **Zustand + persist for cart UI state** — must remain. The DB sync layer wraps Zustand; do not replace it.
- **next-intl (EN/AR) with full RTL** — every checkout component, error message, and email template must be bilingual.
- **CSS logical properties only** — `ms-`, `me-`, `ps-`, `pe-`, never `ml-/mr-/pl-/pr-/left-/right-`.
- **Currency: SAR formatted via `Intl.NumberFormat('ar-SA-u-nu-latn')`** in both locales (Western numerals).
- **Tap targets ≥ 44×44px**, dark-first design (black/white only).

### Claude's Discretion
- Email provider choice (Resend vs Postmark) — both viable. **Recommendation: Resend.**
- Form library (react-hook-form vs raw `useState` + zod). **Recommendation: react-hook-form + zod.**
- State machine implementation (XState vs hand-written transition table). **Recommendation: hand-written.**
- Tax/shipping numbers (KSA VAT 15% confirmed; shipping flat rate is design choice).
- Whether checkout submit is a Server Action vs Route Handler. **Recommendation: Server Action.**

### Deferred Ideas (OUT OF SCOPE)
- Real payment processor (Moyasar, HyperPay, Tap, Stripe) — deferred to a post-Phase-10 milestone.
- User accounts, order history page, "save my address" — deferred to Phase 10.
- Live shipping rate lookup (Aramex/SMSA APIs) — flat rate only this phase.
- Webhook receivers (no real PSP) — not needed yet.
- Admin order list/refund UI — Phase 6 admin dashboard already exists; the Phase 8 schema and server actions must support refund/cancel from the admin side, but the actual admin UI for orders can be a thin pass-through this phase or extended next phase.
- Customer notifications beyond order confirmation (shipping update emails, etc.) — schema supports them via `order_events` but only `order_confirmed` email is implemented this phase.

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UX-01 | Guest checkout (no forced account) | Cookie-based cart session keyed to `carts.session_id`; `orders.user_id` nullable. Authoritative pattern below. |
| UX-02 | Minimum-step checkout with progress indicator | 2-step (Shipping → Payment+Review) already in `checkout/page.tsx`. Keep, add a numbered progress bar with `aria-current="step"`. |
| UX-03 | Total cost (incl. tax + shipping) before final confirm | Server-side total computation in `lib/pricing.ts`: subtotal + shipping + 15% VAT. Display in `OrderSummary` BEFORE the final "Place Order" button. |
| UX-04 | Mobile-functional, 44×44 tap targets, no hover-only | Audit existing `h-14` button (≈56px ✓). Hover-only states on `PaymentGrid` cards must add `:focus-visible` styles. |
| UX-05 | Validation highlights field, preserves data | react-hook-form preserves `formState.errors` while keeping field values; zod resolver provides per-field error keys. |
| UX-06 | No raw technical errors | Server returns `{ code: 'STOCK_UNAVAILABLE' \| 'PAYMENT_DECLINED' \| ... }`; client maps codes to next-intl translation keys. Never `err.message` from a thrown DB error to the user. |
| UX-07 | Trust signals near checkout button | Render a small row of icons (lock + return + secure) above the place-order button. Static — no third-party badges this phase. |
| UX-08 | Recovery on payment failure preserves cart | Cart row is NOT cleared until order transitions to `confirmed`. Failure response leaves cart intact and cart drawer reopens. |
| UX-09 | WCAG 2.1 AA | `aria-invalid` + `aria-describedby` on every input; live region (`role="status"`) announces step changes and errors; focus moves to first invalid field on submit; color contrast already passes (white on black). |
| ECOM-02 | Order state machine pending → confirmed → shipped → delivered → refunded/cancelled | Transition table in `lib/orders/state-machine.ts` + Postgres CHECK constraint + `order_events` audit log. |
| ECOM-03 | Transactional emails (Resend or Postmark) | **Resend 6.12.3** + React Email templates. Idempotency key per `(order_id, event_type)` prevents double-sends. Bilingual templates (one component, locale prop). |
| ECOM-04 | Refund and cancellation in core architecture | State machine already includes `cancelled` and `refunded` transitions. Server Actions `cancelOrder(orderId)` and `refundOrder(orderId)` callable from the admin dashboard (Phase 6). Refund logic in this phase is bookkeeping only — no real payment reversal until a PSP exists. |

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Cart UI state (drawer open, optimistic add) | Browser (Zustand) | — | Sub-100ms feedback required; sync to DB happens in background. |
| Cart persistence (cross-device, cross-session) | API / Backend (Server Action + Postgres) | Browser (Zustand mirrors DB state on hydration) | Source of truth must outlive localStorage clears and survive device switches. |
| Cart session identity | API / Backend (httpOnly cookie set in middleware or Server Action) | — | Must be httpOnly to resist XSS; cannot be set from client JS. |
| Pricing calculation (subtotal, shipping, VAT, total) | API / Backend (`lib/pricing.ts`, server-only) | Frontend Server (SSR initial render reads computed totals) | Client computation can be tampered with; tax must be authoritative server-side. |
| Stock reservation at checkout | Database / Storage (`SELECT … FOR UPDATE` inside transaction) | API / Backend (orchestrates the transaction) | Race condition ownership belongs to the DB; app code coordinates. |
| Order state machine | API / Backend (transition function) | Database (CHECK constraint as a defense-in-depth backstop) | Application is the policy enforcer; DB is the integrity backstop. |
| Order audit trail | Database / Storage (`order_events` table) | API / Backend (writes events on every transition) | Append-only event log lives with the order data. |
| Form validation (client side) | Browser (react-hook-form + zod) | API / Backend (zod schema reused server-side for re-validation) | Same zod schema runs on both — no drift. |
| Form validation (authoritative) | API / Backend (Server Action re-runs zod) | — | Never trust client validation alone (UX-06 + SEC-02). |
| Transactional email send | API / Backend (Resend SDK invocation) | External (Resend infra) | Email send happens after the DB transaction commits to avoid sending for rolled-back orders. |
| Email templates | Frontend Server (React Email components rendered to HTML at send time) | — | Components live alongside other React code; rendered server-side at send. |
| Trust signals (UX-07) | Browser (static UI) | — | Pure presentation. |

---

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `drizzle-orm` | 0.45.2 | ORM, schema, transactions | Already in use; supports `.for('update')` row locking [VERIFIED: Drizzle GH discussion #1337]. |
| `postgres` | 3.4.9 | Driver | Already in use. |
| `zustand` | 5.0.13 | Cart UI state | Already in use; persist middleware can be reconfigured to sync to server instead of localStorage. |
| `next-intl` | 4.11.0 | Bilingual error messages, email subject lines | Already in use; supports ICU pluralization for "{n} items". |
| `next` | 15.3.9 | Server Actions, route handlers, cookies API | Already in use. `cookies()` is async in Next 15 [VERIFIED: Next.js docs]. |

### New (to install this phase)
| Library | Version (verified 2026-05-09) | Purpose | Why Standard |
|---------|-------------------------------|---------|--------------|
| `zod` | 4.4.3 | Schema validation, single source of truth for form types | Industry standard; pairs natively with react-hook-form via `@hookform/resolvers/zod`. [VERIFIED: npm registry] |
| `react-hook-form` | 7.75.0 | Form state, validation, ARIA wiring, preserves data on error (UX-05) | Performance leader, integrates cleanly with shadcn `<Form>` component. [VERIFIED: npm registry] |
| `@hookform/resolvers` | 5.2.2 | Zod ↔ react-hook-form bridge | Official adapter. [VERIFIED: npm registry] |
| `resend` | 6.12.3 | Transactional email API | Built-in idempotency keys, React Email native, simple DX. [VERIFIED: npm registry, Resend docs] |
| `@react-email/components` | 1.0.12 | Bilingual HTML email templates | Standard pairing with Resend; renders to inlined HTML. [VERIFIED: npm registry] |
| `nanoid` | 5.1.11 | Short opaque order references (`ORK-XXXXXX`) and cart session IDs | URL-safe, collision-resistant, faster than uuid. [VERIFIED: npm registry] |

**Optional, only if scope expands:**
| Library | Why you might want it | Why we skip it |
|---------|----------------------|----------------|
| `xstate` 5.31.0 | Visual state machine, typed transitions | 5 states / ~7 transitions is too small to justify the dependency. A 50-line transition table is clearer. [ASSUMED] |
| `sonner` 2.0.7 | Toast notifications | Existing UI uses inline `AlertCircle` blocks; no toast pattern established. Defer. |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Resend | Postmark | Postmark has slightly stronger deliverability track record (since 2010); Resend has better DX, native React Email, and idempotency keys are first-class. [CITED: postmarkapp.com/compare/resend-alternative, sequenzy.com/versus/resend-vs-postmark] For a launching brand at this scale, Resend wins on integration velocity. |
| react-hook-form | TanStack Form / native form actions | RHF is the dominant ecosystem choice and integrates with shadcn/ui's Form component (which we'll likely add). |
| Hand-written FSM | XState | XState is overkill for this phase; revisit if order lifecycle grows past ~10 states. |
| httpOnly cookie session | JWT in cookie | JWT is stateless but harder to revoke; opaque cookie + DB lookup is simpler and we already have the DB. |

**Installation:**
```bash
npm install zod react-hook-form @hookform/resolvers resend @react-email/components nanoid
```

---

## System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                                 │
│                                                                          │
│  CartDrawer / PDP "Add to Cart"                                          │
│        │                                                                 │
│        ▼                                                                 │
│  Zustand store (UI source of truth) ───────► localStorage (legacy,       │
│        │                                       removed after migration)  │
│        │ optimistic UI update                                            │
│        │                                                                 │
│        ▼                                                                 │
│  Server Action: addToCartAction(productId, size, qty)                    │
└──────────────────────────────┬───────────────────────────────────────────┘
                               │ httpOnly cookie: orki_sid
                               ▼
┌──────────────────────────────────────────────────────────────────────────┐
│  NEXT.JS SERVER                                                          │
│                                                                          │
│  cookies() ──► resolveCartId()                                           │
│       │           │                                                      │
│       │           ├─ cookie present + cart row exists ► reuse            │
│       │           ├─ cookie present + no cart row     ► insert + reuse   │
│       │           └─ cookie absent                    ► create + setCookie│
│       │                                                                  │
│       ▼                                                                  │
│  Zod re-validation (server-side)                                         │
│       │                                                                  │
│       ▼                                                                  │
│  Drizzle txn: SELECT cart_items ► UPSERT cart_item ► return new state    │
│       │                                                                  │
│       └─► revalidatePath('/cart'), return cart snapshot                  │
└──────────────────────────────────────────────────────────────────────────┘

CHECKOUT SUBMIT FLOW (the critical path):
┌──────────────────────────────────────────────────────────────────────────┐
│  Server Action: placeOrderAction(formData)                               │
│                                                                          │
│  1. Zod validate (shipping + payment)            ──► 400 with field map  │
│  2. Resolve cart from cookie                     ──► 404 if empty        │
│  3. db.transaction(async tx => {                                         │
│       4. For each cart_item:                                             │
│          tx.select().from(productSizes)                                  │
│            .where(eq(...)).for('update')        ◄── pessimistic lock    │
│       5. If any size.stock < qty: tx.rollback() ──► STOCK_UNAVAILABLE   │
│       6. tx.update(productSizes) decrement stock                         │
│       7. tx.insert(orders)                       ◄── status='pending'   │
│       8. tx.insert(orderItems) (snapshot price)                          │
│       9. tx.insert(orderEvents) ('created')                              │
│      10. simulatePayment()                                               │
│          if fail: tx.rollback() ──► PAYMENT_DECLINED (cart preserved)   │
│      11. tx.update(orders) status='confirmed'                            │
│      12. tx.insert(orderEvents) ('confirmed')                            │
│      13. tx.delete(cartItems where cart_id=…)                            │
│     });                                                                  │
│  14. AFTER COMMIT ─► resend.emails.send({                                │
│         idempotencyKey: `order-confirmed/${orderId}` })                  │
│  15. clearCookie(orki_sid)? NO — keep for next session                   │
│  16. Return { orderId } ──► redirect to /checkout/confirmation           │
└──────────────────────────────────────────────────────────────────────────┘
```

The diagram shows: cart writes are optimistic (Zustand updates first, server confirms); checkout writes are pessimistic (server is the gate, client only renders the result). The DB transaction is the atomic unit — everything inside `db.transaction()` either commits together or rolls back together. Email send is OUTSIDE the transaction (post-commit) so a Resend outage cannot roll back a paid order.

---

## Recommended Project Structure

```
src/
├── lib/
│   ├── db/
│   │   ├── schema.ts            # ADD: carts, cartItems, orders, orderItems, orderEvents
│   │   └── ...
│   ├── cart/
│   │   ├── session.ts           # NEW: getOrCreateCartSession() — reads/writes orki_sid cookie
│   │   ├── server.ts            # NEW: server-only cart mutations (addItem, removeItem, etc.)
│   │   └── migrate.ts           # NEW: one-shot localStorage → DB migration helper
│   ├── orders/
│   │   ├── state-machine.ts     # NEW: transition table + canTransition() + assertTransition()
│   │   ├── server.ts            # NEW: placeOrderAction, cancelOrderAction, refundOrderAction
│   │   ├── pricing.ts           # NEW: computeOrderTotals(items) — subtotal, shipping, vat, total
│   │   └── errors.ts            # NEW: OrderError codes (STOCK_UNAVAILABLE, etc.)
│   ├── email/
│   │   ├── client.ts            # NEW: Resend singleton
│   │   ├── send.ts              # NEW: sendOrderConfirmation(order, locale)
│   │   └── templates/
│   │       └── OrderConfirmation.tsx  # NEW: React Email bilingual template
│   └── validation/
│       └── checkout.ts          # NEW: shippingSchema, checkoutSchema (zod, shared client+server)
├── app/
│   ├── actions/
│   │   ├── admin.ts             # EXISTING
│   │   ├── cart.ts              # NEW: addToCartAction, updateQtyAction, removeItemAction
│   │   └── orders.ts            # NEW: placeOrderAction (re-export from lib for "use server")
│   ├── api/
│   │   └── checkout/
│   │       └── mock/route.ts    # KEEP for now; DEPRECATE in favor of Server Action
│   └── [locale]/
│       ├── checkout/
│       │   ├── page.tsx         # MODIFY: wire to Server Action, add progress bar
│       │   └── confirmation/page.tsx  # MODIFY: read order from DB, not just URL param
│       └── admin/
│           └── orders/          # OPTIONAL this phase: thin order list page
├── components/
│   ├── checkout/
│   │   ├── ShippingForm.tsx     # REWRITE: use react-hook-form + zod + ARIA
│   │   ├── PaymentGrid.tsx      # MODIFY: add :focus-visible, ensure 44×44
│   │   ├── OrderSummary.tsx     # MODIFY: read totals from server-computed pricing
│   │   ├── CheckoutSteps.tsx    # NEW: progress bar with aria-current="step"
│   │   └── TrustSignals.tsx     # NEW: lock/return/secure icons row (UX-07)
│   └── cart/
│       ├── CartDrawer.tsx       # MODIFY: hydrate from server cart on mount
│       └── CartItem.tsx         # MODIFY: actions call Server Actions
└── store/
    └── cartStore.ts             # MODIFY: remove localStorage persist; rehydrate from server props
```

---

## Schema Additions

The existing `schema.ts` already notes "Order tables are NOT here — they belong to Phase 8". Add the following. **All tables use `index()` on every column referenced in WHERE clauses (ECOM-06 carryover).**

```typescript
// ─── Carts ────────────────────────────────────────────────────────────────────
export const carts = pgTable(
  'carts',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Opaque session id stored in orki_sid httpOnly cookie. Indexed for cookie→cart lookup. */
    sessionId: text('session_id').notNull().unique(),
    /** Nullable until Phase 10. When auth lands, populate on login + merge guest cart. */
    userId: uuid('user_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('carts_session_id_idx').on(table.sessionId),
    index('carts_user_id_idx').on(table.userId),
  ]
);

export const cartItems = pgTable(
  'cart_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    cartId: uuid('cart_id').notNull().references(() => carts.id, { onDelete: 'cascade' }),
    productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    sizeId: uuid('size_id').notNull().references(() => productSizes.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    addedAt: timestamp('added_at').notNull().defaultNow(),
  },
  (table) => [
    index('cart_items_cart_id_idx').on(table.cartId),
    // Composite unique: a cart can only have one row per (product, size). UPSERT target.
    uniqueIndex('cart_items_cart_product_size_unq').on(table.cartId, table.productId, table.sizeId),
  ]
);

// ─── Orders ───────────────────────────────────────────────────────────────────
export const orderStatusEnum = pgEnum('order_status', [
  'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'
]);

export const orders = pgTable(
  'orders',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    /** Public-facing order number, e.g. ORK-A1B2C3. Indexed for confirmation page lookup. */
    reference: text('reference').notNull().unique(),
    /** Nullable until Phase 10 (guest checkout). */
    userId: uuid('user_id'),
    /** Snapshot of email at order time (UX-01: guest checkout — no user FK). Indexed. */
    email: text('email').notNull(),

    status: orderStatusEnum('status').notNull().default('pending'),

    // Pricing — all in halalas (1 SAR = 100 halalas) to avoid float drift.
    subtotalCents: integer('subtotal_cents').notNull(),
    shippingCents: integer('shipping_cents').notNull(),
    vatCents: integer('vat_cents').notNull(),
    totalCents: integer('total_cents').notNull(),
    currency: text('currency').notNull().default('SAR'),

    // Shipping address — embedded for simplicity; if reused, normalize later.
    shippingFirstName: text('shipping_first_name').notNull(),
    shippingLastName: text('shipping_last_name').notNull(),
    shippingPhone: text('shipping_phone').notNull(),
    shippingCity: text('shipping_city').notNull(),
    shippingDistrict: text('shipping_district').notNull(),
    shippingAddress: text('shipping_address').notNull(),
    shippingApartment: text('shipping_apartment'),

    paymentMethod: text('payment_method').notNull(), // card | mada | stcpay | applepay | cod

    placedAt: timestamp('placed_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('orders_email_idx').on(table.email),         // ECOM-06
    index('orders_reference_idx').on(table.reference), // ECOM-06
    index('orders_user_id_idx').on(table.userId),      // ECOM-06 + Phase 10 readiness
    index('orders_status_idx').on(table.status),       // admin filtering
    index('orders_placed_at_idx').on(table.placedAt),  // admin sort
  ]
);

export const orderItems = pgTable(
  'order_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    /** FK to product, but item details are SNAPSHOTTED below (price, name) so order reflects time-of-purchase. */
    productId: text('product_id').notNull().references(() => products.id),
    sizeLabel: text('size_label').notNull(),     // 'M' — snapshotted, not FK
    productNameEn: text('product_name_en').notNull(), // snapshot
    productNameAr: text('product_name_ar').notNull(), // snapshot
    unitPriceCents: integer('unit_price_cents').notNull(), // snapshot
    quantity: integer('quantity').notNull(),
  },
  (table) => [
    index('order_items_order_id_idx').on(table.orderId),
    index('order_items_product_id_idx').on(table.productId),
  ]
);

// ─── Order Events (audit trail / state-machine log / email idempotency) ──────
export const orderEvents = pgTable(
  'order_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    /** 'created' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
     *  | 'email_sent.confirmation' | 'payment_failed' | ... */
    type: text('type').notNull(),
    /** Free-form JSON metadata: who triggered (admin user, system), reason, etc. */
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (table) => [
    index('order_events_order_id_idx').on(table.orderId),
    index('order_events_type_idx').on(table.type),
    // Used for email idempotency: query by (orderId, type) — if exists, skip send.
    uniqueIndex('order_events_order_type_unq').on(table.orderId, table.type)
      // NOTE: unique constraint applies only to types that should fire once
      // (e.g. 'email_sent.confirmation'). State-change events use a different
      // composite or no unique. Decide during planning — see Open Questions.
  ]
);
```

> **Important:** Drizzle's `pgEnum` requires importing from `drizzle-orm/pg-core`. The `jsonb` and `pgEnum` and `uniqueIndex` imports must be added to the existing `schema.ts` import line. [VERIFIED: Drizzle docs `/drizzle-team/drizzle-orm-docs`]

> **Money handling:** All money is stored as `integer` halalas (cents) — never `numeric` or `float`. Convert at the display boundary using `Intl.NumberFormat('ar-SA-u-nu-latn', { style: 'currency', currency: 'SAR' })` after dividing by 100. The existing `products.price` column is `integer` in whole SAR; for backward compat, convert (`* 100`) when computing line totals. **Recommend a follow-up migration to halalas across the board** but it is not required for Phase 8.

---

## Architecture Patterns

### Pattern 1: Cart Session Resolution (httpOnly cookie + DB lookup)

**What:** Every server action/route that touches the cart must resolve the cart row via the cookie. If no cookie, mint one.

**When to use:** All cart and checkout server actions.

**Why this pattern:** httpOnly prevents XSS exfiltration of the session ID. SameSite=Lax is correct for ecommerce (gives cross-site GET allowance for return-from-payment-redirect flows; even though we have no real PSP this phase, future-proofs). Path=/ so the cookie reaches both `/cart` and `/checkout`.

**Example:**
```typescript
// src/lib/cart/session.ts
import 'server-only';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { db, carts } from '@/lib/db';
import { eq } from 'drizzle-orm';

const COOKIE_NAME = 'orki_sid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export async function getOrCreateCart(): Promise<{ id: string; sessionId: string }> {
  const jar = await cookies(); // Next 15: async [VERIFIED: Next.js docs]
  let sessionId = jar.get(COOKIE_NAME)?.value;

  if (sessionId) {
    const cart = await db.query.carts.findFirst({ where: eq(carts.sessionId, sessionId) });
    if (cart) return { id: cart.id, sessionId };
    // Cookie present but DB row missing (e.g., DB reset). Treat as new.
  }

  sessionId = nanoid(32);
  const [cart] = await db.insert(carts).values({ sessionId }).returning();

  jar.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
  return { id: cart.id, sessionId };
}
```

**Critical caveat:** Next.js does NOT allow setting cookies from a Server Component render. `cookies().set()` only works in Server Actions, Route Handlers, and Middleware. [CITED: nextjs.org/docs/app/api-reference/functions/cookies] If a Server Component needs the cart and no cookie exists yet, you have two options:

1. **Set in middleware:** Add a small middleware that mints the cookie on first visit. The existing `src/middleware.ts` excludes `/api`, but adding cart-cookie minting there is straightforward. Trade-off: middleware runs on every request.
2. **Set on first mutation:** Don't materialize a cart row until the user adds something. The first `addToCartAction` Server Action calls `getOrCreateCart()` and sets the cookie there. **Recommended** — avoids creating empty carts for every visitor.

### Pattern 2: Order State Machine (hand-written transition table)

**What:** A small typed transition map in `lib/orders/state-machine.ts`. Exported `canTransition(from, to)` and `assertTransition(from, to)` functions. Used by every server action that touches `orders.status`.

**Why hand-written, not XState:** 6 states × ~7 transitions does not justify a 50KB dependency. The transition table fits on one screen and is maximally clear.

**Example:**
```typescript
// src/lib/orders/state-machine.ts
export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled'],
  shipped:   ['delivered'],
  delivered: ['refunded'],
  cancelled: [],          // terminal
  refunded:  [],          // terminal
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export class IllegalTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`Cannot transition order from ${from} to ${to}`);
  }
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}
```

Plus a Postgres CHECK constraint as defense-in-depth — but note that CHECK can only validate the new row, not the transition (PostgreSQL CHECK constraints cannot reference data outside the row being checked [CITED: postgresql.org/docs/current/ddl-constraints.html]). The constraint validates that `status` is one of the legal values; the transition validity is enforced in app code.

The Postgres-level transition guard is an optional trigger — out of scope this phase. The pgEnum already prevents invalid status strings.

### Pattern 3: Atomic Checkout Transaction with Stock Locking

**What:** One Drizzle transaction holds locks on every purchased size row, decrements stock, inserts order rows, and commits. Email is sent AFTER commit.

**Drizzle's `.for('update')` is the API for `SELECT … FOR UPDATE`** [VERIFIED: Drizzle GH discussion #1337].

```typescript
// src/lib/orders/server.ts (sketch — full version in plan)
import 'server-only';
import { db, productSizes, orders, orderItems, orderEvents, cartItems } from '@/lib/db';
import { eq, and, inArray } from 'drizzle-orm';

export async function placeOrderAction(input: CheckoutInput) {
  const validated = checkoutSchema.parse(input);              // zod re-validate
  const cart = await getOrCreateCart();
  const items = await getCartItemsWithProduct(cart.id);
  if (items.length === 0) return { error: 'CART_EMPTY' as const };

  const totals = computeOrderTotals(items);                   // server-side pricing

  let orderId: string;
  let reference: string;

  try {
    await db.transaction(async (tx) => {
      // 1. Lock all size rows we're decrementing — FOR UPDATE
      const sizeIds = items.map(i => i.sizeId);
      const lockedSizes = await tx
        .select()
        .from(productSizes)
        .where(inArray(productSizes.id, sizeIds))
        .for('update');                                       // pessimistic lock

      // 2. Verify stock
      for (const item of items) {
        const size = lockedSizes.find(s => s.id === item.sizeId);
        if (!size || size.stock < item.quantity) {
          throw new OrderError('STOCK_UNAVAILABLE', { sizeId: item.sizeId });
        }
      }

      // 3. Decrement stock
      for (const item of items) {
        await tx.update(productSizes)
          .set({ stock: sql`${productSizes.stock} - ${item.quantity}` })
          .where(eq(productSizes.id, item.sizeId));
      }

      // 4. Insert order (status='pending')
      reference = `ORK-${nanoid(6).toUpperCase()}`;
      const [order] = await tx.insert(orders).values({
        reference,
        email: validated.email,
        status: 'pending',
        subtotalCents: totals.subtotalCents,
        shippingCents: totals.shippingCents,
        vatCents: totals.vatCents,
        totalCents: totals.totalCents,
        ...validated.shipping,
        paymentMethod: validated.paymentMethod,
      }).returning();
      orderId = order.id;

      // 5. Insert order_items (price snapshot)
      await tx.insert(orderItems).values(items.map(i => ({
        orderId,
        productId: i.productId,
        sizeLabel: i.sizeLabel,
        productNameEn: i.product.nameEn,
        productNameAr: i.product.nameAr,
        unitPriceCents: i.product.price * 100,
        quantity: i.quantity,
      })));

      await tx.insert(orderEvents).values({ orderId, type: 'created' });

      // 6. Simulate payment (mock — see UX-08 testing strategy)
      const paymentResult = await simulatePayment(validated);
      if (!paymentResult.success) {
        await tx.insert(orderEvents).values({
          orderId, type: 'payment_failed', metadata: { code: paymentResult.code },
        });
        throw new OrderError('PAYMENT_DECLINED', { code: paymentResult.code });
      }

      // 7. Transition pending → confirmed
      assertTransition('pending', 'confirmed');
      await tx.update(orders).set({ status: 'confirmed', updatedAt: new Date() })
        .where(eq(orders.id, orderId));
      await tx.insert(orderEvents).values({ orderId, type: 'confirmed' });

      // 8. Clear cart
      await tx.delete(cartItems).where(eq(cartItems.cartId, cart.id));
    });
  } catch (err) {
    // Cart preserved (UX-08), errors mapped to user codes (UX-06)
    if (err instanceof OrderError) return { error: err.code };
    throw err; // unexpected — let Next.js error boundary handle
  }

  // 9. POST-COMMIT side effects
  await sendOrderConfirmation(orderId).catch(e => console.error('email failed', e));
  // Email failure is logged but does NOT roll back the order.

  return { orderId: orderId!, reference: reference! };
}
```

Notes:
- `.for('update')` works inside `tx` because the row lock is released only at transaction commit/rollback. [VERIFIED: Drizzle GH #1337]
- Email send is OUTSIDE the transaction. If we sent inside, a Resend timeout would roll back a paid order — never acceptable.
- `simulatePayment()` for this phase is just a function that fails when `phone === '911'` (matching the existing mock contract) or randomly with low probability for testing. Replace with real PSP in a future milestone.

### Pattern 4: Form with react-hook-form + zod + ARIA

**What:** Reusable pattern for the rewritten `ShippingForm`.

**Why:** UX-05 (preserve data on error) is automatic with RHF. UX-06 (no raw errors) is enforced by mapping zod issues to next-intl keys. UX-09 (a11y) requires aria-invalid + aria-describedby — RHF integrates naturally.

**Example:**
```typescript
// src/lib/validation/checkout.ts (shared client+server)
import { z } from 'zod';
export const shippingSchema = z.object({
  firstName: z.string().min(1, 'errors.required').max(50),
  lastName:  z.string().min(1, 'errors.required').max(50),
  email:     z.string().email('errors.email'),
  phone:     z.string().regex(/^\+?966\s?5\d(\s?\d{3}){2}$/, 'errors.phone.ksa'),
  city:      z.string().min(1, 'errors.required'),
  district:  z.string().min(1, 'errors.required'),
  address:   z.string().min(5, 'errors.address.short'),
  apartment: z.string().optional(),
});
export type ShippingInput = z.infer<typeof shippingSchema>;
```

```tsx
// src/components/checkout/ShippingForm.tsx (sketch)
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { shippingSchema, type ShippingInput } from '@/lib/validation/checkout';

export function ShippingForm({ onSubmit, defaultValues }: Props) {
  const t = useTranslations('Checkout');
  const { register, handleSubmit, formState: { errors } } = useForm<ShippingInput>({
    resolver: zodResolver(shippingSchema),
    defaultValues,
    mode: 'onBlur', // validate on blur, not on every keystroke (UX-05 friendly)
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Field id="firstName" label={t('firstName')} error={errors.firstName?.message}>
        <input id="firstName" {...register('firstName')}
          aria-invalid={errors.firstName ? 'true' : undefined}
          aria-describedby={errors.firstName ? 'firstName-error' : undefined}
          className="..." />
      </Field>
      {/* … */}
    </form>
  );
}

function Field({ id, label, error, children }: FieldProps) {
  const t = useTranslations('Checkout');
  return (
    <div>
      <label htmlFor={id} className="...">{label}</label>
      {children}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-red-400 text-xs mt-1">
          {t(error)}
        </p>
      )}
    </div>
  );
}
```

Key WCAG points [VERIFIED: carlrippon.com/accessible-react-forms, react-spectrum.adobe.com/react-aria/Form.html]:
- `aria-invalid={true}` only when there's an error; set to `undefined` (not `false`) when valid to avoid screen reader announcing "invalid: false".
- `aria-describedby` references the error message ID, so screen readers read the error when the field is focused.
- `role="alert"` on the error `<p>` causes immediate announcement when error appears.
- `noValidate` on `<form>` disables browser-native validation so RHF/zod is the single source of truth.

### Pattern 5: Bilingual Email Templates with React Email

**What:** One template component takes `locale` and renders EN or AR copy with correct `dir` attribute on the root `<Html>`.

**Why:** React Email components render to inlined HTML compatible with Gmail/Outlook/Apple Mail. Single component → two languages.

**Example:**
```tsx
// src/lib/email/templates/OrderConfirmation.tsx
import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components';
import type { Locale } from '@/types/domain';

interface Props {
  locale: Locale;
  reference: string;
  customerName: string;
  items: { name: string; qty: number; total: string }[];
  totalFormatted: string;
}

export default function OrderConfirmationEmail({ locale, reference, items, totalFormatted, customerName }: Props) {
  const isRtl = locale === 'ar';
  const t = isRtl ? AR : EN;
  return (
    <Html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
      <Head />
      <Body style={{ fontFamily: isRtl ? '"IBM Plex Arabic", sans-serif' : '"Space Grotesk", sans-serif',
                     backgroundColor: '#000', color: '#fff' }}>
        <Container>
          <Heading>{t.title}</Heading>
          <Text>{t.greeting(customerName)}</Text>
          <Text>{t.referenceLabel}: <strong>{reference}</strong></Text>
          <Hr />
          {items.map(i => (<Text key={i.name}>{i.qty} × {i.name} — {i.total}</Text>))}
          <Hr />
          <Text>{t.totalLabel}: <strong>{totalFormatted}</strong></Text>
        </Container>
      </Body>
    </Html>
  );
}

const EN = { title: 'Order Confirmed', greeting: (n: string) => `Thanks for your order, ${n}.`,
             referenceLabel: 'Order Reference', totalLabel: 'Total' };
const AR = { title: 'تم تأكيد طلبك', greeting: (n: string) => `شكراً لطلبك يا ${n}.`,
             referenceLabel: 'رقم الطلب', totalLabel: 'الإجمالي' };
```

Send with idempotency key:
```typescript
// src/lib/email/send.ts
import 'server-only';
import { Resend } from 'resend';
import OrderConfirmationEmail from './templates/OrderConfirmation';

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function sendOrderConfirmation(orderId: string) {
  // Check order_events for an existing 'email_sent.confirmation' to short-circuit
  // (defense in depth — Resend's idempotency key already covers most cases).
  const order = await getOrderForEmail(orderId);
  const locale = order.locale ?? 'en';

  const { error } = await resend.emails.send({
    from: 'ORKI <orders@orki.sa>',
    to: order.email,
    subject: locale === 'ar' ? 'تم تأكيد طلبك من ORKI' : 'Your ORKI order is confirmed',
    react: OrderConfirmationEmail({ locale, reference: order.reference, /* … */ }),
    headers: { 'X-Entity-Ref-ID': order.reference },
    // Format: <event-type>/<entity-id>; max 256 chars; expires after 24h
    // Same key + same payload => Resend returns original response (no resend)
    // Same key + different payload => 409 [CITED: resend.com/docs]
  } as any);
  // Note: idempotencyKey field — verify exact field name in resend@6.12.3 SDK at install time.

  if (error) {
    await db.insert(orderEvents).values({ orderId, type: 'email_send_failed',
      metadata: { error: error.message } });
    return;
  }
  await db.insert(orderEvents).values({ orderId, type: 'email_sent.confirmation' });
}
```

[VERIFIED: Resend docs — idempotency key format is `<event-type>/<entity-id>`, expires after 24h, max 256 chars]

### Anti-Patterns to Avoid

- **Hand-rolling cookie parsing/setting** — use `cookies()` from `next/headers`; never `document.cookie` for the session ID.
- **Storing cart in JWT** — JWTs are not revocable. Use opaque session ID + DB row.
- **Computing totals client-side as the source of truth** — client can be tampered with. Server is authoritative.
- **Sending email inside the DB transaction** — a network failure to Resend would roll back a paid order.
- **Returning `error.message` from a thrown DB error** — leaks SQL/internal info (UX-06 violation). Always map to a `code` enum and translate client-side.
- **Clearing cart before order is confirmed** — violates UX-08 (failure recovery). Cart deletion is the LAST step inside the transaction.
- **Decrementing stock without `FOR UPDATE`** — race condition: two concurrent checkouts read stock=1, both decrement, end up at -1.
- **Trusting `productSizes.stock` to never go negative without a check constraint** — add `CHECK (stock >= 0)` to the column or guard in app code (currently the schema has no such check).
- **Using `"use client"` on the entire checkout page when only the form needs it** — split server-rendered shell from client-interactive form.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Form state + validation + ARIA | Custom `useState` form with manual error tracking (current `ShippingForm`) | react-hook-form + zod + @hookform/resolvers | Touched/dirty/error tracking, focus-on-error, controlled-vs-uncontrolled edge cases — RHF solves all of this; it's why every modern React stack uses it. |
| Email HTML templates | Hand-written HTML strings or `nodemailer` | Resend + React Email | Email client compat is a swamp (Outlook table-based layout, dark mode quirks, Gmail clipping). React Email components handle the inline-styles + table-layout details. |
| Email idempotency | Custom dedup table + lookup | Resend's built-in `idempotencyKey` | Resend stores the idempotency key for 24h server-side; same payload → cached response, different payload → 409. [CITED: resend.com/docs/dashboard/emails/idempotency-keys] |
| Order ID generation | Auto-increment integers exposed publicly, or `Date.now()` | `nanoid` for the reference column, UUID for the primary key | Auto-increment leaks order volume; `Date.now()` collides under concurrency; nanoid is collision-resistant and URL-safe. |
| Stock reservation | Application-level mutex (in-memory or Redis) | Postgres `SELECT … FOR UPDATE` inside `db.transaction` | DB-level locking is tied to the transaction lifecycle — release on commit/rollback is automatic. App-level locks leak on crash. [CITED: drizzle-orm GH #1337] |
| Money math | `number` (float) for prices | Integer halalas + format at display | Floats accumulate rounding error: `0.1 + 0.2 !== 0.3`. Always integer cents. |
| KSA phone validation | Hand-rolled regex variants | Single shared regex `/^\+?966\s?5\d(\s?\d{3}){2}$/` in `lib/validation/checkout.ts` (or `libphonenumber-js` if requirements grow) | One canonical regex prevents drift; `libphonenumber-js` if international support arrives. |
| State machine | XState (full library) | Hand-written transition table | At 6 states / 7 transitions, a typed `Record<Status, Status[]>` is clearer and ships in 30 LOC. |
| Localized SAR currency formatting | Manual string concatenation | `Intl.NumberFormat('ar-SA-u-nu-latn', { style: 'currency', currency: 'SAR' })` | Already specified in CLAUDE.md; matches both locales with Western numerals. |

**Key insight:** Phase 8 is mostly about *wiring established libraries together correctly* — not building primitives. The areas worth custom code are the order state machine (small, unique to ORKI's flow) and the cart session helper (project-specific cookie strategy).

---

## Runtime State Inventory

> **Trigger:** Phase 8 is greenfield ADD (new tables, new actions). Not a rename. But there IS one rename-adjacent concern: deprecating the localStorage cart.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | `localStorage['orki-cart']` from Zustand persist middleware (set in `src/store/cartStore.ts:64` as `name: 'orki-cart'`). Existing users will have stale carts in localStorage when this phase ships. | **One-shot migration:** on cart-store hydration, if `localStorage['orki-cart']` exists AND has items, POST it to a `migrateLocalStorageCart` Server Action that inserts items into the DB cart, then `localStorage.removeItem('orki-cart')`. |
| Live service config | None (no production deploys with paid customers yet). | None. |
| OS-registered state | None. | None. |
| Secrets/env vars | NEW: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, optional `ORKI_BASE_URL` for email links. Add to `.env.local`, `.env.example`, and Vercel env. | Add to `src/lib/env.ts` zod schema. |
| Build artifacts | Existing `/api/checkout/mock/route.ts` becomes vestigial after the Server Action takes over. | Leave the route handler in place but mark deprecated; keep until verifier confirms migration; then delete in a follow-up plan. |

**Nothing found in category:** OS-registered state, live service config — verified by inspection of `src/middleware.ts`, scripts directory, and the absence of any external service registrations referencing the old cart system.

---

## Common Pitfalls

### Pitfall 1: Next.js 15 cookies() is async
**What goes wrong:** Code written for Next 14 (`const c = cookies()`) silently returns a Promise in Next 15, leading to "cookies.get is not a function" errors at runtime — but only sometimes, depending on optimization.
**Why it happens:** Next 15 made `cookies()`, `headers()`, and `params` async to support PPR. [VERIFIED: nextjs.org/docs/app/api-reference/functions/cookies]
**How to avoid:** Always `await cookies()`. Codify in `lib/cart/session.ts` so consumers don't need to think about it.
**Warning signs:** TypeScript error "Property 'get' does not exist on type 'Promise<…>'", or runtime `TypeError`.

### Pitfall 2: Server-Component cookie write
**What goes wrong:** Trying to set the cart-session cookie from a Server Component (e.g., the cart page) throws.
**Why it happens:** Next.js prohibits cookie writes outside Server Actions, Route Handlers, and Middleware to keep RSC pure. [VERIFIED: nextjs.org/docs/app/guides/authentication]
**How to avoid:** Mint the cookie either (a) in middleware on first visit, or (b) on first cart mutation server action. Recommend (b).
**Warning signs:** "Cookies can only be modified in a Server Action or Route Handler" error.

### Pitfall 3: Race between Zustand hydration and server cart
**What goes wrong:** User adds item on Browser A while logged out, then on Browser B; Zustand stores both versions, hydration order picks wrong one.
**Why it happens:** Zustand's persist middleware hydrates from localStorage on mount, regardless of server data.
**How to avoid:** After this phase, REMOVE the `persist` middleware from `cartStore.ts`. Cart is hydrated from a server-rendered `<CartProvider initial={…}>` on every page load. localStorage migration runs ONCE on the first load post-deploy, then never again.
**Warning signs:** Cart count differs between SSR and CSR; flash of wrong cart contents.

### Pitfall 4: Stock decrement double-spend
**What goes wrong:** Two checkouts hit `productSizes` simultaneously, both read `stock = 1`, both decrement to 0, oversell happens.
**Why it happens:** Without `FOR UPDATE`, both reads see committed=1 because Postgres MVCC.
**How to avoid:** `.for('update')` on the SELECT inside the transaction. This is the entire reason ECOM-01 (Phase 7) and ECOM-02 (Phase 8) intersect — Phase 7 added stock counts but did NOT add reservation logic. **This phase is where reservation actually lands.**
**Warning signs:** Sporadic `stock = -1` rows in the DB; oversold orders.

> ⚠️ **Cross-phase verification finding:** Phase 7's SUMMARY.md describes "low stock" UI and admin stock editing, but does NOT mention atomic stock reservation. The codebase confirms this — `src/app/actions/admin.ts` has `updateSizeInventory` for admin edits, but no checkout-side stock decrement exists. **Phase 8 plans must explicitly include the FOR UPDATE pattern; do not assume it's already there.**

### Pitfall 5: VAT calculation order
**What goes wrong:** Tax computed on subtotal only, missing the VAT on shipping. ZATCA expects 15% on (subtotal + shipping). [CITED: zatca.gov.sa]
**Why it happens:** Naïve "tax = subtotal * 0.15" misses delivery fee inclusion.
**How to avoid:** `vat = round((subtotal + shipping) * 0.15)`. Test with a fixture where shipping is non-zero. Round halalas using banker's rounding or floor — pick one, document it, stick with it.
**Warning signs:** Total mismatch with ZATCA-compliant invoice generators (won't matter this phase since no e-invoicing yet, but matters at audit time).

### Pitfall 6: Email send before transaction commit
**What goes wrong:** Customer gets confirmation email for an order that rolled back due to a downstream error.
**Why it happens:** Email send inside `db.transaction()` runs even if the surrounding code throws after.
**How to avoid:** Email send is the FIRST line AFTER the `await db.transaction(…)` call returns successfully. If email throws, log to `order_events.email_send_failed` but do not roll back the order.
**Warning signs:** "Where's my order?" support tickets when the order doesn't exist in the DB.

### Pitfall 7: Locale-aware email but no locale in cart session
**What goes wrong:** Email sends in EN even though customer browsed/checked out in AR.
**Why it happens:** The cart session row doesn't store the user's locale. Email send picks a default.
**How to avoid:** Snapshot the user's locale on the order itself. Add `orders.locale: text` (or store in metadata column). Read it during email send.
**Warning signs:** AR customers receive EN emails; customer complaints; A/B confusion.

### Pitfall 8: 44×44 tap target on PaymentGrid cards
**What goes wrong:** Existing `PaymentGrid` uses `p-6` which is 24px padding — the icon + text inside is small; the button itself is large enough at desktop but at narrow mobile widths could squeeze.
**Why it happens:** No explicit min-height set.
**How to avoid:** Add `min-h-[88px]` (or `min-h-22`) to the `<button>` and verify with DevTools mobile inspector at 320px width.
**Warning signs:** Lighthouse a11y audit flags "Tap targets are not sized appropriately."

### Pitfall 9: RTL focus order on multi-step checkout
**What goes wrong:** When step 1 collapses (read-only summary) and step 2 expands, focus stays on the now-hidden submit button in step 1; screen reader says nothing.
**Why it happens:** No focus management on step transition.
**How to avoid:** On `setStep(2)`, use `useEffect` + `ref.current.focus()` to move focus to the first input/control in step 2. Add `role="status"` `aria-live="polite"` region that announces "Step 2 of 2: Payment".
**Warning signs:** axe-core / @testing-library a11y rules flag missing focus management.

### Pitfall 10: Drizzle `.for('update')` undocumented but real
**What goes wrong:** Developer searches Drizzle docs, doesn't find FOR UPDATE, assumes it's not supported, builds an app-level mutex.
**Why it happens:** Drizzle has `.for('update')` but it's undocumented as of this research date. [CITED: drizzle-orm GH #2875 "[FEATURE]: Document SELECT FOR UPDATE"]
**How to avoid:** Trust the GH discussion (#1337) and the codebase tests. Verify with a local test that two concurrent transactions block as expected.
**Warning signs:** Concurrent test passes when it shouldn't (no blocking).

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `cookies()` synchronous | `cookies()` async | Next.js 15 (Oct 2024) | Must `await`. Older copy-paste code breaks. |
| `useState` + manual validation | react-hook-form + zod | RHF v7 (~2021), zod v3+ | Smaller bundle, better DX, automatic ARIA. |
| nodemailer SMTP | Resend / Postmark API | ~2023 | Idempotency, deliverability, React templates. |
| Stateless JWT for cart | Opaque session + DB lookup | Industry shift toward revocable sessions (~2022) | Simpler invalidation, no key-rotation pain. |
| Float SAR/USD | Integer cents/halalas | Long-standing | Avoids `0.1 + 0.2 !== 0.3` errors. |

**Deprecated/outdated:**
- Calling `cookies()` without `await` in Next 15 — silently broken.
- Yup as form validator — superseded by zod everywhere except legacy codebases.
- nodemailer for transactional email at scale — no built-in idempotency, deliverability worse than Resend/Postmark.

---

## Code Examples

### Compute Order Totals (server-only, single source of truth)
```typescript
// src/lib/orders/pricing.ts
import 'server-only';

const VAT_RATE = 0.15;        // KSA standard rate [VERIFIED: zatca.gov.sa]
const FLAT_SHIPPING_CENTS = 2500; // 25 SAR — placeholder. Make env-configurable.
const FREE_SHIPPING_THRESHOLD_CENTS = 30000; // 300 SAR free shipping above this

export interface PricingInput {
  unitPriceCents: number;
  quantity: number;
}

export interface OrderTotals {
  subtotalCents: number;
  shippingCents: number;
  vatCents: number;
  totalCents: number;
}

export function computeOrderTotals(items: PricingInput[]): OrderTotals {
  const subtotalCents = items.reduce((sum, i) => sum + i.unitPriceCents * i.quantity, 0);
  const shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
  // VAT applies to subtotal + shipping per ZATCA. [CITED: zatca.gov.sa]
  const vatCents = Math.round((subtotalCents + shippingCents) * VAT_RATE);
  const totalCents = subtotalCents + shippingCents + vatCents;
  return { subtotalCents, shippingCents, vatCents, totalCents };
}

export function formatSAR(cents: number, locale: 'en' | 'ar'): string {
  // 'ar-SA-u-nu-latn' forces Western numerals in both locales — per CLAUDE.md
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA', {
    style: 'currency', currency: 'SAR', maximumFractionDigits: 2,
  }).format(cents / 100);
}
```

### Order Reference Generation
```typescript
// nanoid 5 is ESM-only — verify import. [VERIFIED: npm view nanoid]
import { customAlphabet } from 'nanoid';
const orderRef = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6);
// excludes 0/O/1/I/L for human readability; 32^6 = ~1B combinations
export function generateOrderReference(): string {
  return `ORK-${orderRef()}`;
}
```

### Drizzle Transaction with FOR UPDATE (verified syntax)
```typescript
// [VERIFIED: Drizzle GH discussion #1337]
const lockedRows = await tx
  .select()
  .from(productSizes)
  .where(inArray(productSizes.id, sizeIds))
  .for('update');
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Postgres (Neon prod / local dev) | Cart, orders schema | ✓ | — | — |
| Drizzle CLI | Migration generation | ✓ (drizzle-kit 0.31.10) | — | — |
| Resend API key | ECOM-03 transactional email | ✗ | — | Stub `sendOrderConfirmation` to no-op + log; gate behind env check so missing key doesn't crash. |
| Verified Resend domain (orki.sa or similar) | Inbox deliverability | ✗ | — | Use `onboarding@resend.dev` for dev/staging; require verified domain before production rollout. |
| RESEND_FROM_EMAIL env var | Send `from` header | ✗ | — | Add to `lib/env.ts`. |
| Node 18+ runtime | Resend SDK requires Node 18+ | ✓ (Vercel default) | — | — |

**Missing dependencies with no fallback:** None blocking development.

**Missing dependencies with fallback:**
- Resend API key + verified domain — gate the email send behind `if (env.RESEND_API_KEY)` so local dev and PR preview deploys don't fail. Plan a "production email setup" task as a checklist item before launch.

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.5 + @testing-library/react 16.3.2 + @testing-library/user-event 14.6.1 + jsdom 29.1.1 (already in devDependencies) |
| Config file | None detected at repo root — see Wave 0 |
| Quick run command | `npx vitest run --reporter=basic` (until config exists) |
| Full suite command | `npm test` (need to add `"test": "vitest"` to package.json scripts) |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| UX-01 | Place order without user account | integration (server action against test DB) | `npx vitest run tests/orders/place-order-guest.test.ts` | ❌ Wave 0 |
| UX-02 | Step indicator shows current step | unit (component) | `npx vitest run tests/checkout/CheckoutSteps.test.tsx` | ❌ Wave 0 |
| UX-03 | Total includes shipping + VAT | unit (pure pricing fn) | `npx vitest run tests/orders/pricing.test.ts` | ❌ Wave 0 |
| UX-04 | All checkout buttons ≥ 44px | unit (computed style snapshot) | `npx vitest run tests/checkout/tap-targets.test.tsx` | ❌ Wave 0 |
| UX-05 | Form preserves data on validation error | unit (RTL with userEvent) | `npx vitest run tests/checkout/ShippingForm.test.tsx` | ❌ Wave 0 |
| UX-06 | Server error returns code, not message | integration | `npx vitest run tests/orders/error-mapping.test.ts` | ❌ Wave 0 |
| UX-07 | Trust signals render near submit button | unit (component) | `npx vitest run tests/checkout/TrustSignals.test.tsx` | ❌ Wave 0 |
| UX-08 | Cart preserved when payment fails | integration | `npx vitest run tests/orders/payment-failure-preserves-cart.test.ts` | ❌ Wave 0 |
| UX-09 | aria-invalid + describedby on errors | unit (RTL) | `npx vitest run tests/checkout/a11y.test.tsx` | ❌ Wave 0 |
| ECOM-02 | Illegal transition throws | unit | `npx vitest run tests/orders/state-machine.test.ts` | ❌ Wave 0 |
| ECOM-02 | Concurrent checkouts can't oversell | integration (two parallel txns) | `npx vitest run tests/orders/concurrent-stock.test.ts` | ❌ Wave 0 |
| ECOM-03 | Email idempotency — second send is no-op | integration (mocked Resend) | `npx vitest run tests/email/idempotency.test.ts` | ❌ Wave 0 |
| ECOM-04 | Cancel from confirmed → cancelled writes event | integration | `npx vitest run tests/orders/cancel.test.ts` | ❌ Wave 0 |
| ECOM-04 | Refund from delivered → refunded writes event | integration | `npx vitest run tests/orders/refund.test.ts` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run --reporter=basic` (full unit + integration suite)
- **Per wave merge:** `npx vitest run --reporter=verbose --coverage`
- **Phase gate:** Full suite green + manual UAT in `08-UAT.md` before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `vitest.config.ts` — set up jsdom environment, path aliases, test DB env var
- [ ] `tests/setup.ts` — global RTL setup (jest-dom matchers, MSW handlers if used)
- [ ] `tests/helpers/test-db.ts` — spin up a test schema (truncate-between-tests pattern), reuse Drizzle migrations
- [ ] `tests/helpers/factories.ts` — order/cart/product factories
- [ ] `package.json` — add `"test": "vitest"`, `"test:watch": "vitest watch"` scripts
- [ ] Each test file listed above (one per requirement at minimum)

---

## Security Domain

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | partially (Phase 10 owns user auth; this phase handles cart sessions) | httpOnly + Secure + SameSite=Lax cookie; opaque random session ID (nanoid 32); no PII in cookie value |
| V3 Session Management | yes | 90-day max-age; rotate session ID on order placement (recommended, optional this phase); no fixation since session is mint-on-first-write |
| V4 Access Control | yes | Cart server actions check `cart.sessionId === cookie.sessionId`; admin order actions are gated behind admin route group (Phase 6) |
| V5 Input Validation | yes | zod schemas applied server-side in every Server Action; `noValidate` on `<form>` so server validation is not optional |
| V6 Cryptography | partially | nanoid uses CSPRNG (`crypto.randomFillSync`); no custom crypto in this phase |
| V11 Business Logic | yes | Order state machine enforces transition validity; price snapshots prevent post-purchase price manipulation; stock locking prevents race conditions |
| V13 API Security | yes | Server Actions are Next.js's CSRF-by-default mechanism (origin check); rate limiting deferred to Phase 9 |

### Known Threat Patterns for Next.js + Postgres + Server Actions
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| SQL injection | Tampering | Drizzle parameterized queries (already in use; INFRA-02 covered) |
| Cart hijack via cookie theft | Spoofing/IDR | httpOnly + Secure cookie; opaque session ID (no PII); short-ish max-age |
| Price tampering at checkout | Tampering | Server-side `computeOrderTotals` is authoritative; client values are advisory only |
| Stock oversell | Race condition | `SELECT … FOR UPDATE` inside `db.transaction` |
| Order replay (multiple submits) | Tampering | Idempotency: client disables submit during in-flight; server checks for existing pending order with same cart hash (advanced — defer); duplicate emails prevented by Resend idempotency key |
| XSS via product/order display | Tampering | React's default escaping; never `dangerouslySetInnerHTML` on customer data |
| Unverified email recipient | Spoofing | Verified Resend domain required for prod; SPF/DKIM/DMARC handled by Resend |
| State machine bypass via direct DB manipulation | Tampering | pgEnum prevents invalid status strings; admin actions go through `assertTransition`; defense-in-depth via order_events audit log |
| Information disclosure in error messages | Information Disclosure | UX-06: errors return `{ code: ENUM }` only; `error.message` never reaches client |
| Brute-force order reference enumeration | Information Disclosure | nanoid 6 chars from 32-alphabet ≈ 10⁹ space; combined with email check on confirmation page lookup, makes enumeration impractical |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Hand-written FSM is preferable to XState at this scale | Standard Stack / Pattern 2 | If lifecycle grows past ~10 states, refactor pressure. Low cost — the transition table is replaced by an XState machine in one file. |
| A2 | 25 SAR flat shipping is the right number | Pricing example | Phase 8 succeeds either way; the value is config-driven. Flag for `/gsd-discuss-phase 8` to confirm with stakeholder. |
| A3 | Free shipping threshold of 300 SAR | Pricing example | Same as A2 — discuss with stakeholder. Marketing/pricing decision, not engineering. |
| A4 | Resend is the right choice over Postmark | Standard Stack | Switching providers post-launch is medium-effort (templates port; idempotency-key shape differs). Confirm in `/gsd-discuss-phase 8`. |
| A5 | `orders` table embeds shipping address rather than normalizing into `addresses` | Schema | Phase 10 adds user-saved addresses; normalization may become useful then. Easy to migrate later. |
| A6 | Cart session lifetime of 90 days | Cookie helper | If too short, customer loses cart; if too long, stale data accumulates. 90 days is the common ecommerce default. |
| A7 | "ORK-" prefix + 6 nanoid chars (≈10⁹ space) is sufficiently unique for v1 launch volume | Pattern 3 / generateOrderReference | At low volume, no collision. If volume scales 100x, increase to 8 chars. |
| A8 | Phase 7 did NOT add stock reservation logic — only display | Pitfall 4 / cross-phase note | Verified by grep of `src/lib`/`src/app/actions` for `for('update')` and `transaction(` — not present. Confidence HIGH. |
| A9 | Single-page checkout (existing 2-step `useState`) satisfies UX-02 if augmented with progress bar | Phase requirement table | An alternative is a multi-route flow (`/checkout/shipping` → `/checkout/payment`). Recommend keeping single page; cleaner state model and faster perceived flow. |
| A10 | Email locale is captured at order placement time, not from email recipient preferences | Pitfall 7 | Future preference-center feature could override; for v1 the current-session locale is the right snapshot. |
| A11 | The CHECK constraint approach for state validation is unnecessary because `pgEnum` already restricts the column to legal values; transition validity stays in app code | Pattern 2 | If a rogue raw SQL update bypasses the app, defense breaks. Add a Postgres trigger as a follow-up if it ever becomes a concern. |
| A12 | Existing `/api/checkout/mock` route can be deprecated rather than deleted in this phase | Project structure | Keeping it around lets us A/B the new Server Action flow. Delete after verifier confirms green. |

---

## Open Questions

1. **Should the state machine include `failed` as a terminal state?**
   - What we know: Right now, payment-decline rolls back the transaction so no `pending` order exists. But if requirements change (e.g., we want to keep failed-payment orders in the DB for retry), we need a `failed` state.
   - What's unclear: Whether Phase 8's "preserve cart on failure" implies "preserve order intent" too.
   - Recommendation: Start with rollback-on-failure (no `failed` state); revisit if retry-after-failure becomes a requirement. Surface in `/gsd-discuss-phase 8`.

2. **Cart-merge strategy when Phase 10 auth lands**
   - What we know: Today, cart is keyed by session cookie. When user logs in (Phase 10), we'll have both a guest cart (cookie) and a possible existing user cart (logged-in user's previous session).
   - What's unclear: Merge strategy — concatenate items? Prefer newer? Replace?
   - Recommendation: Out of scope this phase. Document the data shape (carts.userId nullable) so Phase 10 can implement merge cleanly. Add a `// TODO(phase-10): merge guest+user cart on login` comment.

3. **Should OrderConfirmation email include a magic-link order tracking URL?**
   - What we know: Without auth, customers can't log in to see order history.
   - What's unclear: Whether to add a signed token in the email link (`/order/{ref}?token=…`) for limited-time access.
   - Recommendation: For Phase 8, the email shows the order reference; the `/order/{ref}` route requires a confirmation email match (lookup by `ref` AND `email` query param). Defer signed-token magic links until traffic justifies it.

4. **Inventory release on cancel/refund?**
   - What we know: Cancel from `confirmed` should release stock back. Refund from `delivered` is more nuanced — usually stock has shipped and is not recoverable.
   - What's unclear: Business policy for cancel-after-shipped (rare but possible).
   - Recommendation: `cancelled` releases stock; `refunded` does NOT release stock by default (admin can manually adjust if returned). Document in state-machine.ts comments.

5. **VAT-inclusive vs VAT-exclusive product prices**
   - What we know: Existing `products.price` is integer SAR but the schema doesn't specify whether it's VAT-inclusive.
   - What's unclear: Stakeholder intent.
   - Recommendation: Treat `products.price` as VAT-exclusive for consistency with the current OrderSummary "Subtotal / Shipping / Free / Total" UI. If business wants VAT-inclusive prices, the change is a single line in `computeOrderTotals` (skip VAT addition or split out tax-inclusive). Surface in `/gsd-discuss-phase 8`.

6. **Order events: per-event uniqueness vs append-only log**
   - What we know: Some events (state transitions) should be append-only; others (`email_sent.confirmation`) should be unique per (orderId, type).
   - What's unclear: Whether to use one table with conditional uniqueness, or split into `order_state_log` and `order_email_log`.
   - Recommendation: One table; uniqueness enforced at the application layer (check before insert) for events that need it. Simpler schema; the alternative bloats the data model.

---

## Sources

### Primary (HIGH confidence)
- Context7 `/drizzle-team/drizzle-orm-docs` — transactions, isolation levels, custom seed migrations
- Context7 `/websites/resend` — idempotency keys, error handling, retry strategy
- nextjs.org/docs/app/api-reference/functions/cookies — Next 15 async cookies API
- nextjs.org/docs/app/guides/authentication — cookie-write restrictions
- zatca.gov.sa — KSA VAT 15% rate, shipping included in taxable base
- npm registry — verified versions for zod 4.4.3, react-hook-form 7.75.0, @hookform/resolvers 5.2.2, resend 6.12.3, @react-email/components 1.0.12, nanoid 5.1.11, sonner 2.0.7

### Secondary (MEDIUM confidence)
- github.com/drizzle-team/drizzle-orm/discussions/1337 — `.for('update')` syntax confirmed in maintainer reply
- github.com/drizzle-team/drizzle-orm/issues/2875 — feature request to document FOR UPDATE (confirms it works but is undocumented)
- carlrippon.com/accessible-react-forms — aria-invalid + aria-describedby pattern
- react-spectrum.adobe.com/react-aria/Form.html — accessible form patterns
- felixge.de/2017/07/27/implementing-state-machines-in-postgresql — DB-level FSM tradeoffs
- postmarkapp.com/compare/resend-alternative — provider deliverability comparison (vendor-biased)
- sequenzy.com/versus/resend-vs-postmark — provider comparison
- Aramex KSA shipping rates ≈ 60–65 SAR per package — used to inform 25 SAR flat-rate placeholder (we charge less than full courier rate as a typical retailer subsidy)

### Tertiary (LOW confidence)
- General assumption that 6-character nanoid order references are sufficient for v1 launch — based on industry convention for low-volume DTC shops

---

## Project Constraints (from CLAUDE.md)

The following directives from `CLAUDE.md` apply to all Phase 8 work and override stylistic discretion:

- **Logical CSS properties only:** `ms-`, `me-`, `ps-`, `pe-`, `inline-start`, `inline-end`. NEVER `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` as directional styles. Audit every new component.
- **Both `lang` AND `dir`** must be set on `<html>` atomically when locale changes — applies to email templates too (`<Html lang dir>`).
- **Animations must be direction-aware** (already established with the existing `ArrowLeft`/`ArrowRight` swap pattern).
- **Data layer contract:** All product reads go through `src/lib/products.ts`. Phase 8 introduces `src/lib/cart/server.ts` and `src/lib/orders/server.ts` as the analogous canonical entry points for cart and orders. Components MUST NOT import Drizzle tables directly.
- **TypeScript domain types in `src/types/domain.ts`** stay the contract. Phase 8 should ADD new types there (e.g., `Order`, `OrderItem`, `OrderStatus`) — do not invent parallel types in feature folders.
- **Black/white only** — for the order confirmation email, the dark-first palette must carry through to email rendering (gray fallback for clients that strip backgrounds — TODO).
- **44×44 minimum tap targets** — applies to PaymentGrid, step-edit links, trust-signal icons (if interactive), and email CTAs.
- **`Intl.NumberFormat('ar-SA-u-nu-latn', { style: 'currency', currency: 'SAR' })`** — reuse the existing pattern; do not invent ad-hoc formatting.
- **Frontend-first principle is now relaxing:** v2.0 milestone explicitly connects backend; Phase 8 is the largest backend addition yet. The principle now means "pre-existing frontend types/components stay stable; backend conforms to them."
- **Tech stack lock:** Next 15 App Router, Tailwind v4, shadcn/ui, Motion, GSAP, next-intl, Zustand. Do NOT introduce React Query, tRPC, or alternative form libraries.
- **Phase order non-negotiable:** Phase 8 cannot merge until Phase 7's blocker (cold-start Drizzle relational query failure flagged in `07-UAT.md` test #1) is resolved. Confirm Phase 7 verifier-green before kicking off Phase 8 plans.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — every package version verified against npm registry on 2026-05-09; APIs verified against Context7 and project docs.
- Architecture: HIGH — patterns are direct applications of well-established Next.js 15 / Drizzle / Resend conventions, validated against multiple authoritative sources.
- Schema: HIGH — additive only; aligns with existing `products.id` text PK pattern and `productSizes.id` UUID pattern.
- State machine: HIGH — small enough to specify completely in this document.
- Pricing (KSA VAT 15%, shipping in taxable base): HIGH — directly cited from ZATCA.
- Pricing (flat shipping rate, free-ship threshold): LOW — placeholder values, must be confirmed in `/gsd-discuss-phase 8`.
- Email provider choice: MEDIUM — both Resend and Postmark would work; recommendation is defensible but stakeholder may have preference.
- Concurrent stock test viability with Vitest + a single test DB: MEDIUM — needs Wave 0 verification that `pg_isolated` schema-per-test or transaction rollback patterns are set up cleanly.
- Phase 10 auth refactor surface: LOW — speculative; flagged in Open Questions.

**Research date:** 2026-05-09
**Valid until:** 2026-06-09 (30 days for stable libraries) / 2026-05-23 (14 days for the Resend SDK changelog, which moves quickly)

---

## RESEARCH COMPLETE
