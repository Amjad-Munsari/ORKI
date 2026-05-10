/**
 * Phase 10 Plan 03 — zod schemas for auth Server Actions.
 *
 * Mirrors the `src/lib/checkout/schemas.ts` pattern. Error keys are full
 * dotted paths (`'Auth.errors.emailInvalid'`) so the form-side `Field`
 * helper resolves them via t(key.replace(/^Auth\./, '')).
 *
 * Per UI-SPEC §"Bilingual Copywriting Contract", DO NOT invent new keys —
 * every key here must already exist in messages/{en,ar}.json under the
 * `Auth.errors.*` namespace (or land alongside this plan's UI work in
 * Plan 10-04).
 */
import { z } from 'zod';

export const signupSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Auth.errors.emailInvalid'),
  password: z.string().min(8, 'Auth.errors.passwordTooShort'),
  acceptTerms: z.literal(true, { error: 'Auth.errors.acceptTermsRequired' }),
});

export const signinSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Auth.errors.emailInvalid'),
  password: z.string().min(1, 'Auth.errors.passwordRequired'),
});

export const requestResetSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Auth.errors.emailInvalid'),
});

export const setPasswordSchema = z
  .object({
    password: z.string().min(8, 'Auth.errors.passwordTooShort'),
    confirmPassword: z.string().min(8, 'Auth.errors.passwordTooShort'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Auth.errors.passwordMismatch',
    path: ['confirmPassword'],
  });

export type SignupInput = z.infer<typeof signupSchema>;
export type SigninInput = z.infer<typeof signinSchema>;
export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
