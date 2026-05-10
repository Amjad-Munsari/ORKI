'use server';
/**
 * Phase 10 Plan 03 — Auth Server Actions.
 *
 * Each action:
 *   1. Parses input via the matching zod schema (SEC-02). Supabase is NEVER
 *      called when validation fails.
 *   2. Calls the SSR Supabase client (RLS-bound) via createClient().
 *   3. Writes an auth_events row (success OR failure paths) (SEC-09).
 *   4. Returns AuthActionResult<T>. Raw Supabase error text NEVER crosses the
 *      wire (SEC-06): everything funnels through mapSupabaseError, which
 *      collapses wrong-email + wrong-password to INVALID_CREDENTIALS and
 *      existing-email signup to UNKNOWN.
 *   5. revalidatePath('/', 'layout') on auth-state change so Navbar UserMenu
 *      re-renders.
 *
 * Cart-merge integration landed in Plan 10-05 — signInAction calls
 * mergeGuestCartIntoUserCart immediately after a successful sign-in.
 */
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { writeAuthEvent } from '@/lib/auth/audit';
import {
  mapSupabaseError,
  type AuthActionResult,
} from '@/lib/auth/errors';
import {
  signupSchema,
  signinSchema,
  requestResetSchema,
  setPasswordSchema,
  type SignupInput,
  type SigninInput,
  type RequestResetInput,
  type SetPasswordInput,
} from '@/lib/auth/schemas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function validationFailure<T>(parsed: {
  error: { issues: ReadonlyArray<{ path: ReadonlyArray<PropertyKey>; message: string }> };
}): Extract<AuthActionResult<T>, { ok: false }> {
  const fields = parsed.error.issues.reduce<Record<string, string>>(
    (acc, issue) => {
      const key = issue.path.map((p) => String(p)).join('.') || 'root';
      // Keep the first error per field; zod issues come ordered by parse pass.
      if (!acc[key]) acc[key] = issue.message;
      return acc;
    },
    {}
  );
  return {
    ok: false,
    code: 'VALIDATION',
    fields,
    messageKey: 'Auth.errors.unknown',
  };
}

// ─── 1. signUpAction ──────────────────────────────────────────────────────────

export async function signUpAction(
  input: SignupInput
): Promise<AuthActionResult<{ userId: string }>> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      const msg = (error?.message ?? '').toLowerCase();
      const isCollision = /already.*registered|user.*(?:exists|already)|email.*(?:exists|already)/.test(
        msg
      );
      // Anti-enumeration audit row: record the collision in metadata so ops
      // can detect duplicate-signup probes, but the wire response stays generic.
      await writeAuthEvent({
        type: 'signup',
        email: parsed.data.email,
        metadata: {
          failed: true,
          collision: isCollision,
          code: error?.code,
        },
      });
      const mapped = mapSupabaseError(error);
      return { ok: false, code: mapped.code, messageKey: mapped.messageKey };
    }

    await writeAuthEvent({
      type: 'signup',
      userId: data.user.id,
      email: data.user.email ?? parsed.data.email,
    });
    revalidatePath('/', 'layout');
    return { ok: true, data: { userId: data.user.id } };
  } catch (err) {
    console.error('[signUpAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Auth.errors.unknown' };
  }
}

// ─── 2. signInAction ──────────────────────────────────────────────────────────

