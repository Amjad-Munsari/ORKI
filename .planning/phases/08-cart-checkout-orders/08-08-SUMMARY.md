---
phase: 08-cart-checkout-orders
plan: 08
subsystem: admin-orders
tags: [admin, orders, dashboard, state-machine, server-component, client-component, useTransition, locale, phase-8, wave-3]
requires:
  - "Plan 08-05 — getAllOrders, getOrderByReference, transitionOrderStatus, transitionOrderAction shim"
  - "Plan 08-03 — canTransition, legalNextStates, formatSAR, computeOrderTotals"
  - "Plan 08-01 — orders / order_items / order_events schema + OrderStatus enum"
  - "Phase 6 admin route group + sidebar layout (src/app/[locale]/admin/layout.tsx)"
  - "next-intl/server getLocale() — pre-existing across the codebase"
provides:
  - "/[locale]/admin/orders — Server Component list of all orders, newest first"
  - "/[locale]/admin/orders/[reference] — Server Component detail with line items, totals, shipping, events log, transitions"
  - "OrdersTable (Client) — search by reference/email/status; row-click navigates to detail"
  - "OrderStateControls (Client) — renders only legalNextStates() buttons; canTransition gate; useTransition + router.refresh()"
  - "Optional tracking input on Mark Shipped, reason input on Cancel/Refund"
affects:
  - "Plan 08-09 (integration tests) — admin UAT path now exists end-to-end"
  - "Phase 10 (auth) — the open auth gap on transitionOrderAction (threat flag from 08-05) will be closed when admin route group gets a real auth gate"
tech-stack:
  added: []
  patterns:
    - "Server Components resolve request locale via await getLocale() from next-intl/server (Revision 3a) — never hardcoded 'en' as const"
    - "OrdersTable receives locale as a prop from its Server Component parent and passes it to formatSAR()"
    - "OrderStateControls filters ALL_TRANSITIONS through legalNextStates(order.status) before rendering — execution rule 7 (no raw enum buttons)"
    - "canTransition retained as defense-in-depth gate on the disabled attribute even after legalNextStates filter"
    - "Audit log row format: type · (from → to) · actor · note · timestamp — execution rule 8"
key-files:
  created:
    - "src/app/[locale]/admin/orders/page.tsx"
    - "src/app/[locale]/admin/orders/[reference]/page.tsx"
    - "src/components/admin/OrdersTable.tsx"
    - "src/components/admin/OrderStateControls.tsx"
    - ".planning/phases/08-cart-checkout-orders/08-08-SUMMARY.md"
  modified:
    - "src/app/[locale]/admin/layout.tsx"
    - "src/app/actions/orders.ts"
    - "src/lib/orders/state-machine.ts"
decisions:
  - "Render only legalNextStates(order.status) — buttons whose target is not in the legal set are removed entirely, not just disabled. When all targets are unreachable (terminal state) the section shows a 'No further transitions' message. canTransition is still queried per-button as a defense-in-depth gate so the disabled attribute and acceptance grep both remain truthful."
  - "Filtered the four transition definitions through a Set built from legalNextStates() rather than rendering all four and disabling some. This satisfies execution rule 7 ('render only legalNextStates') while keeping the four labels (Mark Shipped / Mark Delivered / Cancel / Refund) as the canonical UI vocabulary — raw enum names never reach the DOM."
  - "Per-button input fields share two top-level useState hooks (tracking, reason) rather than per-target maps. The legal-target filter ensures only one tracking-bearing button (Mark Shipped) and at most two reason-bearing buttons (Cancel + Refund) ever co-exist, and a real admin only fires one transition per page load before router.refresh() reloads the order — the shared state is not a UX hazard."
  - "Audit log lives on the Server Component parent (not inside OrderStateControls) — the plan suggests this 'cleaner separation' as the preferred option."
  - "AdminLayout link target was already in src/app/[locale]/admin/layout.tsx (not src/components/admin/AdminLayout.tsx as the plan stated). The link existed but was disabled with a 'PHASE 8' placeholder; this plan enables it. The acceptance grep was rerouted to the actual layout file path. Documented as Rule-1 deviation below."
