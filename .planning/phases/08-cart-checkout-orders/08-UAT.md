# Phase 8 UAT — Cart, Checkout State & Order Flow

**Tester:** ___
**Build SHA:** ___
**Date:** ___
**Environment:** local dev (`npm run dev`) at http://localhost:3000 with the live Supabase Postgres DB.

Run each scenario in order. Mark Result as `passed`, `failed`, or `blocked` (with reason).

> **Note on email scenarios.** Plan 08-07 (Resend transactional email) is **deferred** until a `RESEND_API_KEY` is provisioned. Email send sites in the codebase are no-ops/stubs today. Scenarios that exercised the email flow have been marked **Pending — adds when Plan 08-07 ships** and tracked in `deferred-items.md`. Do NOT block Phase 8 sign-off on the email scenarios.

---

## Scenario 1 — EN happy path (UX-01, UX-02, UX-03, ECOM-02)

**Pre-conditions:**
- Dev server running, EN locale (`/en/...`).
- At least one product with `stock > 0` for some size (admin → `/en/admin/inventory`).

**Steps:**
1. Visit `/en/shop`; click any product; pick a size; click **Add to Cart**.
2. Open cart drawer; verify the item is present with the correct size + price.
3. Refresh the page. Verify cart persists (UX-08 baseline; cookie-backed).
4. Click **Checkout**.
5. Confirm `<CheckoutSteps>` shows "Step 1 of 2" and step 1 is highlighted with `aria-current="step"` (DevTools → Elements).
6. Fill all fields with valid Saudi data (e.g. phone `+966 50 123 4567`). Click **Continue to Payment**.
7. Confirm `<CheckoutSteps>` shows "Step 2 of 2" and the live region announces the change (sr-only `<div role="status" aria-live="polite">`).
8. Pick a payment method (`mada`).
9. Confirm `<OrderSummary>` shows four distinct lines: **Subtotal**, **Shipping** (with "Free" if subtotal ≥ 300 SAR), **VAT (15%)**, **Total**. Currency uses Western numerals in both locales (CLAUDE.md `'ar-SA-u-nu-latn'` rule).
10. Confirm `<TrustSignals>` (Lock + Returns + SSL) visible above the **Complete Purchase** button.
11. Click **Complete Purchase**.
12. Land on `/en/checkout/confirmation?ref=ORK-XXXXXX`. Verify reference shown matches a row in the database (admin → `/en/admin/orders` → order row exists with status `confirmed`).
13. Email: **Pending — adds when Plan 08-07 ships.** Today the order persists but no confirmation email is sent.
14. Visit `/en/admin/orders`. Verify the new order appears with status `confirmed`.

**Expected:** Steps 1–12 + 14 all behave as described. No raw error strings anywhere. Step 13 is deferred.

**Result:** _____

---

## Scenario 2 — AR happy path with RTL (UX-02, UX-03)

**Pre-conditions:** dev server running.

**Steps:**
1. Visit `/ar/shop`; verify `<html dir="rtl" lang="ar">` (DevTools → Elements).
2. Add an item; open cart drawer; verify icons mirror correctly (chevrons point inward, not literally "left/right"). All directional spacing uses logical CSS (`ms-`, `me-`, `ps-`, `pe-`).
3. Click checkout. Verify all labels are Arabic, the form is visually mirrored, and no horizontal-scroll bug appears.
4. Fill fields; submit. Land on `/ar/checkout/confirmation?ref=ORK-XXXXXX`; verify Arabic copy on the confirmation page (`getTranslations('Order')` from server).
5. Currency renders Western numerals in AR (e.g. "100.00 SAR" not "١٠٠٫٠٠").
6. Email: **Pending — adds when Plan 08-07 ships.** The AR variant `'تم تأكيد طلبك من ORKI'` will be exercised then.

**Expected:** Full AR flow works; no mixed-direction layout bugs; Western digits in money formatting.

**Result:** _____

---

## Scenario 3 — Payment failure recovery (UX-06, UX-08)

**Pre-conditions:** cart has at least one item.

**Steps:**
1. On checkout, fill shipping with phone `+966 50 123 4911` (last three digits `911` → `simulatePayment` returns `CARD_DECLINED`).
2. Click **Complete Purchase**.
3. Confirm error banner appears with the localized text from `Checkout.errors.paymentDeclined` (NOT a raw "Error: PAYMENT_DECLINED" or stack trace).
4. Open cart drawer. Verify the cart still has the same items and quantities (UX-08 — txn rolled back, cart preserved).
5. Edit shipping phone to a valid value (e.g. `+966 50 123 4567`), retry. Order completes successfully and routes to `/checkout/confirmation?ref=ORK-XXXXXX`.
6. Verify in `/admin/orders` that NO row exists for the failed attempt (only the second, successful one).

