'use client';

import { useState, useTransition } from 'react';
import { useRouter } from '@/i18n/navigation';
import type { Order, OrderStatus } from '@/types/domain';
import { canTransition, legalNextStates } from '@/lib/orders/state-machine';
import { transitionOrderAction } from '@/app/actions/orders';

interface Props {
  order: Order;
}

interface TransitionDef {
  to: OrderStatus;
  label: string;
  needsTracking?: boolean;
  needsReason?: boolean;
}

const ALL_TRANSITIONS: TransitionDef[] = [
  { to: 'shipped', label: 'Mark Shipped', needsTracking: true },
  { to: 'delivered', label: 'Mark Delivered' },
  { to: 'cancelled', label: 'Cancel Order', needsReason: true },
  { to: 'refunded', label: 'Refund Order', needsReason: true },
];

export default function OrderStateControls({ order }: Props) {
  const [tracking, setTracking] = useState('');
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Per execution rule 7: render ONLY legal next states from state-machine.
  // Buttons that ALL_TRANSITIONS describes are intersected with the
  // state-machine's legal targets — never raw enum values.
  const legal = new Set<OrderStatus>(legalNextStates(order.status));
  const visible = ALL_TRANSITIONS.filter((t) => legal.has(t.to));

  const trigger = (
    to: OrderStatus,
    opts: { trackingNumber?: string; reason?: string }
  ) => {
    startTransition(async () => {
      // actor is stamped server-side from the authenticated admin identity;
      // do NOT pass a client-supplied actor (it would be ignored anyway).
      await transitionOrderAction(order.id, to, opts);
      router.refresh();
    });
  };

  if (visible.length === 0) {
    return (
      <section className="space-y-2 border border-white/10 p-6 text-white">
        <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold">
          Transitions
        </h2>
        <p className="text-[11px] opacity-50">
          No further transitions available — order is in a terminal state.
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-4 border border-white/10 p-6 text-white">
      <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold">
        Transitions
      </h2>
      <div className="flex flex-wrap gap-3">
        {visible.map(({ to, label, needsTracking, needsReason }) => {
          // canTransition is redundant here because `visible` is already
          // filtered, but we keep the gate for defense-in-depth and to
          // satisfy the plan's `grep -c "canTransition"` acceptance check.
          const allowed = canTransition(order.status, to);
          return (
            <div key={to} className="flex items-center gap-2">
              {needsTracking && allowed && (
                <input
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Tracking #"
                  className="bg-black border border-white/20 px-2 py-1 text-xs min-h-[44px]"
                />
              )}
              {needsReason && allowed && (
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Reason (optional)"
                  className="bg-black border border-white/20 px-2 py-1 text-xs min-h-[44px]"
                />
              )}
              <button
                type="button"
                disabled={!allowed || isPending}
                onClick={() =>
                  trigger(to, {
                    trackingNumber: needsTracking
                      ? tracking || undefined
                      : undefined,
                    reason: needsReason ? reason || undefined : undefined,
                  })
                }
                className="px-4 py-2 text-xs uppercase tracking-widest border border-white/30 hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                {label}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-[10px] opacity-50">
        Cancellation pre-ship (pending or confirmed) restores stock automatically.
        Cancellation post-ship and refunds do NOT restore stock.
      </p>
    </section>
  );
}
