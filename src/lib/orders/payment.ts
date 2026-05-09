import 'server-only';

/**
 * Payment simulator (Phase 8 — no real PSP yet).
 *
 * Deterministic by phone-number tail so tests + dev flows can reproduce both
 * success and failure paths without flakiness:
 *   tail "911" → CARD_DECLINED
 *   tail "000" → NETWORK_ERROR
 *   anything else → success
 *
 * Replace with real Moyasar/Mada/STC Pay integration in a future milestone.
 */

export type PaymentFailureCode = 'CARD_DECLINED' | 'NETWORK_ERROR';

export type PaymentResult =
  | { success: true }
  | { success: false; code: PaymentFailureCode };

export async function simulatePayment(input: {
  phone: string;
  method: string;
}): Promise<PaymentResult> {
  // Normalize phone to digits only and inspect last 3.
  const digits = input.phone.replace(/\D/g, '');
  const tail = digits.slice(-3);
  if (tail === '911') return { success: false, code: 'CARD_DECLINED' };
  if (tail === '000') return { success: false, code: 'NETWORK_ERROR' };
  // Tiny artificial delay for realism — bounded so tests stay fast.
  await new Promise((r) => setTimeout(r, 25));
  return { success: true };
}
