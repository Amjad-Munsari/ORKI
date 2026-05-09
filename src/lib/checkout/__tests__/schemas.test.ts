import { describe, it, expect } from 'vitest';
import { paymentSelectionSchema } from '../schemas';

describe('paymentSelectionSchema (i18n contract)', () => {
  it('emits the bilingual i18n key for unknown methods', () => {
    // Pinned by phase-8 plan-checker revision 1: this is the contract,
    // not a coincidence. Both EN and AR rendering go through this key.
    expect(
      paymentSelectionSchema.safeParse({ method: 'bitcoin' }).error?.issues[0]
        ?.message,
    ).toBe('Checkout.errors.payment.required');
  });

  it('accepts a canonical method (mada)', () => {
    const r = paymentSelectionSchema.safeParse({ method: 'mada' });
    expect(r.success).toBe(true);
  });

  it('reports the issue at path "method" with the i18n key', () => {
    const r = paymentSelectionSchema.safeParse({ method: 'bitcoin' });
    expect(r.success).toBe(false);
    if (!r.success) {
      const issue = r.error.issues[0];
      expect(issue.path).toEqual(['method']);
      expect(issue.message).toBe('Checkout.errors.payment.required');
    }
  });
});
