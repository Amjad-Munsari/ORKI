import 'server-only';
import type { ReactElement } from 'react';
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

/**
 * Idempotency guard at the persistence layer: if we already logged a
 * successful send of this kind for this order, never call Resend again.
 * Belt-and-braces with the Resend `idempotencyKey` (which dedupes within
 * Resend's 24h window) — this also dedupes across longer gaps / re-runs.
 */
async function alreadySent(orderId: string, kind: SendKind): Promise<boolean> {
  const existing = await db.query.orderEvents.findFirst({
    where: and(
      eq(orderEvents.orderId, orderId),
      eq(orderEvents.type, `email_sent.${kind}`),
    ),
  });
  return Boolean(existing);
}

async function logSendFailed(orderId: string, kind: SendKind, error: string) {
  try {
    await db.insert(orderEvents).values({
      orderId,
      type: 'email_send_failed',
      metadata: { kind, error },
    });
  } catch (e) {
    console.error('[email/send] failed to log email_send_failed', e);
  }
}

async function logSendOk(orderId: string, kind: SendKind, resendId?: string) {
  try {
    await db.insert(orderEvents).values({
      orderId,
      type: `email_sent.${kind}`,
      metadata: { resendId },
    });
  } catch (e) {
    console.error('[email/send] failed to log email_sent', e);
  }
}

function customerName(order: Order): string {
  return (
    `${order.shipping.firstName} ${order.shipping.lastName}`.trim() || 'Customer'
  );
}

function lineItems(order: Order) {
  return order.items.map((i) => ({
    name: order.locale === 'ar' ? i.productName.ar : i.productName.en,
    qty: i.quantity,
    lineTotal: formatSAR(i.unitPriceCents * i.quantity, order.locale),
  }));
}

async function sendImpl(
  orderId: string,
  kind: SendKind,
  params: { to: string; subject: string; react: ReactElement },
): Promise<SendResult> {
  if (!resend) {
    console.warn(
      `[email/send] RESEND_API_KEY missing — skipping ${kind} email for order ${orderId}`,
    );
    return { ok: false, code: 'NO_API_KEY' };
  }
  try {
    // PINNED Resend 6.12.x SDK form: the second positional argument carries
    // request options. `idempotencyKey` is canonical per the resend@6.x types
    // (CreateEmailRequestOptions extends IdempotentRequest). Pattern: `<kind>/<id>`.
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

/** Sends the confirmation email. Pins idempotencyKey: 'confirmation/<orderId>'. */
export async function sendOrderConfirmed(order: Order): Promise<SendResult> {
  if (await alreadySent(order.id, 'confirmation'))
    return { ok: true, alreadySent: true };
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

/** Sends the shipped email. Pins idempotencyKey: 'shipped/<orderId>'. */
export async function sendOrderShipped(order: Order): Promise<SendResult> {
  if (await alreadySent(order.id, 'shipped'))
    return { ok: true, alreadySent: true };
  return sendImpl(order.id, 'shipped', {
    to: order.email,
    subject: SUBJECT[order.locale].shipped,
    react: OrderShippedEmail({
      locale: order.locale,
      reference: order.reference,
      customerName: customerName(order),
      trackingNumber: order.trackingNumber,
    }),
  });
}

/** Sends the cancelled email. Pins idempotencyKey: 'cancelled/<orderId>'. */
export async function sendOrderCancelled(order: Order): Promise<SendResult> {
  if (await alreadySent(order.id, 'cancelled'))
    return { ok: true, alreadySent: true };
  return sendImpl(order.id, 'cancelled', {
    to: order.email,
    subject: SUBJECT[order.locale].cancelled,
    react: OrderCancelledEmail({
      locale: order.locale,
      reference: order.reference,
      customerName: customerName(order),
    }),
  });
}

/** Sends the refunded email. Pins idempotencyKey: 'refunded/<orderId>'. */
export async function sendOrderRefunded(order: Order): Promise<SendResult> {
  if (await alreadySent(order.id, 'refunded'))
    return { ok: true, alreadySent: true };
  return sendImpl(order.id, 'refunded', {
    to: order.email,
    subject: SUBJECT[order.locale].refunded,
    react: OrderRefundedEmail({
      locale: order.locale,
      reference: order.reference,
      customerName: customerName(order),
      totalFormatted: formatSAR(order.totalCents, order.locale),
    }),
  });
}
