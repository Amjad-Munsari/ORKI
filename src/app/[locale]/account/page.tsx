/**
 * Phase 10 Plan 05 — /[locale]/account orders-list page.
 *
 * Server Component. Queries Drizzle for orders filtered by userId. The
 * userId filter is the ONLY enforcement at this query path (Drizzle bypasses
 * RLS) — see src/lib/orders/server.ts §getOrdersForUser for the contract.
 * RLS for PostgREST consumers is proven separately by the cross-user-deny
 * test (Task 5.8).
 *
 * Renders the UI-SPEC §"Account Page Chrome": Tier 4 eyebrow + Tier 1
 * display heading + signedInAs micro-line + OrdersList (which handles empty
 * state inline).
 */
export const dynamic = 'force-dynamic';

import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { getOrdersForUser } from '@/lib/orders/server';
import { OrdersList } from '@/components/account/OrdersList';
import type { Locale } from '@/types/domain';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function AccountPage({ params }: Props) {
  const { locale } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  // Layout already gates this route; defensive belt-and-braces. notFound()
  // matches the sibling /account/orders/[reference]/page.tsx pattern and is
  // a clearer assertion than a silent blank screen.
  if (!user) notFound();

  const t = await getTranslations('Account');
  const orders = await getOrdersForUser(user.id, { limit: 20, offset: 0 });

  return (
    <main className="min-h-[calc(100vh-80px)] bg-black py-24 px-6">
      <div className="max-w-2xl mx-auto space-y-12">
        <header className="space-y-3">
          <p className="text-[12px] uppercase tracking-widest text-white/40 font-bold">
            {t('eyebrow')}
          </p>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white leading-none">
            {t('heading')}
          </h1>
          <p className="text-sm text-white/60 mt-3">
            {t.rich('signedInAs', {
              email: () => <span dir="ltr">{user.email}</span>,
            })}
          </p>
        </header>
        <OrdersList orders={orders} locale={locale as Locale} />
      </div>
    </main>
  );
}
