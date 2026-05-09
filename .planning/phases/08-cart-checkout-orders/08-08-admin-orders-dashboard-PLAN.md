---
phase: 08-cart-checkout-orders
plan: 08
type: execute
wave: 3
depends_on: [08-05]
files_modified:
  - src/app/[locale]/admin/orders/page.tsx
  - src/app/[locale]/admin/orders/[reference]/page.tsx
  - src/components/admin/OrdersTable.tsx
  - src/components/admin/OrderStateControls.tsx
  - src/components/admin/AdminLayout.tsx
autonomous: true
requirements: [ECOM-02, ECOM-04]
must_haves:
  truths:
    - "/admin/orders renders a server-fetched table of all orders sorted by placedAt desc"
    - "/admin/orders/[reference] renders order detail with line items and the order_events audit log"
    - "Admin can transition an order via OrderStateControls; only legal transitions per state-machine.ts are enabled"
    - "Stock is restored automatically on cancellation when status was pending or confirmed (handled in transitionOrderStatus from Plan 08-05)"
    - "AdminLayout side nav includes a link to /admin/orders"
    - "Admin order pages render in the actual request locale (EN or AR) — NO hardcoded `'en' as const` (per Revision 3)"
    - "OrdersTable receives the locale from its parent Server Component and passes it to formatSAR"
  artifacts:
    - path: "src/app/[locale]/admin/orders/page.tsx"
      provides: "Server Component admin orders list"
      contains: "getAllOrders"
    - path: "src/app/[locale]/admin/orders/[reference]/page.tsx"
      provides: "Server Component admin order detail"
      contains: "getOrderByReference"
    - path: "src/components/admin/OrdersTable.tsx"
      provides: "Client table mirroring InventoryTable with row-click drawer"
    - path: "src/components/admin/OrderStateControls.tsx"
      provides: "Slide-over panel with transition buttons gated by canTransition"
      contains: "canTransition"
  key_links:
    - from: "src/components/admin/OrderStateControls.tsx"
      to: "src/app/actions/orders.ts"
      via: "transitionOrderAction inside useTransition"
      pattern: "transitionOrderAction"
---

