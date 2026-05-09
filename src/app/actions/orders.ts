'use server';

/**
 * Server Action shim for the order/checkout flow. Heavy logic lives in
 * `src/lib/orders/server.ts`. This file is a thin `'use server'` boundary
 * that exposes the actions under client-friendly names so callers can
 * `import { submitCheckoutAction } from '@/app/actions/orders'`.
 *
 * Per CLAUDE.md: components and actions never import Drizzle tables
 * directly — they go through `src/lib/orders/*`.
 */

export { submitCheckout as submitCheckoutAction } from '@/lib/orders/server';
export { transitionOrderStatus as transitionOrderAction } from '@/lib/orders/server';
