import { describe, it, expect } from 'vitest';
import {
  canTransition,
  assertTransition,
  isTerminal,
  legalNextStates,
  TRANSITIONS,
} from './state-machine';
import { IllegalTransitionError } from './errors';

describe('order state machine', () => {
  it('allows pending → confirmed transition', () => {
    expect(canTransition('pending', 'confirmed')).toBe(true);
  });

  it('allows pending → cancelled', () => {
    expect(canTransition('pending', 'cancelled')).toBe(true);
  });

  it('allows confirmed → shipped, cancelled, refunded', () => {
    expect(canTransition('confirmed', 'shipped')).toBe(true);
    expect(canTransition('confirmed', 'cancelled')).toBe(true);
    expect(canTransition('confirmed', 'refunded')).toBe(true);
  });

  it('allows shipped → delivered, cancelled, refunded (cancel-after-ship per CONTEXT)', () => {
    expect(canTransition('shipped', 'delivered')).toBe(true);
    expect(canTransition('shipped', 'cancelled')).toBe(true);
    expect(canTransition('shipped', 'refunded')).toBe(true);
  });

  it('allows delivered → refunded only', () => {
    expect(canTransition('delivered', 'refunded')).toBe(true);
    expect(canTransition('delivered', 'cancelled')).toBe(false);
    expect(canTransition('delivered', 'shipped')).toBe(false);
  });

  it('forbids backward transitions', () => {
    expect(canTransition('confirmed', 'pending')).toBe(false);
    expect(canTransition('shipped', 'pending')).toBe(false);
    expect(canTransition('shipped', 'confirmed')).toBe(false);
  });

  it('marks cancelled and refunded as terminal', () => {
    expect(isTerminal('cancelled')).toBe(true);
    expect(isTerminal('refunded')).toBe(true);
    expect(legalNextStates('cancelled')).toEqual([]);
    expect(legalNextStates('refunded')).toEqual([]);
  });

  it('throws IllegalTransitionError on invalid transition', () => {
    expect(() => assertTransition('cancelled', 'shipped')).toThrow(IllegalTransitionError);
    expect(() => assertTransition('refunded', 'pending')).toThrow(IllegalTransitionError);
  });

  it('does not allow self-transition', () => {
    expect(canTransition('pending', 'pending')).toBe(false);
    expect(canTransition('confirmed', 'confirmed')).toBe(false);
  });

  it('TRANSITIONS map covers all six states', () => {
    const states = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'] as const;
    for (const s of states) expect(TRANSITIONS[s]).toBeDefined();
  });
});