metrics:
  duration: "~11 min"
  tasks_completed: 1
  files_created: 4
  files_modified: 3
  lib_orders_tests_passing: 27
  next_build: "exit 0 (admin/orders + admin/orders/[reference] both compile and register)"
  completed: 2026-05-09
---

# Phase 8 Plan 08: Admin Orders Dashboard Summary

**One-liner:** `/admin/orders` and `/admin/orders/[reference]` are now live as Server Components — the admin can search/list orders, click into any order's detail (totals, line items, events log) and fire state-machine transitions (Mark Shipped, Mark Delivered, Cancel, Refund) gated by `legalNextStates(order.status)` rather than a raw enum. Both pages resolve the real request locale via `await getLocale()` (no hardcoded `'en' as const`), and `formatSAR` flows from the Server-Component parent into the Client `OrdersTable` via prop.

## What Was Built

### `src/app/[locale]/admin/orders/page.tsx` — Server Component list

`export const dynamic = 'force-dynamic'`; reads the active locale via `await getLocale()`, calls `getAllOrders()` from `src/lib/orders/server.ts` (newest-placed first), and hands the array plus the locale into `<OrdersTable initialOrders={orders} locale={loc} />`. Header matches the inventory page styling for visual consistency.

### `src/app/[locale]/admin/orders/[reference]/page.tsx` — Server Component detail

`export const dynamic = 'force-dynamic'`; reads `params.reference`, calls `getOrderByReference(reference)`, and short-circuits to `notFound()` if null. Renders four sections:

1. **Header** — order reference, email, placed timestamp, status chip
2. **Shipping + Totals grid** — full snapshot of name/phone/address plus subtotal / shipping (or "Free") / VAT / total via `formatSAR(_, loc)`, payment method, optional tracking number
3. **Line Items list** — bilingual product name (driven by `loc === 'ar' ? productName.ar : productName.en`), size label, quantity, line subtotal
4. **Events audit log** — type, optional `(from → to)`, actor, optional reason note, ISO timestamp — pulled from `order.events[].metadata`

`<OrderStateControls order={order} />` is wedged between line items and events so the admin's eye flow is "see what was bought → take action → see what already happened."

### `src/components/admin/OrdersTable.tsx` — Client search/list

`'use client'`. Props: `{ initialOrders: Order[]; locale: Locale }`. Mirrors `InventoryTable.tsx` styling (border-2 white/20, `[#0a0a0a]` headers, hover row treatment). Search filters by reference / email / status (case-insensitive). Each row is a `<button>` whose click calls `useRouter().push('/admin/orders/{reference}')`. Empty-state shows "No Orders" when the search produces no matches. All currency cells use the locale prop — never a hardcode.

### `src/components/admin/OrderStateControls.tsx` — Client transition panel

`'use client'`. Props: `{ order: Order }`. Internal state: `tracking`, `reason`, `useTransition()`. Workflow:

1. Build `visible = ALL_TRANSITIONS.filter(t => legalNextStates(order.status).has(t.to))` — the four named transitions intersected with the state-machine's legal targets. Raw enum strings never appear as button labels.
2. For terminal states (`cancelled`, `refunded`) where `visible` is empty, render a single "No further transitions available" notice instead of an empty button row.
3. Each visible button:
   - Shows `<input>` for tracking when `to === 'shipped'` and the transition is allowed.
   - Shows `<input>` for reason when `to === 'cancelled' | 'refunded'` and the transition is allowed.
   - On click, opens `startTransition(async () => { await transitionOrderAction(order.id, to, { actor: 'admin', trackingNumber?, reason? }); router.refresh(); })`.
   - Is disabled while `isPending` or if `canTransition(order.status, to)` returns false (defense-in-depth — `visible` already filters but we keep the check honest).

Footer note reminds the admin that pre-ship cancellations restore stock; post-ship cancellations and refunds do not (this is enforced server-side in `transitionOrderStatus`).

### `src/app/[locale]/admin/layout.tsx` — sidebar link enablement

The layout already had an `/admin/orders` `<Link>` but it was rendered with `opacity-30 cursor-not-allowed` and a `PHASE 8` placeholder badge. This plan removes the disabled treatment and aligns the link styling with the existing Inventory and Products entries (`hover:border-white`, hover-revealed `→`).

