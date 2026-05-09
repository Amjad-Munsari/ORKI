---
phase: 08-cart-checkout-orders
verified: 2026-05-10T01:10:00Z
status: human_needed
score: 5/5 success criteria verified (programmatic); 8/12 requirements PASS, 3/12 PARTIAL (need human UAT), 1/12 DEFERRED
overrides_applied: 0
re_verification: null
human_verification:
  - test: "EN + AR happy-path checkout flow (08-UAT Scenarios 1, 2)"
    expected: "User can add to cart, persist across reload, complete checkout, land on confirmation with ORK- reference; Western numerals in both locales; Arabic mirrored layout works"
    why_human: "Visual layout, RTL mirroring, screen-reader announcements, real-browser cookie behavior cannot be verified by static checks"
  - test: "Payment failure recovery (08-UAT Scenario 3) — phone +966 50 123 4911"
    expected: "Cart preserved after CARD_DECLINED; localized error banner (no raw stack); no orphan order in /admin/orders"
    why_human: "End-to-end interaction across browser → server action → DB rollback → UI"
  - test: "Validation + ARIA wiring (08-UAT Scenario 4)"
    expected: "Submit empty form → field errors highlight + entered data preserved + focus moves to first invalid field + role='alert' summary present"
    why_human: "Focus-management and screen-reader behavior require manual interaction"
  - test: "Mobile tap targets at 375px (08-UAT Scenario 5, UX-04)"
    expected: "All interactive checkout buttons measure ≥44px; PaymentGrid tiles ≥88px; no hover-only interactions"
    why_human: "Pixel measurement at responsive breakpoint requires browser dev tools"
  - test: "Screen reader pass (08-UAT Scenario 6, UX-09)"
    expected: "VoiceOver/NVDA announces step changes via aria-live='polite'; aria-invalid + aria-describedby ties errors to fields; role='alert' on summary"
    why_human: "Assistive-tech behavior cannot be verified programmatically"
  - test: "Admin transitions end-to-end (08-UAT Scenario 7, ECOM-02, ECOM-04)"
    expected: "Mark Shipped writes trackingNumber + audit row; cancel pre-ship restores stock; refund does NOT restore stock"
    why_human: "Integration tests cover transitionOrderStatus(), but UI button → router.refresh() round-trip needs visual verification"
  - test: "Optimistic add-to-cart pre-hydration race (08-UAT Scenario 9)"
    expected: "Rapidly add items before /api/cart hydration completes; final cart state reconciles correctly with no duplicates or losses"
    why_human: "Race-condition timing cannot be deterministically reproduced in automated tests; needs human-paced clicks"
---

# Phase 8: Cart, Checkout State & Order Flow — Verification Report

**Phase Goal:** Build persistent cart and robust order state machine.
**Verified:** 2026-05-10T01:10:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (ROADMAP Success Criteria)

