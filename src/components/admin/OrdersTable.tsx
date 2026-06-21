'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/navigation';
import { formatSAR } from '@/lib/orders/pricing';
import type { Order, Locale } from '@/types/domain';

interface Props {
  initialOrders: Order[];
  /** Per Plan 08-08 Revision 3a — locale comes from parent Server Component. */
  locale: Locale;
}

export default function OrdersTable({ initialOrders, locale }: Props) {
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filtered = initialOrders.filter((o) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      o.reference.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 text-white">
      <div className="flex justify-between items-end gap-4 border-b-2 border-white/20 pb-6">
        <div className="flex-1 max-w-md">
          <label
            htmlFor="orders-search"
            className="block text-[10px] font-mono uppercase font-bold mb-1 opacity-50"
          >
            Search Orders
          </label>
          <input
            id="orders-search"
            type="search"
            placeholder="FILTER BY REFERENCE / EMAIL / STATUS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent border-2 border-white/40 p-3 font-mono text-sm uppercase placeholder:opacity-20 focus:outline-none focus:border-white focus:ring-0 transition-all text-white"
          />
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono uppercase opacity-40 mb-1">
            Orders Found
          </div>
          <div className="text-2xl font-black italic text-white">
            {filtered.length}
          </div>
        </div>
      </div>

      <div className="border-2 border-white/20 overflow-hidden bg-white/5">
        <div className="grid grid-cols-[160px_1fr_120px_140px_120px_60px] gap-4 px-4 py-3 bg-[#0a0a0a] border-b border-white/10 text-[10px] uppercase tracking-widest opacity-50 font-bold">
          <div>Reference</div>
          <div>Email</div>
          <div>Placed</div>
          <div>Total</div>
          <div>Status</div>
          <div>Items</div>
        </div>

        {filtered.length === 0 && (
          <div className="bg-black p-12 text-center">
            <div className="text-4xl font-black uppercase opacity-10 italic text-white">
              No Orders
            </div>
            <p className="font-mono text-xs opacity-40 mt-2 uppercase text-white">
              No orders match your search.
            </p>
          </div>
        )}

        {filtered.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() =>
              // next-intl's typed router accepts a string href when prefixed by locale
              // by default; cast through unknown to keep the pathname-template strict
              // typing happy without disabling typescript-eslint rules.
              router.push(`/admin/orders/${o.reference}` as never)
            }
            className="grid grid-cols-[160px_1fr_120px_140px_120px_60px] gap-4 px-4 py-3 w-full text-start bg-black hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0 min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          >
            <span className="font-mono text-sm">{o.reference}</span>
            <span className="text-sm truncate">{o.email}</span>
            <span className="text-xs opacity-60">
              {new Date(o.placedAt).toISOString().slice(0, 10)}
            </span>
            <span className="text-sm tabular-nums">
              {formatSAR(o.totalCents, locale)}
            </span>
            <span className="text-[10px] uppercase tracking-widest">
              {o.status}
            </span>
            <span className="text-xs opacity-60">{o.items.length}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