### `src/lib/orders/state-machine.ts` — `'server-only'` import removed (Rule 3 fix)

The matrix-only state-machine module was previously gated with `import 'server-only'` — fine while only `src/lib/orders/server.ts` imported it. Once `OrderStateControls` (a Client Component) needed `canTransition` / `legalNextStates`, the build failed with "you're importing a component that needs `server-only` … not supported in the pages directory." The module is pure (no DB, cookies, or fs), so dropping the gate is correct and matches the documented stance of `src/lib/orders/pricing.ts` and `src/lib/orders/errors.ts`. New file-header comment makes the new dual-context contract explicit.

### `src/app/actions/orders.ts` — re-exports replaced with async wrappers (Rule 3 fix)

Next 15 enforces "Only async functions are allowed to be exported in a `'use server'` file." The previous shim used `export { … } from '@/lib/orders/server'` which fails this rule. The replacement wraps the lib functions in `async function` forwarders — same behavior, same client-call ergonomics, no Drizzle leakage to client bundles (per CLAUDE.md data-layer rule).

## Commits

| Task | Hash      | Type | Message                                                                                  |
| ---- | --------- | ---- | ---------------------------------------------------------------------------------------- |
| 1    | `bf04c88` | feat | `feat(08-08): admin orders dashboard list + detail with state-transition controls`        |

## Acceptance Criteria — all PASS

| Criterion | Result |
|---|---|
| `test -f 'src/app/[locale]/admin/orders/page.tsx'` | OK |
| `test -f 'src/app/[locale]/admin/orders/[reference]/page.tsx'` | OK |
| `test -f 'src/components/admin/OrdersTable.tsx'` | OK |
| `test -f 'src/components/admin/OrderStateControls.tsx'` | OK |
| `grep -c "getAllOrders" 'src/app/[locale]/admin/orders/page.tsx'` ≥ 1 | **2** (import + call) |
| `grep -c "getOrderByReference" 'src/app/[locale]/admin/orders/[reference]/page.tsx'` ≥ 1 | **2** (import + call) |
| `grep -c "notFound" 'src/app/[locale]/admin/orders/[reference]/page.tsx'` ≥ 1 | **2** (import + call) |
| `grep -c "canTransition" 'src/components/admin/OrderStateControls.tsx'` ≥ 1 | **4** (import line carries `canTransition` + `legalNextStates`, plus 1 call site, plus the `allowed = canTransition(...)` line — ripgrep counts substring hits) |
| `grep -c "transitionOrderAction" 'src/components/admin/OrderStateControls.tsx'` ≥ 1 | **2** (import + call) |
| `grep -c "useTransition" 'src/components/admin/OrderStateControls.tsx'` "outputs 1" | **2** — see deviation note below |
| `grep -c "/admin/orders" 'src/app/[locale]/admin/layout.tsx'` ≥ 1 | **1** (the now-enabled `<Link href="/admin/orders">`) |
| `grep -c "await getLocale()" 'src/app/[locale]/admin/orders/page.tsx'` ≥ 1 | **1** |
| `grep -c "await getLocale()" 'src/app/[locale]/admin/orders/[reference]/page.tsx'` ≥ 1 | **1** |
| `grep -rc "'en' as const" 'src/app/[locale]/admin/orders/'` outputs 0 | **0 / 0** (per file, total 0) |
| `grep -c "'en' as const" 'src/components/admin/OrdersTable.tsx'` outputs 0 | **0** |
| Directional Tailwind sweep across all 4 files (`ml-|mr-|pl-|pr-|left-|right-`) | **0** |
| `npx next build` exits 0 | **PASS** — `/[locale]/admin/orders` (2.51 kB) and `/[locale]/admin/orders/[reference]` (2.43 kB) both registered; `✓ Compiled successfully in 10.3s`; "Failed to compile" string absent from output |
| `npx vitest run src/lib/orders/` (regression on state-machine after `server-only` removal) | **27 / 27 pass** (state-machine 9 + pricing 12 + reference 3 + server 3) |

## Deviations from Plan

### Rule 1 — Plan-vs-Reality file path correction