| #   | Truth                                                         | Status     | Evidence       |
| --- | ------------------------------------------------------------- | ---------- | -------------- |
| 1   | Cart persists for guest and logged-in users                   | ✓ VERIFIED (guest only; auth deferred) | `src/lib/cart/session.ts` mints `orki_sid` httpOnly cookie (`maxAge=2592000s`, sameSite=lax, secure in prod). DB `carts` + `cart_items` tables exist (`schema.ts:102-147`). `migrateLocalStorageCart` in `src/lib/cart/migrate.ts` performs one-shot Phase-3 localStorage → DB migration; `src/store/StoreHydration.tsx` calls it on mount and removes the localStorage key. `userId` columns nullable per Phase 10 contract. |
| 2   | Checkout displays total cost AND visible progress steps        | ✓ VERIFIED | `src/components/checkout/CheckoutSteps.tsx` renders `<ol>` with `aria-current="step"` + sr-only `<div role="status" aria-live="polite">`. `src/components/checkout/OrderSummary.tsx:60-85` renders 4 distinct rows: Subtotal / Shipping (or "Free") / VAT (15%) / Total — all via `formatSAR(cents, locale)` from `src/lib/orders/pricing.ts`. Mounted at `src/app/[locale]/checkout/page.tsx:84` and `:186`. |
| 3   | Order state machine pending → confirmed correctly transitions  | ✓ VERIFIED | `src/lib/orders/server.ts:253` calls `assertTransition('pending', 'confirmed')` inside the same `db.transaction(...)` that decrements stock and creates the order. `src/lib/orders/state-machine.ts:31-38` defines the matrix. `tests/integration/transitions.test.ts` covers 5 cases (confirmed→shipped sets trackingNumber + audit event, shipped→delivered→refunded walk, illegal shipped→confirmed returns VALIDATION, confirmed→cancelled restores stock, shipped→cancelled does NOT restore). All 76 tests pass via `npm test`. |
| 4   | Form validations highlight errors without losing data          | ✓ VERIFIED (programmatic); needs human UAT | `src/components/checkout/ShippingForm.tsx:34-50` uses `useForm` + `zodResolver(shippingSchema)`, `mode: 'onBlur'`, `setFocus(firstError)` in useEffect for focus-management. `aria-invalid` + `aria-describedby` wired via `ariaProps()` helper (lines 21-26). `<p role="alert">` on each field error. RHF preserves entered data on submit failure by default. Schema in `src/lib/checkout/schemas.ts` returns next-intl error keys for bilingual messages. |
| 5   | Simulated payment failure preserves cart state                 | ✓ VERIFIED | `src/lib/orders/server.ts:236-250`: payment failure throws `OrderError('PAYMENT_DECLINED')` from inside `db.transaction(...)`, rolling back the entire txn — order, items, events, AND stock decrements all disappear; `tx.delete(cartItems)` (line 270) is unreachable on failure. `src/app/[locale]/checkout/page.tsx:59-69` keeps the user on the page on `!result.ok` with `setError(t(messageKey))` and only navigates on success. UAT Scenario 3 documents the manual verification path. |

**Score:** 5/5 truths verified (programmatic). All require some human UAT for full confidence.

### Required Artifacts

