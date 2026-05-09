---
phase: 08-cart-checkout-orders
plan: 01
type: execute
wave: 0
depends_on: []
files_modified:
  - src/lib/db/schema.ts
  - src/lib/db/migrations/0001_phase8_cart_orders.sql
  - src/lib/db/migrations/meta/_journal.json
  - src/lib/db/migrations/meta/0001_snapshot.json
  - src/types/domain.ts
autonomous: true
requirements: [ECOM-02, ECOM-04]
must_haves:
  truths:
    - "Drizzle schema includes carts, cart_items, orders, order_items, order_events tables"
    - "order_status pgEnum exists with exactly six values: pending, confirmed, shipped, delivered, cancelled, refunded"
    - "All money columns on orders/order_items are integer halalas (no numeric/float)"
    - "After db:push, the live database has all five new tables and the order_status enum"
    - "Indexes exist for ECOM-06: orders.reference (unique), orders.userId, orders.email, orders.status, order_items.productId, cart_items.cartId"
  artifacts:
    - path: "src/lib/db/schema.ts"
      provides: "carts, cartItems, orders, orderItems, orderEvents tables + orderStatusEnum + relations + Row types"
      contains: "pgEnum('order_status'"
    - path: "src/lib/db/migrations/0001_phase8_cart_orders.sql"
      provides: "Generated SQL for new tables + enum"
      contains: "CREATE TYPE \"public\".\"order_status\""
    - path: "src/types/domain.ts"
      provides: "OrderStatus, Cart, CartItem (server), Order, OrderItem, OrderEvent domain types"
  key_links:
    - from: "src/lib/db/schema.ts"
      to: "src/lib/db/migrations/0001_phase8_cart_orders.sql"
      via: "drizzle-kit generate"
      pattern: "CREATE TABLE \"carts\""
    - from: "live Postgres DB"
      to: "drizzle-kit push"
      via: "npm run db:push"
      pattern: "applied"
---

<objective>
Add Phase 8 schema (carts, cart_items, orders, order_items, order_events) plus the order_status pgEnum to Drizzle, generate the migration, and push it to the live DB. This unblocks every other Plan 08-* — they all import the new tables.

Purpose: Persistence foundation for cart, orders, audit log, and refund/cancellation bookkeeping. All money is stored as integer halalas (1 SAR = 100 halalas) to avoid float drift (per CONTEXT.md "Money & pricing").

Output: Schema file extended, migration committed, live DB has the new tables + enum so Wave 1 plans can compile and run.
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
@src/lib/db/migrations/0000_furry_ink.sql

