---
status: diagnosed
phase: 08-cart-checkout-orders
source: [08-01-SUMMARY.md, 08-02-SUMMARY.md, 08-03-SUMMARY.md, 08-04-SUMMARY.md, 08-05-SUMMARY.md, 08-06-SUMMARY.md, 08-08-SUMMARY.md, 08-09-SUMMARY.md]
started: 2026-05-10T00:00:00Z
updated: 2026-05-16T00:00:00Z
---

## Current Test

[session closed 2026-05-16 — 1 pass, 1 issue (cart-clear), 7 skipped (1 email-deferred, 6 checkout/payment/admin deferred to a later UAT round). User pivoting to storefront UI/UX + content verification.]

## Tests

### 1. EN happy path (UX-01, UX-02, UX-03, ECOM-02)
expected: |
  EN locale: add product+size to cart, drawer shows item, refresh persists cart. Checkout step 1 shows "Step 1 of 2" with aria-current="step". Fill valid Saudi shipping (phone +966 50 123 4567), continue. Step 2 shows "Step 2 of 2" with sr-only live-region announcement. Pick mada. OrderSummary shows Subtotal / Shipping (Free if ≥300 SAR) / VAT (15%) / Total in Western numerals. TrustSignals visible. Complete Purchase. Land on /en/checkout/confirmation?ref=ORK-XXXXXX. /en/admin/orders shows the order with status confirmed.
result: passed
reported: "refreshing the page resets the cart"
severity: major
fix: "AddToCartButton.tsx now calls addToCartAction (debug session: cart-resets-on-refresh). Verified by user 2026-05-10 — cart persists across refresh."

### 2. AR happy path with RTL (UX-02, UX-03)
expected: |
  /ar/shop loads with <html dir="rtl" lang="ar">. Add item, open drawer, icons/chevrons mirror correctly, all directional spacing logical (ms-/me-/ps-/pe-). Checkout shows Arabic labels and visually mirrored form, no horizontal-scroll bug. Submit valid form → land on /ar/checkout/confirmation?ref=ORK-XXXXXX with Arabic copy. Currency renders Western numerals in AR ("100.00 SAR" not "١٠٠٫٠٠"). Cart is empty after successful order.
result: issue
reported: "I used fake data, but either way it worked and I got the order number. one thing that should've happened is that the cart should be empty"
severity: major
note: Main RTL flow + order completion verified. Post-order cart-clear missing.

### 3. Payment failure recovery (UX-06, UX-08)
expected: |
  Phone +966 50 123 4911 (suffix 911 → simulatePayment returns CARD_DECLINED) → Complete Purchase shows localized error banner from Checkout.errors.paymentDeclined (NOT raw "Error: PAYMENT_DECLINED" or stack). Cart drawer still has same items + quantities (txn rolled back). Edit phone to +966 50 123 4567, retry → order completes and routes to confirmation. /admin/orders has only the second successful order, NO row for the failed attempt.
result: skipped
reason: User deferred payment-specific testing. Mock simulator (simulatePayment) will be replaced when a real provider (Moyasar/Mada/STC Pay) is wired up; revisit then.

### 4. Validation errors (UX-05, UX-09)
expected: |
  Empty form + Continue: each empty required field shows red message ("This field is required" / "هذا الحقل مطلوب"), focus auto-moves to FIRST invalid field, entered data NOT erased. Invalid email shows "Please enter a valid email" / "أدخل بريداً إلكترونياً صحيحاً". Email input has aria-invalid="true" + aria-describedby="email-error", error <p id="email-error"> has role="alert". Non-Saudi phone (+1 555 123 4567) shows localized Checkout.errors.phone.ksa.
result: skipped
reason: User deferred all checkout/cart/admin verification 2026-05-16 — focusing on storefront UI/UX + content polish first.

### 5. Mobile tap targets (UX-04)
expected: |
  At 375×812 viewport: Place Order button ≥44px, PaymentGrid cards ≥88px (min-h-[88px]), form inputs ≥44px, cart qty +/- buttons ≥44px. No hover-only interactions — all CTAs have :focus-visible AND tap-friendly sizing. Same checks pass in /ar/ — RTL must not cause overflow at 375px.
