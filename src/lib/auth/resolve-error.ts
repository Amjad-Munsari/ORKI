/**
 * Phase 10 Plan 04 — shared helper for resolving a dynamic `Auth.errors.*`
 * message key inside a bound `useTranslations('Auth.errors')` translator.
 *
 * IN-04 (Phase 10 review): centralizes the `as never` escape hatch that the
 * three auth forms used to repeat (LoginForm, SignupForm, ResetPasswordForm).
 * The cast is the documented next-intl escape for runtime-dynamic keys when
 * the translator is bound to a namespace — see
 * https://next-intl.dev/docs/usage/messages#dynamic-keys.
 *
 * Strategy: strip the optional `Auth.errors.` prefix (action results may carry
 * the fully-qualified key), then try the lookup; on any throw (unknown key,
 * type narrowing failure) fall back to `Auth.errors.unknown`.
 *
 * Typing note: the parameter is typed as `unknown` rather than next-intl's
 * `Translator<...>` because the helper is intentionally untyped on the key
 * dimension — the cast IS the escape hatch. Callers pass the result of
 * `useTranslations('Auth.errors')` directly.
 */
export function resolveAuthErrorMessage(
  tErrors: unknown,
  messageKey: string,
): string {
  const stripped = messageKey.replace(/^Auth\.errors\./, '');
  const t = tErrors as (key: string) => string;
  try {
    return t(stripped);
  } catch {
    return t('unknown');
  }
}
