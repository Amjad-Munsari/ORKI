import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';
import type { Locale } from '@/types/domain';

interface Props {
  /** Eyebrow label, e.g. "(Legal) — 01" */
  eyebrow: string;
  /** Page heading, e.g. "Privacy Policy" */
  heading: string;
  /** Last-updated date string, e.g. "10 May 2026" */
  lastUpdated: string;
  /** Active locale */
  locale: Locale;
  /** Body sections (rendered inside <article>) */
  children: ReactNode;
}

/**
 * Shared chrome for all /[locale]/legal/* pages.
 *
 * Server Component — no 'use client'. Loads `Legal.lastUpdatedLabel` and
 * `Legal.templateDisclaimer` via getTranslations and renders the standard
 * eyebrow + h1 + last-updated + body slot + template-disclaimer footer.
 *
 * Width = max-w-[768px] per UI-SPEC §"Why max-w-[768px]" (legal copy reads
 * better at ~70ch). Container padding `px-6` is intentionally symmetric and
 * therefore fine in both LTR and RTL — logical-property rules apply only to
 * directional padding/margin, not to symmetric container gutters.
 */
export async function LegalArticle({
  eyebrow,
  heading,
  lastUpdated,
  locale,
  children,
}: Props) {
  const tCommon = await getTranslations({ locale, namespace: 'Legal' });

  return (
    <div className="min-h-screen bg-black pt-24 pb-48">
      <div className="max-w-[768px] mx-auto px-6">
        <header className="mb-24 space-y-6">
          <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold block">
            {eyebrow}
          </span>
          <h1 className="text-6xl md:text-[100px] font-bold uppercase tracking-tighter leading-none text-white">
            {heading}
          </h1>
          <p className="text-xs text-white/40">
            {tCommon('lastUpdatedLabel')} {lastUpdated}
          </p>
        </header>
        <article className="space-y-12 text-base text-white/60 leading-relaxed">
          {children}
        </article>
        <footer className="mt-32 pt-12 border-t border-white/10 text-xs text-white/40">
          {tCommon('templateDisclaimer')}
        </footer>
      </div>
    </div>
  );
}