| Artifact | Expected | Status | Details |
| -------- | -------- | ------ | ------- |
| `src/lib/db/schema.ts` | Phase 8 tables (carts, cart_items, orders, order_items, order_events) + order_status pgEnum | ✓ VERIFIED | All 5 tables present (lines 100-239); `order_status` pgEnum with exact 6 values (line 151-153); composite unique index on cart_items (line 133); halalas integer money columns; embedded shipping snapshot. |
| `src/lib/orders/server.ts` | submitCheckout + transitionOrderStatus + getOrderByReference + getAllOrders | ✓ VERIFIED | All four exported (lines 80, 306, 322, 346). `submitCheckout` is a single `db.transaction(...)` with `.for('update')` lock on productSizes (line 134). 12-step flow as documented. |
| `src/app/actions/orders.ts` | 'use server' shim with submitCheckoutAction + transitionOrderAction | ✓ VERIFIED | Line 1 = `'use server'`. Both actions are async forwarders (lines 25-39) per Next 15 rule. |
| `src/app/actions/cart.ts` | 'use server' actions for add/update/remove/migrate | ✓ VERIFIED | Line 1 = `'use server'`. Four actions (lines 39, 57, 74, 96), all returning canonical envelope. |
| `src/lib/cart/session.ts` | getOrCreateCart minting orki_sid cookie | ✓ VERIFIED | Cookie name `orki_sid` (line 16); 30-day MaxAge (line 17); httpOnly + sameSite=lax + secure-in-prod (lines 53-57). |
| `src/lib/cart/migrate.ts` | localStorage → DB migration | ✓ VERIFIED | File exists; called from `StoreHydration.tsx`; integration test `tests/integration/cart-merge.test.ts` covers UPSERT + sum-on-conflict + skip-unknown-sku branches. |
| `src/lib/orders/state-machine.ts` | TRANSITIONS + canTransition + assertTransition + legalNextStates | ✓ VERIFIED | Lines 31-54. NOT marked server-only (per dual-context decision). |
| `src/lib/orders/pricing.ts` | computeOrderTotals + formatSAR + halalas constants | ✓ VERIFIED | (Confirmed via tests + import sites in OrderSummary). |
| `src/lib/orders/reference.ts` | generateOrderReference → ORK-XXXXXX | ✓ VERIFIED | (Confirmed via tests + reference uniqueness retry in server.ts:163). |
| `src/lib/orders/errors.ts` | OrderError + IllegalTransitionError | ✓ VERIFIED | Imported by server.ts:24; used in throws. |
| `src/lib/checkout/schemas.ts` | shippingSchema + checkoutSchema + KSA_PHONE_PATTERN | ✓ VERIFIED | 15 schema tests pass. zod 4.4.3 + RHF 7.75 + @hookform/resolvers 5.2.2 confirmed. |
| `src/app/[locale]/checkout/page.tsx` | RHF form + submitCheckoutAction + CheckoutSteps + TrustSignals | ✓ VERIFIED | Mounted, calls action via useTransition, routes to `/checkout/confirmation?ref=` on success, sets error on failure. |
| `src/app/[locale]/checkout/confirmation/page.tsx` | Server Component reading order via getOrderByReference | ✓ VERIFIED | Server Component, no useEffect cart-clear, notFound() on missing/invalid ref. |
| `src/app/[locale]/admin/orders/page.tsx` | Admin orders list | ✓ VERIFIED | Server Component, `await getLocale()`, calls `getAllOrders()`. |
| `src/app/[locale]/admin/orders/[reference]/page.tsx` | Admin order detail with state transitions | ✓ VERIFIED | Confirmed via SUMMARY + grep. |
| `src/components/admin/OrderStateControls.tsx` | Client transition panel filtered by legalNextStates | ✓ VERIFIED | Line 36-37: `legal = new Set(legalNextStates(order.status)); visible = ALL_TRANSITIONS.filter(t => legal.has(t.to))`. canTransition retained as defense-in-depth (line 72). |
| `tests/integration/concurrent-stock.test.ts` | Two simultaneous checkouts of stock=1 → exactly one wins | ✓ VERIFIED | File exists; asserts `okCount===1 && failCount===1 && stock===0`; uses real DB with `describe.skipIf(!hasDbUrl)`. |
| `tests/integration/cart-merge.test.ts` | UPSERT semantics for migrateLocalStorageCart | ✓ VERIFIED | 3 cases per SUMMARY. |
| `tests/integration/transitions.test.ts` | State-machine walk + stock-restore policy | ✓ VERIFIED | 5 cases per SUMMARY. |
| `messages/en.json` + `messages/ar.json` | Checkout/Order/Email namespaces, EN+AR parity | ✓ VERIFIED | 110 keys across both, key-tree match per 08-04 SUMMARY. |
| `src/lib/email/*` | Email send module (08-07) | ✗ MISSING (deferred) | Glob `src/lib/email/**` → no files found. Plan 08-07 (Resend) deferred — no RESEND_API_KEY. Documented in `deferred-items.md`. ECOM-03 not satisfied. |

### Key Link Verification

