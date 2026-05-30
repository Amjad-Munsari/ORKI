/**
 * Cart session — cookie + DB cart row resolver.
 *
 * MUST be called from a Server Action or Route Handler. Never from a Server
 * Component (Next 15 prohibits cookie writes in RSC, and `getOrCreateCart`
 * may mint the `orki_sid` cookie on first call).
 */
import 'server-only';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/client';
import { carts } from '@/lib/db/schema';
import type { Locale } from '@/types/domain';

const COOKIE_NAME = 'orki_sid';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days (CONTEXT.md)

/**
 * Resolves the active cart for the current request, minting a new cookie +
 * carts row when needed. Idempotent within a request — safe to call from
 * multiple Server Actions in the same flow.
 */
export async function getOrCreateCart(
  locale?: Locale
): Promise<{ id: string; sessionId: string; locale: Locale }> {
  const jar = await cookies(); // Next 15 async API
  let sessionId = jar.get(COOKIE_NAME)?.value;

  let resolvedCart: { id: string; sessionId: string; locale: Locale } | null = null;

  if (sessionId) {
    const existing = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    });
    if (existing) {
      // Keep the persisted locale in sync with the caller's current locale so
      // the order snapshot (and thus the email language) reflects how the user
      // was actually browsing. Only update when the caller PROVIDES a locale —
      // callers that pass nothing (e.g. submitCheckout) must not clobber it.
      if (locale && existing.locale !== locale) {
        await db.update(carts).set({ locale }).where(eq(carts.id, existing.id));
      }
      resolvedCart = {
        id: existing.id,
        sessionId,
        locale: locale ?? (existing.locale as Locale) ?? 'en',
      };
    }
    // Cookie present but row missing (DB reset). Reuse the same sessionId so
    // the localStorage migration path keys correctly, then re-mint the row.
  } else {
    sessionId = nanoid(32);
  }

  if (!resolvedCart) {
    const newLocale: Locale = locale ?? 'en';
    const [cart] = await db
      .insert(carts)
      .values({ sessionId, locale: newLocale })
      .returning();

    jar.set(COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE,
    });

    resolvedCart = { id: cart.id, sessionId, locale: newLocale };
  }

  // Phase 10: first-sign-in merge hook (defensive — covers paths that don't go
  // through signInAction, e.g. social-login callbacks landed in a future plan
  // or a direct cookie restoration after Supabase token refresh). Triggers
  // on every authenticated request whose resolved cart still lacks a userId.
  //
  // WR-09 (Phase 10 review): the merge has nothing to do once the cart is
  // already user-bound. Gate the hook on `userId === null` first to skip the
  // entire Supabase Auth round-trip on the hot path. This also tightens
  // failure semantics: if Supabase Auth has a blip during a guest's request
  // we still log the error rather than silently fall through.
  const cartRow = await db.query.carts.findFirst({
    where: eq(carts.id, resolvedCart.id),
    columns: { userId: true },
  });
  if (cartRow && cartRow.userId === null) {
    try {
      const { createClient } = await import('@/lib/supabase/server');
      const supabase = await createClient();
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError) {
        // Surface Supabase Auth outages in ops dashboards instead of letting
        // them disappear into the catch-all below.
        console.error('[getOrCreateCart][merge-hook] auth.getUser error', userError);
      } else if (user) {
        const { mergeGuestCartIntoUserCart } = await import('./merge-on-signin');
        await mergeGuestCartIntoUserCart(user.id, resolvedCart.sessionId);
        // Re-fetch in case the merge re-pointed userId or deleted the guest cart.
        const refreshed = await db.query.carts.findFirst({
          where: eq(carts.userId, user.id),
        });
        if (refreshed) {
          resolvedCart = {
            id: refreshed.id,
            sessionId: refreshed.sessionId,
            locale: (refreshed.locale as Locale) ?? locale ?? 'en',
          };
        }
      }
    } catch (err) {
      // Defensive — never block cart resolution on auth or merge failure.
      console.error('[getOrCreateCart][merge-hook]', err);
    }
  }

  return resolvedCart;
}

/**
 * Read-only helper — never mints a cookie. Use from Server Components.
 */
export async function readCartSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
