import { notFound } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { getOrderByReference } from '@/lib/orders/server';
import { formatSAR } from '@/lib/orders/pricing';
import OrderStateControls from '@/components/admin/OrderStateControls';
import type { Locale } from '@/types/domain';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ reference: string; locale: string }>;
}

export default async function AdminOrderDetailPage({ params }: Props) {
  const { reference } = await params;
  const order = await getOrderByReference(reference);
  if (!order) notFound();

  // Per Plan 08-08 Revision 3a: real request locale, never hardcoded.
  const loc = (await getLocale()) as Locale;
  const placed = new Date(order.placedAt).toISOString();

  return (
    <div className="space-y-8 text-white">
      <div className="flex items-baseline justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic">
            {order.reference}
          </h1>
          <p className="text-sm font-mono opacity-50 mt-1 uppercase">
            {order.email} · {placed}
          </p>
        </div>
        <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 border border-white/30 rounded">
          {order.status}
        </span>
      </div>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2 text-sm">
          <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-2">
            Shipping
          </h2>
          <p>
            {order.shipping.firstName} {order.shipping.lastName}
          </p>
          <p>{order.shipping.phone}</p>
          <p>
            {order.shipping.address}
            {order.shipping.apartment ? ', ' + order.shipping.apartment : ''}
          </p>
          <p>
            {order.shipping.district}, {order.shipping.city}
          </p>
        </div>
        <div className="space-y-2 text-sm">
          <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-2">
            Totals
          </h2>
          <p>Subtotal: {formatSAR(order.subtotalCents, loc)}</p>
          <p>
            Shipping:{' '}
            {order.shippingCents === 0
              ? 'Free'
              : formatSAR(order.shippingCents, loc)}
          </p>
          <p>VAT: {formatSAR(order.vatCents, loc)}</p>
          <p className="font-bold">
            Total: {formatSAR(order.totalCents, loc)}
          </p>
          <p className="opacity-50">Payment: {order.paymentMethod}</p>
          {order.trackingNumber && (
            <p className="opacity-50">Tracking: {order.trackingNumber}</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-3">
          Line Items
        </h2>
        <ul className="divide-y divide-white/10 border border-white/10">
          {order.items.map((item) => (
            <li
              key={item.id}
              className="flex justify-between p-4 text-sm"
            >
              <span>
                {loc === 'ar' ? item.productName.ar : item.productName.en} (
                {item.sizeLabel}) × {item.quantity}
              </span>
              <span className="tabular-nums">
                {formatSAR(item.unitPriceCents * item.quantity, loc)}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <OrderStateControls order={order} />

      <section>
        <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-3">
          Events
        </h2>
        <ul className="divide-y divide-white/10 border border-white/10 text-xs font-mono">
          {order.events.map((ev) => {
            const meta = ev.metadata as Record<string, unknown> | null;
            const fromTo =
              meta && meta.fromStatus && meta.toStatus
                ? `${String(meta.fromStatus)} → ${String(meta.toStatus)}`
                : null;
            const actor = meta && meta.actor ? String(meta.actor) : null;
            const note = meta && meta.reason ? String(meta.reason) : null;
            return (
              <li
                key={ev.id}
                className="p-3 flex justify-between gap-4 flex-wrap"
              >
                <span className="space-x-2">
                  <span>{ev.type}</span>
                  {fromTo && <span className="opacity-60">({fromTo})</span>}
                  {actor && <span className="opacity-60">· {actor}</span>}
                  {note && <span className="opacity-60">· {note}</span>}
                </span>
                <span className="opacity-60">
                  {new Date(ev.createdAt).toISOString()}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
