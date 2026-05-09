---
phase: 08-cart-checkout-orders
plan: 03
type: execute
wave: 1
depends_on: [08-01]
files_modified:
  - src/lib/orders/state-machine.ts
  - src/lib/orders/state-machine.test.ts
  - src/lib/orders/pricing.ts
  - src/lib/orders/pricing.test.ts
  - src/lib/orders/reference.ts
  - src/lib/orders/reference.test.ts
  - src/lib/orders/errors.ts
  - vitest.config.ts
  - tests/setup.ts
  - package.json
  - package-lock.json
autonomous: true
requirements: [ECOM-02, ECOM-04, UX-03]
must_haves:
  truths:
    - "Order state machine permits exactly the transitions defined in CONTEXT.md (pending→confirmed, pending→cancelled, confirmed→shipped, confirmed→cancelled, shipped→delivered, shipped→cancelled, confirmed/shipped/delivered→refunded)"
    - "Pricing computes subtotal+shipping+VAT(15%)+total entirely in halalas (no floats)"
    - "Free shipping kicks in at subtotal >= 30000 halalas (300 SAR)"
    - "VAT is applied on (subtotal + shipping), per ZATCA"
    - "Order references match /^ORK-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/"
    - "Vitest is wired and runs unit tests under tests/ or *.test.ts files"
  artifacts:
    - path: "src/lib/orders/state-machine.ts"
      provides: "TRANSITIONS map, canTransition, assertTransition, IllegalTransitionError"
      contains: "shipped → cancelled"
    - path: "src/lib/orders/pricing.ts"
      provides: "computeOrderTotals, formatSAR, VAT_RATE, FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS"
    - path: "src/lib/orders/reference.ts"
      provides: "generateOrderReference() — ORK-XXXXXX"
    - path: "src/lib/orders/errors.ts"
      provides: "OrderError class with typed code"
    - path: "vitest.config.ts"
      provides: "Vitest config with jsdom environment and tests/setup.ts"
  key_links:
    - from: "tests/orders/*.test.ts"
      to: "src/lib/orders/*"
      via: "import + assert"
      pattern: "expect\\("
---

<objective>
Build the three pure-logic libraries that the checkout transaction (Plan 08-05) and admin transitions (Plan 08-08) depend on:
1. Order state machine — typed transition table per CONTEXT.md
2. Pricing — halalas-based subtotal/shipping/VAT/total computation
3. Order reference generator — `ORK-XXXXXX` nanoid

Plus wire Vitest (already installed but never configured) so this plan can ship with its own unit tests, and so Plan 08-09 has a foundation to extend.

Purpose: ECOM-02 (state machine), ECOM-04 (refund/cancel architecture), UX-03 (visible total cost).

Output: Pure functions + tests, zero side effects, ready for Plan 08-05 to compose into the checkout transaction.
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
@src/lib/products-logic.ts
@package.json

<interfaces>
After Plan 08-01, `OrderStatus` is exported from `@/types/domain` and `@/lib/db/schema`:
```typescript
export type OrderStatus =
  | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
```

Vitest is already installed (`vitest@^4.1.5` in devDependencies) but no config exists. jsdom and @testing-library are also installed.

