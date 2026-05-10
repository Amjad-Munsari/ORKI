import { getLocale, getTranslations } from 'next-intl/server';
import { getAllOrders } from '@/lib/orders/server';
import OrdersTable from '@/components/admin/OrdersTable';
import type { Locale, Order } from '@/types/domain';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  // Per Plan 08-08 Revision 3a: use the actual request locale, never a hardcode.
  const loc = (await getLocale()) as Locale;

  // PERF-05: wrap DB read in try/catch so a Supabase blip renders branded
  // fallback copy instead of bubbling to the per-locale error boundary.
  let orders: Order[] | null = null;
  try {
    orders = await getAllOrders();
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('[admin/orders] getAllOrders failed', err);
  }

  if (!orders) {
    const tErr = await getTranslations('Errors.section');
    return (
      <div
        role="alert"
        className="min-h-[60vh] flex items-center justify-center px-6"
      >
        <p className="text-lg text-white/60 max-w-md text-center">
          {tErr('adminOrdersFailed')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black uppercase tracking-tighter italic">
          Orders
        </h1>
        <p className="text-sm font-mono opacity-50 mt-1 uppercase">
          Order lifecycle, fulfillment, and audit log
        </p>
      </div>

      <OrdersTable initialOrders={orders} locale={loc} />
    </div>
  );
}
