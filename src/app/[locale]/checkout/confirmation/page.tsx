import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { getOrderByReference } from '@/lib/orders/server';
import { sessionMayViewOrder } from '@/lib/orders/order-access';
import { createClient } from '@/lib/supabase/server';
import { OrderDetailView } from '@/components/order/OrderDetailView';
import type { Locale, Order } from '@/types/domain';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ ref?: string; orderId?: string }>;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  const sp = await searchParams;
  const ref = sp.ref ?? sp.orderId;
  if (!ref) notFound();

  // PERF-05: separate "DB unavailable" (try/catch fallback) from "order
  // doesn't exist" (still notFound()). A Supabase blip should NOT 404 a user
  // whose payment we already accepted — render reassurance copy instead.
  let order: Order | null;
  try {
    order = await getOrderByReference(ref);
  } catch (err) {
    console.error('[checkout/confirmation] getOrderByReference failed', err);
    const tErr = await getTranslations('Errors.section');
    return (
      <div
        role="alert"
        className="min-h-[60vh] flex items-center justify-center px-6"
      >
        <p className="text-lg text-white/60 max-w-md text-center">
          {tErr('orderLoadFailed')}
        </p>
      </div>
    );
  }

  if (!order) notFound();

  // AUTHORIZATION (anti-enumeration, IDOR): this page exposes full order PII.
  // Allow only (a) the browser that placed the order — proven by the httpOnly
  // order-view cookie set at checkout — or (b) the signed-in owner. Anyone else
  // gets notFound(), NEVER 403 (must not reveal that the reference exists).
  const placedBySession = await sessionMayViewOrder(ref);
  let ownedByUser = false;
  if (!placedBySession && order.userId) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    ownedByUser = !!user && order.userId === user.id;
  }
  if (!placedBySession && !ownedByUser) notFound();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center py-24 px-6">
      <OrderDetailView
        order={order}
        locale={locale as Locale}
        confirmationChrome
      />
    </div>
  );
}
