'use client';
/**
 * Phase 10 Plan 04 — ResetPasswordForm.
 *
 * Three states (UI-SPEC §"Reset-password specific chrome"):
 *   1. verifying — spinner + Auth.reset.verifyingLink. On mount we call
 *      supabase.auth.getUser() (the recovery session is set in the cookie
 *      by /api/auth/callback BEFORE this page renders).
 *   2. linkExpired — getUser returned no user → BrandedErrorPage variant='error'
 *      with CTA to /forgot-password.
 *   3. ready — form with two new-password inputs, posts to setPasswordAction.
 *
 * setPasswordAction is server-guarded too (updateUser fails without a
 * session); the loading-then-render pattern just avoids flashing the form
 * to a user who shouldn't see it.
 */
import { useEffect, useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Loader2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/client';
import { BrandedErrorPage } from '@/components/error/BrandedErrorPage';
import { Field } from '@/components/forms/Field';
import { setPasswordAction } from '@/app/actions/auth';
import { setPasswordSchema, type SetPasswordInput } from '@/lib/auth/schemas';
import { resolveAuthErrorMessage } from '@/lib/auth/resolve-error';
import type { Locale } from '@/types/domain';

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

interface Props {
  locale: Locale;
}

type ViewState = 'verifying' | 'expired' | 'ready' | 'done';

export function ResetPasswordForm({ locale }: Props) {
  const t = useTranslations('Auth.reset');
  const tErrors = useTranslations('Auth.errors');
  const [view, setView] = useState<ViewState>('verifying');
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
    mode: 'onBlur',
  });

  // On mount: verify recovery session is in place.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase.auth.getUser();
        if (cancelled) return;
        if (error || !data.user) {
          setView('expired');
        } else {
          setView('ready');
        }
      } catch {
        if (!cancelled) setView('expired');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = handleSubmit((data) => {
    setFormError(null);
    startTransition(async () => {
      const result = await setPasswordAction(data);
      if (!result.ok) {
        setFormError(resolveAuthErrorMessage(tErrors, result.messageKey));
        return;
      }
      setView('done');
    });
  });

  if (view === 'verifying') {
    return (
      <div className="text-center space-y-6">
        <Loader2
          className="size-6 text-white/40 animate-spin mx-auto"
          aria-hidden
        />
        <p className="text-sm text-white/60">{t('verifyingLink')}</p>
      </div>
    );
  }

  if (view === 'expired') {
    return (
      <BrandedErrorPage
        variant="error"
        heading={t('linkExpiredHeading')}
        body={t('linkExpiredBody')}
        ctaLabel={t('requestNewLink')}
        ctaHref="/forgot-password"
        locale={locale}
        isRtl={locale === 'ar'}
      />
    );
  }

  if (view === 'done') {
    return (
      <div className="space-y-8">
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-white/60 text-center"
        >
          {t('success')}
        </p>
        <p className="text-center">
          <Link
            href="/login"
            className="underline underline-offset-4 text-white text-sm"
          >
            {t('back')}
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={t('heading')}
      className="space-y-8"
    >
      <Field
        id="reset-new-password"
        label={t('newPassword')}
        error={errors.password?.message}
        namespace="Auth"
      >
        <input
          id="reset-new-password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          disabled={isPending}
          {...register('password')}
          {...ariaProps('reset-new-password', errors.password?.message)}
          className={inputClass}
        />
      </Field>
      <Field
        id="reset-confirm-password"
        label={t('confirmPassword')}
        error={errors.confirmPassword?.message}
        namespace="Auth"
      >
        <input
          id="reset-confirm-password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          disabled={isPending}
          {...register('confirmPassword')}
          {...ariaProps(
            'reset-confirm-password',
            errors.confirmPassword?.message,
          )}
          className={inputClass}
        />
      </Field>
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