**Expected:** Cart preserved on failure; user-friendly bilingual error; no orphaned `pending` order in the DB.

**Result:** _____

---

## Scenario 4 — Validation errors (UX-05, UX-09)

**Steps:**
1. On the shipping form, leave all fields empty and click **Continue to Payment**.
2. Verify each empty required field shows a red message under it (e.g. "This field is required" / "هذا الحقل مطلوب").
3. Verify focus moves to the FIRST invalid field automatically (UX-09 / Pitfall 9 — `setFocus` in `useEffect`).
4. Verify entered data is NOT erased by clicking continue — RHF preserves field state across submit failures.
5. Submit an invalid email (e.g. `notanemail`). Verify the email field shows "Please enter a valid email" / "أدخل بريداً إلكترونياً صحيحاً".
6. Inspect the email input in DevTools: it has `aria-invalid="true"` and `aria-describedby="email-error"`. The `<p>` with id `email-error` has `role="alert"`.
7. Submit a non-Saudi phone (e.g. `+1 555 123 4567`). Verify a localized error from `Checkout.errors.phone.ksa`.

**Expected:** ARIA wiring correct; data preserved; first-invalid focus management works in both EN and AR.

**Result:** _____

---

## Scenario 5 — Mobile tap targets (UX-04)

**Steps:**
1. DevTools → device emulation 375×812 (iPhone X).
2. Use the Lighthouse "Tap targets are sized appropriately" audit, OR manually verify in DevTools → Computed:
   - Place Order button height ≥ 44px
   - PaymentGrid cards height ≥ 88px (per Pitfall 8 + UX-04 — `min-h-[88px]` in `PaymentGrid.tsx`)
   - Form input heights ≥ 44px
   - Cart quantity +/- buttons height ≥ 44px
3. Confirm no hover-only interactions — all CTAs have `:focus-visible` AND tap-friendly sizing.
4. Same checks in AR (`/ar/...`) — RTL layout must not cause overflow at 375px.

**Expected:** No tap target < 44×44; no overflow at 375px viewport in either locale.

**Result:** _____

---

## Scenario 6 — Screen reader pass (UX-09)

**Tools:** VoiceOver (macOS, Cmd+F5) or NVDA (Windows).

**Steps:**
1. Navigate the checkout flow with screen reader on, EN.
2. On step transition (after clicking **Continue to Payment**), verify the live region announces "Step 2 of 2: Payment Method" — the sr-only `<div role="status" aria-live="polite">` in `<CheckoutSteps>`.
3. On a validation error, the screen reader announces the error message via `role="alert"` (immediate live region).
4. Tab through every interactive element — keyboard navigation order makes sense; no skipped controls; no focus traps; visible focus ring on every focusable.
5. The progress indicator announces "Step 1, current" / "Step 2, current" via `aria-current="step"`.
6. Repeat with AR locale — the AR translation strings should also be announced.

**Expected:** All ARIA wiring is consumed correctly by the screen reader in both locales.

**Result:** _____

---

## Scenario 7 — Admin: ship + cancel-pre-ship + refund (ECOM-02, ECOM-04)

**Pre-conditions:** at least 3 confirmed orders in the DB (run Scenario 1 three times to seed orders A, B, C).

