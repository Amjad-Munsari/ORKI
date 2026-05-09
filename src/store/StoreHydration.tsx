'use client';

/**
 * Hydrates the client cart store from the server on mount.
 *
 *  1. If the legacy Phase 3 `orki-cart` localStorage key exists with items,
 *     call `migrateLocalCartAction(legacy, locale)` exactly once, then
 *     remove the localStorage key. Use the returned cart as the seed.
 *  2. Otherwise GET /api/cart and seed from there.
 *
 * The DB is now the single source of truth — Zustand is the UI mirror.
 * Renders nothing.
 */
import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCartStore } from './cartStore';
import { migrateLocalCartAction } from '@/app/actions/cart';
import type { CartItem, Locale, Product, ServerCartItem } from '@/types/domain';

interface LegacyEntry {
  productId: string;
  selectedSize: string;
  quantity: number;
}

export function StoreHydration() {
  const params = useParams<{ locale?: string }>();
  const locale: Locale = params?.locale === 'ar' ? 'ar' : 'en';

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // 1. Check for legacy Phase 3 localStorage payload.
      let legacy: LegacyEntry[] = [];
      try {
        const raw =
          typeof window !== 'undefined'
            ? window.localStorage.getItem('orki-cart')
            : null;
        if (raw) {
          const parsed = JSON.parse(raw) as {
            state?: { items?: Array<{ product?: { id?: string }; selectedSize?: string; quantity?: number }> };
          };
          const items = parsed?.state?.items ?? [];
          legacy = items
            .filter(
              (i) =>
                !!i?.product?.id &&
                typeof i?.selectedSize === 'string' &&
                typeof i?.quantity === 'number' &&
                i.quantity > 0
            )
            .map((i) => ({
              productId: i.product!.id!,
              selectedSize: i.selectedSize!,
              quantity: i.quantity!,
            }));
        }
      } catch {
        legacy = [];
      }

      if (legacy.length > 0) {
        const result = await migrateLocalCartAction(legacy, locale);
        try {
          window.localStorage.removeItem('orki-cart');
        } catch {
          /* ignore */
        }
        if (cancelled) return;
        if (result.ok) {
          useCartStore
            .getState()
            .setItems(toClientItems(result.data.items));
          return;
        }
        // Migration failed — fall through to GET /api/cart so we still hydrate.
      }

      // 2. No legacy payload (or migration failed) — pull current cart.
      try {
        const res = await fetch('/api/cart', { cache: 'no-store' });
        const json = (await res.json()) as {
          ok?: boolean;
          cart?: { items?: ServerCartItem[] } | null;
        };
        if (!cancelled && json?.ok && json.cart) {
          useCartStore
            .getState()
            .setItems(toClientItems(json.cart.items ?? []));
        }
      } catch {
        // Leave the store empty on error rather than crashing the UI.
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  return null;
}

function toClientItems(serverItems: ServerCartItem[]): CartItem[] {
  return (serverItems ?? []).map((si) => ({
    id: si.id,
    sizeId: si.sizeId,
    product: si.product as Product,
    selectedSize: si.sizeLabel,
    quantity: si.quantity,
  }));
}