**1. `src/components/admin/AdminLayout.tsx` does not exist.** The plan instructed updates to `src/components/admin/AdminLayout.tsx` and the acceptance grep targeted that path, but the actual admin layout in this codebase lives at `src/app/[locale]/admin/layout.tsx`. The Inventory and Products links — and the (previously disabled) Orders placeholder — were already rendered there. The plan's stated path is a phantom; the real layout has the link slot.

- **Found during:** initial file inventory pre-edit.
- **Fix:** Routed the link enablement (remove `opacity-30 cursor-not-allowed` + `PHASE 8` badge; align with the Inventory link styling) to the real file at `src/app/[locale]/admin/layout.tsx`. The acceptance criterion's spirit ("admin nav includes a link to /admin/orders") is met — verified by `grep -c '/admin/orders' 'src/app/[locale]/admin/layout.tsx' = 1`.
- **Files modified:** `src/app/[locale]/admin/layout.tsx`.
- **Commit:** `bf04c88`.
- **Why not Rule 4:** No architectural change — same layout component, same Next.js layout slot, same RTL-friendly logical CSS. Just the actual on-disk path. The plan's path was apparently authored from the pattern-map file (which uses the symbolic name `AdminLayout.tsx` as the analog reference) without checking the runtime location.

### Rule 3 — Auto-fixed blocking issues exposed by the new client import

**2. [Rule 3 – Block] `src/app/actions/orders.ts` used non-async `export { … } from …` re-exports inside a `'use server'` module.**

- **Found during:** Task 1 first build attempt.
- **Issue:** Next 15 hard-fails with `Only async functions are allowed to be exported in a "use server" file.` The shim was authored in Plan 08-05 and only worked at build time because no client component had imported `transitionOrderAction` yet — the new `OrderStateControls` is the first.
- **Fix:** Replaced the two `export { … } from …` lines with `async function submitCheckoutAction(input)` and `async function transitionOrderAction(orderId, to, opts)` that forward to the lib functions. Same call signature on the client side, same data-layer separation per CLAUDE.md.
- **Files modified:** `src/app/actions/orders.ts`.
- **Commit:** `bf04c88` (rolled into the same task commit because the task could not complete otherwise).

**3. [Rule 3 – Block] `src/lib/orders/state-machine.ts` had `import 'server-only'` at the top.**

