---
phase: 08-cart-checkout-orders
plan: 07
subsystem: transactional-email
one_liner: "Resend-backed bilingual transactional emails (confirmation/shipped/cancelled/refunded) dispatched post-commit with DB + idempotency-key dedup, graceful no-op when RESEND_API_KEY is absent"
tags: [resend, react-email, server-only, idempotency, post-commit, ECOM-03, wave-3]
requires:
  - "Phase 8 Plan 03 (orders pure libs — Order/pricing types)"
  - "Phase 8 Plan 05 (submitCheckout + transitionOrderStatus + getOrderByReference)"
provides:
  - "src/lib/email/client.ts — HMR-safe Resend singleton, null when no API key"
  - "Four react-email bilingual templates (OrderConfirmation/Shipped/Cancelled/Refunded) with lang+dir + brand dark theme"
  - "src/lib/email/send.ts — sendOrderConfirmed/Shipped/Cancelled/Refunded; DB idempotency guard + Resend idempotencyKey; never throws"
  - "submitCheckout sends confirmation post-commit; transitionOrderStatus sends shipped/cancelled/refunded post-commit"
  - "getOrderById(orderId) helper on orders/server.ts mirroring getOrderByReference"
  - "env.ts extended with RESEND_API_KEY (optional) / RESEND_FROM_EMAIL (default onboarding@resend.dev) / ORKI_BASE_URL (optional)"
affects:
  - "Plan 08-09 (integration tests) — concurrent-stock.test.ts can now add the email/send vi.mock its TODO comment anticipated"
tech-stack:
  added:
    - "resend@6.12.4"
    - "@react-email/components@1.0.12"
  patterns:
    - "Post-commit side effect OUTSIDE db.transaction(...) — email failure logs an order_events row, never rolls back the order"
    - "Double idempotency: DB pre-check on order_events.type = email_sent.{kind} + Resend idempotencyKey '<kind>/<orderId>' (pinned 2nd-positional-arg form, fully typed via CreateEmailRequestOptions, no `as any`)"
    - "Locale COPY tables co-defined in each template file (react-email renders outside the next-intl provider)"
    - "Resend singleton resolves to null without a key → send.ts returns { ok: false, code: 'NO_API_KEY' } and warns"
key-files:
  created:
    - "src/lib/email/client.ts"
    - "src/lib/email/templates/OrderConfirmation.tsx"
    - "src/lib/email/templates/OrderShipped.tsx"
    - "src/lib/email/templates/OrderCancelled.tsx"
    - "src/lib/email/templates/OrderRefunded.tsx"
    - "src/lib/email/send.ts"
    - ".planning/phases/08-cart-checkout-orders/08-07-SUMMARY.md"
  modified:
    - "src/lib/env.ts"
    - "src/lib/orders/server.ts"
    - ".env.example"
    - "package.json"
    - "package-lock.json"
requirements: [ECOM-03]
status: complete
date: 2026-05-29
---

# Phase 8 Plan 07 SUMMARY: Resend Transactional Emails

**Completed:** 2026-05-29 (executed out of band — this plan was the one outstanding 08 plan with no summary)

## Accomplishments
- Installed `resend@6.12.4` and `@react-email/components@1.0.12` (React 19 compatible).
- Added an HMR-safe Resend singleton (`src/lib/email/client.ts`) that resolves to `null` when `RESEND_API_KEY` is absent — mirrors the `db/client.ts` global pattern.
- Built four bilingual react-email templates (`OrderConfirmation`, `OrderShipped`, `OrderCancelled`, `OrderRefunded`), each `<Html lang dir>` with locale-selected COPY tables and the brand dark theme (Space Grotesk EN / IBM Plex Sans Arabic AR).
- Built `src/lib/email/send.ts` with four exported senders. Each: short-circuits with `{ ok: false, code: 'NO_API_KEY' }` when no client; DB-idempotency-checks `order_events.type = 'email_sent.{kind}'`; calls `resend.emails.send(payload, { idempotencyKey: '<kind>/<orderId>' })`; logs `email_sent.{kind}` (with resendId) on success or `email_send_failed` on error; **never throws**.
- Wired dispatch into `orders/server.ts`: `submitCheckout` sends the confirmation **after** the transaction commits; `transitionOrderStatus` sends shipped/cancelled/refunded **after** its transaction commits (refactored from `return await db.transaction(...)` to capture the result, dispatch, then return). Added `getOrderById` helper.
- Extended `env.ts` (preserving the Phase 10 Supabase vars) and `.env.example` with the three Resend keys, all optional.

## Key invariants (grep-verified, not eyeballed)
- Email send lives **outside** the `db.transaction(...)` closure — an awk scan of the txn block finds zero `sendOrderConfirmed` references inside it.
- `idempotencyKey:` appears 5× in send.ts; `as any` appears 0×.
- Email failures log to `order_events` and never change the order's success/return value.

## Verification
- `npx tsc --noEmit` → exit 0.
- `npx next build` → **compiled successfully, type validity + lint passed** (only a pre-existing unused-var warning in `OrderDetailView.tsx`). Build then stops at `/sitemap.xml` prerender because that route runs a live product DB query and no database is reachable in this environment (`ENOTFOUND postgres.gkca...`) — an environmental limit, unrelated to this plan.
- `npm test` → 82 passed, 12 failed — **identical to the pre-change baseline** (verified via stash). All 12 failures are integration/auth/RLS suites that require a live Postgres/Supabase connection (same `ENOTFOUND` / `fetch failed` at fixture setup). No new failures introduced.
- All plan acceptance grep gates pass.

## Outstanding (manual, deferred to the user — Task 2 checkpoint)
- **No `RESEND_API_KEY` is set**, so emails currently no-op by design. To enable real sends: add `RESEND_API_KEY` (+ `RESEND_FROM_EMAIL`, `ORKI_BASE_URL`) to `.env.local`, restart dev, and complete a checkout to see an `email_sent.confirmation` row + a Resend dashboard entry.
- **Production:** verify a sending domain in Resend and set `RESEND_FROM_EMAIL` to e.g. `orders@orki.sa`; add the three vars to Vercel env.
- **Live UAT** of actual delivery (the plan's manual verification) remains unrun pending the key.

## Deviations from plan
- `env.ts` already carried Phase 10 Supabase vars the plan predated — extended the object + transform rather than replacing them.
- `transitionOrderStatus` returned the transaction result directly; refactored to `let result` + post-commit dispatch + `return result` so the email send is provably outside the txn.
- Cancelled/Refunded templates gained optional `reason` / `totalFormatted` props (refunded is passed the formatted total); senders call components as functions (valid in a `.ts` dispatcher).
