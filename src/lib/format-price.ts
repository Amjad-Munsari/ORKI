import type { Locale } from '@/types/domain';

/**
 * Custom Saudi Riyal glyph used in all user-facing price displays.
 * Override of the default `Intl.NumberFormat({ style: 'currency', currency: 'SAR' })`
 * output (which renders "ر.س" / "SAR") — the brand uses the new SAMA symbol.
 *
 * Keep schema.org / data-layer / order-record fields on the ISO code 'SAR'
 * (schema.org requires ISO 4217); only swap for human-facing UI.
 */
export const RIYAL_SYMBOL = '⃁';

/**
 * Format a whole-SAR amount for display. Western numerals in both locales
 * (CLAUDE.md "Currency" rule: `'ar-SA-u-nu-latn'`).
 *
 * Glyph trails the amount with a thin space (` `) so digit
 * grouping reads cleanly in both LTR and RTL contexts.
 */
export function formatPriceSAR(amount: number, locale: Locale): string {
  const fmt = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA',
    { style: 'decimal', minimumFractionDigits: 0, maximumFractionDigits: 0 },
  );
  return `${fmt.format(amount)} ${RIYAL_SYMBOL}`;
}

/**
 * Format halalas (1/100 SAR) for display. Used by cart / checkout / order flows
 * that store integer cents. Preserves two-decimal precision for partial amounts.
 */
export function formatPriceSARFromHalalas(cents: number, locale: Locale): string {
  const fmt = new Intl.NumberFormat(
    locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA',
    { style: 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 },
  );
  return `${fmt.format(cents / 100)} ${RIYAL_SYMBOL}`;
}