result: skipped
reason: User deferred all checkout/cart/admin verification 2026-05-16 — focusing on storefront UI/UX + content polish first. Tap-target verification for non-checkout surfaces (PDP, shop, nav) to be covered by the UI/UX-only pass.

### 6. Screen reader pass (UX-09)
expected: |
  EN with VoiceOver/NVDA: step transition announces "Step 2 of 2: Payment Method" via sr-only role="status" aria-live="polite". Validation error announces via role="alert". Tab order makes sense, no skipped controls, no focus traps, visible focus ring everywhere. Progress indicator announces "Step N, current" via aria-current="step". Repeats correctly in AR with Arabic strings.
result: skipped
reason: User deferred all checkout/cart/admin verification 2026-05-16 — focusing on storefront UI/UX + content polish first.

### 7. Admin: ship + cancel-pre-ship + refund (ECOM-02, ECOM-04)
expected: |
  Seed 3 confirmed orders A/B/C. /en/admin/orders shows all 3 confirmed; search by ref/email/status works. Order A → Mark Shipped (tracking AWB-123) → status shipped, trackingNumber set, audit-log row appears. Order B → Cancel Order (reason "test") → status cancelled, audit event with actor:admin, reason:test, stockRestored:true; /admin/inventory shows stock incremented. Order C → Mark Shipped → Mark Delivered → Refund Order → status flows confirmed→shipped→delivered→refunded with one audit event per transition; stock NOT restored for shipped→cancelled and *→refunded. On refunded order, OrderStateControls shows "No further transitions available" (legalNextStates('refunded') is empty). Admin sidebar Orders link active, no PHASE 8 placeholder badge.
result: skipped
reason: User deferred all checkout/cart/admin verification 2026-05-16 — focusing on storefront UI/UX + content polish first.

### 8. Email graceful degradation (ECOM-03)
expected: |
  Plan 08-07 deferred — no email module exists. Send-sites are stubs/no-ops. Nothing to test today; restore when 08-07 ships.
result: skipped
reason: Plan 08-07 (Resend email) deferred until RESEND_API_KEY provisioned. Tracked in deferred-items.md.

### 9. Rapid add-to-cart before server hydration (UX-08, Plan 08-02 race)
expected: |
  Fresh incognito session (no orki_sid cookie, no orki-cart in localStorage). With Network throttled to Fast 4G, double-click Add to Cart within ~200ms. Cart drawer immediately shows 2 items (optimistic, before server confirms). After ~1s server hydration, items have stable UUID id fields (not temp_*). Refresh preserves both items. ZERO uncaught console errors during the rapid-add window. DB query: exactly ONE cart_items row with quantity=2 (upsert-on-conflict dedup), NOT two duplicate rows.
result: skipped
reason: User deferred all checkout/cart/admin verification 2026-05-16 — focusing on storefront UI/UX + content polish first.

## Summary

total: 9
passed: 1
issues: 1
pending: 0
skipped: 7
blocked: 0

## Gaps

- truth: "Cart persists across full-page refresh (UX-08; Plan 08-02 cookie-backed cart hydration)"
  status: resolved
  reason: "User reported: refreshing the page resets the cart"
  resolved: 2026-05-10
  severity: major
  test: 1
  root_cause: "AddToCartButton.tsx (PDP) never invoked the addToCartAction Server Action — the click only mutated Zustand in-memory, so nothing reached Postgres. On refresh, /api/cart correctly returned an empty cart and StoreHydration replaced Zustand with []. Plan 08-02 Task 3 wired CartItem.tsx (drawer) but omitted the PDP add path; addToCartAction had zero call sites in src/."
  fix: "Wired AddToCartButton to call addToCartAction inside useTransition, mirroring CartItem.tsx (optimistic Zustand → Server Action → reconcile via setItems on success/failure). sizeId resolved from product.sizes by label."
  artifacts: ["src/components/pdp/AddToCartButton.tsx"]
  missing: []
  debug_session: ".planning/debug/cart-resets-on-refresh.md"

- truth: "Cart is cleared after a successful order completes (UX flow contract — user should not see prior items after placing an order)"
  status: failed
  reason: "User reported: I used fake data, but either way it worked and I got the order number. one thing that should've happened is that the cart should be empty"
  severity: major
  test: 2
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis
