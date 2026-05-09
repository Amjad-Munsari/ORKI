---
phase: 08-cart-checkout-orders
plan: 04
type: execute
wave: 1
depends_on: [08-01]
files_modified:
  - src/lib/checkout/schemas.ts
  - src/lib/checkout/schemas.test.ts
  - messages/en.json
  - messages/ar.json
  - package.json
  - package-lock.json
autonomous: true
requirements: [UX-05, UX-06]
must_haves:
  truths:
    - "zod schemas exist for shipping address, payment selection, and full checkout — single source of truth shared by client RHF and server re-validation"
    - "Each zod field's error message is a next-intl key (e.g. 'Checkout.errors.required'), NOT raw English"
    - "messages/en.json and messages/ar.json contain matching key trees under Checkout.* and Order.* and Email.* namespaces"
    - "Zod's safeParse on a valid payload returns { success: true, data }; on invalid returns a field map mappable to RHF errors"
    - "Saudi phone regex /^\\+?966\\s?5\\d(\\s?\\d{3}){2}$/ is a single shared constant — no drift"
  artifacts:
    - path: "src/lib/checkout/schemas.ts"
      provides: "shippingSchema, paymentSelectionSchema, checkoutSchema, ShippingInput, PaymentSelection, CheckoutInput types"
      contains: "z.object"
    - path: "messages/en.json"
      provides: "Checkout, Order, Email namespaces"
      contains: "\"errors\""
    - path: "messages/ar.json"
      provides: "Checkout, Order, Email namespaces (AR translations of all EN keys)"
      contains: "\"errors\""
  key_links:
    - from: "messages/en.json"
      to: "messages/ar.json"
      via: "matching key trees"
      pattern: "Checkout\\.errors"
---

<objective>
Install zod + react-hook-form + @hookform/resolvers, create the shared validation schemas, and add bilingual message keys for every error code, button label, and progress step in the new checkout flow. These keys are referenced by Plan 08-05 (server) and Plan 08-06 (client RHF).

Purpose: UX-05 (preserve data on error, highlight fields), UX-06 (no raw technical errors — every error renders through next-intl). Single zod schema is the shared contract between client and server.

Output: Validation library + complete bilingual message catalog. No runtime code paths exercised yet (Plan 08-05 wires it into the Server Action; Plan 08-06 wires it into the form).
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
@messages/en.json
@messages/ar.json
@src/components/checkout/PaymentGrid.tsx
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Install zod + RHF + resolvers; create src/lib/checkout/schemas.ts with full unit tests</name>
  <files>package.json, package-lock.json, src/lib/checkout/schemas.ts, src/lib/checkout/schemas.test.ts</files>
  <read_first>
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Validation" section
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 605-617 (zod schema sketch)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "src/lib/checkout/schemas.ts" section
    - src/lib/env.ts (existing zod usage pattern)
    - src/components/checkout/PaymentGrid.tsx (existing PaymentMethod type — reuse the same string union)
  </read_first>
  <behavior>
    - `zod@^4`, `react-hook-form@^7`, `@hookform/resolvers@^5` are installed
    - `src/lib/checkout/schemas.ts` exports:
      - `KSA_PHONE_PATTERN` const regex
      - `shippingSchema` (firstName, lastName, email, phone, city, district, address, apartment optional)
      - `paymentSelectionSchema` (method enum: 'card'|'mada'|'stcpay'|'applepay'|'cod')
      - `checkoutSchema` = `z.object({ shipping: shippingSchema, payment: paymentSelectionSchema })`
      - Inferred types: `ShippingInput`, `PaymentSelection`, `CheckoutInput`
    - All error messages are next-intl KEYS, not English strings. Examples: `'Checkout.errors.required'`, `'Checkout.errors.email'`, `'Checkout.errors.phone.ksa'`, `'Checkout.errors.address.short'`.
    - Field max lengths: firstName/lastName/city/district 50; address 200; apartment 100.
    - Email uses `z.string().email('Checkout.errors.email')`.
    - Phone is required; regex matches `+966 5X XXX XXXX` and variations like `+9665XXXXXXXX`, `9665XXXXXXXX`, `05XXXXXXXX` (Saudi prefix).
    - Test cases: each field's required state, email format, phone valid + invalid forms, payment method enum (valid + invalid), full checkoutSchema accepts a complete payload, rejects with field-keyed issues.
  </behavior>
  <action>
    Install:

    ```bash
    npm install zod@^4 react-hook-form@^7 @hookform/resolvers@^5
    ```

    Create `src/lib/checkout/schemas.ts`:

    ```typescript
    import { z } from 'zod';

    /**
     * Saudi mobile phone format. Accepts:
     *   +966 5X XXX XXXX
     *   +9665XXXXXXXX
     *   9665XXXXXXXX
     *   05XXXXXXXX
     * No drift — this is the ONLY phone regex in the codebase.
     */
    export const KSA_PHONE_PATTERN =
      /^(?:\+?966\s?5|05)\d(?:\s?\d{3}){2}$|^(?:\+?966|0)5\d{8}$/;

    export const shippingSchema = z.object({
      firstName: z.string().min(1, 'Checkout.errors.required').max(50, 'Checkout.errors.tooLong'),
      lastName:  z.string().min(1, 'Checkout.errors.required').max(50, 'Checkout.errors.tooLong'),
      email:     z.string().email('Checkout.errors.email'),
      phone:     z.string().regex(KSA_PHONE_PATTERN, 'Checkout.errors.phone.ksa'),
      city:      z.string().min(1, 'Checkout.errors.required').max(50, 'Checkout.errors.tooLong'),
      district:  z.string().min(1, 'Checkout.errors.required').max(50, 'Checkout.errors.tooLong'),
      address:   z.string().min(5, 'Checkout.errors.address.short').max(200, 'Checkout.errors.tooLong'),
      apartment: z.string().max(100, 'Checkout.errors.tooLong').optional().or(z.literal('')),
    });

    export const PAYMENT_METHODS = ['card', 'mada', 'stcpay', 'applepay', 'cod'] as const;
    export type PaymentMethodCode = (typeof PAYMENT_METHODS)[number];

    export const paymentSelectionSchema = z.object({
      method: z.enum(PAYMENT_METHODS, { errorMap: () => ({ message: 'Checkout.errors.payment.required' }) }),
    });

    export const checkoutSchema = z.object({
      shipping: shippingSchema,
      payment: paymentSelectionSchema,
    });

    export type ShippingInput = z.infer<typeof shippingSchema>;
    export type PaymentSelection = z.infer<typeof paymentSelectionSchema>;
    export type CheckoutInput = z.infer<typeof checkoutSchema>;
    ```

    Note: zod 4 uses a slightly different API for `enum` errorMap; if `errorMap` syntax differs, fall back to `z.enum([...]).refine` or use `z.enum([...], { error: () => 'Checkout.errors.payment.required' })`. Verify against the installed zod 4.x docs at runtime — keep the error message KEY exactly as `'Checkout.errors.payment.required'`.

    Create `src/lib/checkout/schemas.test.ts`:

    ```typescript
    import { describe, it, expect } from 'vitest';
    import {
      shippingSchema, paymentSelectionSchema, checkoutSchema,
      KSA_PHONE_PATTERN, PAYMENT_METHODS,
    } from './schemas';

    const validShipping = {
      firstName: 'Amjad', lastName: 'Test',
      email: 'amjad@example.com',
      phone: '+966 50 123 4567',
      city: 'Riyadh', district: 'Olaya',
      address: 'King Fahd Rd 123',
    };

    describe('shippingSchema', () => {
      it('accepts a valid payload', () => {
        const r = shippingSchema.safeParse(validShipping);
        expect(r.success).toBe(true);
      });

      it('flags missing required fields with i18n keys', () => {
        const r = shippingSchema.safeParse({ ...validShipping, firstName: '' });
        expect(r.success).toBe(false);
        if (!r.success) {
          const msg = r.error.issues.find(i => i.path[0] === 'firstName')?.message;
          expect(msg).toBe('Checkout.errors.required');
        }
      });

      it('rejects invalid email with i18n key', () => {
        const r = shippingSchema.safeParse({ ...validShipping, email: 'not-an-email' });
        expect(r.success).toBe(false);
        if (!r.success) {
          const msg = r.error.issues.find(i => i.path[0] === 'email')?.message;
          expect(msg).toBe('Checkout.errors.email');
        }
      });

      it('accepts multiple Saudi phone formats', () => {
        for (const phone of ['+966 50 123 4567', '+966501234567', '966501234567', '0501234567']) {
          expect(shippingSchema.safeParse({ ...validShipping, phone }).success).toBe(true);
        }
      });

      it('rejects non-KSA phone formats', () => {
        for (const phone of ['+1 555 123 4567', '12345', '+44 20 7946 0958']) {
          const r = shippingSchema.safeParse({ ...validShipping, phone });
          expect(r.success).toBe(false);
        }
      });

      it('allows empty apartment', () => {
        expect(shippingSchema.safeParse({ ...validShipping, apartment: '' }).success).toBe(true);
        expect(shippingSchema.safeParse({ ...validShipping, apartment: undefined }).success).toBe(true);
      });

      it('rejects address shorter than 5 chars', () => {
        const r = shippingSchema.safeParse({ ...validShipping, address: 'No' });
        expect(r.success).toBe(false);
        if (!r.success) {
          expect(r.error.issues.find(i => i.path[0] === 'address')?.message)
            .toBe('Checkout.errors.address.short');
        }
      });
    });

    describe('paymentSelectionSchema', () => {
      it('accepts each canonical method', () => {
        for (const m of PAYMENT_METHODS) {
          expect(paymentSelectionSchema.safeParse({ method: m }).success).toBe(true);
        }
      });

      it('rejects an unknown method with i18n key', () => {
        const r = paymentSelectionSchema.safeParse({ method: 'bitcoin' as any });
        expect(r.success).toBe(false);
      });
    });

    describe('checkoutSchema', () => {
      it('accepts a full valid payload', () => {
        const r = checkoutSchema.safeParse({
          shipping: validShipping,
          payment: { method: 'mada' },
        });
        expect(r.success).toBe(true);
      });

      it('reports nested field errors', () => {
        const r = checkoutSchema.safeParse({
          shipping: { ...validShipping, email: 'bad' },
          payment: { method: 'card' },
        });
        expect(r.success).toBe(false);
        if (!r.success) {
          const issue = r.error.issues.find(i =>
            i.path[0] === 'shipping' && i.path[1] === 'email'
          );
          expect(issue?.message).toBe('Checkout.errors.email');
        }
      });
    });

    describe('KSA_PHONE_PATTERN', () => {
      it('is exported as a RegExp', () => {
        expect(KSA_PHONE_PATTERN).toBeInstanceOf(RegExp);
      });
    });
    ```

    Run tests; fix the schema if any case fails (zod 4 API quirks may need a `transform` for whitespace tolerance — keep the regex permissive enough that all four canonical phone forms pass).
  </action>
  <verify>
    <automated>npm ls zod react-hook-form @hookform/resolvers &amp;&amp; npx vitest run src/lib/checkout/schemas.test.ts 2>&amp;1 | tail -10</automated>
  </verify>
  <acceptance_criteria>
    - `npm ls zod` shows zod 4.x
    - `npm ls react-hook-form` shows 7.x
    - `npm ls @hookform/resolvers` shows 5.x
    - `grep -c "export const shippingSchema" src/lib/checkout/schemas.ts` outputs 1
    - `grep -c "export const checkoutSchema" src/lib/checkout/schemas.ts` outputs 1
    - `grep -c "Checkout.errors.required" src/lib/checkout/schemas.ts` outputs at least 4
    - `grep -c "Checkout.errors.email" src/lib/checkout/schemas.ts` outputs 1
    - `grep -c "Checkout.errors.phone.ksa" src/lib/checkout/schemas.ts` outputs 1
    - `grep -c "KSA_PHONE_PATTERN" src/lib/checkout/schemas.ts` outputs at least 2
    - `npx vitest run src/lib/checkout/schemas.test.ts` exits 0 with at least 10 tests passing
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Schemas file is the contract; tests pass; types compile.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Add bilingual message keys to messages/en.json and messages/ar.json (Checkout, Order, Email namespaces)</name>
  <files>messages/en.json, messages/ar.json</files>
  <read_first>
    - messages/en.json (current namespaces: Nav, Footer, Placeholder, Meta, Shop)
    - messages/ar.json (mirror — verify same key shape)
    - src/lib/checkout/schemas.ts (just-created — every error key referenced here MUST exist in both message files)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "messages/{en,ar}.json" section
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Trust signals (UX-07)" + "Error UX (UX-06)" sections (for trust-signal labels and error message text)
  </read_first>
  <behavior>
    - en.json adds top-level `Checkout`, `Order`, `Email` namespaces. Existing keys (Nav/Footer/Placeholder/Meta/Shop) untouched.
    - ar.json adds the SAME key tree with Arabic translations.
    - Every error key referenced in `src/lib/checkout/schemas.ts` must exist under `Checkout.errors` in BOTH files.
    - Both JSON files parse without errors.
    - Key sets are identical between EN and AR (same shape).
  </behavior>
  <action>
    Open `messages/en.json`. APPEND the three new namespaces (place them after `Shop`). The file MUST remain valid JSON; preserve trailing comma rules.

    ```json
    {
      "Nav": { ... existing ... },
      "Footer": { ... existing ... },
      "Placeholder": { ... existing ... },
      "Meta": { ... existing ... },
      "Shop": { ... existing ... },

      "Checkout": {
        "title": "Checkout",
        "step1": "Shipping Information",
        "step2": "Payment Method",
        "stepProgress": "Step {current} of {total}",
        "edit": "Edit",
        "continueToPayment": "Continue to Payment",
        "placeOrder": "Complete Purchase",
        "processing": "Processing...",
        "firstName": "First Name",
        "lastName": "Last Name",
        "email": "Email Address",
        "phone": "Phone Number",
        "phonePlaceholder": "+966 5X XXX XXXX",
        "city": "City",
        "district": "District",
        "address": "Street Address",
        "apartment": "Apartment / Villa (Optional)",
        "subtotal": "Subtotal",
        "shipping": "Shipping",
        "vat": "VAT (15%)",
        "total": "Total",
        "freeShipping": "Free",
        "summary": "Order Summary",
        "termsAcknowledgement": "By completing this order, you agree to our Terms of Service and Privacy Policy.",
        "trust": {
          "secureCheckout": "Secure Checkout",
          "returnsPolicy": "30-Day Returns",
          "sslEncryption": "SSL Encrypted"
        },
        "errors": {
          "required": "This field is required",
          "tooLong": "This value is too long",
          "email": "Please enter a valid email",
          "phone": {
            "ksa": "Enter a Saudi mobile number (+966 5X XXX XXXX)"
          },
          "address": {
            "short": "Please enter a more complete address"
          },
          "payment": {
            "required": "Please select a payment method"
          },
          "stockUnavailable": "One or more items just sold out. Please review your cart.",
          "paymentDeclined": "Payment was declined. Your cart is preserved — please try another method.",
          "cartEmpty": "Your cart is empty.",
          "validation": "Please correct the highlighted fields and try again.",
          "unknown": "Something went wrong. Please try again or contact support."
        }
      },

      "Order": {
        "confirmedTitle": "Order Confirmed",
        "thanks": "Thank you for your order",
        "reference": "Order Reference",
        "emailSent": "We've sent a confirmation email with all the details.",
        "backHome": "Back to Home",
        "continueShopping": "Continue Shopping",
        "support": "If you have any questions, please contact our support team.",
        "status": {
          "pending": "Pending",
          "confirmed": "Confirmed",
          "shipped": "Shipped",
          "delivered": "Delivered",
          "cancelled": "Cancelled",
          "refunded": "Refunded"
        }
      },

      "Email": {
        "confirmation": {
          "subject": "Your ORKI order is confirmed",
          "title": "Order Confirmed",
          "greeting": "Thanks for your order, {name}.",
          "referenceLabel": "Order Reference",
          "totalLabel": "Total",
          "footer": "Questions? Reply to this email or contact support@orki.sa."
        },
        "shipped": {
          "subject": "Your ORKI order is on the way",
          "title": "Order Shipped",
          "greeting": "Good news, {name} — your order is on the way.",
          "referenceLabel": "Order Reference",
          "trackingLabel": "Tracking",
          "footer": "Questions? Reply to this email or contact support@orki.sa."
        },
        "cancelled": {
          "subject": "Your ORKI order has been cancelled",
          "title": "Order Cancelled",
          "greeting": "Hi {name}, your order has been cancelled.",
          "referenceLabel": "Order Reference",
          "footer": "Questions? Reply to this email or contact support@orki.sa."
        },
        "refunded": {
          "subject": "Your ORKI order has been refunded",
          "title": "Order Refunded",
          "greeting": "Hi {name}, your refund has been processed.",
          "referenceLabel": "Order Reference",
          "footer": "Questions? Reply to this email or contact support@orki.sa."
        }
      }
    }
    ```

    Mirror in `messages/ar.json` with these AR translations:

    ```json
    "Checkout": {
      "title": "إتمام الشراء",
      "step1": "معلومات الشحن",
      "step2": "طريقة الدفع",
      "stepProgress": "الخطوة {current} من {total}",
      "edit": "تعديل",
      "continueToPayment": "الاستمرار للدفع",
      "placeOrder": "تأكيد الطلب",
      "processing": "جاري المعالجة...",
      "firstName": "الاسم الأول",
      "lastName": "اسم العائلة",
      "email": "البريد الإلكتروني",
      "phone": "رقم الجوال",
      "phonePlaceholder": "+966 5X XXX XXXX",
      "city": "المدينة",
      "district": "الحي",
      "address": "العنوان",
      "apartment": "الشقة / الفيلا (اختياري)",
      "subtotal": "المجموع الفرعي",
      "shipping": "الشحن",
      "vat": "ضريبة القيمة المضافة (15%)",
      "total": "الإجمالي",
      "freeShipping": "مجاني",
      "summary": "ملخص الطلب",
      "termsAcknowledgement": "بإتمام هذا الطلب، فإنك توافق على شروط الخدمة وسياسة الخصوصية الخاصة بنا.",
      "trust": {
        "secureCheckout": "دفع آمن",
        "returnsPolicy": "إرجاع خلال 30 يوم",
        "sslEncryption": "اتصال مشفر SSL"
      },
      "errors": {
        "required": "هذا الحقل مطلوب",
        "tooLong": "القيمة طويلة جداً",
        "email": "يرجى إدخال بريد إلكتروني صحيح",
        "phone": { "ksa": "أدخل رقم جوال سعودي (5X XXX XXXX 966+)" },
        "address": { "short": "يرجى إدخال عنوان كامل" },
        "payment": { "required": "يرجى اختيار طريقة دفع" },
        "stockUnavailable": "بعض المنتجات نفدت للتو. يرجى مراجعة السلة.",
        "paymentDeclined": "تم رفض الدفع. سلتك محفوظة — يرجى تجربة طريقة أخرى.",
        "cartEmpty": "سلتك فارغة.",
        "validation": "يرجى تصحيح الحقول المُظللة والمحاولة مرة أخرى.",
        "unknown": "حدث خطأ. يرجى المحاولة لاحقاً أو التواصل مع الدعم."
      }
    },

    "Order": {
      "confirmedTitle": "تم تأكيد طلبك",
      "thanks": "شكراً لتسوقك معنا",
      "reference": "رقم الطلب",
      "emailSent": "لقد أرسلنا بريداً إلكترونياً لتأكيد الطلب مع كافة التفاصيل.",
      "backHome": "العودة للرئيسية",
      "continueShopping": "استمر في التسوق",
      "support": "إذا كان لديك أي أسئلة، يرجى التواصل مع فريق الدعم لدينا.",
      "status": {
        "pending": "قيد الانتظار",
        "confirmed": "مؤكد",
        "shipped": "تم الشحن",
        "delivered": "تم التسليم",
        "cancelled": "ملغي",
        "refunded": "مسترد"
      }
    },

    "Email": {
      "confirmation": {
        "subject": "تم تأكيد طلبك من ORKI",
        "title": "تم تأكيد طلبك",
        "greeting": "شكراً لطلبك يا {name}.",
        "referenceLabel": "رقم الطلب",
        "totalLabel": "الإجمالي",
        "footer": "لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa."
      },
      "shipped": {
        "subject": "طلبك من ORKI في الطريق إليك",
        "title": "تم شحن الطلب",
        "greeting": "أخبار سارة يا {name} — طلبك في الطريق إليك.",
        "referenceLabel": "رقم الطلب",
        "trackingLabel": "رقم التتبع",
        "footer": "لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa."
      },
      "cancelled": {
        "subject": "تم إلغاء طلبك من ORKI",
        "title": "تم إلغاء الطلب",
        "greeting": "مرحباً {name}، تم إلغاء طلبك.",
        "referenceLabel": "رقم الطلب",
        "footer": "لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa."
      },
      "refunded": {
        "subject": "تم استرداد المبلغ من طلبك",
        "title": "تم استرداد المبلغ",
        "greeting": "مرحباً {name}، تم معالجة استردادك.",
        "referenceLabel": "رقم الطلب",
        "footer": "لأي استفسار، يمكنك الرد على هذا البريد أو التواصل مع support@orki.sa."
      }
    }
    ```

    Validate JSON: `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"` and same for ar.json.

    Validate matching shape:

    ```bash
    node -e "
      const en = JSON.parse(require('fs').readFileSync('messages/en.json','utf8'));
      const ar = JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'));
      const flatten = (o, p='') => Object.entries(o).flatMap(([k,v]) => typeof v === 'object' && v !== null ? flatten(v, p+k+'.') : [p+k]);
      const eKeys = flatten(en).sort();
      const aKeys = flatten(ar).sort();
      const missing = eKeys.filter(k => !aKeys.includes(k));
      const extra = aKeys.filter(k => !eKeys.includes(k));
      if (missing.length || extra.length) { console.error({missing, extra}); process.exit(1); }
      console.log('OK', eKeys.length, 'keys matched');
    "
    ```

    Output must include `OK` and a key count >= 50.
  </action>
  <verify>
    <automated>node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'));JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'));console.log('OK')" &amp;&amp; node -e "const f=p=>JSON.parse(require('fs').readFileSync(p,'utf8'));const fl=(o,p='')=>Object.entries(o).flatMap(([k,v])=>typeof v==='object'&amp;&amp;v?fl(v,p+k+'.'):[p+k]);const e=fl(f('messages/en.json')).sort();const a=fl(f('messages/ar.json')).sort();const m=e.filter(k=>!a.includes(k));const x=a.filter(k=>!e.includes(k));if(m.length||x.length){console.error('mismatch',{m,x});process.exit(1)}console.log('matched',e.length)"</automated>
  </verify>
  <acceptance_criteria>
    - `node -e "JSON.parse(require('fs').readFileSync('messages/en.json','utf8'))"` exits 0
    - `node -e "JSON.parse(require('fs').readFileSync('messages/ar.json','utf8'))"` exits 0
    - `grep -c '"Checkout"' messages/en.json` outputs at least 1
    - `grep -c '"Checkout"' messages/ar.json` outputs at least 1
    - `grep -c '"Order"' messages/en.json` outputs at least 1
    - `grep -c '"Email"' messages/en.json` outputs at least 1
    - `grep -c '"errors"' messages/en.json` outputs at least 1
    - `grep -c '"errors"' messages/ar.json` outputs at least 1
    - `grep -c '"phone"' messages/en.json` outputs at least 1
    - `grep -c '"ksa"' messages/en.json` outputs at least 1
    - The key-shape parity script (in &lt;action&gt;) outputs `matched` with a count >= 50
  </acceptance_criteria>
  <done>Both message catalogs include Checkout/Order/Email namespaces with identical key trees. Plan 08-06 can use `useTranslations('Checkout')` and every key referenced by zod schemas resolves.</done>
</task>

</tasks>

<verification>
- `npx vitest run src/lib/checkout/schemas.test.ts` passes
- JSON files parse and key trees match
</verification>

<success_criteria>
Plan 08-05 (server submitCheckout) imports `checkoutSchema` from `@/lib/checkout/schemas` and re-validates client input. Plan 08-06 (form rewire) uses `shippingSchema` with `zodResolver`. All error messages render through next-intl.
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-04-SUMMARY.md`
</output>