| From | To | Via | Status | Details |
| ---- | -- | --- | ------ | ------- |
| `submitCheckout` | `productSizes` | `tx.select().from(productSizes).where(...).for('update')` | ✓ WIRED | server.ts:130-134; `grep -c "\.for('update')" src/lib/orders/server.ts` = **2** |
| `submitCheckout` | DB transaction | `db.transaction(async (tx) => { ... })` | ✓ WIRED | server.ts:126; `grep -c "db.transaction(" src/lib/orders/server.ts` = **2** |
| `submitCheckout` | state machine | `assertTransition('pending', 'confirmed')` | ✓ WIRED | server.ts:253 |
| `submitCheckout` | cart clear | `tx.delete(cartItems).where(eq(cartItems.cartId, cart.id))` | ✓ WIRED | server.ts:270 — only after payment confirmed |
| `checkout/page.tsx` | submitCheckoutAction | `startTransition + submitCheckoutAction(...)` | ✓ WIRED | checkout/page.tsx:53-58 |
| `checkout/page.tsx` | confirmation page | `router.push('/checkout/confirmation?ref=' + reference)` | ✓ WIRED | checkout/page.tsx:71-73 |
| `confirmation/page.tsx` | DB | `getOrderByReference(ref)` (Server Component) | ✓ WIRED | per 08-06 SUMMARY + verified Server Component status |
| `OrderSummary` | totals | `computeOrderTotals(items.map(...))` | ✓ WIRED | OrderSummary.tsx:18-23 |
| `ShippingForm` | zod schema | `zodResolver(shippingSchema)` | ✓ WIRED | ShippingForm.tsx:40 |
| `OrderStateControls` | server action | `transitionOrderAction(order.id, to, opts)` | ✓ WIRED | OrderStateControls.tsx:7, 44 |
| `OrderStateControls` | state machine | `legalNextStates(order.status)` filter | ✓ WIRED | OrderStateControls.tsx:36-37 |
| `StoreHydration` | DB | `migrateLocalCartAction` + `fetch('/api/cart')` | ✓ WIRED | per 08-02 SUMMARY |
| `transitionOrderStatus` | stock restore (pre-ship cancel) | `.for('update')` on productSizes by (productId, sizeLabel) | ✓ WIRED | server.ts:399 |
| `transitionOrderStatus` | email send | `import { sendEmail } from '@/lib/email/send'` | ✗ NOT_WIRED (deferred) | No email module; ECOM-03 deferred to 08-07. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
| -------- | ------------- | ------ | ------------------ | ------ |
| `OrderSummary` | `items` (Zustand) | `useCartStore()` ← `StoreHydration` ← `fetch('/api/cart')` ← `getCart()` ← Drizzle | ✓ Yes (DB-backed) | ✓ FLOWING |
| `checkout/confirmation/page.tsx` | `order` | `getOrderByReference(ref)` ← Drizzle relational read | ✓ Yes (DB-backed) | ✓ FLOWING |
| `admin/orders/page.tsx` | `orders` | `getAllOrders()` ← Drizzle relational read with items + events joined | ✓ Yes (DB-backed) | ✓ FLOWING |
| `admin/orders/[reference]/page.tsx` | `order` | `getOrderByReference(reference)` | ✓ Yes (DB-backed) | ✓ FLOWING |
| `OrderStateControls` | `order` | passed in by Server Component parent | ✓ Yes (DB-backed via parent) | ✓ FLOWING |
| `submitCheckout` | `cart.items` | `getCart(session.id)` ← Drizzle | ✓ Yes (DB-backed) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
| -------- | ------- | ------ | ------ |
| FOR UPDATE lock present | `grep -c "\.for('update')" src/lib/orders/server.ts` | 2 | ✓ PASS (≥1 required) |
| db.transaction present | `grep -c "db.transaction(" src/lib/orders/server.ts` | 2 | ✓ PASS (≥1 required) |
| Full test suite | `npm test` | 14 files / 76 tests passed; exit 0 | ✓ PASS |
| Targeted suite | `npx vitest run src/lib/orders/ src/lib/checkout/ tests/integration/` | 9 files / 51 tests passed | ✓ PASS (integration tests in separate project ran with full suite — see above) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
| ----------- | ----------- | ----------- | ------ | -------- |
| UX-01 | 08-06 | Guest checkout (no forced account) | ✓ PASS | Cart `userId` nullable; checkout/page.tsx requires no auth; only email collected on shipping form. |
| UX-02 | 08-06 | Visible progress indicator + minimum steps | ✓ PASS (programmatic); needs human UAT | `CheckoutSteps.tsx` renders 2-step `<ol>` with aria-current. Mounted in checkout/page.tsx:84. |
| UX-03 | 08-06 | Total cost (incl. tax/shipping) shown before confirmation | ✓ PASS | `OrderSummary.tsx:60-85` renders Subtotal + Shipping + VAT (15%) + Total. ZATCA-correct VAT base = subtotal + shipping. |
| UX-04 | 08-06 | Mobile tap targets ≥44px, no hover-only | PARTIAL — needs human UAT | `min-h-[44px]` and `min-h-[88px]` (PaymentGrid) classes present. Visual verification at 375px viewport pending. |
| UX-05 | 08-06 | Field-level errors + preserve entered data | ✓ PASS (programmatic); needs human UAT | RHF defaults preserve data on submit failure. Per-field error elements with role="alert". |
| UX-06 | 08-05/06 | No raw technical errors | ✓ PASS | server.ts:272-291 catches all errors → typed envelope `{ code, messageKey }`. Raw error logged with requestId server-side; never serialized. |
| UX-07 | 08-06 | Trust signals visible near checkout button | ✓ PASS | `<TrustSignals />` mounted at checkout/page.tsx:160, directly above Place Order button. |
| UX-08 | 08-05/06 | Recovery path on payment failure (preserve cart) | ✓ PASS | server.ts:270 places `tx.delete(cartItems)` AFTER payment confirmation. Failure throws → txn rollback → cart intact. UI shows error and stays on page (checkout/page.tsx:59-69). |
| UX-09 | 08-06 | WCAG 2.1 AA (keyboard, ARIA, contrast) | PARTIAL — needs human UAT | aria-invalid, aria-describedby, role="alert", aria-live="polite", focus-visible:ring all present. Screen-reader behavior requires human verification. |
| ECOM-02 | 08-03/05/08 | Order state machine pending→confirmed→shipped→delivered→refunded/cancelled | ✓ PASS | `state-machine.ts:31-38` defines matrix; `transitionOrderStatus` in server.ts:346 + integration test transitions.test.ts cover full graph + audit log. Admin UI in OrderStateControls.tsx renders only legal next states. |
| ECOM-03 | 08-07 (deferred) | Transactional emails via reliable provider (Resend) | ✗ DEFERRED | No `src/lib/email/` directory exists. Plan 08-07 not executed (no RESEND_API_KEY). UAT Scenario 8 marked Pending. Documented in `deferred-items.md`. |
| ECOM-04 | 08-05/08 | Refund + cancellation logic in core architecture | ✓ PASS | State machine includes `cancelled` + `refunded` terminal states. `transitionOrderStatus` enforces stock-restore policy (pre-ship: restore; post-ship/refund: do NOT). `order_events` audit log tracks every transition. Admin UI exposes Cancel + Refund buttons gated by legalNextStates. |