- **Found during:** Task 1 first build attempt.
- **Issue:** Next 15 hard-fails with `You're importing a component that needs "server-only" … not supported in the pages/ directory` once `OrderStateControls` (a Client Component) imports `canTransition` and `legalNextStates`. The state-machine module is pure (no DB, cookies, or fs) — it should be safe on either side, just like its sibling `pricing.ts` and `errors.ts` already are.
- **Fix:** Removed the `import 'server-only'` line and added a file-header comment documenting the dual-context contract. The 9 state-machine unit tests still pass — there is no behavior change.
- **Files modified:** `src/lib/orders/state-machine.ts`.
- **Commit:** `bf04c88` (same reason as #2).

### Documentation-only acceptance note

**4. `grep -c "useTransition" OrderStateControls.tsx` outputs 2, not 1.**

- The plan's literal acceptance criterion is `outputs 1`. The natural shape (`import { useTransition }` line + `useTransition()` call line) lands at 2. Plan 08-05's SUMMARY documented the exact same `grep -c` quirk for `computeOrderTotals` and `generateOrderReference` (each outputs 2 because of import + call) and accepted it as a wording artifact, not a deviation. Same here — the spirit (presence + use of `useTransition`) is met. No code change.

## Authentication Gates

None encountered during execution. The `transitionOrderAction` admin Server Action remains unauthenticated at the function level — its protection comes from being routed under the admin route group, which Phase 6 left as a placeholder pending Phase 10 auth. Plan 08-05's threat flag for this is still open and is the same flag for this plan; carrying it forward unchanged.

## Verification (executable commands)

```bash
# File presence (single-quoted bracketed paths per Revision 3b)
test -f 'src/app/[locale]/admin/orders/page.tsx'                  # 0
test -f 'src/app/[locale]/admin/orders/[reference]/page.tsx'      # 0
test -f 'src/components/admin/OrdersTable.tsx'                    # 0
test -f 'src/components/admin/OrderStateControls.tsx'             # 0

# Locale handling (Revision 3a — real request locale, no hardcode)
grep -c "await getLocale()" 'src/app/[locale]/admin/orders/page.tsx'                # 1
grep -c "await getLocale()" 'src/app/[locale]/admin/orders/[reference]/page.tsx'    # 1
grep -rc "'en' as const" 'src/app/[locale]/admin/orders/'                           # 0 / 0

# Transition gating
grep -c "canTransition"        'src/components/admin/OrderStateControls.tsx'  # 4
grep -c "legalNextStates"      'src/components/admin/OrderStateControls.tsx'  # 2
grep -c "transitionOrderAction" 'src/components/admin/OrderStateControls.tsx' # 2

# Nav link
grep -c '/admin/orders' 'src/app/[locale]/admin/layout.tsx'  # 1

# RTL hygiene
grep -E "\b(ml-|mr-|pl-|pr-|left-|right-)" \
  'src/app/[locale]/admin/orders/page.tsx' \
  'src/app/[locale]/admin/orders/[reference]/page.tsx' \
  'src/components/admin/OrdersTable.tsx' \
  'src/components/admin/OrderStateControls.tsx' | wc -l  # 0

# Build + regression suite
npx next build                          # ✓ Compiled successfully in 10.3s
npx vitest run src/lib/orders/          # 27/27 pass
```

## Manual UAT (deferred to Phase 8 closing UAT)

- Visit `/en/admin/orders` and `/ar/admin/orders` separately — currency formatting renders Western numerals in both (per CLAUDE.md SAR rule, `'ar-SA-u-nu-latn'`) but the Intl.NumberFormat invocation receives the actual request locale, not a hardcoded one.
- Click into any order — detail page renders line items + events log.
- Click `Mark Shipped` (with optional tracking) → status transitions and a `shipped` event row appears in the audit log; if `RESEND_API_KEY` is set, an `email_sent.shipped` event also appears (Plan 08-07 territory).
- Click `Cancel Order` on a `pending` or `confirmed` order → status moves to `cancelled` and stock is restored on `productSizes` (verified via `transitionOrderStatus` in Plan 08-05; integration coverage owned by Plan 08-09).

## Security / Threat Notes

The plan's only new surface is the admin route. The Server Action it exposes (`transitionOrderAction`) was already created in Plan 08-05 with the threat flag `missing-authn`; this plan does not add or close that flag — it only consumes the action behind the same admin route group that Phase 6 left as a placeholder. When Phase 10 auth lands, both the route group and (optionally) a `requireAdmin()` inside `transitionOrderAction` will close the gap.

No new external surface introduced — no new endpoints, no new schema, no new file/asset access patterns.

## Threat Flags

(No new flags. The pre-existing `missing-authn` flag on `transitionOrderStatus` from Plan 08-05's SUMMARY remains open, awaiting Phase 10.)

## Known Stubs

None new. The `actor` value passed to `transitionOrderAction` is the literal string `'admin'` because there is no auth identity to source from yet — this is documented in Plan 08-05 and CONTEXT.md and is intentional; it will become the authenticated admin's user id in Phase 10.

## TDD Gate Compliance

This plan declared `<task type="auto" tdd="false">` — no RED → GREEN gate applies. The acceptance grep matrix functions as the GREEN gate; the test regression on `src/lib/orders/` (27/27 still pass after the `'server-only'` removal in `state-machine.ts`) functions as the safety net.

## Self-Check: PASSED

- `src/app/[locale]/admin/orders/page.tsx` → FOUND
- `src/app/[locale]/admin/orders/[reference]/page.tsx` → FOUND
- `src/components/admin/OrdersTable.tsx` → FOUND
- `src/components/admin/OrderStateControls.tsx` → FOUND
- `src/app/[locale]/admin/layout.tsx` → MODIFIED (orders link enabled)
- `src/app/actions/orders.ts` → MODIFIED (async forwarders)
- `src/lib/orders/state-machine.ts` → MODIFIED (server-only removed)
- Commit `bf04c88` → FOUND on `main`
- `npx next build` → exits 0; admin/orders + admin/orders/[reference] both registered
- `npx vitest run src/lib/orders/` → 27/27 pass
- All acceptance grep checks → pass (counts at or above plan thresholds; absences confirmed at exactly 0)
