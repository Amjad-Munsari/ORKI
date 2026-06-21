import 'server-only';
import { Section, Button } from '@react-email/components';
import { env } from '@/lib/env';
import type { Locale } from '@/types/domain';

/**
 * Shared bits for the transactional email templates.
 *
 * Font: emails cannot rely on the app's next/font webfonts (Geist / IBM Plex
 * Sans Arabic are not loaded in the recipient's mail client), so we use
 * web-safe stacks that degrade predictably. The previous templates declared
 * "Space Grotesk" — a font the project doesn't even use and never loaded —
 * which silently fell back to the client default.
 */
export function emailFontFamily(isRtl: boolean): string {
  return isRtl
    ? '"IBM Plex Sans Arabic", "Segoe UI", Tahoma, sans-serif'
    : '"Helvetica Neue", Arial, sans-serif';
}

const CTA_COPY = {
  en: 'Visit ORKI',
  ar: 'زيارة ORKI',
} as const;

/**
 * A clickable CTA back to the storefront. Rendered only when ORKI_BASE_URL is
 * configured (it's optional in env) so emails never ship a broken/localhost
 * link. Links to the locale home — a target valid for both guests and
 * registered customers (order-detail pages are auth-gated and not universally
 * reachable from an email).
 */
export function StoreCta({ locale }: { locale: Locale }) {
  const base = env.ORKI_BASE_URL;
  if (!base) return null;
  const href = `${base.replace(/\/$/, '')}/${locale}`;
  return (
    <Section style={{ marginTop: 24, marginBottom: 8 }}>
      <Button
        href={href}
        style={{
          backgroundColor: '#fff',
          color: '#000',
          padding: '12px 22px',
          fontSize: 14,
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-block',
        }}
      >
        {CTA_COPY[locale]}
      </Button>
    </Section>
  );
}
