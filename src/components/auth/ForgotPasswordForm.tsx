'use client';
/**
 * Phase 10 Plan 04 — ForgotPasswordForm.
 *
 * Posts to requestPasswordResetAction (Plan 10-03). Per SEC-06 anti-enumeration:
 *   - The action ALWAYS returns ok regardless of whether the email exists.
 *   - This UI ALWAYS shows the generic success message after submit, regardless
 *     of result.ok (defensive — also covers the unlikely VALIDATION-failure path
 *     where the email is syntactically invalid; in that case the field-level
 *     error renders too, but the form-level success message is suppressed
 *     until the field error is cleared).
 */
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Field } from '@/components/forms/Field';
import { requestPasswordResetAction } from '@/app/actions/auth';
import { requestResetSchema, type RequestResetInput } from '@/lib/auth/schemas';

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

export function ForgotPasswordForm() {
  const t = useTranslations('Auth.forgot');
  const [isPending, startTransition] = useTransition();
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RequestResetInput>({
    resolver: zodResolver(requestResetSchema),
    mode: 'onBlur',
  });

  const onSubmit = handleSubmit((data) => {
    startTransition(async () => {
      // SEC-06: the action is anti-enumeration — it always returns ok.
      // We don't branch on the response.
      await requestPasswordResetAction(data);
      setSubmitted(true);
    });
  });

  if (submitted) {
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
        id="forgot-email"
        label={t('email')}
        error={errors.email?.message}
        namespace="Auth"
      >
        <input
          id="forgot-email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email"
          disabled={isPending}
          {...register('email')}
          {...ariaProps('forgot-email', errors.email?.message)}
          className={inputClass}
        />
      </Field>
      <div role="alert" aria-live="polite" className="min-h-[1.25rem]" />
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
