'use client';
/**
 * Phase 10 Plan 04 — SignupForm.
 *
 * Posts to signUpAction (Plan 10-03). On success → router.push('/account')
 * (user is auto-signed-in per CONTEXT.md decision).
 *
 * Anti-enumeration (SEC-06): existing-email signup returns
 * Auth.errors.unknown — never reveal "email already registered".
 *
 * Includes the accept-terms checkbox via @base-ui/react/checkbox with a
 * t.rich label wiring <terms> / <privacy> tokens to next-intl Link.
 */
import { useState, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import { Checkbox } from '@base-ui/react/checkbox';
import { useRouter, Link } from '@/i18n/navigation';
import { Field } from '@/components/forms/Field';
import { signUpAction } from '@/app/actions/auth';
import { signupSchema, type SignupInput } from '@/lib/auth/schemas';
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

export function SignupForm() {
  const t = useTranslations('Auth.signup');
  const tErrors = useTranslations('Auth.errors');
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    mode: 'onBlur',
    defaultValues: {
      acceptTerms: false,
    },
  });

  const onSubmit = handleSubmit((data) => {
    setFormError(null);
    startTransition(async () => {
      const result = await signUpAction(data);
      if (!result.ok) {
        setFormError(resolveAuthErrorMessage(tErrors, result.messageKey));
        return;
      }
      router.push('/account');
    });
  });

  const acceptErr = errors.acceptTerms?.message;

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      aria-label={t('heading')}
      className="space-y-8"
    >
      <Field
        id="signup-email"
        label={t('email')}
        error={errors.email?.message}
        namespace="Auth"
      >
        <input
          id="signup-email"
          type="email"
          dir="ltr"
          inputMode="email"
          autoComplete="email username"
          disabled={isPending}
          {...register('email')}
          {...ariaProps('signup-email', errors.email?.message)}
          className={inputClass}
        />
      </Field>
      <Field
        id="signup-password"
        label={t('password')}
        error={errors.password?.message}
        namespace="Auth"
      >
        <input
          id="signup-password"
          type="password"
          dir="ltr"
          autoComplete="new-password"
          disabled={isPending}
          {...register('password')}
          {...ariaProps('signup-password', errors.password?.message)}
          className={inputClass}
          aria-describedby={
            errors.password?.message
              ? 'signup-password-error signup-password-helper'
              : 'signup-password-helper'
          }
        />
        <p
          id="signup-password-helper"
          className="text-[12px] text-white/60 leading-relaxed mt-2"
        >
          {t('passwordHelper')}
        </p>
      </Field>

      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Controller
            control={control}
            name="acceptTerms"
            render={({ field }) => (
              <Checkbox.Root
                id="signup-accept"
                checked={field.value === true}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                disabled={isPending}
                aria-invalid={acceptErr ? true : undefined}
                aria-describedby={acceptErr ? 'signup-accept-error' : undefined}
                className="mt-1 size-5 rounded-none border border-white/30 data-[checked]:bg-white data-[checked]:border-white focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-white/50"
              >
                <Checkbox.Indicator className="flex items-center justify-center">
                  <Check className="size-4 text-black" aria-hidden />
                </Checkbox.Indicator>
              </Checkbox.Root>
            )}
          />
          <label
            htmlFor="signup-accept"
            className="text-sm text-white/60 leading-relaxed cursor-pointer"
          >
            {t.rich('acceptTerms', {
              terms: (chunks) => (
                <Link
                  href="/legal/terms"
                  className="underline underline-offset-4 text-white"
                >
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link
                  href="/legal/privacy"
                  className="underline underline-offset-4 text-white"
                >
                  {chunks}
                </Link>
              ),
            })}
          </label>
        </div>
        {acceptErr && (
          <p
            id="signup-accept-error"
            role="alert"
            className="text-red-400 text-xs"
          >
            {resolveAuthErrorMessage(tErrors, acceptErr)}
          </p>
        )}
      </div>

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