**Coverage:** 8 PASS / 3 PARTIAL (need human UAT) / 1 DEFERRED out of 12 phase requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
| ---- | ---- | ------- | -------- | ------ |
| `src/lib/orders/payment.ts` | (entire file) | `simulatePayment` is intentional stub | ℹ️ Info | Documented stub. CONTEXT.md and ROADMAP both confirm payment-on-checkout is simulator-only this phase. Swap-point for real PSP later. NOT a goal-blocker. |
| `src/components/checkout/PaymentGrid.tsx` | UI | Renders `card`/`cod` methods which fail server validation | ⚠️ Warning | Per 08-06 SUMMARY decision: server schema only accepts 4 methods (mada/visa/applepay/stcpay); UI renders 5. `card` and `cod` selections fall through to VALIDATION envelope with localized error. UX intact but mismatched — reconciliation deferred. |
| `tests/products.test.ts` | (entire file) | Excluded from `node` test project (pre-existing async/sync mismatch) | ℹ️ Info | Pre-Phase-8 test debt; documented in deferred-items.md; does NOT affect Phase 8 deliverables. |

### Threat Flags

| Flag | File | Description |
| ---- | ---- | ----------- |
| missing-authn | `src/lib/orders/server.ts` (`transitionOrderStatus`) | Admin Server Action has no auth gate at function level. Currently protected only by Phase-6 admin route group placeholder bypass. Phase 10 (auth) will close this. Direct import bypasses gate. Open and acknowledged in 08-05 + 08-08 SUMMARY. |

### Deferred Items (carried forward, not Phase 8 gaps)

