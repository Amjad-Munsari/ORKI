# Phase 5 Research: Local Database & ORM Setup

**Phase:** 5 — Local Database & ORM Setup
**Date:** 2026-05-08
**Decision locked in CONTEXT.md:** Drizzle ORM + local PostgreSQL (Docker)

---

## 1. Package Selection

### Core packages

| Package | Version | Role |
|---------|---------|------|
| `drizzle-orm` | latest | ORM — query builder and type inference |
| `postgres` | latest | PostgreSQL driver (preferred over `pg` for Drizzle; full async, no callback API) |
| `drizzle-kit` | latest (dev) | CLI — schema push, migrate, studio |
| `dotenv` | (built-in Next.js) | Env loading |
| `zod` | latest | Env validation in `src/lib/env.ts` |

> **`postgres` vs `pg`:** Drizzle docs recommend the `postgres` (postgres.js) driver for Next.js App Router over the older `pg` (node-postgres) driver. It's async-native, supports connection pooling via `max` option, and has a cleaner API.

```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit tsx
```

`tsx` is needed to run seed and migration scripts with TypeScript directly.

---

## 2. File Structure

```
ORKI/
├── docker-compose.yml              # NEW — PostgreSQL container
├── drizzle.config.ts               # NEW — drizzle-kit config
├── .env.local                      # existing (add DATABASE_URL)
├── .env.example                    # NEW — committed template
├── src/
│   └── lib/
│       ├── env.ts                  # NEW — Zod env validation
│       ├── db/
│       │   ├── client.ts           # NEW — Drizzle singleton client
│       │   ├── schema.ts           # NEW — table definitions
│       │   └── migrations/         # NEW — drizzle-kit output
│       └── products.ts             # MODIFY — swap static import for DB queries
├── scripts/
│   └── seed.ts                     # NEW — populate DB from src/data/products.ts
└── SECURITY-EXCEPTIONS.md          # NEW — npm audit exception log
```

---

## 3. Docker Compose Setup

Standard pattern for local Postgres that mirrors Supabase's Postgres version (15):

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    container_name: orki_db
    environment:
      POSTGRES_USER: orki
      POSTGRES_PASSWORD: orki
      POSTGRES_DB: orki_dev
    ports:
      - "5432:5432"
    volumes:
      - orki_postgres_data:/var/lib/postgresql/data

volumes:
  orki_postgres_data:
```

- Port 5432 maps to localhost — `DATABASE_URL=postgresql://orki:orki@localhost:5432/orki_dev`
- Named volume `orki_postgres_data` persists data between container restarts
- `postgres:15-alpine` matches Supabase's Postgres version for frictionless migration

---

## 4. Zod Env Validation (`src/lib/env.ts`)

Validates all env vars at module load time. Imported into `next.config.ts` to fail fast at build time (not at first DB query).

```typescript
// src/lib/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid PostgreSQL URL'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
```

Import in `next.config.ts`:
```typescript
import './src/lib/env'; // Validates env at build time
```

---

## 5. Drizzle Schema (`src/lib/db/schema.ts`)

Maps directly to `src/types/domain.ts` — no type drift between DB rows and frontend types.

```typescript
import { pgTable, text, boolean, integer, timestamp, uuid } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: text('id').primaryKey(),                    // matches Product.id (slug-based)
  slug: text('slug').notNull().unique(),           // INDEXED — used by getProductBySlug
  nameEn: text('name_en').notNull(),
  nameAr: text('name_ar').notNull(),
  descriptionEn: text('description_en').notNull(),
  descriptionAr: text('description_ar').notNull(),
  category: text('category', { enum: ['tops', 'bottoms'] }).notNull(), // INDEXED
  price: integer('price').notNull(),              // stored as integer (SAR halala or SAR whole)
  currency: text('currency').notNull().default('SAR'),
  inStock: boolean('in_stock').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const productSizes = pgTable('product_sizes', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),                 // 'XS' | 'S' | 'M' | 'L' | 'XL'
  inStock: boolean('in_stock').notNull().default(true),
});

export const productImages = pgTable('product_images', {
  id: uuid('id').primaryKey().defaultRandom(),
  productId: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});
```

