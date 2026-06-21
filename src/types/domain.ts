// Data contract between frontend components and future backend integration.
// When Medusa v2 backend arrives, only /lib/products.ts changes — these types stay.

export type Locale = 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

export interface Size {
  id: string;
  label: string; // 'XS' | 'S' | 'M' | 'L' | 'XL'
  stock: number;
  inStock: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: { en: string; ar: string };
  description: { en: string; ar: string };
  category: 'tops' | 'bottoms';
  price: number;
  currency: 'SAR';
  sizes: Size[];
  images: string[];
  inStock: boolean;
}

/**
 * Client-side cart item — backed by Zustand store.
 * Phase 3 originally stored these in localStorage; Phase 8 hydrates from
 * /api/cart so `id` (cart_items.id) and `sizeId` are now carried alongside
 * `selectedSize` (the human label) so client components can call Server
 * Actions by id. Both are optional to preserve backward compatibility for
 * any code path that still constructs items locally before hydration.
 */
export interface CartItem {
  /** cart_items.id — present on hydrated items, absent on optimistic adds. */
  id?: string;
  /** product_sizes.id — present on hydrated items. */
  sizeId?: string;
  product: Product;
  selectedSize: string;
  quantity: number;
}

// ─── Phase 8: Cart, Checkout & Orders domain types ───────────────────────────

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

/**
 * Server-side cart item shape — what `/api/cart` returns and what server actions
 * operate on. Joined with the product. Distinct from the Phase 3 client `CartItem`
 * which the Zustand store uses.
 */
export interface ServerCartItem {
  id: string;
  productId: string;
  sizeId: string;
  sizeLabel: string;
  quantity: number;
  product: Product; // joined
}

export interface Cart {
  id: string;
  sessionId: string;
  userId: string | null;
  locale: Locale;
  items: ServerCartItem[];
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  /** Null if the product was deleted after the order was placed (snapshot
   *  fields below remain authoritative). See schema.ts order_items.productId. */
  productId: string | null;
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
    firstName: string;
    lastName: string;
    phone: string;
    city: string;
    district: string;
    address: string;
    apartment: string | null;
  };
  paymentMethod: string;
  trackingNumber: string | null;
  items: OrderItem[];
  events: OrderEvent[];
  placedAt: Date;
  updatedAt: Date;
}
