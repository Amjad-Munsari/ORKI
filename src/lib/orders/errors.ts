/**
 * Order-domain error envelope.
 *
 * NOTE: NOT marked `'server-only'` — these classes are read by client error
 * mapping (e.g. mapping a Server Action's `code` field to a localized message).
 * No DB, cookie, or file-system imports here.
 */

export type OrderErrorCode =
  | 'STOCK_UNAVAILABLE'
  | 'PAYMENT_DECLINED'
  | 'CART_EMPTY'
  | 'PRODUCT_NOT_FOUND'
  | 'VALIDATION'
  | 'UNKNOWN';

export class OrderError extends Error {
  constructor(
    public readonly code: OrderErrorCode,
    message?: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message ?? code);
    this.name = 'OrderError';
  }
}

export class IllegalTransitionError extends Error {
  constructor(
    public readonly from: string,
    public readonly to: string
  ) {
    super(`Cannot transition order from ${from} to ${to}`);
    this.name = 'IllegalTransitionError';
  }
}
