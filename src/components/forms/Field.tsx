'use client';
/**
 * Phase 10 Plan 04 — shared form Field helper.
 *
 * Lifted from ShippingForm.tsx:165-209 with two changes:
 *   1. Label class bumped `text-[10px]` → `text-[12px]` per UI-SPEC §Anti-patterns #15.
 *      10 px labels risk WCAG 1.4.4 (Resize text) failures at 200% zoom and
 *      are too small for IBM Plex Arabic glyphs.
 *   2. New `namespace` prop (default `'Checkout'`) parameterises the t-shim
 *      strip so the same helper works for Auth.errors.* and Checkout.errors.*
 *      messageKeys without re-implementation.
 *
 * Logical CSS only (no `ml-/mr-/pl-/pr-/text-right/text-left`) per CLAUDE.md.
 * Aria attributes (aria-invalid, aria-describedby, role="alert") are owned by
 * the caller's <input> + this helper's error <p>.
 */
import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';

export interface FieldProps {
  id: string;
  label: string;
  /**
   * Error message — either a raw localized string OR a dotted-path messageKey
   * matching the `namespace` prop (e.g. `Auth.errors.emailInvalid` when
   * namespace is `Auth`). Dotted-path keys are stripped of the namespace
   * prefix and resolved via useTranslations(namespace).
   */
  error: string | undefined;
  className?: string;
  children: ReactNode;
  /**
   * next-intl namespace under which messageKey errors will be resolved.
   * Defaults to 'Checkout' to preserve ShippingForm semantics if it ever
   * consumes this shared helper.
   */
  namespace?: string;
}

export function Field({
  id,
  label,
  error,
  className,
  children,
  namespace = 'Checkout',
}: FieldProps) {
  // next-intl's typed namespaces narrow to specific literal unions;
  // a dynamic `namespace` prop must be widened via a typed cast.
  const t = useTranslations(namespace as Parameters<typeof useTranslations>[0]);

  let resolvedError: string | undefined;
  if (error) {
    const stripPrefix = new RegExp('^' + namespace + '\\.');
    if (stripPrefix.test(error)) {
      const stripped = error.replace(stripPrefix, '');
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
        className="block text-[12px] uppercase tracking-widest text-white/40 mb-2 font-bold"
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
