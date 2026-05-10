import { Link } from '@/i18n/navigation';
import type { Locale } from '@/types/domain';

export type BrandedErrorVariant = 'error' | '404';

export interface BrandedErrorPageProps {
  variant: BrandedErrorVariant;
  heading: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  locale: Locale;
  isRtl: boolean;
  errorDigest?: string;
  /** When set, primary renders as <button> (used by error variant for reset()). */
  onPrimary?: () => void;
  secondaryLabel?: string;
  secondaryHref?: string;
}

/**
 * Shared chrome consumed by global-error.tsx, [locale]/error.tsx, and
 * [locale]/not-found.tsx. Server-Component-friendly: no `'use client'`
 * directive — works inside Client Components and RSCs alike.
 *
 * Variant rules:
 *  - `error` → role="alert" (accessible live-region announce on render)
 *  - `404` → no role attribute (UI-SPEC §Accessibility line 304)
 *
 * The `errorDigest` is rendered only when `process.env.NODE_ENV === 'development'`
 * — production users never see internal IDs (T-09-05-01 mitigation).
 */
export function BrandedErrorPage({
  variant,
  heading,
  body,
  ctaLabel,
  ctaHref,
  locale: _locale,
  isRtl: _isRtl,
  errorDigest,
  onPrimary,
  secondaryLabel,
  secondaryHref,
}: BrandedErrorPageProps) {
  const role = variant === 'error' ? 'alert' : undefined;

  const primary = onPrimary ? (
    <button
      type="button"
      onClick={onPrimary}
      className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-none"
    >
      {ctaLabel}
    </button>
  ) : (
    <Link
      href={ctaHref}
      className="inline-block px-6 py-3 bg-white text-black font-semibold rounded-none"
    >
      {ctaLabel}
    </Link>
  );

  return (
    <div
      role={role}
      className="min-h-[80vh] bg-black flex items-center justify-center px-6"
    >
      <div className="max-w-md text-center space-y-8">
        <h1 className="text-6xl md:text-[100px] font-bold leading-none tracking-tighter text-white">
          {heading}
        </h1>
        <p className="text-lg text-white/60">{body}</p>
        {errorDigest && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-white/40">Error ID: {errorDigest}</p>
        )}
        <div className="flex gap-4 justify-center pt-4">
          {primary}
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="inline-block px-6 py-3 border border-white/30 text-white font-semibold rounded-none"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
