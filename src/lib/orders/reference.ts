import 'server-only';
import { customAlphabet } from 'nanoid';

/**
 * 31-char no-look-alike alphabet, excluding visually ambiguous chars
 * O, 0, I, 1, L per CONTEXT.md "Order references" decision.
 *
 * NOTE: CONTEXT.md and PLAN.md call out the same exclusion list but quote
 * a 32-char alphabet "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" that still contains L —
 * a typo in those docs. We honor the *decision* (no ambiguous chars) over the
 * literal string and drop L. Tests verify "no L" against generated refs.
 *
 * Collision space at 6 chars is 31^6 ≈ 887M — comfortably unique at realistic
 * order volumes; the DB unique constraint is the safety net.
 */
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
// Reference: original decision string was 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' (typo with L).
const generate = customAlphabet(ALPHABET, 6);

/** Validation regex — used by tests and the orders schema. */
export const ORDER_REFERENCE_PATTERN =
  /^ORK-[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{6}$/;

/**
 * Generate a customer-facing order reference like `ORK-A2C4E6`.
 * Collision space at 6 chars is 32^6 ≈ 1.07B — comfortably unique at
 * realistic order volumes; the DB unique constraint is the safety net.
 */
export function generateOrderReference(): string {
  return `ORK-${generate()}`;
}
