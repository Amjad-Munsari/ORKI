/**
 * Unit tests for guest order-confirmation access control (order-access.ts).
 * Locks in the anti-enumeration contract: only references this browser was
 * granted (at checkout) are viewable; unknown references are rejected.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// In-memory cookie jar standing in for next/headers cookies().
const store = new Map<string, string>();
vi.mock('next/headers', () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) =>
      store.has(name) ? { name, value: store.get(name)! } : undefined,
    set: (name: string, value: string) => {
      store.set(name, value);
    },
  })),
}));

import {
  grantOrderView,
  sessionMayViewOrder,
  ORDER_VIEW_COOKIE,
} from './order-access';

beforeEach(() => {
  store.clear();
});

describe('order-access', () => {
  it('rejects any reference before a grant', async () => {
    await expect(sessionMayViewOrder('ORK-AAAAAA')).resolves.toBe(false);
  });

  it('authorizes only the granted reference', async () => {
    await grantOrderView('ORK-AAAAAA');
    await expect(sessionMayViewOrder('ORK-AAAAAA')).resolves.toBe(true);
    await expect(sessionMayViewOrder('ORK-BBBBBB')).resolves.toBe(false);
  });

  it('accumulates multiple grants for the same browser', async () => {
    await grantOrderView('ORK-AAAAAA');
    await grantOrderView('ORK-BBBBBB');
    await expect(sessionMayViewOrder('ORK-AAAAAA')).resolves.toBe(true);
    await expect(sessionMayViewOrder('ORK-BBBBBB')).resolves.toBe(true);
  });

  it('caps the stored list at 10 most-recent references', async () => {
    for (let i = 0; i < 12; i++) {
      await grantOrderView(`ORK-${String(i).padStart(6, '0')}`);
    }
    const stored = store.get(ORDER_VIEW_COOKIE)!.split(',');
    expect(stored).toHaveLength(10);
    // Most recent retained, oldest evicted.
    await expect(sessionMayViewOrder('ORK-000011')).resolves.toBe(true);
    await expect(sessionMayViewOrder('ORK-000000')).resolves.toBe(false);
  });
});
