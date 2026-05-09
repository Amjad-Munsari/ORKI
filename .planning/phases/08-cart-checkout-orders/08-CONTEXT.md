# Phase 8: Cart, Checkout State & Order Flow — Context

**Gathered:** 2026-05-09
**Status:** Ready for planning
**Source:** Auto-decided by orchestrator (user invoked `/gsd-plan-phase 8` with "decide what's best, plan directly" — discuss-phase skipped intentionally)

<domain>
## Phase Boundary

Convert the existing Phase 3 frontend cart (Zustand + localStorage, mock `/api/checkout/mock`) into:

1. A **persistent guest cart** backed by Postgres (Drizzle), keyed by an httpOnly session cookie. Auth (Phase 10) is DEFERRED — `userId` columns are nullable.
2. A **complete order lifecycle** with explicit state machine: `pending → confirmed → shipped → delivered → cancelled / refunded`.
3. **Server-side checkout submit** (Server Action) that re-prices, locks stock with `SELECT … FOR UPDATE`, decrements inventory, creates the order, simulates payment, transitions state, clears the cart — all in one Drizzle transaction.
4. **Bilingual transactional email** (order confirmation, shipping, cancellation/refund) via Resend + react-email, sent post-commit with idempotency keys.
5. **Form validation** via zod + react-hook-form, EN/AR error messages, WCAG 2.1 AA wiring (aria-invalid, aria-describedby, role="alert", focus management on step transitions).
6. **Refund/cancellation architecture** wired into the Phase 6 admin dashboard (orders table + state-transition controls + `order_events` audit log).

Out of scope for this phase:
- Real payment gateway (Moyasar/Mada/STC Pay) — payment stays simulated.
- Authentication / user accounts — Phase 10.
- Returns/RMA UI for customers — admin-initiated only this phase.
- Live shipping carrier integration (Aramex API) — flat rate only.

</domain>

<decisions>
## Implementation Decisions (Locked)

### Persistence model
- **Cart session:** httpOnly cookie `orki_sid` (SameSite=Lax, Path=/, 30-day expiry, Secure in prod). Minted on first cart mutation via Server Action — never inside a Server Component (Next 15 prohibits cookie writes in RSC).
- **Cart merge on auth (future):** localStorage cart from Phase 3 is merged into the DB cart on first server-side mutation, then dropped — Zustand stays as the UI source of truth and is hydrated from `/api/cart` on mount.
- **Carts table:** `carts(id uuid pk, sessionId text unique, userId text null, createdAt, updatedAt)`. Cart items reference `carts.id` and `products.id` + `selectedSize`.