**Steps:**
1. Visit `/en/admin/orders`. Verify the table shows all three orders with status `confirmed`. Search by reference / email / status — all three filters work.
2. Click order A → detail page → click **Mark Shipped** with tracking number `AWB-123` → verify status becomes `shipped`, `trackingNumber` is set, and a `shipped` row appears in the audit log section. Email step: **Pending — adds when Plan 08-07 ships.**
3. Click order B → detail → **Cancel Order** with reason `test` → verify status `cancelled`, an event `cancelled` appears in the audit log with `actor: 'admin'`, `reason: 'test'`, `stockRestored: true`. Inspect `/admin/inventory` for the affected size — stock has been restored (incremented by the order's quantity).
4. Click order C → detail → **Mark Shipped** → **Mark Delivered** → **Refund Order** → verify the status flows `confirmed → shipped → delivered → refunded` and each transition emits one audit event row. Stock is NOT restored for `shipped → cancelled` and `* → refunded` (CONTEXT.md policy; verified in Plan 08-09 transitions integration test).
5. On a refunded order, verify the available transition buttons in `<OrderStateControls>` are filtered down to "No further transitions available" — `legalNextStates('refunded')` is empty, so no raw enum buttons appear (Plan 08-08 rule).
6. Admin nav sidebar shows the **Orders** link active and clickable (no `PHASE 8` placeholder badge).

**Expected:** All transitions follow `state-machine.ts`. Stock restoration only on pre-ship cancel. Terminal states render no enabled transition buttons.

**Result:** _____

---

## Scenario 8 — Email graceful degradation (ECOM-03)

**Status:** **Pending — adds when Plan 08-07 ships.**

This scenario was originally drafted to verify that an unset `RESEND_API_KEY` does not break checkout (the order persists, the page renders, the dev console logs a warning, no `email_sent.confirmation` event row is written). Plan 08-07 is **deferred** until an API key is provisioned. Today the email send sites are no-ops/stubs and do not depend on `RESEND_API_KEY` at all — there is nothing to test.

**When 08-07 ships:** restore the original Scenario 8 body (see plan 08-09 PLAN.md) and run it both with `RESEND_API_KEY` set and unset. Tracked in `deferred-items.md` under "Plan 08-07 deferred — re-enable Scenario 8 + email assertions".

**Result:** _____  (use `pending` until 08-07 lands)

---

## Scenario 9 — Rapid add-to-cart before server hydration completes (UX-08, Plan 08-02 race)

**Per Revision 4 of plan-checker feedback. Covers the optimistic-add-before-server-hydration code path surfaced by Plan 08-02 (cart persistence): the client must show items immediately while the DB cart is still being hydrated for a brand-new session, and after hydration the items must end up with stable server `id` fields with NO duplicate DB rows.**

**Pre-conditions:**
- Dev server running (`npm run dev`).
- Open a fresh incognito / private browser session — no `orki_sid` cookie set yet.
- DevTools → Application → Cookies: confirm no `orki_sid` cookie exists for `localhost:3000`.
- DevTools → Application → Local Storage: clear `orki-cart` (Zustand persisted key) if present.
- Have a SQL query handy to inspect DB state, e.g. via the Drizzle Studio (`npm run db:studio`) or `psql $DATABASE_URL -c "select * from cart_items where cart_id in (select id from carts order by created_at desc limit 1);"`.

**Steps:**
1. Navigate to a product detail page (e.g. `/en/shop/<some-slug>`). Pick a size.
2. Click **Add to Cart** TWICE within ~200 ms — use a deliberate fast double-click. Practice with DevTools → Network throttling: "Fast 4G" to make the underlying server roundtrip slower and the race more visible.
3. **Immediately** (within ~100 ms of the second click) open the cart drawer. Verify the cart drawer shows **2 items of that product/size** (or one line with quantity 2, depending on the UI shape) — this is the OPTIMISTIC state, displayed BEFORE the server confirms.
4. Wait ~1 s for server hydration to complete (watch Network tab for `getOrCreateCart` and `addToCartAction` requests to settle).
5. Inspect localStorage `orki-cart` (or the rehydrated Zustand state via React DevTools) and verify each cart item now has a stable, non-temporary server `id` field (UUID-shaped, not `temp_*` or absent). Items SHOULD have synchronized with their server-side row IDs.
6. Refresh the page.
7. Re-open the cart drawer. Verify the items are still present, with the same product, size, and total quantity = 2.
8. Open DevTools console — verify NO uncaught errors logged during steps 1–7. (Warnings about hydration race are acceptable; uncaught exceptions are NOT.)
9. Inspect the DB: `select count(*) from cart_items where cart_id = (select id from carts where session_id = '<value of orki_sid cookie>')`. Expected: **exactly 1 row** with `quantity = 2` (the upsert-sum behavior from Plan 08-02), NOT two duplicate rows.

**Expected:**
- Cart drawer shows 2 items immediately (optimistic, before server hydration completes).
- After ~1 s, items have stable server IDs (verified by inspecting localStorage OR by behavior — refresh preserves them).
- Page refresh preserves both items.
- Zero uncaught console errors during the rapid-add window.
- DB has exactly ONE `cart_items` row with `quantity = 2`, NOT two duplicate rows (the upsert-on-conflict behavior from Plan 08-02 must dedup correctly even when the second `addToCartAction` fires before the first one's `id` has been written back).

**Result:** _____

---

## Sign-off

Tested by: __________________   Date: __________

All scenarios pass: yes / no   (Scenario 8 may be `pending` while Plan 08-07 is deferred — that does NOT block Phase 8 sign-off.)

Phase 8 UAT status: **passed** / **failed**

---

*Requirements covered: UX-01 (S1), UX-02 (S1, S2), UX-03 (S1, S2), UX-04 (S5), UX-05 (S4), UX-06 (S3), UX-07 (S1), UX-08 (S3, S9), UX-09 (S4, S6), ECOM-02 (S1, S7), ECOM-03 (S8 — deferred), ECOM-04 (S7).*
