/**
 * Unit tests for the privileged-action authorization guard (require-admin.ts).
 * Locks in the SEC-08 contract for Server Action / Route Handler boundaries:
 * unauthenticated → throw, non-allowlisted → throw (audited), admin → pass.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(async () => ({ auth: { getUser } })),
}));

const isAdminEmail = vi.fn<(email: string | null | undefined) => boolean>();
vi.mock('@/lib/auth/admin-allowlist', () => ({
  isAdminEmail: (email: string | null | undefined) => isAdminEmail(email),
}));

const writeAuthEvent = vi.fn<(params: unknown) => Promise<void>>();
vi.mock('@/lib/auth/audit', () => ({
  writeAuthEvent: (params: unknown) => writeAuthEvent(params),
}));

import { requireAdmin, AdminAuthError } from './require-admin';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('requireAdmin', () => {
  it('throws AdminAuthError(unauthenticated) and audits when there is no user', async () => {
    getUser.mockResolvedValue({ data: { user: null } });

    await expect(requireAdmin('toggleProductStock')).rejects.toMatchObject({
      name: 'AdminAuthError',
      reason: 'unauthenticated',
    });
    expect(isAdminEmail).not.toHaveBeenCalled();
    expect(writeAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'admin_action',
        metadata: expect.objectContaining({ denied: true, reason: 'unauthenticated' }),
      })
    );
  });

  it('throws AdminAuthError(not_in_allowlist) and audits the denial for a non-admin user', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1', email: 'nope@evil.test' } } });
    isAdminEmail.mockReturnValue(false);

    await expect(requireAdmin('updateProductDetails')).rejects.toBeInstanceOf(AdminAuthError);
    expect(writeAuthEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'admin_action',
        userId: 'u1',
        email: 'nope@evil.test',
        metadata: expect.objectContaining({ denied: true, reason: 'not_in_allowlist' }),
      })
    );
  });

  it('returns the admin user and writes no denial audit for an allowlisted email', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'admin1', email: 'admin@orki.test' } } });
    isAdminEmail.mockReturnValue(true);

    await expect(requireAdmin('transitionOrder')).resolves.toEqual({
      id: 'admin1',
      email: 'admin@orki.test',
    });
    expect(writeAuthEvent).not.toHaveBeenCalled();
  });
});
