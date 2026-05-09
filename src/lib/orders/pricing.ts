/**
 * Pure pricing helpers. All amounts are integer halalas (1 SAR = 100 halalas).
 *
 * Safe to import from BOTH client and server — intentionally NOT marked
 * server-only. `OrderSummary.tsx` (client) calls `formatSAR` and
 * `computeOrderTotals` for the cart summary UI. The server re-prices
 * authoritatively in `src/lib/orders/server.ts` (Plan 08-05).
 */
import type { Locale } from '@/types/domain';

/** KSA standard rate (ZATCA). Applied on (subtotal + shipping). */
export const VAT_RATE = 0.15;

/** Flat shipping fee in halalas (25.00 SAR). */
export const FLAT_SHIPPING_CENTS = 2500;

/** Free shipping kicks in at subtotal >= this many halalas (300.00 SAR). */
export const FREE_SHIPPING_THRESHOLD_CENTS = 30000;

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

/**
 * Compute order totals entirely in integer halalas. No float drift.
 *
 * Negative `unitPriceCents` or `quantity` are clamped to 0 to harden against
 * malformed input; the server re-validates at submit time.
 */
export function computeOrderTotals(items: PricingInput[]): OrderTotals {
  const subtotalCents = items.reduce(
    (sum, i) => sum + Math.max(0, i.unitPriceCents) * Math.max(0, i.quantity),
    0
  );

  // No shipping on an empty/zero-subtotal cart — charging shipping on a
  // zero-subtotal "order" would be meaningless and breaks the empty-cart UX.
  const shippingCents =
    subtotalCents === 0
      ? 0
      : subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS
        ? 0
        : FLAT_SHIPPING_CENTS;

  // VAT applies to (subtotal + shipping) per ZATCA. Round half-away-from-zero.
  const vatCents = Math.round((subtotalCents + shippingCents) * VAT_RATE);

  const totalCents = subtotalCents + shippingCents + vatCents;

  return { subtotalCents, shippingCents, vatCents, totalCents };
}

/**
 * Format halalas as SAR currency. Western numerals in BOTH locales — per
 * CLAUDE.md "Currency" rule (`'ar-SA-u-nu-latn'`).
 */
export function formatSAR(cents: number, locale: Locale): string {
  const fmt = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA',
    { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }
  );
  return fmt.format(cents / 100);
}
