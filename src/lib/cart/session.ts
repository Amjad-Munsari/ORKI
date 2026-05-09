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
  locale: Locale = 'en'
): Promise<{ id: string; sessionId: string; locale: Locale }> {
  const jar = await cookies(); // Next 15 async API
  let sessionId = jar.get(COOKIE_NAME)?.value;

  if (sessionId) {
    const existing = await db.query.carts.findFirst({
      where: eq(carts.sessionId, sessionId),
    });
    if (existing) {
      return {
        id: existing.id,
        sessionId,
        locale: (existing.locale as Locale) ?? locale,
      };
    }
    // Cookie present but row missing (DB reset). Reuse the same sessionId so
    // the localStorage migration path keys correctly, then re-mint the row.
  } else {
    sessionId = nanoid(32);
  }

  const [cart] = await db
    .insert(carts)
    .values({ sessionId, locale })
    .returning();

  jar.set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: COOKIE_MAX_AGE,
  });

  return { id: cart.id, sessionId, locale };
}

/**
 * Read-only helper — never mints a cookie. Use from Server Components.
 */
export async function readCartSessionId(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(COOKIE_NAME)?.value ?? null;
}
