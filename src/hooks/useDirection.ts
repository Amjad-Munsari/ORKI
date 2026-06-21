'use client';

import {useLocale} from 'next-intl';

/**
 * Returns the direction multiplier for the current locale.
 * LTR (EN): 1  — translateX(100%) pushes off-screen to the right (inline-end)
 * RTL (AR): -1 — translateX(-100%) pushes off-screen to the left (inline-end in RTL)
 *
 * Usage in MobileNavDrawer:
 *   const direction = useDirection();
 *   closed: { x: `${100 * direction}%` }
 */
export function useDirection(): 1 | -1 {
  const locale = useLocale();
  return locale === 'ar' ? -1 : 1;
}
