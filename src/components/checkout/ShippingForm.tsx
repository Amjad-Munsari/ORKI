'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { shippingSchema, type ShippingInput } from '@/lib/checkout/schemas';

interface Props {
  defaultValues?: Partial<ShippingInput>;
  onValid: (data: ShippingInput) => void;
  formId?: string;
}

export type ShippingFormData = ShippingInput;

const inputClass =
  'w-full bg-transparent border-b border-white/20 py-3 min-h-[44px] text-white placeholder:text-white/10 ' +
  'focus:outline-none focus:border-white transition-colors duration-300 rounded-none';

function ariaProps(id: string, error: string | undefined) {
  return {
    'aria-invalid': error ? ('true' as const) : undefined,
    'aria-describedby': error ? `${id}-error` : undefined,
  };
}

export function ShippingForm({
  defaultValues,
  onValid,
  formId = 'checkout-shipping-form',
}: Props) {
  const t = useTranslations('Checkout');
  const {
    register,
    handleSubmit,
    formState: { errors },
    setFocus,
  } = useForm<ShippingInput>({
    resolver: zodResolver(shippingSchema),
    defaultValues,
    mode: 'onBlur',
  });

  useEffect(() => {
    const firstError = Object.keys(errors)[0] as
      | keyof ShippingInput
      | undefined;
    if (firstError) setFocus(firstError);
  }, [errors, setFocus]);

  return (
    <form
      id={formId}
      onSubmit={handleSubmit(onValid)}
      noValidate
      className="space-y-12"
      aria-label={t('step1')}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        <Field
          id="firstName"
          label={t('firstName')}
          error={errors.firstName?.message}
        >
          <input
            id="firstName"
            {...register('firstName')}
            {...ariaProps('firstName', errors.firstName?.message)}
            className={inputClass}
          />
        </Field>
        <Field
          id="lastName"
          label={t('lastName')}
          error={errors.lastName?.message}
        >
          <input
            id="lastName"
            {...register('lastName')}
            {...ariaProps('lastName', errors.lastName?.message)}
            className={inputClass}
          />
        </Field>
        <Field
          id="email"
          label={t('email')}
          error={errors.email?.message}
          className="md:col-span-2"
        >
          <input
            id="email"
            type="email"
            {...register('email')}
            {...ariaProps('email', errors.email?.message)}
            className={inputClass}
          />
        </Field>
        <Field
          id="phone"
          label={t('phone')}
          error={errors.phone?.message}
          className="md:col-span-2"
        >
          <input
            id="phone"
            type="tel"
            placeholder={t('phonePlaceholder')}
            {...register('phone')}
            {...ariaProps('phone', errors.phone?.message)}
            className={inputClass}
          />
        </Field>
        <Field id="city" label={t('city')} error={errors.city?.message}>
          <input
            id="city"
            {...register('city')}
            {...ariaProps('city', errors.city?.message)}
            className={inputClass}
          />
        </Field>
        <Field
          id="district"
          label={t('district')}
          error={errors.district?.message}
        >
          <input
            id="district"
            {...register('district')}
            {...ariaProps('district', errors.district?.message)}
            className={inputClass}
          />
        </Field>
        <Field
          id="address"
          label={t('address')}
          error={errors.address?.message}
          className="md:col-span-2"
        >
          <input
            id="address"
            {...register('address')}
            {...ariaProps('address', errors.address?.message)}
            className={inputClass}
          />
        </Field>
        <Field
          id="apartment"
          label={t('apartment')}
          error={errors.apartment?.message}
          className="md:col-span-2"
        >
          <input
            id="apartment"
            {...register('apartment')}
            {...ariaProps('apartment', errors.apartment?.message)}
            className={inputClass}
          />
        </Field>
      </div>
    </form>
  );
}

interface FieldProps {
  id: string;
  label: string;
  error: string | undefined;
  className?: string;
  children: React.ReactNode;
}

function Field({ id, label, error, className, children }: FieldProps) {
  const t = useTranslations('Checkout');
  // Schemas store error keys as full dotted paths like "Checkout.errors.required".
  // Strip the namespace prefix so useTranslations('Checkout') can resolve them.
  let resolvedError: string | undefined;
  if (error) {
    if (error.startsWith('Checkout.')) {
      const stripped = error.replace(/^Checkout\./, '');
      try {
        resolvedError = t(stripped as never);
      } catch {
        resolvedError = error;
      }
    } else {
      resolvedError = error;
    }
  }
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold"
      >
        {label}
      </label>
      {children}
      {resolvedError && (
        <p
          id={`${id}-error`}
          role="alert"
          className="text-red-400 text-xs mt-2"
        >
          {resolvedError}
        </p>
      )}
    </div>
  );
}
