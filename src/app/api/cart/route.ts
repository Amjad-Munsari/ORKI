/**
 * GET /api/cart — returns the active cart for the orki_sid cookie holder.
 *
 * Mints a fresh cart row + cookie on first visit (route handlers may write
 * cookies, unlike Server Components). Used by `StoreHydration` on client
 * mount to seed the Zustand store.
 */
import { NextResponse } from 'next/server';
import { getOrCreateCart } from '@/lib/cart/session';
import { getCart } from '@/lib/cart/server';

export async function GET() {
  try {
    const session = await getOrCreateCart();
    const cart = await getCart(session.id);
    return NextResponse.json({ ok: true, cart });
  } catch (err) {
    const e = err as { message?: string };
    console.error('[/api/cart GET]', e?.message ?? err);
    return NextResponse.json(
      { ok: false, code: 'UNKNOWN' },
      { status: 500 }
    );
  }
}
