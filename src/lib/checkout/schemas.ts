import { z } from 'zod';

/**
 * Saudi mobile phone format. Accepts:
 *   +966 5X XXX XXXX
 *   +9665XXXXXXXX
 *   9665XXXXXXXX
 *   05XXXXXXXX
 * No drift — this is the ONLY phone regex in the codebase.
 */
export const KSA_PHONE_PATTERN =
  /^(?:\+?966\s?5\d\s?\d{3}\s?\d{4}|0\s?5\d\s?\d{3}\s?\d{4}|(?:\+?966|0)5\d{8})$/;

export const shippingSchema = z.object({
  firstName: z
    .string()
    .min(1, 'Checkout.errors.required')
    .max(50, 'Checkout.errors.tooLong'),
  lastName: z
    .string()
    .min(1, 'Checkout.errors.required')
    .max(50, 'Checkout.errors.tooLong'),
  email: z.string().email('Checkout.errors.email'),
  phone: z.string().regex(KSA_PHONE_PATTERN, 'Checkout.errors.phone.ksa'),
  city: z
    .string()
    .min(1, 'Checkout.errors.required')
    .max(50, 'Checkout.errors.tooLong'),
  district: z
    .string()
    .min(1, 'Checkout.errors.required')
    .max(50, 'Checkout.errors.tooLong'),
  address: z
    .string()
    .min(5, 'Checkout.errors.address.short')
    .max(200, 'Checkout.errors.tooLong'),
  apartment: z
    .string()
    .max(100, 'Checkout.errors.tooLong')
    .optional()
    .or(z.literal('')),
});

/**
 * Canonical payment-method codes accepted by the checkout flow.
 * MUST stay in lock-step with the enum below — the enum is the runtime
 * gate, this tuple is the type-level export. Keep ordering identical.
 *
 * Note: kept narrower than PaymentGrid.tsx's PaymentMethod (which still
 * includes 'card' and 'cod') because Phase 8 server-side checkout only
 * accepts the four real-rail methods. PaymentGrid will be reconciled in
 * Plan 08-06 (form rewire).
 */
export const PAYMENT_METHODS = ['mada', 'visa', 'applepay', 'stcpay'] as const;
export type PaymentMethodCode = (typeof PAYMENT_METHODS)[number];

// Zod 4 enum custom error API — pinned form. Per zod v4 changelog, the
// legacy `errorMap` parameter is replaced by a unified `error` parameter
// that accepts a string OR a function returning { message }.
export const paymentSelectionSchema = z.object({
  method: z.enum(['mada', 'visa', 'applepay', 'stcpay'], {
    error: () => ({ message: 'Checkout.errors.payment.required' }),
  }),
});

export const checkoutSchema = z.object({
  shipping: shippingSchema,
  payment: paymentSelectionSchema,
});

export type ShippingInput = z.infer<typeof shippingSchema>;
export type PaymentSelection = z.infer<typeof paymentSelectionSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
