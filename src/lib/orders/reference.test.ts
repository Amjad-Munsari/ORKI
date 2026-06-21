import { describe, it, expect } from 'vitest';
import { generateOrderReference, ORDER_REFERENCE_PATTERN } from './reference';

describe('generateOrderReference', () => {
  it('returns a string matching the ORK-XXXXXX pattern', () => {
    for (let i = 0; i < 100; i++) {
      const ref = generateOrderReference();
      expect(ref).toMatch(ORDER_REFERENCE_PATTERN);
    }
  });

  it('uses an alphabet without visually ambiguous chars (no O, 0, I, 1, L)', () => {
    for (let i = 0; i < 200; i++) {
      const ref = generateOrderReference();
      const tail = ref.slice(4); // drop ORK-
      expect(tail).not.toMatch(/[O0I1L]/);
    }
  });

  it('is highly unlikely to collide across 1000 calls', () => {
    const refs = new Set<string>();
    for (let i = 0; i < 1000; i++) refs.add(generateOrderReference());
    expect(refs.size).toBeGreaterThanOrEqual(999);
  });
});
