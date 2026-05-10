/**
 * Phase 10 Plan 03 — SEC-02 zod-validation gate.
 *
 * Each action must `safeParse` BEFORE calling Supabase. If validation fails,
 * the action returns { ok: false, code: 'VALIDATION', fields: { ... } } and
 * Supabase is NEVER called.
 *
 * These tests are unit-level — they run without live Supabase. They mock
 * `@/lib/supabase/server` so we can observe whether `createClient` was hit.
 *
 * Note: `@/lib/auth/audit` is also mocked so writeAuthEvent doesn't try to
 * reach the live DB during a unit test.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the SSR Supabase factory BEFORE the action import — it picks up the mock.
const createClientMock = vi.fn(async () => {
  throw new Error(
    'createClient should NOT be called when zod validation fails (SEC-02)'
  );
});
vi.mock('@/lib/supabase/server', () => ({
  createClient: createClientMock,
}));

// Mock the audit writer so unit tests don't try to talk to the DB.
const writeAuthEventMock = vi.fn(async () => undefined);
vi.mock('@/lib/auth/audit', () => ({
  writeAuthEvent: writeAuthEventMock,
}));

import {
  signInAction,
  signUpAction,
  requestPasswordResetAction,
  setPasswordAction,
} from '@/app/actions/auth';

describe('SEC-02 zod gate — Supabase NEVER called on invalid input', () => {
  beforeEach(() => {
    createClientMock.mockClear();
    writeAuthEventMock.mockClear();
  });

  describe('signUpAction', () => {
    it('rejects invalid email and does not call Supabase', async () => {
      const result = await signUpAction({
        // @ts-expect-error testing runtime rejection
        email: 'not-an-email',
        password: 'long-enough',
        acceptTerms: true,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it('rejects short password', async () => {
      const result = await signUpAction({
        email: 'a@b.com',
        password: 'short',
        acceptTerms: true,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it('rejects missing acceptTerms', async () => {
      const result = await signUpAction({
        email: 'a@b.com',
        password: 'long-enough',
        // @ts-expect-error — testing runtime rejection
        acceptTerms: false,
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });
  });

  describe('signInAction', () => {
    it('rejects invalid email', async () => {
      const result = await signInAction({
        // @ts-expect-error
        email: 'nope',
        password: 'whatever',
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it('rejects empty password', async () => {
      const result = await signInAction({ email: 'a@b.com', password: '' });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });
  });

  describe('requestPasswordResetAction', () => {
    it('rejects invalid email', async () => {
      const result = await requestPasswordResetAction({
        // @ts-expect-error
        email: 'nope',
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });
  });

  describe('setPasswordAction', () => {
    it('rejects mismatched passwords', async () => {
      const result = await setPasswordAction({
        password: 'long-enough',
        confirmPassword: 'different-long',
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });

    it('rejects short password', async () => {
      const result = await setPasswordAction({
        password: 'short',
        confirmPassword: 'short',
      });
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.code).toBe('VALIDATION');
      expect(createClientMock).not.toHaveBeenCalled();
    });
  });
});