<objective>
Add the admin orders area: list at `/admin/orders` and detail at `/admin/orders/[reference]`. Detail page shows the audit log and exposes state-transition buttons (confirm-skip not applicable in this phase since payment success auto-confirms; the controls cover ship, deliver, cancel, refund). Each button is enabled only if `canTransition(currentStatus, target)` returns true. Cancellation pre-ship restores stock (handled in Plan 08-05's `transitionOrderStatus`).

Purpose: ECOM-02 (state machine usable end-to-end), ECOM-04 (refund/cancellation core architecture exposed via admin UI).

Output: Admin can manage the order lifecycle without touching the DB directly. All currency formatting honors the actual request locale (EN or AR) via `await getLocale()` from `next-intl/server` — no hardcoded `'en' as const` (per Revision 3).
</objective>

<execution_context>
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/workflows/execute-plan.md
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-cart-checkout-orders/08-CONTEXT.md
@.planning/phases/08-cart-checkout-orders/08-PATTERNS.md
@CLAUDE.md
@src/lib/orders/server.ts
@src/lib/orders/state-machine.ts
@src/lib/orders/pricing.ts
@src/app/actions/orders.ts
@src/app/[locale]/admin/inventory/page.tsx
@src/components/admin/InventoryTable.tsx
@src/components/admin/ProductEditor.tsx
@src/components/admin/AdminLayout.tsx
@messages/en.json
@messages/ar.json
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Create admin orders pages + OrdersTable + OrderStateControls; add nav link</name>
  <files>src/app/[locale]/admin/orders/page.tsx, src/app/[locale]/admin/orders/[reference]/page.tsx, src/components/admin/OrdersTable.tsx, src/components/admin/OrderStateControls.tsx, src/components/admin/AdminLayout.tsx</files>
  <read_first>
    - src/app/[locale]/admin/inventory/page.tsx (pattern: Server Component, getAllProducts, force-dynamic)
    - src/components/admin/InventoryTable.tsx (full file — search bar, grid table, useTransition action pattern)
    - src/components/admin/ProductEditor.tsx (slide-over panel pattern: fixed inset-0 z-50 with backdrop + side panel; useTransition + Server Action call)
    - src/components/admin/AdminLayout.tsx (add a nav entry)
    - src/lib/orders/server.ts (getAllOrders, getOrderByReference, transitionOrderStatus signatures from Plan 08-05)
    - src/lib/orders/state-machine.ts (canTransition for button gating)
    - src/lib/orders/pricing.ts (formatSAR for display)
    - src/app/actions/orders.ts (transitionOrderAction)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "admin/orders/page.tsx" + "OrdersTable" + "OrderStateControls" sections
  </read_first>
  <behavior>
    /admin/orders/page.tsx (Server Component):
    - `export const dynamic = 'force-dynamic'`
    - Resolves the actual request locale via `await getLocale()` from `next-intl/server` (per Revision 3 — option (a)). NO `'en' as const`.
    - Calls `getAllOrders()` and renders a header similar to inventory page + `<OrdersTable initialOrders={orders} locale={loc} />` (locale passed as prop).

    /admin/orders/[reference]/page.tsx (Server Component):
    - `export const dynamic = 'force-dynamic'`
    - Reads `params.reference`. Calls `getOrderByReference`. If null → notFound().
    - Resolves locale via `await getLocale()` from `next-intl/server` (per Revision 3). NO `'en' as const`.
    - Renders order summary (reference, email, status, placedAt, totals via `formatSAR(_, loc)` where `loc` is the awaited locale), shipping address, line items table, and the events audit log (chronological).
    - Renders `<OrderStateControls order={order} />` (client component) for the transition buttons.

    OrdersTable.tsx:
    - `'use client'`. Props: `{ initialOrders: Order[]; locale: 'en' | 'ar' }` (per Revision 3 — locale comes from parent, no hardcode). Mirror InventoryTable structure (search by reference / email / status, sortable headers optional). Each row click navigates to `/admin/orders/${row.reference}` (use `next/link` or `useRouter().push`).
    - Columns: Reference (mono), Email, Placed (date), Total (formatSAR with the locale prop), Status (colored chip), Items count.

    OrderStateControls.tsx:
    - `'use client'`. Props: `{ order: Order }`.
    - Renders four buttons: Mark Shipped, Mark Delivered, Cancel, Refund.
    - Each is disabled when `!canTransition(order.status, target)`.
    - Each click calls `transitionOrderAction(order.id, target, { actor: 'admin', trackingNumber?, reason? })` inside `useTransition`. On success, route refresh via `router.refresh()`.
    - Mark Shipped button shows an inline input for `trackingNumber` (optional).
    - Cancel button asks for an inline `reason` (optional textarea before confirming).
    - The component MAY also render the order_events audit log (or that may stay on the parent page — your call). Prefer parent-page for cleaner separation.

    AdminLayout.tsx:
    - Add a link to `/admin/orders` next to the existing inventory link. Keep logical CSS only.

    Acceptance: pages render at runtime (404 not allowed for valid references), buttons disable based on legal transitions, `npx next build` exits 0, NO `'en' as const` appears in any of the four admin orders files (per Revision 3).
  </behavior>
  <action>
    Create `src/app/[locale]/admin/orders/page.tsx`:

    ```tsx
    import { getLocale } from 'next-intl/server';
    import { getAllOrders } from '@/lib/orders/server';
    import OrdersTable from '@/components/admin/OrdersTable';

    export const dynamic = 'force-dynamic';

    export default async function AdminOrdersPage() {
      const loc = await getLocale() as 'en' | 'ar';
      const orders = await getAllOrders();
      return (
        <div className="space-y-8">
          <div>
            <h1 className="text-4xl font-black uppercase tracking-tighter italic">Orders</h1>
            <p className="text-sm font-mono opacity-50 mt-1 uppercase">Order lifecycle, fulfillment, and audit log</p>
          </div>
          <OrdersTable initialOrders={orders} locale={loc} />
        </div>
      );
    }
    ```

    Create `src/app/[locale]/admin/orders/[reference]/page.tsx`:

    ```tsx
    import { notFound } from 'next/navigation';
    import { getLocale } from 'next-intl/server';
    import { getOrderByReference } from '@/lib/orders/server';
    import { formatSAR } from '@/lib/orders/pricing';
    import OrderStateControls from '@/components/admin/OrderStateControls';

    export const dynamic = 'force-dynamic';

    interface Props { params: Promise<{ reference: string; locale: string }>; }

    export default async function AdminOrderDetailPage({ params }: Props) {
      const { reference } = await params;
      const order = await getOrderByReference(reference);
      if (!order) notFound();

      const placed = new Date(order.placedAt).toISOString();
      // Per Revision 3: real request locale, never hardcoded.
      const loc = await getLocale() as 'en' | 'ar';

      return (
        <div className="space-y-8 text-white">
          <div className="flex items-baseline justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter italic">{order.reference}</h1>
              <p className="text-sm font-mono opacity-50 mt-1 uppercase">{order.email} · {placed}</p>
            </div>
            <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 border border-white/30 rounded">
              {order.status}
            </span>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2 text-sm">
              <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-2">Shipping</h2>
              <p>{order.shipping.firstName} {order.shipping.lastName}</p>
              <p>{order.shipping.phone}</p>
              <p>{order.shipping.address}{order.shipping.apartment ? ', ' + order.shipping.apartment : ''}</p>
              <p>{order.shipping.district}, {order.shipping.city}</p>
            </div>
            <div className="space-y-2 text-sm">
              <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-2">Totals</h2>
              <p>Subtotal: {formatSAR(order.subtotalCents, loc)}</p>
              <p>Shipping: {order.shippingCents === 0 ? 'Free' : formatSAR(order.shippingCents, loc)}</p>
              <p>VAT: {formatSAR(order.vatCents, loc)}</p>
              <p className="font-bold">Total: {formatSAR(order.totalCents, loc)}</p>
              <p className="opacity-50">Payment: {order.paymentMethod}</p>
              {order.trackingNumber && <p className="opacity-50">Tracking: {order.trackingNumber}</p>}
            </div>
          </section>

          <section>
            <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-3">Line Items</h2>
            <ul className="divide-y divide-white/10 border border-white/10">
              {order.items.map(item => (
                <li key={item.id} className="flex justify-between p-4 text-sm">
                  <span>{loc === 'ar' ? item.productName.ar : item.productName.en} ({item.sizeLabel}) × {item.quantity}</span>
                  <span className="tabular-nums">{formatSAR(item.unitPriceCents * item.quantity, loc)}</span>
                </li>
              ))}
            </ul>
          </section>

          <OrderStateControls order={order} />

          <section>
            <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold mb-3">Events</h2>
            <ul className="divide-y divide-white/10 border border-white/10 text-xs font-mono">
              {order.events.map(ev => (
                <li key={ev.id} className="p-3 flex justify-between gap-4">
                  <span>{ev.type}</span>
                  <span className="opacity-60">{new Date(ev.createdAt).toISOString()}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      );
    }
    ```

    Create `src/components/admin/OrdersTable.tsx`:

    ```tsx
    'use client';
    import { useState } from 'react';
    import { useRouter } from '@/i18n/navigation';
    import { formatSAR } from '@/lib/orders/pricing';
    import type { Order } from '@/types/domain';

    interface Props { initialOrders: Order[]; locale: 'en' | 'ar'; }

    export default function OrdersTable({ initialOrders, locale }: Props) {
      const [search, setSearch] = useState('');
      const router = useRouter();

      const filtered = initialOrders.filter(o => {
        const q = search.toLowerCase();
        return !q || o.reference.toLowerCase().includes(q)
          || o.email.toLowerCase().includes(q)
          || o.status.toLowerCase().includes(q);
      });

      return (
        <div className="space-y-4 text-white">
          <input
            type="search"
            placeholder="Search by reference, email, or status…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full max-w-md bg-black border border-white/20 px-3 py-2 text-sm rounded
                       focus:outline-none focus:border-white"
          />

          <div className="border border-white/10 overflow-hidden">
            <div className="grid grid-cols-[160px_1fr_140px_120px_120px_60px] gap-4 px-4 py-3 border-b border-white/10 text-[10px] uppercase tracking-widest opacity-50 font-bold">
              <div>Reference</div><div>Email</div><div>Placed</div><div>Total</div><div>Status</div><div>Items</div>
            </div>
            {filtered.length === 0 && (
              <div className="p-8 text-sm opacity-50">No orders match your search.</div>
            )}
            {filtered.map(o => (
              <button
                key={o.id}
                type="button"
                onClick={() => router.push(`/admin/orders/${o.reference}` as any)}
                className="grid grid-cols-[160px_1fr_140px_120px_120px_60px] gap-4 px-4 py-3 w-full text-start border-b border-white/5 last:border-b-0 hover:bg-white/5 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              >
                <span className="font-mono text-sm">{o.reference}</span>
                <span className="text-sm truncate">{o.email}</span>
                <span className="text-xs opacity-60">{new Date(o.placedAt).toISOString().slice(0, 10)}</span>
                <span className="text-sm tabular-nums">{formatSAR(o.totalCents, locale)}</span>
                <span className="text-[10px] uppercase tracking-widest">{o.status}</span>
                <span className="text-xs opacity-60">{o.items.length}</span>
              </button>
            ))}
          </div>
        </div>
      );
    }
    ```

    Create `src/components/admin/OrderStateControls.tsx`:

    ```tsx
    'use client';
    import { useState, useTransition } from 'react';
    import { useRouter } from '@/i18n/navigation';
    import type { Order, OrderStatus } from '@/types/domain';
    import { canTransition } from '@/lib/orders/state-machine';
    import { transitionOrderAction } from '@/app/actions/orders';

    interface Props { order: Order; }

    export default function OrderStateControls({ order }: Props) {
      const [tracking, setTracking] = useState('');
      const [reason, setReason] = useState('');
      const [isPending, startTransition] = useTransition();
      const router = useRouter();

      const transitions: Array<{ to: OrderStatus; label: string; needsTracking?: boolean; needsReason?: boolean }> = [
        { to: 'shipped', label: 'Mark Shipped', needsTracking: true },
        { to: 'delivered', label: 'Mark Delivered' },
        { to: 'cancelled', label: 'Cancel Order', needsReason: true },
        { to: 'refunded', label: 'Refund Order', needsReason: true },
      ];

      const trigger = (to: OrderStatus, opts: { trackingNumber?: string; reason?: string }) => {
        startTransition(async () => {
          await transitionOrderAction(order.id, to, { actor: 'admin', ...opts });
          router.refresh();
        });
      };

      return (
        <section className="space-y-4 border border-white/10 p-6 text-white">
          <h2 className="text-xs uppercase tracking-widest opacity-50 font-bold">Transitions</h2>
          <div className="flex flex-wrap gap-3">
            {transitions.map(({ to, label, needsTracking, needsReason }) => {
              const allowed = canTransition(order.status, to);
              return (
                <div key={to} className="flex items-center gap-2">
                  {needsTracking && allowed && (
                    <input value={tracking} onChange={e => setTracking(e.target.value)}
                           placeholder="Tracking #"
                           className="bg-black border border-white/20 px-2 py-1 text-xs min-h-[44px]" />
                  )}
                  {needsReason && allowed && (
                    <input value={reason} onChange={e => setReason(e.target.value)}
                           placeholder="Reason (optional)"
                           className="bg-black border border-white/20 px-2 py-1 text-xs min-h-[44px]" />
                  )}
                  <button
                    type="button"
                    disabled={!allowed || isPending}
                    onClick={() => trigger(to, {
                      trackingNumber: needsTracking ? tracking || undefined : undefined,
                      reason: needsReason ? reason || undefined : undefined,
                    })}
                    className="px-4 py-2 text-xs uppercase tracking-widest border border-white/30 hover:bg-white hover:text-black disabled:opacity-30 disabled:cursor-not-allowed min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
                  >
                    {label}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] opacity-50">
            Cancellation pre-ship (pending or confirmed) restores stock automatically. Cancellation post-ship and refunds do NOT restore stock.
          </p>
        </section>
      );
    }
    ```

    Update `src/components/admin/AdminLayout.tsx`. Find the navigation list (look for the existing inventory link). Add an `Orders` entry with `href="/admin/orders"`. Use the same nav-item styling as the existing entries. Keep logical CSS (the existing layout already uses `border-e-2`).

    Run `npx next build`.

    NOTE on bracketed paths in shell commands (Revision 3): Bash treats unquoted `[...]` as a character-class glob. ALL `test -f` and `grep` commands targeting the route paths below MUST single-quote the path so the brackets are literal. Examples:

    - `test -f 'src/app/[locale]/admin/orders/page.tsx'` ✓
    - `test -f 'src/app/[locale]/admin/orders/[reference]/page.tsx'` ✓
    - `grep -c "await getLocale()" 'src/app/[locale]/admin/orders/page.tsx'` ✓
    - `test -f src/app/[locale]/admin/orders/page.tsx` ✗ (would be interpreted as a glob)
  </action>
  <verify>
    <automated>test -f 'src/app/[locale]/admin/orders/page.tsx' &amp;&amp; test -f 'src/app/[locale]/admin/orders/[reference]/page.tsx' &amp;&amp; test -f 'src/components/admin/OrdersTable.tsx' &amp;&amp; test -f 'src/components/admin/OrderStateControls.tsx' &amp;&amp; grep -c "canTransition" 'src/components/admin/OrderStateControls.tsx' &amp;&amp; grep -c "transitionOrderAction" 'src/components/admin/OrderStateControls.tsx' &amp;&amp; grep -c "/admin/orders" 'src/components/admin/AdminLayout.tsx' &amp;&amp; test "$(grep -c 'await getLocale()' 'src/app/[locale]/admin/orders/page.tsx')" -ge 1 &amp;&amp; test "$(grep -rc \"'en' as const\" 'src/app/[locale]/admin/orders/' || echo 0)" -eq 0 &amp;&amp; npx next build 2>&amp;1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `test -f 'src/app/[locale]/admin/orders/page.tsx'` exits 0 (single-quoted, per Revision 3)
    - `test -f 'src/app/[locale]/admin/orders/[reference]/page.tsx'` exits 0 (single-quoted, per Revision 3)
    - `test -f 'src/components/admin/OrdersTable.tsx'` exits 0
    - `test -f 'src/components/admin/OrderStateControls.tsx'` exits 0
    - `grep -c "getAllOrders" 'src/app/[locale]/admin/orders/page.tsx'` outputs at least 1
    - `grep -c "getOrderByReference" 'src/app/[locale]/admin/orders/[reference]/page.tsx'` outputs at least 1
    - `grep -c "notFound" 'src/app/[locale]/admin/orders/[reference]/page.tsx'` outputs at least 1
    - `grep -c "canTransition" 'src/components/admin/OrderStateControls.tsx'` outputs at least 1
    - `grep -c "transitionOrderAction" 'src/components/admin/OrderStateControls.tsx'` outputs at least 1
    - `grep -c "useTransition" 'src/components/admin/OrderStateControls.tsx'` outputs 1
    - `grep -c "/admin/orders" 'src/components/admin/AdminLayout.tsx'` outputs at least 1
    - **(Revision 3a — real locale)** `grep -c "await getLocale()" 'src/app/[locale]/admin/orders/page.tsx'` outputs at least 1
    - **(Revision 3a — real locale)** `grep -c "await getLocale()" 'src/app/[locale]/admin/orders/[reference]/page.tsx'` outputs at least 1
    - **(Revision 3a — real locale)** `grep -rc "'en' as const" 'src/app/[locale]/admin/orders/'` outputs 0 (no hardcoded locale anywhere under admin/orders)
    - **(Revision 3a — real locale)** `grep -c "'en' as const" 'src/components/admin/OrdersTable.tsx'` outputs 0
    - `grep -E "\\b(ml-|mr-|pl-|pr-|left-|right-)" 'src/app/[locale]/admin/orders/page.tsx' 'src/app/[locale]/admin/orders/[reference]/page.tsx' 'src/components/admin/OrdersTable.tsx' 'src/components/admin/OrderStateControls.tsx' | wc -l` outputs 0 (single-quoted bracketed paths, per Revision 3b)
    - `npx next build` exits 0
  </acceptance_criteria>
  <done>Admin can navigate to /admin/orders, view list, click into detail, transition orders. Buttons disable based on canTransition. Stock restoration on pre-ship cancel works (verified in Plan 08-09 integration test). Locale is resolved from the actual request via `await getLocale()` in both Server Components — no hardcoded `'en' as const` anywhere under admin/orders.</done>
</task>

</tasks>

<verification>
- `npx next build` exits 0
- `grep -rc "'en' as const" 'src/app/[locale]/admin/orders/'` outputs 0 (Revision 3a)
- `grep -c "await getLocale()" 'src/app/[locale]/admin/orders/page.tsx'` outputs at least 1 (Revision 3a)
- All bracketed-path verify commands are single-quoted (Revision 3b)
- Manual UAT: visit /en/admin/orders and /ar/admin/orders separately — currency formatting matches the locale (Western numerals everywhere per project SAR rule, but the formatter is invoked with the actual locale, not a hardcoded one). Click an order → detail page renders with line items + events; click "Mark Shipped" → status updates and a `shipped` event appears in the audit log; if RESEND_API_KEY set, an `email_sent.shipped` event also appears.
</verification>

<success_criteria>
ECOM-02 lifecycle is fully exposed in admin UI. ECOM-04 refund/cancellation is callable from the admin without DB tooling. The admin shell honors the actual request locale (no silent EN-only scope reduction, per Revision 3a). All shell verify commands quote bracketed paths properly (Revision 3b).
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-08-SUMMARY.md`
</output>