### Order state machine
- **States:** `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `refunded` — Postgres `pgEnum order_status`.
- **No `failed` terminal state.** Payment failure rolls back the transaction; the order is never persisted. The cart is preserved (UX-08) by NOT clearing the cart on failure.
- **Allowed transitions** (validated in code, NOT just at the DB layer):
  - `pending → confirmed` (payment success)
  - `confirmed → shipped` (admin)
  - `shipped → delivered` (admin)
  - `pending|confirmed → cancelled` (admin; releases stock if pre-ship)
  - `confirmed|shipped|delivered → refunded` (admin; does not auto-release stock)
- **`order_events` audit log** with `(orderId, fromStatus, toStatus, actor, note, createdAt)` — every transition emits one row. This is non-negotiable; refund accounting later depends on it.
- **Cancel-after-ship:** allowed but does NOT release stock (admin assumes goods are in transit). Recorded as `shipped → cancelled` in `order_events`.

### Money & pricing
- **All amounts stored as integer halalas** (1 SAR = 100 halalas). No floats anywhere.
- **`products.price` is VAT-EXCLUSIVE.** Display layer shows "Price (excl. VAT)" or recomputes inclusive total; checkout summary shows subtotal, shipping, VAT (15%), total as separate lines (UX-03).
- **Server-side re-pricing** at checkout submit — the client total is informational only; server is authoritative.
- **VAT:** 15% (KSA standard rate, ZATCA), computed on `(subtotal + shipping)`. Single-line display "VAT (15%)".

### Shipping
- **Flat rate:** 25 SAR per order.
- **Free shipping threshold:** 300 SAR subtotal (excl. VAT). Display "Free shipping" line at threshold.
- **No carrier integration** — admin marks `shipped` manually; no tracking number this phase (add a nullable `trackingNumber` column for future).

### Email (ECOM-03)
- **Provider: Resend.** Reasoning: simpler Next.js DX, native idempotency keys, react-email integration matches our component-based aesthetic.
- **Templates** (bilingual EN + AR, dark theme, Space Grotesk + IBM Plex Arabic via Google Fonts CSS):
  - `OrderConfirmedEmail` — sent on `pending → confirmed`
  - `OrderShippedEmail` — sent on `confirmed → shipped`
  - `OrderCancelledEmail` — sent on `* → cancelled`
  - `OrderRefundedEmail` — sent on `* → refunded`
- **Send is post-commit.** A failure to send must NOT roll back the order. Failures are logged to `order_events.note` with status `email_failed`.
- **Idempotency key:** `${event-type}/${orderId}` — Resend native dedup.
- **From address:** `orders@orki.sa` (env-var, default `onboarding@resend.dev` in dev).
- **Locale:** email locale is the cart's locale at submit time; stored on `orders.locale`.

### Validation
- **zod 4.x + react-hook-form 7.x + @hookform/resolvers 5.x.** Schemas live in `src/lib/checkout/schemas.ts` and are imported by both client (RHF) and Server Action (re-validate). Single source of truth.
- **Bilingual error messages** via next-intl namespaced keys (`checkout.errors.*`).
- **Preserve entered data on error** — RHF default behavior (don't reset on submit failure). Server Action returns field-level errors that map back into the form.

### Accessibility (UX-09)
- `aria-invalid={fieldState.invalid || undefined}` (omit attr when valid, per ARIA spec)
- `aria-describedby` ties each input to its error message id
- `role="alert"` on the error summary
- Focus moves to first invalid field on submit failure
- Step-change announcements via `aria-live="polite"` region on the checkout shell
- Color contrast already validated in Phase 4 polish — re-verify after any new components

### Server Action vs Route Handler
- **Checkout submit:** Server Action (`submitCheckout`) for first-class form submission, progressive enhancement, automatic CSRF.
- **Cart read/sync:** Route handlers `/api/cart` (GET, POST) — used by client-side Zustand sync.
- **Admin state transitions:** Server Actions inside the admin dashboard.

### Stock locking (intersection with Phase 7)
**IMPORTANT:** The researcher confirmed Phase 7 did NOT actually implement `SELECT … FOR UPDATE`. Phase 8's checkout transaction MUST own this. Pattern:
```ts
await db.transaction(async (tx) => {
  for (const item of cartItems) {
    const [size] = await tx
      .select()
      .from(productSizes)
      .where(and(eq(productSizes.productId, item.productId), eq(productSizes.label, item.selectedSize)))
      .for('update');
    if (!size || size.quantity < item.quantity) throw new InsufficientStockError(item);
    await tx.update(productSizes).set({ quantity: size.quantity - item.quantity })...;
  }
  // insert order, order_items, order_events('pending')
  // simulate payment
  // update order.status = 'confirmed', order_events('pending → confirmed')
  // delete cart_items
});
```
Phase 7 may layer additional reservation logic later; Phase 8 owns the lock at checkout.

### Order references
- Internal id: `uuid` (Drizzle default). External-facing reference: `orders.reference` — 6-char nanoid prefixed `ORK-` (e.g. `ORK-A1B2C3`). Indexed `unique`. Used in URLs and emails.

### Error UX (UX-06)
- Server Actions return `{ ok: false, code: 'INSUFFICIENT_STOCK' | 'PAYMENT_FAILED' | 'VALIDATION' | 'UNKNOWN', fields?: Record<string,string>, messageKey: string }`.
- Client maps `code` + `messageKey` → bilingual user-friendly message via next-intl.
- Raw stack/SQL never reaches the client. Server logs the full error with `console.error` plus a short request id; the client only sees the request id for support.

### Trust signals (UX-07)
- Static block above the "Place Order" button: SSL padlock icon, "Secure Checkout", "30-Day Returns", payment method logos (Mada, Visa, Mastercard, Apple Pay — visual only this phase). Bilingual copy.

### Tests
- **Unit:** zod schemas, state-machine transition matrix, reference generator, VAT calculation.
- **Integration (Vitest + Drizzle):** concurrent-stock test (2 simultaneous checkouts of last item — exactly one wins), cart merge, full happy-path checkout.
- **E2E (manual UAT this phase, automated deferred):** mobile flow, RTL flow, payment-failure recovery, screen-reader pass.

### Claude's Discretion
- Exact file/folder organization under `src/lib/orders/`, `src/lib/cart/`.
- Component-level styling and animation choices (must match Phase 4 polish).
- Test framework wiring (Vitest already present from Phase 5).
- Whether to use Drizzle's `pgEnum` or a CHECK constraint for `order_status` (recommend pgEnum for type-safety).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project & roadmap
- `.planning/PROJECT.md` — project context and constraints
- `.planning/REQUIREMENTS.md` — full requirement catalog (UX-01..09, ECOM-02..04 are this phase)
- `.planning/ROADMAP.md` — phase scope and success criteria
- `CLAUDE.md` — RTL/i18n/styling/data-layer constraints

### Phase 8 research
- `.planning/phases/08-cart-checkout-orders/08-RESEARCH.md` — full technical research (1155 lines)

### Existing code that MUST be respected or extended
- `src/store/cartStore.ts` — Zustand cart contract; UI must keep working as today
- `src/lib/db/schema.ts` — Drizzle schema; Phase 8 ADDS `carts`, `cart_items`, `orders`, `order_items`, `order_events`
- `src/components/cart/CartDrawer.tsx`, `CartItem.tsx`
- `src/components/checkout/ShippingForm.tsx`, `PaymentGrid.tsx`, `OrderSummary.tsx`
- `src/app/[locale]/checkout/page.tsx` — currently uses mock submit; rewire to Server Action
- `src/app/[locale]/checkout/confirmation/page.tsx`
- `src/app/api/checkout/mock/route.ts` — to be replaced by Server Action
- `src/lib/products.ts` — DB read API; do not bypass

### Prior phase artifacts (cross-phase context)
- `.planning/phases/05-local-db-orm/` — Drizzle setup, env vars, DB client
- `.planning/phases/06-admin-dashboard/` — admin route group, auth bypass pattern, table CRUD
- `.planning/phases/07-product-catalog/` — SSR product reads, stock display (NOTE: stock-locking not actually implemented — Phase 8 owns it)

</canonical_refs>

<specifics>
## Specific Ideas

- Order reference format: `ORK-A1B2C3` (nanoid alphabet `ABCDEFGHJKLMNPQRSTUVWXYZ23456789`, 6 chars).
- Email `from`: `ORKI <orders@orki.sa>`. Reply-to: `support@orki.sa`.
- Cart cookie name: `orki_sid`. Max-Age: 2592000 (30 days). HttpOnly, SameSite=Lax, Secure in prod.
- Postgres enum name: `order_status`. Values exactly: `pending`, `confirmed`, `shipped`, `delivered`, `cancelled`, `refunded`.
- Trust badge bar uses inline SVG (already pattern in `/components/icons/` if it exists; otherwise create).
- Confirmation page route: `/[locale]/checkout/confirmation?ref=ORK-A1B2C3` (uses public reference, not uuid).
- Admin orders route: `/admin/orders` (list) and `/admin/orders/[reference]` (detail with state-transition buttons).

</specifics>

<deferred>
## Deferred Ideas

- Real Moyasar / Mada / STC Pay integration — future milestone after auth.
- Customer-initiated returns / RMA flow — admin-only this phase.
- Aramex / SMSA shipping API integration — flat rate this phase.
- User accounts and order history page — Phase 10 (Auth).
- Inventory reservation TTL (cart hold) — Phase 8 locks at checkout submit, not at add-to-cart.
- Webhook delivery / retry queue for emails — relying on Resend native retries this phase.
- A/B testing of trust signals — out of scope.

</deferred>

---

*Phase: 08-cart-checkout-orders*
*Context decided: 2026-05-09 by orchestrator under `/gsd-plan-phase 8` (no-discuss mode)*
