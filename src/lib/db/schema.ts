/**
 * Drizzle ORM schema — ORKI database tables.
 *
 * Design constraints:
 * - All column names map to src/types/domain.ts interfaces (Product, Size)
 * - No type drift: DB rows are mapped to domain types in src/lib/products.ts
 * - Auth tables are NOT here — they belong to Phase 10 (Supabase Auth)
 * - Order tables ARE here as of Phase 8
 */
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

// ─── Products ─────────────────────────────────────────────────────────────────

export const products = pgTable(
  'products',
  {
    /** Matches Product.id — slug-based string ID (e.g. 'orki-heavy-tee-black') */
    id: text('id').primaryKey(),
    /** Unique URL-safe identifier. Indexed for getProductBySlug() lookups. */
    slug: text('slug').notNull().unique(),
    nameEn: text('name_en').notNull(),
    nameAr: text('name_ar').notNull(),
    descriptionEn: text('description_en').notNull(),
    descriptionAr: text('description_ar').notNull(),
    /** 'tops' | 'bottoms' — indexed for getProductsByCategory() lookups. */
    category: text('category').notNull(),
    /** Price in SAR as integer (whole riyals). e.g. 249 = 249 SAR */
    price: integer('price').notNull(),
    currency: text('currency').notNull().default('SAR'),
    /** Derived field: true if any size is in stock. Kept for fast list queries. */
    inStock: boolean('in_stock').notNull().default(true),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => [
    index('products_category_idx').on(table.category),
    index('products_in_stock_idx').on(table.inStock),
  ]
);

export const productsRelations = relations(products, ({ many }) => ({
  sizes: many(productSizes),
  images: many(productImages),
}));

// ─── Product Sizes ─────────────────────────────────────────────────────────────

export const productSizes = pgTable('product_sizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** FK to products.id — cascades delete so removing a product removes its sizes */
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  /** Size label: 'XS' | 'S' | 'M' | 'L' | 'XL' */
  label: text('label').notNull(),
  stock: integer('stock').notNull().default(0),
  inStock: boolean('in_stock').notNull().default(true),
});

export const productSizesRelations = relations(productSizes, ({ one }) => ({
  product: one(products, {
    fields: [productSizes.productId],
    references: [products.id],
  }),
}));

// ─── Product Images ────────────────────────────────────────────────────────────

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  /** FK to products.id — cascades delete so removing a product removes its images */
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  /** URL or path to the image. For Phase 5: relative paths like '/images/products/hoodie.png' */
  url: text('url').notNull(),
  /** Lower number = shown first. Allows reordering without re-inserting. */
  sortOrder: integer('sort_order').notNull().default(0),
});

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
}));

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

// ─── Type Exports (Drizzle inference) ─────────────────────────────────────────

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductSizeRow = typeof productSizes.$inferSelect;
export type ProductImageRow = typeof productImages.$inferSelect;

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
