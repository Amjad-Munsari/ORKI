import type { Locale } from '@/types/domain';

/**
 * Single source of truth for the legal-policy "last updated" date.
 * Update this constant when any of /legal/{privacy,terms,cookies} body copy changes.
 * Per CLAUDE.md, AR locale uses Western numerals via the 'ar-SA-u-nu-latn' modifier
 * to keep the rendered date consistent with site-wide currency formatting.
 */
export const LEGAL_LAST_UPDATED = new Date(2026, 4, 10); // 10 May 2026 (month is 0-indexed)

const FORMATTERS: Record<Locale, Intl.DateTimeFormat> = {
  en: new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }),
  ar: new Intl.DateTimeFormat('ar-SA-u-nu-latn', { dateStyle: 'long' }),
};

export function formatLegalLastUpdated(locale: Locale): string {
  return FORMATTERS[locale].format(LEGAL_LAST_UPDATED);
}
