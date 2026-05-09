import 'server-only';
import type { OrderStatus } from '@/types/domain';
import { IllegalTransitionError } from './errors';

/**
 * Authoritative order-status transition matrix. Derived from
 * .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Order state machine":
 *
 *   pending   → confirmed   (payment success)
 *   pending   → cancelled   (admin)
 *   confirmed → shipped     (admin)
 *   confirmed → cancelled   (admin; releases stock pre-ship)
 *   confirmed → refunded    (admin; bookkeeping refund pre-ship)
 *   shipped   → delivered   (admin)
 *   shipped   → cancelled   (admin; does NOT release stock — goods in transit)
 *   shipped   → refunded    (admin)
 *   delivered → refunded    (admin)
 *   cancelled, refunded     terminal
 *
 * No `failed` state — payment failures roll back the transaction; the order
 * is never persisted (per CONTEXT.md "Persistence model" decision).
 */
export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending:   ['confirmed', 'cancelled'],
  confirmed: ['shipped', 'cancelled', 'refunded'],
  shipped:   ['delivered', 'cancelled', 'refunded'],
  delivered: ['refunded'],
  cancelled: [],
  refunded:  [],
};

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function assertTransition(from: OrderStatus, to: OrderStatus): void {
  if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
}

export function isTerminal(status: OrderStatus): boolean {
  return TRANSITIONS[status].length === 0;
}

export function legalNextStates(from: OrderStatus): readonly OrderStatus[] {
  return TRANSITIONS[from] ?? [];
}
