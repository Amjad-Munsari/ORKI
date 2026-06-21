import { getTranslations } from 'next-intl/server';
import type { Locale } from '@/types/domain';

interface Props {
  /** Active locale */
  locale: Locale;
}

/**
 * Strictly-necessary cookies table for the Cookie Policy page.
 *
 * Server Component — no 'use client'. Renders the two cookies ORKI actually
 * sets (`orki_sid` for cart persistence, `sb-*` for admin auth). Values are
 * sourced from `Legal.cookies.tableHeaders` / `Legal.cookies.tableRows` in
 * messages/{en,ar}.json (Plan 09-01 scaffold).
 *
 * RTL: uses logical padding `ps-4 pe-4` per CLAUDE.md (never `pl-`/`pr-`).
 * `text-start` ensures th alignment flips correctly between LTR and RTL.
 */
export async function CookieTable({ locale }: Props) {
  const t = await getTranslations({
    locale,
    namespace: 'Legal.cookies.tableHeaders',
  });
  const tRow = await getTranslations({
    locale,
    namespace: 'Legal.cookies.tableRows',
  });

  return (
    <table className="w-full text-sm border border-white/10">
      <thead className="bg-[#111111] text-white/40 text-xs uppercase tracking-widest">
        <tr>
          <th className="ps-4 pe-4 py-3 text-start font-medium">{t('name')}</th>
          <th className="ps-4 pe-4 py-3 text-start font-medium">{t('purpose')}</th>
          <th className="ps-4 pe-4 py-3 text-start font-medium">{t('duration')}</th>
          <th className="ps-4 pe-4 py-3 text-start font-medium">{t('type')}</th>
        </tr>
      </thead>
      <tbody className="text-white/80">
        <tr className="border-t border-white/10">
          <td className="ps-4 pe-4 py-3 font-mono">{tRow('orkiSidName')}</td>
          <td className="ps-4 pe-4 py-3">{tRow('orkiSidPurpose')}</td>
          <td className="ps-4 pe-4 py-3">{tRow('orkiSidDuration')}</td>
          <td className="ps-4 pe-4 py-3">{tRow('orkiSidType')}</td>
        </tr>
        <tr className="border-t border-white/10">
          <td className="ps-4 pe-4 py-3 font-mono">{tRow('sbAuthName')}</td>
          <td className="ps-4 pe-4 py-3">{tRow('sbAuthPurpose')}</td>
          <td className="ps-4 pe-4 py-3">{tRow('sbAuthDuration')}</td>
          <td className="ps-4 pe-4 py-3">{tRow('sbAuthType')}</td>
        </tr>
      </tbody>
    </table>
  );
}
