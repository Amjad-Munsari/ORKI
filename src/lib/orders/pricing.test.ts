import { describe, it, expect } from 'vitest';
import {
  computeOrderTotals,
  formatSAR,
  FLAT_SHIPPING_CENTS,
  FREE_SHIPPING_THRESHOLD_CENTS,
} from './pricing';

describe('computeOrderTotals', () => {
  it('returns all zeros for empty cart', () => {
    expect(computeOrderTotals([])).toEqual({
      subtotalCents: 0,
      shippingCents: 0,
      vatCents: 0,
      totalCents: 0,
    });
  });

  it('applies flat shipping below threshold and VAT on (sub+ship)', () => {
    // sub=10000, ship=2500, vat=round(12500*0.15)=1875, total=14375
    const t = computeOrderTotals([{ unitPriceCents: 10000, quantity: 1 }]);
    expect(t.subtotalCents).toBe(10000);
    expect(t.shippingCents).toBe(FLAT_SHIPPING_CENTS);
    expect(t.vatCents).toBe(1875);
    expect(t.totalCents).toBe(14375);
  });

  it('grants free shipping at exactly threshold', () => {
    const t = computeOrderTotals([
      { unitPriceCents: FREE_SHIPPING_THRESHOLD_CENTS, quantity: 1 },
    ]);
    expect(t.shippingCents).toBe(0);
    // sub=30000, ship=0, vat=round(30000*0.15)=4500, total=34500
    expect(t.vatCents).toBe(4500);
    expect(t.totalCents).toBe(34500);
  });

  it('grants free shipping above threshold', () => {
    const t = computeOrderTotals([{ unitPriceCents: 50000, quantity: 1 }]);
    expect(t.shippingCents).toBe(0);
  });

  it('sums multiple items correctly', () => {
    const t = computeOrderTotals([
      { unitPriceCents: 5000, quantity: 2 }, // 10000
      { unitPriceCents: 12500, quantity: 1 }, // 12500
    ]);
    expect(t.subtotalCents).toBe(22500);
    expect(t.shippingCents).toBe(FLAT_SHIPPING_CENTS);
    // (22500 + 2500) * 0.15 = 3750
    expect(t.vatCents).toBe(3750);
    expect(t.totalCents).toBe(28750);
  });

  it('clamps negative inputs to zero', () => {
    const t = computeOrderTotals([{ unitPriceCents: -100, quantity: -5 }]);
    expect(t.subtotalCents).toBe(0);
  });

  it('uses integer math throughout (no float drift)', () => {
    // sub=99, ship=2500 (below threshold), vat=round(2599*0.15)=round(389.85)=390
    const t = computeOrderTotals([{ unitPriceCents: 33, quantity: 3 }]);
    expect(t.subtotalCents).toBe(99);
    expect(t.vatCents).toBe(390);
    expect(t.totalCents).toBe(99 + 2500 + 390);
  });

  it('returns integer halalas only (no floats)', () => {
    const t = computeOrderTotals([{ unitPriceCents: 7777, quantity: 1 }]);
    expect(Number.isInteger(t.subtotalCents)).toBe(true);
    expect(Number.isInteger(t.shippingCents)).toBe(true);
    expect(Number.isInteger(t.vatCents)).toBe(true);
    expect(Number.isInteger(t.totalCents)).toBe(true);
  });
});

describe('formatSAR', () => {
  // Phase 11 followup: switched the symbol from the locale-default 'SAR' / 'ر.س'
  // to the new SAMA Riyal glyph (⃁) via formatPriceSARFromHalalas.
  const RIYAL = '⃁';

  it('formats EN with Western numerals + Riyal glyph', () => {
    const s = formatSAR(12500, 'en');
    expect(s).toContain(RIYAL);
    expect(s).toMatch(/125/);
  });

  it('formats AR with Western numerals (ar-SA-u-nu-latn) + Riyal glyph', () => {
    const s = formatSAR(12500, 'ar');
    expect(s).toContain(RIYAL);
    expect(s).toMatch(/125/);
  });

  it('formats zero', () => {
    expect(formatSAR(0, 'en')).toMatch(/0/);
    expect(formatSAR(0, 'en')).toContain(RIYAL);
  });
});