export async function signInAction(
  input: SigninInput
): Promise<AuthActionResult<{ userId: string }>> {
  const parsed = signinSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error || !data.user) {
      // SEC-09: log the failure with the masked code (no message text).
      await writeAuthEvent({
        type: 'signin_failed',
        email: parsed.data.email,
        metadata: { code: error?.code, status: error?.status },
      });
      // SEC-06: collapse wrong-email + wrong-password into a single envelope.
      const mapped = mapSupabaseError(error);
      return { ok: false, code: mapped.code, messageKey: mapped.messageKey };
    }

    await writeAuthEvent({
      type: 'signin',
      userId: data.user.id,
      email: data.user.email ?? parsed.data.email,
    });

    // Plan 10-05: best-effort guest-cart merge. Read the orki_sid cookie to
    // identify the guest cart; dynamic import keeps the auth-actions module
    // bundle free of cart-server code at module load. Merge MUST happen after
    // writeAuthEvent (audit trail is the source of truth) and BEFORE
    // revalidatePath so the next render of Navbar / cart surfaces sees the
    // merged cart. The merge swallows its own errors internally — auth
    // success never depends on merge success.
    try {
      const sidCookie = (await cookies()).get('orki_sid')?.value ?? null;
      const { mergeGuestCartIntoUserCart } = await import(
        '@/lib/cart/merge-on-signin'
      );
      await mergeGuestCartIntoUserCart(data.user.id, sidCookie);
    } catch (mergeErr) {
      // Defence-in-depth: even though mergeGuestCartIntoUserCart swallows its
      // own errors, the dynamic import or cookie read could still throw.
      console.error('[signInAction][cart-merge]', mergeErr);
    }

    revalidatePath('/', 'layout');
    return { ok: true, data: { userId: data.user.id } };
  } catch (err) {
    console.error('[signInAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Auth.errors.unknown' };
  }
}

// ─── 3. signOutAction ─────────────────────────────────────────────────────────

/**
 * UI-SPEC §"Header Changes" calls this via `<form action={signOutAction}>` —
 * Next.js form actions accept void or a redirect-throwing function. We
 * redirect('/login') from next/navigation, which throws NEXT_REDIRECT (the
 * canonical control-flow shape).
 */
export async function signOutAction(): Promise<void> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    await supabase.auth.signOut();

    await writeAuthEvent({
      type: 'signout',
      userId: user?.id ?? null,
      email: user?.email ?? null,
    });
  } catch (err) {
    // Don't block the redirect — even if signOut throws, the cookies have
    // been cleared at the server boundary; surface the error in logs only.
    console.error('[signOutAction]', err);
  }
  // redirect() throws NEXT_REDIRECT — must be outside try/catch so the
  // control-flow throw isn't swallowed.
  redirect('/login');
}

// ─── 4. requestPasswordResetAction ────────────────────────────────────────────

/**
 * SEC-06 anti-enumeration: ALWAYS returns { ok: true, data: null } regardless
 * of whether the email exists. The UI shows a generic "if an account exists
 * for this email, we sent a reset link" message.
 */
export async function requestPasswordResetAction(
  input: RequestResetInput
): Promise<AuthActionResult<null>> {
  const parsed = requestResetSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const supabase = await createClient();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.NEXT_PUBLIC_VERCEL_URL
        ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
        : 'http://localhost:3000');
    // resetPasswordForEmail emits the reset email; redirectTo is the URL the
    // recovery link returns to (Plan 10-04 ships /api/auth/callback).
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${origin}/api/auth/callback?next=/en/reset-password`,
    });
  } catch (err) {
    // Anti-enumeration: swallow + log. UI must NOT see an error here.
    console.error('[requestPasswordResetAction]', err);
  }

  // Audit row regardless of outcome (records the request — useful for ops).
  await writeAuthEvent({
    type: 'password_reset_requested',
    email: parsed.data.email,
  });

  return { ok: true, data: null };
}

// ─── 5. setPasswordAction ─────────────────────────────────────────────────────

/**
 * Sets a new password for the currently-authenticated user (recovery session
 * is active in the cookie store, set by /api/auth/callback in Plan 10-04).
 */
export async function setPasswordAction(
  input: SetPasswordInput
): Promise<AuthActionResult<null>> {
  const parsed = setPasswordSchema.safeParse(input);
  if (!parsed.success) return validationFailure(parsed);

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });

    if (error || !data.user) {
      const mapped = mapSupabaseError(error);
      return { ok: false, code: mapped.code, messageKey: mapped.messageKey };
    }

    await writeAuthEvent({
      type: 'password_changed',
      userId: data.user.id,
      email: data.user.email ?? null,
    });
    revalidatePath('/', 'layout');
    return { ok: true, data: null };
  } catch (err) {
    console.error('[setPasswordAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Auth.errors.unknown' };
  }
}
