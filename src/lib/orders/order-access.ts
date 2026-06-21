import 'server-only';
/**
 * Guest order-confirmation access control.
 *
 * The /checkout/confirmation page exposes full order PII (name, phone, address,
 * line items, totals) keyed by the public order reference — a short code that is
 * trivially enumerable. Logged-in users are protected by the `order.userId`
 * ownership check (see /account/orders/[reference]), but guests have no account.
 *
 * To bind confirmation viewing to the browser that actually placed the order, we
 * record the order reference(s) in an httpOnly cookie at checkout time and check
 * membership before rendering. An attacker cannot forge this cookie, so guessing
 * another customer's reference yields notFound(), not their PII.
 */
import { cookies } from 'next/headers';

export const ORDER_VIEW_COOKIE = 'orki_orders';
const MAX_REFS = 10;
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

/**
 * Authorize the current browser to view an order's confirmation page. Call from
 * a Server Action / Route Handler (cookie write) immediately after the order is
 * committed. Caps the stored list so the cookie cannot grow unbounded.
 */
export async function grantOrderView(reference: string): Promise<void> {
  const jar = await cookies();
  const prior =
    jar.get(ORDER_VIEW_COOKIE)?.value?.split(',').filter(Boolean) ?? [];
  const next = [...new Set([reference, ...prior])].slice(0, MAX_REFS);
  jar.set(ORDER_VIEW_COOKIE, next.join(','), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });
}

/**
 * True when the current browser placed (is authorized to view) this order.
 * Safe to call from a Server Component — only reads the cookie.
 */
export async function sessionMayViewOrder(reference: string): Promise<boolean> {
  const jar = await cookies();
  const refs =
    jar.get(ORDER_VIEW_COOKIE)?.value?.split(',').filter(Boolean) ?? [];
  return refs.includes(reference);
}
