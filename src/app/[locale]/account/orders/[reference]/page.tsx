/**
 * Phase 10 Plan 05 — per-order detail page for authenticated users.
 *
 * Reuses the lifted OrderDetailView (one source of truth for the order card
 * shared with /checkout/confirmation).
 *
 * Anti-enumeration (UI-SPEC §Anti-patterns #11, T-10-05-01): mismatched
 * ownership returns notFound() — NEVER 403. The page must NOT distinguish
 * between "this reference doesn't exist" and "this reference exists but
 * isn't yours" from the caller's perspective.
 *
 * Defence-in-depth: account/layout.tsx already gates this route via
 * getUser(); the explicit notFound() if !user keeps the page-level
 * contract intact even if the layout ever changes.
 */
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { ArrowCta } from '@/components/ui/ArrowCta';
import { createClient } from '@/lib/supabase/server';
import { getOrderByReference } from '@/lib/orders/server';
import { OrderDetailView } from '@/components/order/OrderDetailView';
import type { Locale } from '@/types/domain';

interface Props {
  params: Promise<{ reference: string; locale: string }>;
}

export const dynamic = 'force-dynamic';

export default async function AccountOrderDetailPage({ params }: Props) {
  const { reference, locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) notFound();

  const order = await getOrderByReference(reference);
  if (!order) notFound();

  // Ownership check — anti-enumeration. NEVER 403 (UI-SPEC #11).
  if (order.userId !== user.id) notFound();

  const t = await getTranslations('Account');

  return (
    <main className="min-h-[calc(100vh-80px)] bg-black py-24 px-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <Link
          href="/account"
          className="group text-sm font-bold uppercase tracking-widest text-white underline underline-offset-8 hover:text-white/80 transition-colors flex items-center gap-2 min-h-[44px]"
        >
          <ArrowCta locale={locale as Locale} direction="back" />
          {t('backToAccount')}
        </Link>
        <p className="text-sm text-white/60">
          {t.rich('signedInAs', {
            email: () => <span dir="ltr">{user.email}</span>,
          })}
        </p>
        <OrderDetailView order={order} locale={locale as Locale} />
      </div>
    </main>
  );
}