**Indexes:**
- `products.slug` — unique constraint acts as index
- `products.category` — explicit index needed (added via `index()` helper)
- `product_sizes.product_id` — FK index (Postgres auto-creates for FK)

---

## 6. Drizzle Client Singleton (`src/lib/db/client.ts`)

Critical pattern for Next.js App Router — prevents connection exhaustion during HMR in development:

```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '../env';

// Singleton pattern — reuse connection across HMR restarts in development
const globalForDb = globalThis as unknown as { conn: ReturnType<typeof postgres> | undefined };

const conn = globalForDb.conn ?? postgres(env.DATABASE_URL, {
  max: process.env.NODE_ENV === 'production' ? 10 : 1,
});

if (process.env.NODE_ENV !== 'production') {
  globalForDb.conn = conn;
}

export const db = drizzle(conn, { schema });
```

---

## 7. drizzle.config.ts

```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
```

---

## 8. Schema Push vs. Migrations

| Scenario | Command | When |
|----------|---------|------|
| Local dev, first time | `npx drizzle-kit push` | Sync schema to DB without migration files |
| Local dev, schema change | `npx drizzle-kit push` | Fast iteration; no migration file needed locally |
| Production / Supabase | `npx drizzle-kit generate` + `npx drizzle-kit migrate` | Deterministic, auditable changes |

For Phase 5 (local only), `push` is used. Migration files are generated as prep for Supabase migration.

---

## 9. lib/products.ts Integration

The existing `src/lib/products.ts` file is the **only file that changes** when wiring to the DB. All public function signatures stay identical — zero component changes required.

```typescript
// BEFORE (Phase 1-4): static array
import { products } from '@/data/products';
export function getAllProducts() { return products; }

// AFTER (Phase 5): Drizzle queries via Server Components / Server Actions
import { db } from '@/lib/db/client';
import { products, productSizes, productImages } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function getAllProducts(): Promise<Product[]> {
  // JOIN products with sizes and images, map to Product type
}
```

**Critical:** The return types must stay `Product[]` (from `src/types/domain.ts`). DB rows must be mapped to the existing domain types — no type leakage from Drizzle inference into components.

---

## 10. Seed Script (`scripts/seed.ts`)

Uses `src/data/products.ts` as the source of truth to populate the DB:

```typescript
import 'dotenv/config';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/lib/db/schema';
import { products as seedProducts } from '../src/data/products';

const conn = postgres(process.env.DATABASE_URL!);
const db = drizzle(conn, { schema });

async function seed() {
  // Insert products, sizes, images
  await conn.end();
}

seed().catch(console.error);
```

Run: `npx tsx scripts/seed.ts`

---

## 11. npm audit Strategy

- Run `npm audit --audit-level=moderate`
- HIGH / CRITICAL: must fix before phase closes
- LOW: document in `SECURITY-EXCEPTIONS.md`
- Add `"audit": "npm audit --audit-level=moderate"` to package.json scripts

---

## 12. Validation Architecture

| Dimension | What to verify |
|-----------|---------------|
| Docker | `docker compose up -d` succeeds; port 5432 reachable |
| Schema push | `npx drizzle-kit push` exits 0 with no errors |
| Env validation | App fails with descriptive error if DATABASE_URL is missing |
| Query integration | `getAllProducts()` returns same 6 products from DB as from static file |
| Seed | `scripts/seed.ts` inserts all 6 products with correct sizes |
| npm audit | `npm audit --audit-level=moderate` exits 0 |
| Type safety | No TypeScript errors: `tsc --noEmit` exits 0 |

## RESEARCH COMPLETE
