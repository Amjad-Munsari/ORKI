// Future-proofing scaffold for Phase 9. Built but unmounted (CONTEXT §2).
// When marketing/analytics cookies are added in a future phase, the banner mounts and
// these helpers become live. Today: no analytics cookies → banner not rendered.

const COOKIE_NAME = 'cookie_consent';

export type ConsentValue = 'accepted' | 'rejected' | 'pending';

/** Reads the cookie. Returns 'pending' if not set. Client-side only. */
export function readCookieConsent(): ConsentValue {
  if (typeof document === 'undefined') return 'pending';
  const match = document.cookie.match(new RegExp(`(^|;\\s*)${COOKIE_NAME}=([^;]+)`));
  if (!match) return 'pending';
  return (match[2] === 'accepted' || match[2] === 'rejected') ? match[2] : 'pending';
}

/** Writes the cookie with 365-day expiry, SameSite=Lax. Client-side only. */
export function writeCookieConsent(value: 'accepted' | 'rejected'): void {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${COOKIE_NAME}=${value}; expires=${expires}; path=/; SameSite=Lax`;
}

/** Convenience predicate. */
export function hasCookieConsent(): boolean {
  const v = readCookieConsent();
  return v === 'accepted' || v === 'rejected';
}
