import { describe, it, expect } from 'vitest';
import {
  shippingSchema,
  paymentSelectionSchema,
  checkoutSchema,
  KSA_PHONE_PATTERN,
  PAYMENT_METHODS,
} from './schemas';

const validShipping = {
  firstName: 'Amjad',
  lastName: 'Test',
  email: 'amjad@example.com',
  phone: '+966 50 123 4567',
  city: 'Riyadh',
  district: 'Olaya',
  address: 'King Fahd Rd 123',
};

describe('shippingSchema', () => {
  it('accepts a valid payload', () => {
    const r = shippingSchema.safeParse(validShipping);
    expect(r.success).toBe(true);
  });

  it('flags missing required fields with i18n keys', () => {
    const r = shippingSchema.safeParse({ ...validShipping, firstName: '' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.find((i) => i.path[0] === 'firstName')?.message;
      expect(msg).toBe('Checkout.errors.required');
    }
  });

  it('rejects invalid email with i18n key', () => {
    const r = shippingSchema.safeParse({ ...validShipping, email: 'not-an-email' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const msg = r.error.issues.find((i) => i.path[0] === 'email')?.message;
      expect(msg).toBe('Checkout.errors.email');
    }
  });

  it('accepts multiple Saudi phone formats', () => {
    for (const phone of [
      '+966 50 123 4567',
      '+966501234567',
      '966501234567',
      '0501234567',
    ]) {
      expect(shippingSchema.safeParse({ ...validShipping, phone }).success).toBe(
        true,
      );
    }
  });

  it('rejects non-KSA phone formats', () => {
    for (const phone of ['+1 555 123 4567', '12345', '+44 20 7946 0958']) {
      const r = shippingSchema.safeParse({ ...validShipping, phone });
      expect(r.success).toBe(false);
    }
  });

  it('allows empty apartment', () => {
    expect(
      shippingSchema.safeParse({ ...validShipping, apartment: '' }).success,
    ).toBe(true);
    expect(
      shippingSchema.safeParse({ ...validShipping, apartment: undefined }).success,
    ).toBe(true);
  });

  it('rejects address shorter than 5 chars', () => {
    const r = shippingSchema.safeParse({ ...validShipping, address: 'No' });
    expect(r.success).toBe(false);
    if (!r.success) {
      expect(
        r.error.issues.find((i) => i.path[0] === 'address')?.message,
      ).toBe('Checkout.errors.address.short');
    }
  });
});

describe('paymentSelectionSchema', () => {
  it('accepts each canonical method', () => {
    for (const m of PAYMENT_METHODS) {
      expect(paymentSelectionSchema.safeParse({ method: m }).success).toBe(true);
    }
  });

  it('rejects an unknown method with i18n key', () => {
    const r = paymentSelectionSchema.safeParse({ method: 'bitcoin' as never });
    expect(r.success).toBe(false);
  });
});

describe('checkoutSchema', () => {
  it('accepts a full valid payload', () => {
    const r = checkoutSchema.safeParse({
      shipping: validShipping,
      payment: { method: 'mada' },
      idempotencyKey: '11111111-1111-4111-8111-111111111111',
    });
    expect(r.success).toBe(true);
  });

  it('reports nested field errors', () => {
    const r = checkoutSchema.safeParse({
      shipping: { ...validShipping, email: 'bad' },
      payment: { method: 'mada' },
    });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues.find(
        (i) => i.path[0] === 'shipping' && i.path[1] === 'email',
      );
      expect(issue?.message).toBe('Checkout.errors.email');
    }
  });
});

describe('KSA_PHONE_PATTERN', () => {
  it('is exported as a RegExp', () => {
    expect(KSA_PHONE_PATTERN).toBeInstanceOf(RegExp);
  });
});
