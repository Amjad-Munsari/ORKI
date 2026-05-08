/**
 * Drizzle ORM schema — ORKI database tables.
 *
 * Design constraints:
 * - All column names map to src/types/domain.ts interfaces (Product, Size)
 * - No type drift: DB rows are mapped to domain types in src/lib/products.ts
 * - Auth tables are NOT here — they belong to Phase 6
 * - Order tables are NOT here — they belong to Phase 8
 */
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

// ─── Type Exports (Drizzle inference) ─────────────────────────────────────────

export type ProductRow = typeof products.$inferSelect;
export type NewProductRow = typeof products.$inferInsert;
export type ProductSizeRow = typeof productSizes.$inferSelect;
export type ProductImageRow = typeof productImages.$inferSelect;