CONTEXT.md transition matrix (authoritative):
- pending → confirmed (payment success)
- pending → cancelled (admin)
- confirmed → shipped (admin)
- confirmed → cancelled (admin; releases stock)
- shipped → delivered (admin)
- shipped → cancelled (admin; does NOT release stock)
- confirmed → refunded (admin)
- shipped → refunded (admin)
- delivered → refunded (admin)
- cancelled, refunded: terminal
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Wire Vitest config + tests/setup.ts + add npm test scripts</name>
  <files>vitest.config.ts, tests/setup.ts, package.json</files>
  <read_first>
    - package.json (vitest@4.1.5, jsdom@29.1.1, @testing-library/react, @vitejs/plugin-react already installed)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "No Analog Found" section (test config is net new)
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md "Wave 0 Gaps" reference
  </read_first>
  <behavior>
    - `vitest.config.ts` exists at repo root; uses jsdom environment by default for tests under `src/components/**` or anywhere using DOM, with `environmentMatchGlobs` mapping. Pure-logic tests can use node (default).
    - `tests/setup.ts` exists; imports `@testing-library/jest-dom/vitest` if available, otherwise empty stub. Includes a polyfill for `crypto.randomUUID` if the runtime needs it.
    - `package.json` `scripts` block gains: `"test": "vitest run"`, `"test:watch": "vitest"`, `"test:ui": "vitest --ui"` (UI optional, only if `@vitest/ui` already installed; if not, omit the test:ui script).
    - `npm test` runs to completion with 0 tests collected (or whatever exists), exits 0.
  </behavior>
  <action>
    Create `vitest.config.ts` at repo root:

    ```typescript
    import { defineConfig } from 'vitest/config';
    import react from '@vitejs/plugin-react';
    import path from 'path';

    export default defineConfig({
      plugins: [react()],
      test: {
        environment: 'node',
        environmentMatchGlobs: [
          ['src/components/**/*.test.{ts,tsx}', 'jsdom'],
          ['src/app/**/*.test.{ts,tsx}', 'jsdom'],
          ['tests/components/**', 'jsdom'],
        ],
        setupFiles: ['./tests/setup.ts'],
        include: [
          'src/**/*.test.{ts,tsx}',
          'tests/**/*.test.{ts,tsx}',
        ],
        globals: true,
      },
      resolve: {
        alias: { '@': path.resolve(__dirname, './src') },
      },
    });
    ```

    Create `tests/setup.ts`:

    ```typescript
    // Vitest global setup. Add DOM matchers / polyfills here as the suite grows.
    import { vi } from 'vitest';

    // Silence next/navigation in unit tests by default; tests that need it can mock per-file.
    if (typeof globalThis.crypto === 'undefined') {
      // Node 18+ has crypto.randomUUID natively; fallback for older runners.
      globalThis.crypto = require('node:crypto').webcrypto as Crypto;
    }
    ```

    Edit `package.json`. ADD these scripts inside the `scripts` block (do not delete the existing ones):

    ```json
    "test": "vitest run",
    "test:watch": "vitest"
    ```

    Run `npm test` once to confirm. Expected: it discovers 0 tests (no test files yet) and exits 0 OR with code 1 saying "no tests found" — Vitest's default is exit 1 on no-tests-found. To avoid that, pass `--passWithNoTests`. Update the script to:

    ```json
    "test": "vitest run --passWithNoTests"
    ```

    Then `npm test` MUST exit 0 with zero tests collected.
  </action>
  <verify>
    <automated>npm test -- --passWithNoTests 2>&amp;1 | tail -5; test ${PIPESTATUS[0]} -eq 0</automated>
  </verify>
  <acceptance_criteria>
    - `test -f vitest.config.ts` (file exists)
    - `test -f tests/setup.ts` (file exists)
    - `grep -c '"test":' package.json` outputs at least 1
    - `grep -c "passWithNoTests" package.json` outputs 1
    - `npm test` exits 0
    - `grep -c "@/" vitest.config.ts` outputs at least 1 (alias is wired)
  </acceptance_criteria>
  <done>Vitest is configured. `npm test` runs and exits 0. Plans 08-04..08-09 can add `*.test.ts` files anywhere under `src/` or `tests/`.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement state machine + pricing + reference + errors with co-located tests</name>
  <files>src/lib/orders/state-machine.ts, src/lib/orders/state-machine.test.ts, src/lib/orders/pricing.ts, src/lib/orders/pricing.test.ts, src/lib/orders/reference.ts, src/lib/orders/reference.test.ts, src/lib/orders/errors.ts</files>
  <read_first>
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Order state machine" section (transition matrix is authoritative)
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Money & pricing" + "Shipping" + "Order references" sections
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 451-477 (state machine sketch — but USE CONTEXT.md transition matrix, NOT this one — RESEARCH is missing shipped→cancelled and confirmed/shipped→refunded)
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 891-936 (pricing + reference)
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md "Pitfall 5" (VAT on subtotal + shipping)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "Money formatting (NEW)" section (Intl.NumberFormat with ar-SA-u-nu-latn)
    - src/lib/products-logic.ts (existing pure-helper convention — colocated with products.ts)
    - CLAUDE.md "Currency" rule
  </read_first>
  <behavior>
    state-machine:
    - Type `OrderStatus` re-exported from `@/types/domain`.
    - Const `TRANSITIONS: Record<OrderStatus, OrderStatus[]>` matches CONTEXT.md exactly:
      ```
      pending:   ['confirmed', 'cancelled']
      confirmed: ['shipped', 'cancelled', 'refunded']
      shipped:   ['delivered', 'cancelled', 'refunded']
      delivered: ['refunded']
      cancelled: []
      refunded:  []
      ```
    - `canTransition(from, to)`, `assertTransition(from, to)` (throws `IllegalTransitionError` from `errors.ts`), `class IllegalTransitionError extends Error`.
    - Test file: ≥10 cases — every legal transition asserts true, several illegal transitions assert false, terminal states throw on any transition, includes the explicit case "pending → confirmed transition test" so the gate-grep in CONTEXT.md / planning brief passes (acceptance criterion below).

    pricing:
    - Constants exported: `VAT_RATE = 0.15`, `FLAT_SHIPPING_CENTS = 2500`, `FREE_SHIPPING_THRESHOLD_CENTS = 30000`.
    - `interface PricingInput { unitPriceCents: number; quantity: number; }`
    - `interface OrderTotals { subtotalCents: number; shippingCents: number; vatCents: number; totalCents: number; }`
    - `computeOrderTotals(items: PricingInput[]): OrderTotals` — subtotal = sum(unit*qty); shipping = subtotal >= 30000 ? 0 : 2500; vat = round((subtotal+shipping)*0.15); total = subtotal+shipping+vat. ALL integer halalas.
    - `formatSAR(cents: number, locale: 'en'|'ar'): string` — uses `Intl.NumberFormat('ar-SA-u-nu-latn', ...)` for `'ar'`, `'en-SA'` for `'en'` per CLAUDE.md.
    - Test cases: empty cart → 0,0,0,0; single item below threshold → flat shipping + VAT applied to (sub+ship); cart at exactly 300 SAR (30000 halalas) subtotal → free shipping; cart above threshold → free shipping; rounding case (e.g. 333 halalas → vat = 50, ensure no float drift).

    reference:
    - Uses `customAlphabet` from `nanoid` (already installed by Plan 08-02 — runtime dep already satisfied).
    - Alphabet: `'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'` (exactly 32 chars, excludes O/0/I/1/L per CONTEXT.md).
    - `generateOrderReference()` returns `'ORK-' + 6 chars`.
    - Test: 1000 generated refs all match `/^ORK-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/`. Set is highly likely all-unique (collision rate at 32^6 ~= 1B is astronomically low; just assert >= 999 unique).

    errors:
    - `class OrderError extends Error` with typed `code: 'STOCK_UNAVAILABLE'|'PAYMENT_DECLINED'|'CART_EMPTY'|'PRODUCT_NOT_FOUND'|'VALIDATION'|'UNKNOWN'` and optional `details?: Record<string, unknown>`.
    - `class IllegalTransitionError extends Error` (re-used by state-machine).

    All five files start with `import 'server-only';` EXCEPT the test files (which run in vitest and the shim in errors.ts — keep errors.ts pure since it's used in client error mapping; mark `'server-only'` only on state-machine, pricing, reference if they import server APIs; pricing's `formatSAR` is pure → can be imported from client too, so DO NOT mark pricing.ts as server-only).
  </behavior>
  <action>
    Create `src/lib/orders/errors.ts`:

    ```typescript
    export type OrderErrorCode =
      | 'STOCK_UNAVAILABLE'
      | 'PAYMENT_DECLINED'
      | 'CART_EMPTY'
      | 'PRODUCT_NOT_FOUND'
      | 'VALIDATION'
      | 'UNKNOWN';

    export class OrderError extends Error {
      constructor(
        public readonly code: OrderErrorCode,
        message?: string,
        public readonly details?: Record<string, unknown>
      ) {
        super(message ?? code);
        this.name = 'OrderError';
      }
    }

    export class IllegalTransitionError extends Error {
      constructor(public readonly from: string, public readonly to: string) {
        super(`Cannot transition order from ${from} to ${to}`);
        this.name = 'IllegalTransitionError';
      }
    }
    ```

    Create `src/lib/orders/state-machine.ts`:

    ```typescript
    import type { OrderStatus } from '@/types/domain';
    import { IllegalTransitionError } from './errors';

    /**
     * Authoritative order-status transition matrix. Derived from CONTEXT.md
     * "Order state machine" decisions:
     *   pending → confirmed  (payment success)
     *   pending → cancelled  (admin)
     *   confirmed → shipped  (admin)
     *   confirmed → cancelled (admin; releases stock pre-ship)
     *   confirmed → refunded (admin; bookkeeping refund pre-ship)
     *   shipped → delivered  (admin)
     *   shipped → cancelled  (admin; does NOT release stock — goods in transit)
     *   shipped → refunded   (admin)
     *   delivered → refunded (admin)
     *   cancelled / refunded: terminal
     */
    export const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
      pending:   ['confirmed', 'cancelled'],
      confirmed: ['shipped', 'cancelled', 'refunded'],
      shipped:   ['delivered', 'cancelled', 'refunded'],
      delivered: ['refunded'],
      cancelled: [],
      refunded:  [],
    };

    export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
      return TRANSITIONS[from]?.includes(to) ?? false;
    }

    export function assertTransition(from: OrderStatus, to: OrderStatus): void {
      if (!canTransition(from, to)) throw new IllegalTransitionError(from, to);
    }

    export function isTerminal(status: OrderStatus): boolean {
      return TRANSITIONS[status].length === 0;
    }

    export function legalNextStates(from: OrderStatus): readonly OrderStatus[] {
      return TRANSITIONS[from] ?? [];
    }
    ```

    Create `src/lib/orders/state-machine.test.ts`:

    ```typescript
    import { describe, it, expect } from 'vitest';
    import {
      canTransition, assertTransition, isTerminal, legalNextStates, TRANSITIONS,
    } from './state-machine';
    import { IllegalTransitionError } from './errors';

    describe('order state machine', () => {
      it('allows pending → confirmed transition', () => {
        expect(canTransition('pending', 'confirmed')).toBe(true);
      });

      it('allows pending → cancelled', () => {
        expect(canTransition('pending', 'cancelled')).toBe(true);
      });

      it('allows confirmed → shipped, cancelled, refunded', () => {
        expect(canTransition('confirmed', 'shipped')).toBe(true);
        expect(canTransition('confirmed', 'cancelled')).toBe(true);
        expect(canTransition('confirmed', 'refunded')).toBe(true);
      });

      it('allows shipped → delivered, cancelled, refunded (cancel-after-ship per CONTEXT)', () => {
        expect(canTransition('shipped', 'delivered')).toBe(true);
        expect(canTransition('shipped', 'cancelled')).toBe(true);
        expect(canTransition('shipped', 'refunded')).toBe(true);
      });

      it('allows delivered → refunded only', () => {
        expect(canTransition('delivered', 'refunded')).toBe(true);
        expect(canTransition('delivered', 'cancelled')).toBe(false);
        expect(canTransition('delivered', 'shipped')).toBe(false);
      });

      it('forbids backward transitions', () => {
        expect(canTransition('confirmed', 'pending')).toBe(false);
        expect(canTransition('shipped', 'pending')).toBe(false);
        expect(canTransition('shipped', 'confirmed')).toBe(false);
      });

      it('marks cancelled and refunded as terminal', () => {
        expect(isTerminal('cancelled')).toBe(true);
        expect(isTerminal('refunded')).toBe(true);
        expect(legalNextStates('cancelled')).toEqual([]);
        expect(legalNextStates('refunded')).toEqual([]);
      });

      it('throws IllegalTransitionError on invalid', () => {
        expect(() => assertTransition('cancelled', 'shipped')).toThrow(IllegalTransitionError);
        expect(() => assertTransition('refunded', 'pending')).toThrow(IllegalTransitionError);
      });

      it('does not allow self-transition', () => {
        expect(canTransition('pending', 'pending')).toBe(false);
        expect(canTransition('confirmed', 'confirmed')).toBe(false);
      });

      it('TRANSITIONS map covers all six states', () => {
        const states: ReadonlyArray<keyof typeof TRANSITIONS> =
          ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled', 'refunded'];
        for (const s of states) expect(TRANSITIONS[s]).toBeDefined();
      });
    });
    ```

    Create `src/lib/orders/pricing.ts`:

    ```typescript
    /**
     * Pure pricing helpers. All amounts are integer halalas (1 SAR = 100 halalas).
     * Safe to import from client AND server — no `server-only` marker.
     */
    import type { Locale } from '@/types/domain';

    export const VAT_RATE = 0.15;                 // KSA standard (ZATCA)
    export const FLAT_SHIPPING_CENTS = 2500;      // 25.00 SAR
    export const FREE_SHIPPING_THRESHOLD_CENTS = 30000; // 300.00 SAR

    export interface PricingInput {
      unitPriceCents: number;
      quantity: number;
    }

    export interface OrderTotals {
      subtotalCents: number;
      shippingCents: number;
      vatCents: number;
      totalCents: number;
    }

    export function computeOrderTotals(items: PricingInput[]): OrderTotals {
      const subtotalCents = items.reduce(
        (sum, i) => sum + Math.max(0, i.unitPriceCents) * Math.max(0, i.quantity), 0
      );
      const shippingCents =
        subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : FLAT_SHIPPING_CENTS;
      // VAT applies to subtotal + shipping per ZATCA. Round half-away-from-zero.
      const vatCents = Math.round((subtotalCents + shippingCents) * VAT_RATE);
      const totalCents = subtotalCents + shippingCents + vatCents;
      return { subtotalCents, shippingCents, vatCents, totalCents };
    }

    export function formatSAR(cents: number, locale: Locale): string {
      // 'ar-SA-u-nu-latn' forces Western numerals in both locales (CLAUDE.md rule).
      const fmt = new Intl.NumberFormat(
        locale === 'ar' ? 'ar-SA-u-nu-latn' : 'en-SA',
        { style: 'currency', currency: 'SAR', maximumFractionDigits: 2 }
      );
      return fmt.format(cents / 100);
    }
    ```

    Create `src/lib/orders/pricing.test.ts`:

    ```typescript
    import { describe, it, expect } from 'vitest';
    import {
      computeOrderTotals, formatSAR, FLAT_SHIPPING_CENTS, FREE_SHIPPING_THRESHOLD_CENTS,
    } from './pricing';

    describe('computeOrderTotals', () => {
      it('returns all zeros for empty cart', () => {
        expect(computeOrderTotals([])).toEqual({
          subtotalCents: 0, shippingCents: 0, vatCents: 0, totalCents: 0,
        });
      });

      it('applies flat shipping below threshold', () => {
        // 100 SAR (10000 halalas) cart → +25 SAR shipping → 125 → vat = round(18750) = 18750? Let’s do explicit:
        // sub=10000, ship=2500, vat=round(12500*0.15)=1875, total=14375
        const t = computeOrderTotals([{ unitPriceCents: 10000, quantity: 1 }]);
        expect(t.subtotalCents).toBe(10000);
        expect(t.shippingCents).toBe(FLAT_SHIPPING_CENTS);
        expect(t.vatCents).toBe(1875);
        expect(t.totalCents).toBe(14375);
      });

      it('grants free shipping at exactly threshold', () => {
        const t = computeOrderTotals([{ unitPriceCents: FREE_SHIPPING_THRESHOLD_CENTS, quantity: 1 }]);
        expect(t.shippingCents).toBe(0);
        // sub=30000, ship=0, vat=round(30000*0.15)=4500, total=34500
        expect(t.vatCents).toBe(4500);
        expect(t.totalCents).toBe(34500);
      });

      it('grants free shipping above threshold', () => {
        const t = computeOrderTotals([{ unitPriceCents: 50000, quantity: 1 }]);
        expect(t.shippingCents).toBe(0);
      });

      it('sums multiple items correctly', () => {
        const t = computeOrderTotals([
          { unitPriceCents: 5000, quantity: 2 },   // 10000
          { unitPriceCents: 12500, quantity: 1 },  // 12500
        ]);
        expect(t.subtotalCents).toBe(22500);
        expect(t.shippingCents).toBe(FLAT_SHIPPING_CENTS);
        // (22500 + 2500) * 0.15 = 3750
        expect(t.vatCents).toBe(3750);
        expect(t.totalCents).toBe(28750);
      });

      it('clamps negative inputs to zero', () => {
        const t = computeOrderTotals([{ unitPriceCents: -100, quantity: -5 }]);
        expect(t.subtotalCents).toBe(0);
      });

      it('uses integer math throughout (no float drift on 0.1+0.2 cases)', () => {
        const t = computeOrderTotals([{ unitPriceCents: 33, quantity: 3 }]); // 99 halalas sub
        // sub=99, ship=2500 (below threshold), vat=round(2599*0.15)=round(389.85)=390
        expect(t.vatCents).toBe(390);
        expect(t.totalCents).toBe(99 + 2500 + 390);
      });
    });

    describe('formatSAR', () => {
      it('formats EN with Western numerals', () => {
        const s = formatSAR(12500, 'en');
        expect(s).toMatch(/SAR/);
        expect(s).toMatch(/125/);
      });

      it('formats AR with Western numerals (ar-SA-u-nu-latn)', () => {
        const s = formatSAR(12500, 'ar');
        // Western digits required per CLAUDE.md
        expect(s).toMatch(/125/);
      });

      it('formats zero', () => {
        expect(formatSAR(0, 'en')).toMatch(/0/);
      });
    });
    ```

    Create `src/lib/orders/reference.ts`:

    ```typescript
    import { customAlphabet } from 'nanoid';

    /**
     * 32-char alphabet excluding visually ambiguous chars: O, 0, I, 1, L.
     * Per CONTEXT.md "Order references" decision.
     */
    const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const generate = customAlphabet(ALPHABET, 6);

    export const ORDER_REFERENCE_PATTERN = /^ORK-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{6}$/;

    export function generateOrderReference(): string {
      return `ORK-${generate()}`;
    }
    ```

    Create `src/lib/orders/reference.test.ts`:

    ```typescript
    import { describe, it, expect } from 'vitest';
    import { generateOrderReference, ORDER_REFERENCE_PATTERN } from './reference';

    describe('generateOrderReference', () => {
      it('returns a string matching the ORK-XXXXXX pattern', () => {
        for (let i = 0; i < 100; i++) {
          const ref = generateOrderReference();
          expect(ref).toMatch(ORDER_REFERENCE_PATTERN);
        }
      });

      it('uses an alphabet without visually ambiguous chars (no O, 0, I, 1, L)', () => {
        for (let i = 0; i < 200; i++) {
          const ref = generateOrderReference();
          // After ORK- prefix, none of: O 0 I 1 L
          const tail = ref.slice(4);
          expect(tail).not.toMatch(/[O0I1L]/);
        }
      });

      it('is highly unlikely to collide across 1000 calls', () => {
        const refs = new Set<string>();
        for (let i = 0; i < 1000; i++) refs.add(generateOrderReference());
        expect(refs.size).toBeGreaterThanOrEqual(999);
      });
    });
    ```

    Run `npm test`. All three suites MUST pass.
  </action>
  <verify>
    <automated>npm test 2>&amp;1 | tee /tmp/test.log; grep -E "Test Files|passed" /tmp/test.log; test ${PIPESTATUS[0]} -eq 0</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "shipped:   \['delivered', 'cancelled', 'refunded'\]" src/lib/orders/state-machine.ts` outputs 1 (cancel-after-ship per CONTEXT.md)
    - `grep -c "confirmed: \['shipped', 'cancelled', 'refunded'\]" src/lib/orders/state-machine.ts` outputs 1
    - `grep -c "delivered: \['refunded'\]" src/lib/orders/state-machine.ts` outputs 1
    - `grep -c "VAT_RATE = 0.15" src/lib/orders/pricing.ts` outputs 1
    - `grep -c "FREE_SHIPPING_THRESHOLD_CENTS = 30000" src/lib/orders/pricing.ts` outputs 1
    - `grep -c "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" src/lib/orders/reference.ts` outputs at least 1
    - `grep -c "ORK-" src/lib/orders/reference.ts` outputs at least 1
    - `grep -c "ar-SA-u-nu-latn" src/lib/orders/pricing.ts` outputs 1
    - `npx vitest run src/lib/orders/state-machine.test.ts` exits 0 with at least 9 tests passing
    - `npx vitest run src/lib/orders/pricing.test.ts` exits 0 with at least 8 tests passing
    - `npx vitest run src/lib/orders/reference.test.ts` exits 0 with at least 3 tests passing
    - `npx tsc --noEmit` exits 0
    - `grep -c "'server-only'" src/lib/orders/pricing.ts` outputs 0 (formatSAR is intentionally usable from client too)
  </acceptance_criteria>
  <done>State machine, pricing, reference, errors all exist as pure libs with passing unit tests. `npm test` exits 0.</done>
</task>

</tasks>

<verification>
- `npm test` exits 0 with at least 20 tests passing
- `grep -c "TRANSITIONS\[from\]" src/lib/orders/state-machine.ts` ≥ 1
</verification>

<success_criteria>
Plan 08-05 (checkout submit) can `import { computeOrderTotals } from '@/lib/orders/pricing'`, `import { generateOrderReference } from '@/lib/orders/reference'`, `import { assertTransition } from '@/lib/orders/state-machine'`, `import { OrderError } from '@/lib/orders/errors'` and have those work as documented and tested.
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-03-SUMMARY.md`
</output>
