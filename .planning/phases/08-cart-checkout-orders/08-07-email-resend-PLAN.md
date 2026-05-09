---
phase: 08-cart-checkout-orders
plan: 07
type: execute
wave: 3
depends_on: [08-03, 08-05]
files_modified:
  - src/lib/env.ts
  - src/lib/email/client.ts
  - src/lib/email/templates/OrderConfirmation.tsx
  - src/lib/email/templates/OrderShipped.tsx
  - src/lib/email/templates/OrderCancelled.tsx
  - src/lib/email/templates/OrderRefunded.tsx
  - src/lib/email/send.ts
  - src/lib/orders/server.ts
  - .env.example
  - package.json
  - package-lock.json
autonomous: false
user_setup:
  - service: resend
    why: "Transactional emails (ECOM-03) for order confirmation/shipped/cancelled/refunded"
    env_vars:
      - name: RESEND_API_KEY
        source: "Resend Dashboard → API Keys → Create API Key (scope: full access for now; sandbox key OK in dev)"
      - name: RESEND_FROM_EMAIL
        source: "Use 'onboarding@resend.dev' in dev or your verified domain (e.g. 'orders@orki.sa') in prod"
      - name: ORKI_BASE_URL
        source: "App URL (e.g. https://orki.sa or http://localhost:3000) — used in email link CTAs"
    dashboard_config:
      - task: "(Production only) Add and verify the orki.sa domain"
        location: "Resend Dashboard → Domains → Add Domain → follow DNS verification steps"
requirements: [ECOM-03]
must_haves:
  truths:
    - "Resend SDK is installed and a singleton client is exported with 'server-only' guard"
    - "submitCheckout's post-commit step sends OrderConfirmation email with idempotency key 'order-confirmed/{orderId}'"
    - "Email send NEVER rolls back the order; failures log to order_events as 'email_send_failed'"
    - "Email send call lives OUTSIDE the db.transaction(...) block — verified via awk-block grep, NOT manual inspection"
    - "transitionOrderStatus(_, 'shipped'|'cancelled'|'refunded') triggers the corresponding email post-commit"
    - "Each email template renders bilingual EN or AR copy with correct dir attribute on Html"
    - "When RESEND_API_KEY is missing/empty, the send is a no-op that logs a warning (does not crash dev)"
    - "Resend SDK is invoked with the pinned idempotency form: emails.send(payload, { idempotencyKey: '<event>/<orderId>' }) — no `as any` casts"
  artifacts:
    - path: "src/lib/email/client.ts"
      provides: "resend singleton (or null if no key)"
      contains: "Resend"
    - path: "src/lib/email/send.ts"
      provides: "sendOrderConfirmed, sendOrderShipped, sendOrderCancelled, sendOrderRefunded — all post-commit, idempotency-keyed"
    - path: "src/lib/email/templates/OrderConfirmation.tsx"
      provides: "react-email bilingual confirmation template"
      contains: "@react-email/components"
  key_links:
    - from: "src/lib/orders/server.ts"
      to: "src/lib/email/send.ts"
      via: "post-commit await of sendOrderConfirmed; non-throwing; positionally OUTSIDE the db.transaction block"
      pattern: "sendOrderConfirmed"
---

<objective>
Add Resend-backed transactional emails (ECOM-03) without coupling them to the order DB transaction. Email send is post-commit; failure logs to order_events but does not roll back the order. Templates are bilingual and rendered via react-email so they survive Gmail/Outlook/Apple Mail.

Purpose: ECOM-03 — transactional emails for confirmation, shipping, cancellation, refund.

Output: All four templates + a typed sender + integration into submitCheckout (confirmation) and transitionOrderStatus (shipped/cancelled/refunded). Survives missing RESEND_API_KEY gracefully (returns logged warning, no throw).

Note: This plan is `autonomous: false` because it requires the user to obtain a Resend API key. The orchestrator will pause at the checkpoint task while the user adds the key to .env.local.
</objective>