<interfaces>
<!-- Existing schema imports (extend, don't replace) -->

From src/lib/db/schema.ts (current import line):
```typescript
import {
  pgTable,
  text,
  boolean,
  integer,
  timestamp,
  uuid,
  index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
```

ADD: `pgEnum`, `uniqueIndex`, `jsonb` to that import.

Existing FK pattern (productSizes.productId, line 60-62):
```typescript
productId: text('product_id')
  .notNull()
  .references(() => products.id, { onDelete: 'cascade' }),
```

Existing relations pattern (line 50-53):
```typescript
export const productsRelations = relations(products, ({ many }) => ({
  sizes: many(productSizes),
  images: many(productImages),
}));
```

Stock column on productSizes (line 65) is `stock` — NOT `quantity`. Phase 8 cart_items uses `quantity` (its own column).
</interfaces>
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Extend schema.ts with carts, cart_items, orders, order_items, order_events + pgEnum + relations + Row types</name>
  <files>src/lib/db/schema.ts, src/types/domain.ts</files>
  <read_first>
    - src/lib/db/schema.ts (entire file — see existing products/productSizes/productImages patterns)
    - src/lib/db/migrations/0000_furry_ink.sql (existing migration shape)
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 256-388 (authoritative table definitions)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Persistence model" + "Order state machine" + "Money & pricing" + "Order references" sections
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md lines 103-176 (schema extension pattern map)
    - src/types/domain.ts (existing Product, Size, CartItem types — extend, do not break)
  </read_first>
  <behavior>
    - schema.ts compiles with no TS errors (all imports present, no duplicate exports)
    - `orderStatusEnum` is an exported pgEnum with EXACTLY values `['pending','confirmed','shipped','delivered','cancelled','refunded']` in that order
    - `carts.sessionId` is unique and indexed; `carts.userId` is nullable (text, no FK — Phase 10 deferred)
    - `cartItems` has unique composite index on (cartId, productId, sizeId) for UPSERT on add-to-cart
    - `orders.reference` is text, unique, indexed; status defaults to 'pending'
    - `orders.subtotalCents`, `shippingCents`, `vatCents`, `totalCents` are all `integer().notNull()` (halalas)
    - `orders.locale` is `text().notNull()` (snapshot of cart locale at submit — used by email send)
    - `orders.userId` is text nullable (Phase 10 readiness)
    - `orderItems.unitPriceCents` is integer halalas (snapshot, never float)
    - `orderEvents` has `metadata jsonb` (nullable); index on (orderId), (type); composite (orderId, type) is NON-unique because some types fire multiple times (state changes)
    - All five new tables have `relations()` declarations
    - `CartRow`, `NewCartRow`, `CartItemRow`, `NewCartItemRow`, `OrderRow`, `NewOrderRow`, `OrderItemRow`, `NewOrderItemRow`, `OrderEventRow`, `NewOrderEventRow` types exported via `$inferSelect` / `$inferInsert`
    - src/types/domain.ts adds: `OrderStatus = 'pending'|'confirmed'|'shipped'|'delivered'|'cancelled'|'refunded'`; `Cart` (id, sessionId, userId, items, updatedAt); domain `CartItem` server shape (productId, sizeId, sizeLabel, quantity, product); `Order` (id, reference, email, status, locale, subtotalCents, shippingCents, vatCents, totalCents, currency, paymentMethod, shipping fields, items, events, placedAt, updatedAt); `OrderItem`; `OrderEvent`. The EXISTING client-side `CartItem` interface MUST stay backward-compatible (used by Zustand store) — if a name conflict exists, add the new server shape as `ServerCartItem`.
  </behavior>
  <action>
    Open `src/lib/db/schema.ts`. Replace the import block (lines 10-19) with:

    ```typescript
    import {
      pgTable,
      pgEnum,
      text,
      boolean,
      integer,
      timestamp,
      uuid,
      index,
      uniqueIndex,
      jsonb,
    } from 'drizzle-orm/pg-core';
    import { relations } from 'drizzle-orm';
    ```

    APPEND (after the existing productImages section, before the type-export tail at line 99) the following blocks verbatim, then move the type-export tail (`ProductRow`, etc.) to remain at the end and add the new Row types:

    ```typescript
    // ─── Carts ────────────────────────────────────────────────────────────────────

    export const carts = pgTable(
      'carts',
      {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Opaque session id stored in orki_sid httpOnly cookie. */
        sessionId: text('session_id').notNull().unique(),
        /** Nullable until Phase 10 auth lands. text so a future text-based user id slots in. */
        userId: text('user_id'),
        /** Locale at cart creation/last update — used for email language. */
        locale: text('locale').notNull().default('en'),
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
        uniqueIndex('cart_items_cart_product_size_unq').on(
          table.cartId, table.productId, table.sizeId
        ),
      ]
    );

    export const cartsRelations = relations(carts, ({ many }) => ({
      items: many(cartItems),
    }));

    export const cartItemsRelations = relations(cartItems, ({ one }) => ({
      cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
      product: one(products, { fields: [cartItems.productId], references: [products.id] }),
      size: one(productSizes, { fields: [cartItems.sizeId], references: [productSizes.id] }),
    }));

    // ─── Orders ───────────────────────────────────────────────────────────────────

    export const orderStatusEnum = pgEnum('order_status', [
      'pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded',
    ]);

    export const orders = pgTable(
      'orders',
      {
        id: uuid('id').primaryKey().defaultRandom(),
        /** Public-facing order number, e.g. ORK-A1B2C3. */
        reference: text('reference').notNull().unique(),
        /** Nullable until Phase 10 (guest checkout). */
        userId: text('user_id'),
        /** Snapshot of email at order time. */
        email: text('email').notNull(),
        /** Snapshot of cart locale at submit — used by email send. */
        locale: text('locale').notNull(),

        status: orderStatusEnum('status').notNull().default('pending'),

        // Pricing — halalas (1 SAR = 100). Never float.
        subtotalCents: integer('subtotal_cents').notNull(),
        shippingCents: integer('shipping_cents').notNull(),
        vatCents: integer('vat_cents').notNull(),
        totalCents: integer('total_cents').notNull(),
        currency: text('currency').notNull().default('SAR'),

        // Shipping address (embedded snapshot — normalize later if reused)
        shippingFirstName: text('shipping_first_name').notNull(),
        shippingLastName: text('shipping_last_name').notNull(),
        shippingPhone: text('shipping_phone').notNull(),
        shippingCity: text('shipping_city').notNull(),
        shippingDistrict: text('shipping_district').notNull(),
        shippingAddress: text('shipping_address').notNull(),
        shippingApartment: text('shipping_apartment'),

        paymentMethod: text('payment_method').notNull(), // 'card'|'mada'|'stcpay'|'applepay'|'cod'
        /** Nullable — populated when status transitions to 'shipped'. */
        trackingNumber: text('tracking_number'),

        placedAt: timestamp('placed_at').notNull().defaultNow(),
        updatedAt: timestamp('updated_at').notNull().defaultNow(),
      },
      (table) => [
        index('orders_email_idx').on(table.email),
        index('orders_reference_idx').on(table.reference),
        index('orders_user_id_idx').on(table.userId),
        index('orders_status_idx').on(table.status),
        index('orders_placed_at_idx').on(table.placedAt),
      ]
    );

    export const orderItems = pgTable(
      'order_items',
      {
        id: uuid('id').primaryKey().defaultRandom(),
        orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
        productId: text('product_id').notNull().references(() => products.id),
        sizeLabel: text('size_label').notNull(),
        productNameEn: text('product_name_en').notNull(),
        productNameAr: text('product_name_ar').notNull(),
        unitPriceCents: integer('unit_price_cents').notNull(),
        quantity: integer('quantity').notNull(),
      },
      (table) => [
        index('order_items_order_id_idx').on(table.orderId),
        index('order_items_product_id_idx').on(table.productId),
      ]
    );

    export const orderEvents = pgTable(
      'order_events',
      {
        id: uuid('id').primaryKey().defaultRandom(),
        orderId: uuid('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
        /** 'created' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
         *  | 'payment_failed' | 'email_sent.confirmation' | 'email_sent.shipped'
         *  | 'email_sent.cancelled' | 'email_sent.refunded' | 'email_send_failed' */
        type: text('type').notNull(),
        /** Free-form metadata: actor (admin/system), reason, fromStatus, toStatus, error */
        metadata: jsonb('metadata'),
        createdAt: timestamp('created_at').notNull().defaultNow(),
      },
      (table) => [
        index('order_events_order_id_idx').on(table.orderId),
        index('order_events_type_idx').on(table.type),
        // NOTE: NOT unique. Some event types (state transitions) repeat. Email idempotency
        // is enforced at send-time by querying for existing 'email_sent.*' rows.
      ]
    );

    export const ordersRelations = relations(orders, ({ many }) => ({
      items: many(orderItems),
      events: many(orderEvents),
    }));

    export const orderItemsRelations = relations(orderItems, ({ one }) => ({
      order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
      product: one(products, { fields: [orderItems.productId], references: [products.id] }),
    }));

    export const orderEventsRelations = relations(orderEvents, ({ one }) => ({
      order: one(orders, { fields: [orderEvents.orderId], references: [orders.id] }),
    }));
    ```

    Add these AFTER the existing `ProductRow` / `ProductSizeRow` / `ProductImageRow` exports:

    ```typescript
    export type CartRow = typeof carts.$inferSelect;
    export type NewCartRow = typeof carts.$inferInsert;
    export type CartItemRow = typeof cartItems.$inferSelect;
    export type NewCartItemRow = typeof cartItems.$inferInsert;
    export type OrderRow = typeof orders.$inferSelect;
    export type NewOrderRow = typeof orders.$inferInsert;
    export type OrderItemRow = typeof orderItems.$inferSelect;
    export type NewOrderItemRow = typeof orderItems.$inferInsert;
    export type OrderEventRow = typeof orderEvents.$inferSelect;
    export type NewOrderEventRow = typeof orderEvents.$inferInsert;
    export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
    ```

    Then open `src/types/domain.ts`. EXAMINE the existing `CartItem` interface (used by Zustand). Add NEW types for the server-side data layer WITHOUT altering the existing client `CartItem`. If a name conflict arises, name the new server shape `ServerCartItem`. Add:

    ```typescript
    export type OrderStatus =
      | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

    export interface Cart {
      id: string;
      sessionId: string;
      userId: string | null;
      locale: Locale;
      items: ServerCartItem[];
      updatedAt: Date;
    }

    export interface ServerCartItem {
      id: string;
      productId: string;
      sizeId: string;
      sizeLabel: string;
      quantity: number;
      product: Product; // joined
    }

    export interface OrderItem {
      id: string;
      productId: string;
      sizeLabel: string;
      productName: { en: string; ar: string };
      unitPriceCents: number;
      quantity: number;
    }

    export interface OrderEvent {
      id: string;
      type: string;
      metadata: Record<string, unknown> | null;
      createdAt: Date;
    }

    export interface Order {
      id: string;
      reference: string;
      userId: string | null;
      email: string;
      locale: Locale;
      status: OrderStatus;
      subtotalCents: number;
      shippingCents: number;
      vatCents: number;
      totalCents: number;
      currency: 'SAR';
      shipping: {
        firstName: string; lastName: string; phone: string;
        city: string; district: string; address: string;
        apartment: string | null;
      };
      paymentMethod: string;
      trackingNumber: string | null;
      items: OrderItem[];
      events: OrderEvent[];
      placedAt: Date;
      updatedAt: Date;
    }
    ```

    Run `npx tsc --noEmit` to verify zero TypeScript errors.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&amp;1 | tee /tmp/tsc.log; grep -E "schema\.ts|domain\.ts" /tmp/tsc.log | grep -i error; test $? -ne 0</automated>
  </verify>
  <acceptance_criteria>
    - `npx tsc --noEmit` exits 0 with no errors referencing `src/lib/db/schema.ts` or `src/types/domain.ts`
    - `grep -c "pgEnum('order_status'" src/lib/db/schema.ts` outputs at least 1
    - `grep -c "export const carts = pgTable" src/lib/db/schema.ts` outputs 1
    - `grep -c "export const cartItems = pgTable" src/lib/db/schema.ts` outputs 1
    - `grep -c "export const orders = pgTable" src/lib/db/schema.ts` outputs 1
    - `grep -c "export const orderItems = pgTable" src/lib/db/schema.ts` outputs 1
    - `grep -c "export const orderEvents = pgTable" src/lib/db/schema.ts` outputs 1
    - `grep -c "subtotalCents: integer" src/lib/db/schema.ts` outputs 1
    - `grep -c "uniqueIndex('cart_items_cart_product_size_unq')" src/lib/db/schema.ts` outputs 1
    - `grep -c "type OrderStatus" src/types/domain.ts` outputs at least 1
    - `grep -c "export interface Order " src/types/domain.ts` outputs 1
    - `grep -c "export type OrderRow" src/lib/db/schema.ts` outputs 1
  </acceptance_criteria>
  <done>schema.ts compiles, domain.ts exports Order/Cart/OrderStatus, all six new tables + pgEnum present, no TS errors anywhere.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Generate Drizzle migration 0001_phase8_cart_orders.sql</name>
  <files>src/lib/db/migrations/0001_phase8_cart_orders.sql, src/lib/db/migrations/meta/_journal.json, src/lib/db/migrations/meta/0001_snapshot.json</files>
  <read_first>
    - src/lib/db/schema.ts (just-extended file from Task 1)
    - src/lib/db/migrations/0000_furry_ink.sql (existing migration shape)
    - src/lib/db/migrations/meta/_journal.json (drizzle-kit appends to this — never hand-edit)
    - drizzle.config.ts (verify generator output path is `src/lib/db/migrations`)
    - package.json (confirm `db:generate` script)
  </read_first>
  <behavior>
    - drizzle-kit emits a NEW SQL migration file `0001_*.sql` (the suffix is auto-generated; rename to `0001_phase8_cart_orders.sql` if drizzle-kit uses a different suffix)
    - Migration creates the `order_status` enum, the 5 new tables, all FKs, all indexes, the unique composite on cart_items
    - `meta/_journal.json` has 2 entries (idx 0 + idx 1)
    - `meta/0001_snapshot.json` exists and contains all 5 new table definitions
  </behavior>
  <action>
    Run from repo root:

    ```bash
    npm run db:generate -- --name=phase8_cart_orders
    ```

    If drizzle-kit produces a file named `0001_<random>.sql`, rename it to `0001_phase8_cart_orders.sql` AND update `meta/_journal.json` — change the corresponding entry's `tag` field to `0001_phase8_cart_orders`. Never hand-edit the SQL body; only the filename + journal tag.

    Verify the generated SQL contains (use grep, not visual inspection):
    - `CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded')`
    - `CREATE TABLE "carts"`, `CREATE TABLE "cart_items"`, `CREATE TABLE "orders"`, `CREATE TABLE "order_items"`, `CREATE TABLE "order_events"`
    - All FK constraints (`REFERENCES "products"("id") ON DELETE cascade`, etc.)
    - The unique index on cart_items
  </action>
  <verify>
    <automated>ls src/lib/db/migrations/0001_*.sql &amp;&amp; grep -c "CREATE TYPE \"public\".\"order_status\"" src/lib/db/migrations/0001_*.sql &amp;&amp; grep -c "CREATE TABLE \"orders\"" src/lib/db/migrations/0001_*.sql</automated>
  </verify>
  <acceptance_criteria>
    - File `src/lib/db/migrations/0001_phase8_cart_orders.sql` exists (after rename if needed)
    - `grep -c 'CREATE TYPE "public"."order_status"' src/lib/db/migrations/0001_*.sql` outputs 1
    - `grep -c 'CREATE TABLE "carts"' src/lib/db/migrations/0001_*.sql` outputs 1
    - `grep -c 'CREATE TABLE "cart_items"' src/lib/db/migrations/0001_*.sql` outputs 1
    - `grep -c 'CREATE TABLE "orders"' src/lib/db/migrations/0001_*.sql` outputs 1
    - `grep -c 'CREATE TABLE "order_items"' src/lib/db/migrations/0001_*.sql` outputs 1
    - `grep -c 'CREATE TABLE "order_events"' src/lib/db/migrations/0001_*.sql` outputs 1
    - `grep -c 'cart_items_cart_product_size_unq' src/lib/db/migrations/0001_*.sql` outputs at least 1
    - `src/lib/db/migrations/meta/0001_snapshot.json` exists and is non-empty
    - `_journal.json` includes an `idx: 1` entry
  </acceptance_criteria>
  <done>Migration file + snapshot + journal updated. Untouched ts files. drizzle-kit reports nothing pending on a re-run.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 3: [BLOCKING] Push migration to live DB via drizzle-kit push</name>
  <files>(no source files changed — DB schema is the side effect)</files>
  <read_first>
    - src/lib/db/migrations/0001_phase8_cart_orders.sql
    - drizzle.config.ts
    - .env.local (verify DATABASE_URL or STORAGE_URL is set; this is local/dev — production push runs separately at deploy)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Stock locking" section (reminds that all later plans depend on these tables existing in the live DB)
  </read_first>
  <behavior>
    - `npm run db:push` runs to completion with no error
    - The connected Postgres DB now has tables: carts, cart_items, orders, order_items, order_events
    - The connected Postgres DB now has type: order_status (enum)
    - Re-running `db:push` shows "No changes detected" or equivalent
  </behavior>
  <action>
    BLOCKING: This task MUST complete before any Wave 1+ plan runs. Without these tables in the live DB, every other plan will compile but fail at runtime.

    Run from repo root:

    ```bash
    npm run db:push
    ```

    If `db:push` prompts interactively (column rename heuristics), answer "create" / accept defaults — Phase 8 is purely additive; no renames or drops are involved.

    After completion, run:

    ```bash
    npm run db:push
    ```

    A second time. The output MUST indicate no pending changes.

    If `STORAGE_URL` is set (production Neon), prefer that. Otherwise rely on `DATABASE_URL` (local). The existing `src/lib/env.ts` resolves either.

    DO NOT run `drizzle-kit migrate` instead — the project uses `db:push` per package.json scripts (matches existing 0000 migration application).
  </action>
  <verify>
    <automated>npm run db:push 2>&amp;1 | tee /tmp/dbpush.log; grep -iE "no changes|nothing to migrate|all changes applied" /tmp/dbpush.log</automated>
  </verify>
  <acceptance_criteria>
    - First `npm run db:push` exits 0
    - Second `npm run db:push` exits 0 AND its output matches one of: `No changes`, `Nothing to migrate`, `Everything up to date` (case-insensitive)
    - A direct DB query (manual sanity, not gated): `psql $DATABASE_URL -c "\dt"` would list the 5 new tables. If no psql, run `node -e "require('./src/lib/db/client').db.execute('SELECT 1')"` to at least confirm connection.
  </acceptance_criteria>
  <done>Live DB has all Phase 8 tables and the order_status enum. Re-running db:push is a no-op. Wave 1 plans are unblocked.</done>
</task>

</tasks>

<verification>
- `grep -c "pgEnum('order_status'" src/lib/db/schema.ts` outputs 1
- `npx tsc --noEmit` exits 0
- `ls src/lib/db/migrations/0001_*.sql` returns one file
- A second `npm run db:push` reports no changes
</verification>

<success_criteria>
Phase 8 schema is in code, in a migration, and in the live DB. Plans 02-09 can import `carts`, `cartItems`, `orders`, `orderItems`, `orderEvents`, `orderStatusEnum`, and the corresponding Row types from `@/lib/db/schema`.
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-01-SUMMARY.md`
</output>
