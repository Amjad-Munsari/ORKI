import { getLocale } from 'next-intl/server';
import { getAllOrders } from '@/lib/orders/server';
import OrdersTable from '@/components/admin/OrdersTable';
import type { Locale } from '@/types/domain';

export const dynamic = 'force-dynamic';

export default async function AdminOrdersPage() {
  // Per Plan 08-08 Revision 3a: use the actual request locale, never a hardcode.
  const loc = (await getLocale()) as Locale;
  const orders = await getAllOrders();

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
