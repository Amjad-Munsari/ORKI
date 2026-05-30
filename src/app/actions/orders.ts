'use server';

/**
 * Server Action shim for the order/checkout flow. Heavy logic lives in
 * `src/lib/orders/server.ts`. This file is a thin `'use server'` boundary
 * that exposes the actions under client-friendly names so callers can
 * `import { submitCheckoutAction } from '@/app/actions/orders'`.
 *
 * Per CLAUDE.md: components and actions never import Drizzle tables
 * directly — they go through `src/lib/orders/*`.
 *
 * NOTE (Plan 08-08, Rule 3 fix): Next 15 prohibits non-async re-exports from
 * a `'use server'` module ("Only async functions are allowed to be exported
 * in a 'use server' file"). We therefore wrap the lib functions in async
 * forwarders rather than re-export them directly.
 */

import {
  submitCheckout,
  transitionOrderStatus,
} from '@/lib/orders/server';
import type { OrderStatus } from '@/types/domain';
import type { CheckoutInput } from '@/lib/checkout/schemas';
import { requireAdmin } from '@/lib/auth/require-admin';

export async function submitCheckoutAction(input: CheckoutInput) {
  return submitCheckout(input);
}

export async function transitionOrderAction(
  orderId: string,
  to: OrderStatus,
  opts: {
    actor?: string;
    trackingNumber?: string;
    reason?: string;
  } = {}
) {
  // AUTHORIZATION: order state transitions (cancel/ship/refund/deliver) are
  // admin-only. This `'use server'` shim is the RPC-reachable boundary — the
  // admin/layout.tsx gate does NOT protect Server Action invocation — so the
  // admin check must live here. requireAdmin throws (audited) on a non-admin.
  await requireAdmin('transitionOrder');
  return transitionOrderStatus(orderId, to, opts);
}