- **Plan 08-07 (Resend transactional email):** No RESEND_API_KEY provisioned. ECOM-03 not satisfied. UAT Scenario 8 + email assertions in Scenarios 1/2/7 marked Pending. To re-enable: provision API key, ship 08-07, restore Scenario 8 body, add `vi.mock('@/lib/email/send', ...)` to integration tests, hook `email_sent.*` event rows.
- **`tests/products.test.ts`:** Pre-existing async/sync mismatch; excluded from `vitest.config.ts` `node` project. Belongs in dedicated test-infra plan.
- **`tests/cartStore.test.ts`, `SizeSelector.test.tsx`, `AddToCartButton.test.tsx`:** Pre-existing TS errors (Size shape mismatch). Same future test-infra plan target.
- **PaymentGrid `card` + `cod` methods:** UI shows 5 methods, server validates 4. Decision in 08-06 to defer reconciliation; UX falls through to localized validation error.

### Open Items / Threat Flags Summary

1. **Auth gap on `transitionOrderStatus`** (acknowledged) — closes in Phase 10.
2. **PaymentGrid card/cod mismatch with server enum** — UX falls back to validation error; not a goal-blocker, but should be reconciled in a future polish plan.
3. **08-07 email send is a no-op** — no email module exists; documented and gated.

### Email (08-07) Deferral Status

**What's wired:**
- `order_events` table has indexed `type` column ready to accept `email_sent.confirmation`, `email_sent.shipped`, `email_sent.cancelled`, `email_sent.refunded`, `email_send_failed` rows (schema.ts:226-227 documents the contract).
- `orders.locale` column captured at submit-time so 08-07 can render templates in the correct language.
- `Email.*` next-intl namespace in messages/en.json + messages/ar.json (per 08-04 SUMMARY).
- Idempotency design (`${event-type}/${orderId}` keys) documented in CONTEXT.md.

**What's missing:**
- No `src/lib/email/` directory; no `sendEmail` function; no react-email templates.
- `submitCheckout` and `transitionOrderStatus` do NOT import any email module — confirmed by inspection.
- No `RESEND_API_KEY` env var; no Resend client instantiation.
- UAT Scenario 8 + email assertions in Scenarios 1/2/7 marked Pending.
- Integration tests do NOT mock email (deliberately — no module to mock).

When 08-07 ships, the wiring sites are well-defined and the existing `order_events` infrastructure makes idempotency drop-in.

### Human Verification Required

The 5 ROADMAP success criteria are all programmatically verifiable as VERIFIED, but the broader requirement set (UX-02, UX-04, UX-05, UX-09) and end-to-end UAT scenarios cannot be confirmed without browser testing. See `08-UAT.md` for 9 scenarios. Critical ones:

1. **EN + AR happy path checkout** (Scenarios 1, 2)
2. **Payment failure recovery** with phone `+966 50 123 4911` (Scenario 3)
3. **Validation + ARIA wiring** (Scenario 4)
4. **Mobile tap targets at 375px** (Scenario 5)
5. **Screen reader pass** (Scenario 6)
6. **Admin transitions end-to-end** (Scenario 7)
7. **Optimistic add-pre-hydration race** (Scenario 9)

Scenario 8 (email graceful degradation) is Pending until 08-07.

### Gaps Summary

There are no codebase gaps that prevent Phase 8 from achieving its stated goal. All 5 ROADMAP success criteria are programmatically verified. 11 of 12 requirements are satisfied or partially satisfied (programmatic + needs UAT); ECOM-03 (transactional email) is explicitly deferred to 08-07 with documented rationale.

The phase delivers:
- Persistent guest cart (cookie + DB; localStorage migration complete) ✓
- Visible progress steps + bilingual total breakdown ✓
- Pessimistic-locked stock decrement (FOR UPDATE) inside Drizzle txn ✓
- Order state machine with audit log + admin UI ✓
- RHF + zod form with full ARIA wiring ✓
- Transaction rollback on payment failure → cart preserved ✓

**Recommendation:** Mark Phase 8 complete pending human UAT execution of 08-UAT.md scenarios 1–7 + 9. Scenario 8 (email) and ECOM-03 are explicitly deferred to a future 08-07 wave when RESEND_API_KEY is provisioned.

---

_Verified: 2026-05-10T01:10:00Z_
_Verifier: Claude (gsd-verifier)_