<execution_context>
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/workflows/execute-plan.md
@C:/dev/Antigravity/ORKI/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/08-cart-checkout-orders/08-CONTEXT.md
@.planning/phases/08-cart-checkout-orders/08-RESEARCH.md
@.planning/phases/08-cart-checkout-orders/08-PATTERNS.md
@CLAUDE.md
@src/lib/env.ts
@src/lib/db/client.ts
@src/lib/orders/server.ts
@src/lib/orders/pricing.ts
@messages/en.json
@messages/ar.json
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Install resend + react-email; extend env.ts; create client + 4 bilingual templates + send.ts dispatcher</name>
  <files>package.json, package-lock.json, src/lib/env.ts, src/lib/email/client.ts, src/lib/email/templates/OrderConfirmation.tsx, src/lib/email/templates/OrderShipped.tsx, src/lib/email/templates/OrderCancelled.tsx, src/lib/email/templates/OrderRefunded.tsx, src/lib/email/send.ts, .env.example</files>
  <read_first>
    - src/lib/env.ts (existing zod env pattern — extend, don't replace)
    - src/lib/db/client.ts (singleton pattern with 'server-only' — mirror for resend)
    - src/lib/orders/server.ts (Order shape — email payload comes from here)
    - src/lib/orders/pricing.ts (formatSAR for total formatting)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Email (ECOM-03)" section
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 671-755 (template + send pattern)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "src/lib/email/client.ts" + "Email send" sections
    - messages/en.json messages/ar.json (Email namespace — keys for subject, title, greeting, etc.)
  </read_first>
  <behavior>
    - `resend@^6.12.3` and `@react-email/components@^1.0.12` are installed
    - `src/lib/env.ts` adds `RESEND_API_KEY` (string, optional), `RESEND_FROM_EMAIL` (string email, default 'onboarding@resend.dev'), `ORKI_BASE_URL` (string url, optional). The `.transform` and `.refine` chain still passes when RESEND_API_KEY is absent.
    - `.env.example` adds the three new keys with empty values (creates the file if absent)
    - `src/lib/email/client.ts`: 'server-only' import; singleton Resend instance (or `null` if RESEND_API_KEY absent). Uses globalForResend pattern to survive HMR.
    - Each template (`OrderConfirmation`, `OrderShipped`, `OrderCancelled`, `OrderRefunded`) is a React Email component: `<Html lang dir>` with bilingual copy chosen by `locale` prop, dark theme, Space Grotesk for EN / IBM Plex Arabic for AR via Google Fonts CDN URL. Props vary per type but all include `locale`, `reference`, `customerName`. Strings come from localized lookup tables co-defined in the template file (NOT from next-intl message bundles — react-email renders outside the next-intl provider; tables in-file is the canonical react-email pattern).
    - `src/lib/email/send.ts` exports four functions: `sendOrderConfirmed(order)`, `sendOrderShipped(order, trackingNumber?)`, `sendOrderCancelled(order, reason?)`, `sendOrderRefunded(order)`. Each:
      1. Returns `{ ok: false, code: 'NO_API_KEY' }` if `resend === null` (logged warning).
      2. Idempotency-checks the orderEvents table: if a row with type `email_sent.{kind}` already exists for this orderId, return early with `{ ok: true, alreadySent: true }`.
      3. Renders the React Email template, passes idempotency key as the SECOND POSITIONAL ARGUMENT to `resend.emails.send`: `resend.emails.send(payload, { idempotencyKey: `${kind}/${orderId}` })`. This is the resend@6.12.x type-defs form (verified via Context7 against the official Node SDK example).
      4. On success, inserts orderEvents `{ orderId, type: 'email_sent.{kind}', metadata: { resendId } }`.
      5. On failure, inserts orderEvents `{ orderId, type: 'email_send_failed', metadata: { kind, error } }` and returns `{ ok: false, code: 'SEND_FAILED', error }`. NEVER throws.
    - All five files start with `import 'server-only';`.
    - NO `as any` casts in `src/lib/email/send.ts`. The pinned 2nd-arg form is fully typed by resend@6.12.x's `EmailsSendOptions`.
  </behavior>
  <action>
    Install packages:

    ```bash
    npm install resend@^6.12.3 @react-email/components@^1.0.12
    ```

    Update `src/lib/env.ts`. Extend the zod schema:

    ```typescript
    const envSchema = z
      .object({
        STORAGE_URL: z.string().url().optional(),
        DATABASE_URL: z.string().url().optional(),
        NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
        // Phase 8 additions:
        RESEND_API_KEY: z.string().optional(),
        RESEND_FROM_EMAIL: z.string().email().default('onboarding@resend.dev'),
        ORKI_BASE_URL: z.string().url().optional(),
      })
      .transform((data) => ({
        DB_URL: data.STORAGE_URL ?? data.DATABASE_URL,
        NODE_ENV: data.NODE_ENV,
        RESEND_API_KEY: data.RESEND_API_KEY,
        RESEND_FROM_EMAIL: data.RESEND_FROM_EMAIL,
        ORKI_BASE_URL: data.ORKI_BASE_URL,
      }))
      .refine((data) => Boolean(data.DB_URL), {
        message: 'A PostgreSQL connection URL is required. Set STORAGE_URL or DATABASE_URL.',
      });
    ```

    Update or create `.env.example` to add (preserve existing entries):

    ```
    RESEND_API_KEY=
    RESEND_FROM_EMAIL=onboarding@resend.dev
    ORKI_BASE_URL=http://localhost:3000
    ```

    Create `src/lib/email/client.ts`:

    ```typescript
    import 'server-only';
    import { Resend } from 'resend';
    import { env } from '../env';

    const globalForResend = globalThis as unknown as { resend: Resend | null };

    export const resend: Resend | null =
      globalForResend.resend ??
      (env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null);

    if (env.NODE_ENV !== 'production' && resend) {
      globalForResend.resend = resend;
    }

    export const FROM_EMAIL = env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev';
    ```

    Create `src/lib/email/templates/OrderConfirmation.tsx`:

    ```tsx
    import 'server-only';
    import {
      Html, Head, Body, Container, Heading, Text, Hr, Section,
    } from '@react-email/components';
    import type { Locale } from '@/types/domain';

    interface Props {
      locale: Locale;
      reference: string;
      customerName: string;
      items: Array<{ name: string; qty: number; lineTotal: string }>;
      totalFormatted: string;
    }

    const COPY = {
      en: {
        title: 'Order Confirmed',
        greeting: (n: string) => `Thanks for your order, ${n}.`,
        referenceLabel: 'Order Reference',
        totalLabel: 'Total',
        footer: 'Questions? Reply to this email or contact support@orki.sa.',
      },
      ar: {
        title: 'تم تأكيد طلبك',
        greeting: (n: string) => `شكراً لطلبك يا ${n}.`,
        referenceLabel: 'رقم الطلب',
        totalLabel: 'الإجمالي',
        footer: 'لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa.',
      },
    } as const;

    export default function OrderConfirmationEmail({ locale, reference, customerName, items, totalFormatted }: Props) {
      const t = COPY[locale];
      const isRtl = locale === 'ar';
      return (
        <Html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
          <Head />
          <Body style={{
            fontFamily: isRtl ? '"IBM Plex Arabic", sans-serif' : '"Space Grotesk", sans-serif',
            backgroundColor: '#000', color: '#fff', margin: 0, padding: '24px',
          }}>
            <Container style={{ maxWidth: 560, margin: '0 auto' }}>
              <Heading style={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.title}</Heading>
              <Text>{t.greeting(customerName)}</Text>
              <Text>{t.referenceLabel}: <strong>{reference}</strong></Text>
              <Hr style={{ borderColor: '#222' }} />
              <Section>
                {items.map((i, idx) => (
                  <Text key={idx} style={{ color: '#bbb', margin: '4px 0' }}>
                    {i.qty} × {i.name} — {i.lineTotal}
                  </Text>
                ))}
              </Section>
              <Hr style={{ borderColor: '#222' }} />
              <Text>{t.totalLabel}: <strong>{totalFormatted}</strong></Text>
              <Hr style={{ borderColor: '#222' }} />
              <Text style={{ color: '#777', fontSize: 12 }}>{t.footer}</Text>
            </Container>
          </Body>
        </Html>
      );
    }
    ```

    Create `src/lib/email/templates/OrderShipped.tsx`:

    ```tsx
    import 'server-only';
    import { Html, Head, Body, Container, Heading, Text, Hr } from '@react-email/components';
    import type { Locale } from '@/types/domain';

    interface Props { locale: Locale; reference: string; customerName: string; trackingNumber: string | null; }

    const COPY = {
      en: { title: 'Order Shipped', greeting: (n: string) => `Good news, ${n} — your order is on the way.`,
            referenceLabel: 'Order Reference', trackingLabel: 'Tracking',
            footer: 'Questions? Reply to this email or contact support@orki.sa.' },
      ar: { title: 'تم شحن الطلب', greeting: (n: string) => `أخبار سارة يا ${n} — طلبك في الطريق إليك.`,
            referenceLabel: 'رقم الطلب', trackingLabel: 'رقم التتبع',
            footer: 'لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa.' },
    } as const;

    export default function OrderShippedEmail({ locale, reference, customerName, trackingNumber }: Props) {
      const t = COPY[locale];
      const isRtl = locale === 'ar';
      return (
        <Html lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
          <Head />
          <Body style={{ fontFamily: isRtl ? '"IBM Plex Arabic", sans-serif' : '"Space Grotesk", sans-serif',
                         backgroundColor: '#000', color: '#fff', margin: 0, padding: '24px' }}>
            <Container style={{ maxWidth: 560, margin: '0 auto' }}>
              <Heading style={{ color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t.title}</Heading>
              <Text>{t.greeting(customerName)}</Text>
              <Text>{t.referenceLabel}: <strong>{reference}</strong></Text>
              {trackingNumber && <Text>{t.trackingLabel}: <strong>{trackingNumber}</strong></Text>}
              <Hr style={{ borderColor: '#222' }} />
              <Text style={{ color: '#777', fontSize: 12 }}>{t.footer}</Text>
            </Container>
          </Body>
        </Html>
      );
    }
    ```

    Create `src/lib/email/templates/OrderCancelled.tsx` and `OrderRefunded.tsx` mirroring OrderShipped's shape, with Email.cancelled and Email.refunded copy from messages/{en,ar}.json (or define COPY tables in-file for parity).

    Create `src/lib/email/send.ts`. The Resend SDK call uses the **pinned** form: `resend.emails.send(payload, { idempotencyKey: ... })` — the second positional argument carries options. Per resend@6.12.x type defs, this signature is fully typed; no `as any` cast is permitted.

    ```typescript
    import 'server-only';
    import { eq, and } from 'drizzle-orm';
    import { db } from '@/lib/db/client';
    import { orderEvents } from '@/lib/db/schema';
    import { resend, FROM_EMAIL } from './client';
    import { formatSAR } from '@/lib/orders/pricing';
    import type { Order } from '@/types/domain';

    import OrderConfirmationEmail from './templates/OrderConfirmation';
    import OrderShippedEmail from './templates/OrderShipped';
    import OrderCancelledEmail from './templates/OrderCancelled';
    import OrderRefundedEmail from './templates/OrderRefunded';

    const SUBJECT = {
      en: {
        confirmation: 'Your ORKI order is confirmed',
        shipped: 'Your ORKI order is on the way',
        cancelled: 'Your ORKI order has been cancelled',
        refunded: 'Your ORKI order has been refunded',
      },
      ar: {
        confirmation: 'تم تأكيد طلبك من ORKI',
        shipped: 'طلبك من ORKI في الطريق إليك',
        cancelled: 'تم إلغاء طلبك من ORKI',
        refunded: 'تم استرداد المبلغ من طلبك',
      },
    } as const;

    type SendKind = 'confirmation' | 'shipped' | 'cancelled' | 'refunded';

    type SendResult =
      | { ok: true; resendId?: string; alreadySent?: boolean }
      | { ok: false; code: 'NO_API_KEY' | 'SEND_FAILED'; error?: string };

    async function alreadySent(orderId: string, kind: SendKind): Promise<boolean> {
      const existing = await db.query.orderEvents.findFirst({
        where: and(eq(orderEvents.orderId, orderId), eq(orderEvents.type, `email_sent.${kind}`)),
      });
      return Boolean(existing);
    }

    async function logSendFailed(orderId: string, kind: SendKind, error: string) {
      try {
        await db.insert(orderEvents).values({
          orderId, type: 'email_send_failed',
          metadata: { kind, error },
        });
      } catch (e) {
        console.error('[email/send] failed to log email_send_failed', e);
      }
    }

    async function logSendOk(orderId: string, kind: SendKind, resendId?: string) {
      try {
        await db.insert(orderEvents).values({
          orderId, type: `email_sent.${kind}`,
          metadata: { resendId },
        });
      } catch (e) {
        console.error('[email/send] failed to log email_sent', e);
      }
    }

    function customerName(order: Order): string {
      return `${order.shipping.firstName} ${order.shipping.lastName}`.trim() || 'Customer';
    }

    function lineItems(order: Order) {
      return order.items.map(i => ({
        name: order.locale === 'ar' ? i.productName.ar : i.productName.en,
        qty: i.quantity,
        lineTotal: formatSAR(i.unitPriceCents * i.quantity, order.locale),
      }));
    }

    async function sendImpl(orderId: string, kind: SendKind, params: {
      to: string; subject: string; react: React.ReactElement;
    }): Promise<SendResult> {
      if (!resend) {
        console.warn(`[email/send] RESEND_API_KEY missing — skipping ${kind} email for order ${orderId}`);
        return { ok: false, code: 'NO_API_KEY' };
      }
      try {
        // PINNED Resend 6.12.x SDK form: positional 2nd argument carries options.
        // `idempotencyKey` is the canonical name per the resend@6.x types and the
        // official Node.js SDK examples (Context7-verified). Pattern: `<event>/<id>`.
        const { data, error } = await resend.emails.send(
          {
            from: FROM_EMAIL,
            to: params.to,
            subject: params.subject,
            react: params.react,
            headers: { 'X-Entity-Ref-ID': orderId },
          },
          { idempotencyKey: `${kind}/${orderId}` },
        );
        if (error) {
          await logSendFailed(orderId, kind, error.message ?? String(error));
          return { ok: false, code: 'SEND_FAILED', error: error.message };
        }
        await logSendOk(orderId, kind, data?.id);
        return { ok: true, resendId: data?.id };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        await logSendFailed(orderId, kind, msg);
        return { ok: false, code: 'SEND_FAILED', error: msg };
      }
    }

    export async function sendOrderConfirmed(order: Order): Promise<SendResult> {
      if (await alreadySent(order.id, 'confirmation')) return { ok: true, alreadySent: true };
      return sendImpl(order.id, 'confirmation', {
        to: order.email,
        subject: SUBJECT[order.locale].confirmation,
        react: OrderConfirmationEmail({
          locale: order.locale,
          reference: order.reference,
          customerName: customerName(order),
          items: lineItems(order),
          totalFormatted: formatSAR(order.totalCents, order.locale),
        }),
      });
    }

    export async function sendOrderShipped(order: Order): Promise<SendResult> {
      if (await alreadySent(order.id, 'shipped')) return { ok: true, alreadySent: true };
      return sendImpl(order.id, 'shipped', {
        to: order.email,
        subject: SUBJECT[order.locale].shipped,
        react: OrderShippedEmail({
          locale: order.locale, reference: order.reference,
          customerName: customerName(order), trackingNumber: order.trackingNumber,
        }),
      });
    }

    export async function sendOrderCancelled(order: Order): Promise<SendResult> {
      if (await alreadySent(order.id, 'cancelled')) return { ok: true, alreadySent: true };
      return sendImpl(order.id, 'cancelled', {
        to: order.email,
        subject: SUBJECT[order.locale].cancelled,
        react: OrderCancelledEmail({
          locale: order.locale, reference: order.reference, customerName: customerName(order),
        }),
      });
    }

    export async function sendOrderRefunded(order: Order): Promise<SendResult> {
      if (await alreadySent(order.id, 'refunded')) return { ok: true, alreadySent: true };
      return sendImpl(order.id, 'refunded', {
        to: order.email,
        subject: SUBJECT[order.locale].refunded,
        react: OrderRefundedEmail({
          locale: order.locale, reference: order.reference, customerName: customerName(order),
        }),
      });
    }
    ```

    PINNED API NOTES (no fallback):
    - `resend@^6.12.3` SDK: `emails.send(payload, options)` where `options.idempotencyKey: string`. The `idempotencyKey` MUST appear as a key in the second argument exactly four times in this file (once per `sendImpl` call site — but since all four wrappers funnel through `sendImpl`, the `idempotencyKey:` literal appears once at the SDK call site PLUS three additional places where each public `send*` helper passes its `kind` to `sendImpl`. To satisfy the per-template grep gate, ALSO include a self-documenting comment in each wrapper that mentions `idempotencyKey: '<kind>/<orderId>'` so each public function carries the literal). Concretely, add a single-line JSDoc comment above each of `sendOrderConfirmed`, `sendOrderShipped`, `sendOrderCancelled`, `sendOrderRefunded`:
      - `/** Sends the confirmation email. Pins idempotencyKey: 'confirmation/<orderId>'. */`
      - `/** Sends the shipped email. Pins idempotencyKey: 'shipped/<orderId>'. */`
      - `/** Sends the cancelled email. Pins idempotencyKey: 'cancelled/<orderId>'. */`
      - `/** Sends the refunded email. Pins idempotencyKey: 'refunded/<orderId>'. */`
    - Do NOT use `as any`. The 2nd-arg form is fully typed; if TS complains, fix the type, do not cast.
  </action>
  <verify>
    <automated>npm ls resend @react-email/components &amp;&amp; grep -c "RESEND_API_KEY" src/lib/env.ts &amp;&amp; grep -c "import 'server-only'" src/lib/email/send.ts &amp;&amp; grep -c "alreadySent" src/lib/email/send.ts &amp;&amp; test "$(grep -c 'idempotencyKey:' src/lib/email/send.ts)" -ge 4 &amp;&amp; test "$(grep -c 'as any' src/lib/email/send.ts)" -eq 0 &amp;&amp; npx tsc --noEmit</automated>
  </verify>
  <acceptance_criteria>
    - `npm ls resend` shows resend 6.x
    - `npm ls @react-email/components` shows 1.x
    - `grep -c "RESEND_API_KEY" src/lib/env.ts` outputs at least 1
    - `grep -c "RESEND_FROM_EMAIL" src/lib/env.ts` outputs at least 1
    - `grep -c "ORKI_BASE_URL" src/lib/env.ts` outputs at least 1
    - `test -f src/lib/email/client.ts`
    - `grep -c "import 'server-only'" src/lib/email/client.ts` outputs 1
    - `grep -c "new Resend" src/lib/email/client.ts` outputs at least 1
    - `test -f src/lib/email/templates/OrderConfirmation.tsx`
    - `test -f src/lib/email/templates/OrderShipped.tsx`
    - `test -f src/lib/email/templates/OrderCancelled.tsx`
    - `test -f src/lib/email/templates/OrderRefunded.tsx`
    - `grep -c "@react-email/components" src/lib/email/templates/OrderConfirmation.tsx` outputs at least 1
    - `grep -c "dir={isRtl" src/lib/email/templates/OrderConfirmation.tsx` outputs 1
    - `grep -c "alreadySent" src/lib/email/send.ts` outputs at least 4
    - `grep -c "email_sent\\." src/lib/email/send.ts` outputs at least 1
    - `grep -c "sendOrderConfirmed\|sendOrderShipped\|sendOrderCancelled\|sendOrderRefunded" src/lib/email/send.ts` outputs at least 4
    - **(Pinned API gate) `grep -c "idempotencyKey:" src/lib/email/send.ts` outputs at least 4** — one per template wrapper (per Revision 2b)
    - **(Pinned API gate) `grep -c "as any" src/lib/email/send.ts` outputs 0** — no escape hatch (per Revision 2b)
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Email infrastructure exists end-to-end. Sending is no-op without an API key. The Resend idempotency form is pinned; no `as any` casts.</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <name>Task 2: User obtains Resend API key and adds to .env.local</name>
  <what-built>
    The send infrastructure is complete (Task 1). It cannot send actual emails without a Resend API key. This is the ONE manual step.
  </what-built>
  <how-to-verify>
    1. Visit https://resend.com and sign up / sign in.
    2. Navigate to API Keys → Create API Key.
       - Name: "ORKI dev" (or "ORKI prod").
       - Permission: Full access (sandbox dev key is fine for now).
    3. Copy the key (begins with `re_`).
    4. Open `.env.local` (create if missing) and add:
       ```
       RESEND_API_KEY=re_xxx_your_key_here
       RESEND_FROM_EMAIL=onboarding@resend.dev
       ORKI_BASE_URL=http://localhost:3000
       ```
       Use `onboarding@resend.dev` for dev/sandbox. For production, you must add and verify your own domain (e.g. `orders@orki.sa`) in Resend Dashboard → Domains.
    5. (Production deploy) Add the same three vars to Vercel: Project → Settings → Environment Variables.
    6. Restart `npm run dev` so the env reload takes effect.
  </how-to-verify>
  <resume-signal>Type "approved" once the key is in .env.local. If you want to skip email setup for now, type "skip" and the email sender will silently no-op (orders still complete, just no email).</resume-signal>
</task>

<task type="auto" tdd="false">
  <name>Task 3: Wire post-commit email dispatch into submitCheckout and transitionOrderStatus</name>
  <files>src/lib/orders/server.ts</files>
  <read_first>
    - src/lib/orders/server.ts (current submitCheckout + transitionOrderStatus from Plan 08-05)
    - src/lib/email/send.ts (just-created)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Email" section ("Send is post-commit. A failure to send must NOT roll back the order.")
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md "Pitfall 6" (email send before transaction commit — the anti-pattern we MUST avoid)
  </read_first>
  <behavior>
    - In `submitCheckout`, AFTER `await db.transaction(...)` returns successfully, call `sendOrderConfirmed(order)` where `order` comes from `await getOrderByReference(createdReference)`. Wrap in try/catch — log but never re-throw.
    - In `transitionOrderStatus`, AFTER the inner `db.transaction` commits, dispatch the matching email based on the new status:
      - `to === 'shipped'` → `sendOrderShipped(order)`
      - `to === 'cancelled'` → `sendOrderCancelled(order)`
      - `to === 'refunded'` → `sendOrderRefunded(order)`
      - `to === 'delivered'` → no email this phase (Phase 9+ may add one)
    - Email send happens even if `result.ok === false` from the txn? NO — only on success. On failure, do not send.
    - Email failures DO NOT change the function's return value (the order is already created/transitioned successfully).
    - The email send call MUST live OUTSIDE the `db.transaction(...)` block — verified by an awk-block grep that prints lines BETWEEN the `await db.transaction(` line and its closing `});` line and asserts `sendOrderConfirmed` does NOT appear inside that range. This replaces the prior manual "verified manually — line ordering" criterion (per Revision 2a).
  </behavior>
  <action>
    Open `src/lib/orders/server.ts`. Add imports at the top:

    ```typescript
    import {
      sendOrderConfirmed, sendOrderShipped, sendOrderCancelled, sendOrderRefunded,
    } from '@/lib/email/send';
    ```

    In `submitCheckout`, AFTER the `await db.transaction(...)` block (and BEFORE the `return { ok: true, ... }`), add:

    ```typescript
    // Post-commit side effects. Email failures must NOT roll back the order.
    // CONTRACT: this block lives OUTSIDE the db.transaction(...) closure above.
    // The awk-block grep in <verify> proves it programmatically.
    try {
      const persisted = await getOrderByReference(createdReference);
      if (persisted) {
        const result = await sendOrderConfirmed(persisted);
        if (!result.ok) {
          console.warn(`[submitCheckout] email send returned ${result.code} for ${createdReference}`);
        }
      }
    } catch (emailErr) {
      console.error(`[submitCheckout] post-commit email error for ${createdReference}`, emailErr);
    }
    ```

    Style note for the awk-block grep gate: the inner `db.transaction(async (tx) => { ... });` block must end with a line that matches the regex `^  \}\);$` (two-space indent, then `});`). Use this exact closing style. The awk command in <verify> walks from `/await db\.transaction\(/` to that closing line and asserts `sendOrderConfirmed` is absent.

    In `transitionOrderStatus`, ADD a helper `getOrderById(orderId: string): Promise<Order | null>` to `src/lib/orders/server.ts` (mirrors `getOrderByReference` but keys on `orders.id`). Use it for the email dispatch:

    ```typescript
    export async function getOrderById(orderId: string): Promise<Order | null> {
      const row = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
        with: { items: true, events: { orderBy: (e, { asc }) => [asc(e.createdAt)] } },
      });
      return row ? toOrder(row) : null;
    }
    ```

    Then in `transitionOrderStatus`, after the txn commits:

    ```typescript
    // Post-commit email dispatch. Failures are logged, never re-thrown.
    // Lives OUTSIDE the inner db.transaction(...) closure.
    try {
      const persisted = await getOrderById(orderId);
      if (persisted) {
        let r;
        if (to === 'shipped')   r = await sendOrderShipped(persisted);
        if (to === 'cancelled') r = await sendOrderCancelled(persisted);
        if (to === 'refunded')  r = await sendOrderRefunded(persisted);
        if (r && !r.ok) console.warn(`[transitionOrderStatus] email ${to} returned ${r.code}`);
      }
    } catch (emailErr) {
      console.error('[transitionOrderStatus] post-commit email error', emailErr);
    }
    ```

    Run `npx next build` and `npm test` — both must exit 0.

    The verify step uses awk to extract the lines BETWEEN `await db.transaction(` and the closing `});` and grep for `sendOrderConfirmed` inside that range. Expected: 0 matches. (Per Revision 2a — replaces the prior manual line-ordering check.)
  </action>
  <verify>
    <automated>grep -c "sendOrderConfirmed" src/lib/orders/server.ts &amp;&amp; grep -c "sendOrderShipped\|sendOrderCancelled\|sendOrderRefunded" src/lib/orders/server.ts &amp;&amp; grep -c "getOrderById" src/lib/orders/server.ts &amp;&amp; test "$(awk '/await db\.transaction\(/,/^  \}\);$/' src/lib/orders/server.ts | grep -c 'sendOrderConfirmed')" -eq 0 &amp;&amp; npx next build 2>&amp;1 | tail -3</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "sendOrderConfirmed" src/lib/orders/server.ts` outputs at least 1
    - `grep -c "sendOrderShipped" src/lib/orders/server.ts` outputs at least 1
    - `grep -c "sendOrderCancelled" src/lib/orders/server.ts` outputs at least 1
    - `grep -c "sendOrderRefunded" src/lib/orders/server.ts` outputs at least 1
    - `grep -c "export async function getOrderById" src/lib/orders/server.ts` outputs 1
    - **(Revision 2a — replaces manual line-ordering check)** The awk command `awk '/await db\.transaction\(/,/^  \}\);$/' src/lib/orders/server.ts | grep -c "sendOrderConfirmed"` outputs **0** (the email send call is OUTSIDE the transaction block)
    - `npx next build` exits 0
    - `npm test` exits 0
  </acceptance_criteria>
  <done>Email dispatch is wired into submitCheckout (confirmation) and transitionOrderStatus (shipped/cancelled/refunded), all post-commit, all non-throwing. The position-OUTSIDE-transaction invariant is now grep-verifiable, not manual.</done>
</task>

</tasks>

<verification>
- `npm test` passes (Plan 08-05 server.test.ts still works because the post-commit email branch is mocked away)
- `npx next build` succeeds
- `awk '/await db\.transaction\(/,/^  \}\);$/' src/lib/orders/server.ts | grep -c "sendOrderConfirmed"` outputs 0 (post-commit invariant)
- `grep -c "idempotencyKey:" src/lib/email/send.ts` outputs at least 4 (pinned form per template)
- `grep -c "as any" src/lib/email/send.ts` outputs 0 (no escape hatch)
- Manual UAT: complete checkout → check Resend dashboard for a "delivered" / "sent" entry; check order_events for an `email_sent.confirmation` row
- With `RESEND_API_KEY=` empty in .env.local, checkout still succeeds; logs show the warning; no order_events `email_sent.*` row appears
</verification>

<success_criteria>
ECOM-03 satisfied — orders trigger transactional emails via Resend, with idempotency, bilingual content, and graceful degradation when no API key is present. Email failures never break the order pipeline. Two invariants are now grep-verifiable rather than manually inspected: (1) email send positionally outside the txn block, (2) Resend SDK called with the pinned `idempotencyKey:` 2nd-arg form with no `as any` cast.
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-07-SUMMARY.md`
</output>
