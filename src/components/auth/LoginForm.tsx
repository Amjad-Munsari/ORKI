'use client';
/**
 * Phase 10 Plan 04 — LoginForm.
 *
 * Posts to signInAction (Plan 10-03). On success → router.push('/account').
 * Form-level errors render via the Auth.errors.* messageKey envelope from
 * AuthActionResult; field-level zod errors come back as dotted keys that the
 * shared Field helper resolves through useTranslations('Auth.login').
 *
 * Anti-enumeration (SEC-06): wrong-email and wrong-password both surface as
 * Auth.errors.invalidCredentials from the action.
 */
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Field } from '@/components/forms/Field';
import { signInAction } from '@/app/actions/auth';
import { signinSchema, type SigninInput } from '@/lib/auth/schemas';
import { resolveAuthErrorMessage } from '@/lib/auth/resolve-error';

const inputClass =
  'w-full bg-transparent border-b border-white/20 py-3 min-h-[44px] text-white text-base placeholder:text-white/10 ' +
  'focus:outline-none focus:border-white transition-colors duration-300 rounded-none';

const buttonClass =
  'w-full sm:w-auto px-10 h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest text-sm ' +
  'flex items-center justify-center gap-2 hover:bg-white/90 transition-colors min-h-[44px] disabled:opacity-50';

function ariaProps(id: string, error: string | undefined) {
  return {
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
}

export function LoginForm() {
  const t = useTranslations('Auth.login');
  const tErrors = useTranslations('Auth.errors');
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SigninInput>({
    resolver: zodResolver(signinSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((data) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signInAction(data);
      if (!result.ok) {
        setFormError(resolveAuthErrorMessage(tErrors, result.messageKey));
        return;
      }
      // signInAction set the Supabase session cookie in its response. A soft
      // (client) navigation can render /account before the server sees that
      // cookie and bounce back to /login. A full-document navigation guarantees
      // the cookie is sent and /account renders authenticated. Login is
      // infrequent, so the full reload is an acceptable trade for correctness.
      window.location.assign(`/${locale}/account`);
    });
  });

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={t('heading')}
      className="space-y-8"
    >
      <Field
        id="login-email"
        label={t('email')}
        error={errors.email?.message}
        namespace="Auth"
      >
        <input
          id="login-email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email username"
          disabled={isPending}
          {...register('email')}
          {...ariaProps('login-email', errors.email?.message)}
          className={inputClass}
        />
      </Field>
      <Field
        id="login-password"
        label={t('password')}
        error={errors.password?.message}
        namespace="Auth"
      >
        <input
          id="login-password"
          type="password"
          dir="ltr"
          autoComplete="current-password"
          disabled={isPending}
          {...register('password')}
          {...ariaProps('login-password', errors.password?.message)}
          className={inputClass}
        />
      </Field>
      <p className="text-sm text-white/60 text-center">
        <Link
          href="/forgot-password"
          className="underline underline-offset-4 text-white"
        >
          {t('forgot')}
        </Link>
      </p>
      <div role="alert" aria-live="polite" className="min-h-[1.25rem]">
        {formError && <p className="text-red-400 text-xs">{formError}</p>}
      </div>
      <button
        type="submit"
        disabled={isPending}
        aria-busy={isPending}
        className={buttonClass}
      >
        {isPending ? t('submitting') : t('submit')}
      </button>
    </form>
  );
}
