---
phase: 08-cart-checkout-orders
plan: 06
type: execute
wave: 3
depends_on: [08-04, 08-05]
files_modified:
  - src/components/checkout/ShippingForm.tsx
  - src/components/checkout/PaymentGrid.tsx
  - src/components/checkout/OrderSummary.tsx
  - src/components/checkout/CheckoutSteps.tsx
  - src/components/checkout/TrustSignals.tsx
  - src/app/[locale]/checkout/page.tsx
  - src/app/[locale]/checkout/confirmation/page.tsx
autonomous: true
requirements: [UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, UX-09]
must_haves:
  truths:
    - "ShippingForm uses react-hook-form + zodResolver(shippingSchema); errors render via next-intl keys"
    - "Each input has aria-invalid (only when error present) and aria-describedby pointing to its error <p role='alert'>"
    - "Focus moves to the first invalid field on submit failure"
    - "CheckoutSteps shows a numbered progress indicator with aria-current='step' and an aria-live='polite' region"
    - "OrderSummary displays subtotal + shipping + VAT(15%) + total as separate lines using formatSAR (UX-03)"
    - "TrustSignals row sits above the place-order button with bilingual copy (UX-07)"
    - "Place-order button calls submitCheckoutAction inside useTransition; success routes to /checkout/confirmation?ref=ORK-XXXXXX; failure renders the messageKey via next-intl AND preserves the cart"
    - "Confirmation page is a Server Component that reads order by reference; cart-clear is removed (server already cleared it)"
    - "PaymentGrid cards have min-h-[88px] and visible focus-visible ring (UX-04, UX-09)"
    - "Every inline 'isRtl ? ... : ...' string in checkout components is replaced with useTranslations('Checkout' | 'Order')"
  artifacts:
    - path: "src/components/checkout/ShippingForm.tsx"
      provides: "RHF + zodResolver form with full ARIA wiring"
      contains: "useForm"
    - path: "src/components/checkout/CheckoutSteps.tsx"
      provides: "Progress indicator with aria-current"
    - path: "src/components/checkout/TrustSignals.tsx"
      provides: "UX-07 trust badges row"
    - path: "src/app/[locale]/checkout/confirmation/page.tsx"
      provides: "Server Component reading order by reference query param"
      contains: "getOrderByReference"
  key_links:
    - from: "src/app/[locale]/checkout/page.tsx"
      to: "src/app/actions/orders.ts"
      via: "submitCheckoutAction inside useTransition"
      pattern: "submitCheckoutAction"
    - from: "src/components/checkout/ShippingForm.tsx"
      to: "src/lib/checkout/schemas.ts"
      via: "zodResolver(shippingSchema)"
      pattern: "zodResolver"
    - from: "src/app/[locale]/checkout/confirmation/page.tsx"
      to: "src/lib/orders/server.ts"
      via: "getOrderByReference(ref)"
      pattern: "getOrderByReference"
---

<objective>
Rewire every checkout component from inline `isRtl ? ... : ...` ternaries + uncontrolled state to next-intl + react-hook-form + zod. Wire the place-order button to `submitCheckoutAction`. Add a progress indicator (CheckoutSteps), trust signals (TrustSignals), and full ARIA. Convert the confirmation page from a `'use client'` page that clears the cart on mount into a Server Component that reads by `?ref=` from the DB.

Purpose: Delivers UX-01 (guest checkout works end-to-end), UX-02 (visible progress), UX-03 (full cost breakdown), UX-04 (44x44 tap targets), UX-05 (preserve data on error), UX-06 (no raw errors), UX-07 (trust signals), UX-09 (WCAG 2.1 AA).

Output: A user can complete checkout from the UI: shipping then payment then place order then confirmation page reads the persisted order.
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
@src/lib/checkout/schemas.ts
@src/lib/orders/pricing.ts
@src/app/actions/orders.ts
@src/lib/orders/server.ts
@src/components/checkout/ShippingForm.tsx
@src/components/checkout/PaymentGrid.tsx
@src/components/checkout/OrderSummary.tsx
@src/app/[locale]/checkout/page.tsx
@src/app/[locale]/checkout/confirmation/page.tsx
@src/components/admin/InventoryTable.tsx
@messages/en.json
@messages/ar.json
</context>

<tasks>

<task type="auto" tdd="false">
  <name>Task 1: Rewrite ShippingForm to RHF + zod + ARIA; create CheckoutSteps + TrustSignals; harden PaymentGrid</name>
  <files>src/components/checkout/ShippingForm.tsx, src/components/checkout/CheckoutSteps.tsx, src/components/checkout/TrustSignals.tsx, src/components/checkout/PaymentGrid.tsx</files>
  <read_first>
    - src/components/checkout/ShippingForm.tsx (existing 133-line uncontrolled form — Input primitive must be preserved/extended)
    - src/components/checkout/PaymentGrid.tsx (existing — button needs min-h-[88px] + focus-visible)
    - src/lib/checkout/schemas.ts (shippingSchema, ShippingInput, KSA_PHONE_PATTERN)
    - messages/en.json + messages/ar.json (Checkout namespace + nested errors keys)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "ShippingForm.tsx (REWRITE)" + "CheckoutSteps" + "TrustSignals" + "PaymentGrid (MODIFY)" sections
    - .planning/phases/08-cart-checkout-orders/08-RESEARCH.md lines 597-669 (RHF pattern + ARIA + Pitfall 8 + Pitfall 9)
    - CLAUDE.md (logical CSS rules — ms-/me-/ps-/pe- only; 44x44 tap targets)
  </read_first>
  <behavior>
    ShippingForm:
    - 'use client' directive
    - Imports: useForm, zodResolver, useTranslations, shippingSchema, ShippingInput
    - Component signature: ShippingForm({ defaultValues, onValid, formId })
    - mode 'onBlur', noValidate on form
    - Internal Input primitive extended with aria-invalid (only when error), aria-describedby pointing to {id}-error, error p uses role='alert'
    - All field labels and the placeholder come from useTranslations('Checkout') — NO inline isRtl ternaries
    - On submit failure, focus moves to the first invalid field via setFocus
    - Exposes formId so parent page's external "Continue to Payment" button can use button form={formId} type="submit"

    CheckoutSteps (NEW): pure presentation; aria-current="step"; sibling div role="status" aria-live="polite" sr-only that announces "Step 1 of 2".

    TrustSignals (NEW): three icon+label items via lucide-react (Lock, RotateCcw, ShieldCheck) with bilingual labels.

    PaymentGrid (MODIFY): each method button gets min-h-[88px] AND focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40. Replace any isRtl ternary text with useTranslations.
  </behavior>
  <action>
    Replace `src/components/checkout/ShippingForm.tsx` body with:

    ```tsx
    'use client';
    import { useEffect } from 'react';
    import { useForm } from 'react-hook-form';
    import { zodResolver } from '@hookform/resolvers/zod';
    import { useTranslations } from 'next-intl';
    import { shippingSchema, type ShippingInput } from '@/lib/checkout/schemas';

    interface Props {
      defaultValues?: Partial<ShippingInput>;
      onValid: (data: ShippingInput) => void;
      formId?: string;
    }

    export type ShippingFormData = ShippingInput;

    const inputClass =
      "w-full bg-transparent border-b border-white/20 py-3 min-h-[44px] text-white placeholder:text-white/10 " +
      "focus:outline-none focus:border-white transition-colors duration-300 rounded-none";

    function ariaProps(id: string, error: string | undefined) {
      return {
        'aria-invalid': error ? ('true' as const) : undefined,
        'aria-describedby': error ? `${id}-error` : undefined,
      };
    }

    export function ShippingForm({ defaultValues, onValid, formId = 'checkout-shipping-form' }: Props) {
      const t = useTranslations('Checkout');
      const {
        register, handleSubmit, formState: { errors }, setFocus,
      } = useForm<ShippingInput>({
        resolver: zodResolver(shippingSchema),
        defaultValues,
        mode: 'onBlur',
      });

      useEffect(() => {
        const firstError = Object.keys(errors)[0] as keyof ShippingInput | undefined;
        if (firstError) setFocus(firstError);
      }, [errors, setFocus]);

      return (
        <form id={formId} onSubmit={handleSubmit(onValid)} noValidate
              className="space-y-12" aria-label={t('step1')}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
            <Field id="firstName" label={t('firstName')} error={errors.firstName?.message}>
              <input id="firstName" {...register('firstName')} {...ariaProps('firstName', errors.firstName?.message)} className={inputClass} />
            </Field>
            <Field id="lastName" label={t('lastName')} error={errors.lastName?.message}>
              <input id="lastName" {...register('lastName')} {...ariaProps('lastName', errors.lastName?.message)} className={inputClass} />
            </Field>
            <Field id="email" label={t('email')} error={errors.email?.message} className="md:col-span-2">
              <input id="email" type="email" {...register('email')} {...ariaProps('email', errors.email?.message)} className={inputClass} />
            </Field>
            <Field id="phone" label={t('phone')} error={errors.phone?.message} className="md:col-span-2">
              <input id="phone" type="tel" placeholder={t('phonePlaceholder')} {...register('phone')} {...ariaProps('phone', errors.phone?.message)} className={inputClass} />
            </Field>
            <Field id="city" label={t('city')} error={errors.city?.message}>
              <input id="city" {...register('city')} {...ariaProps('city', errors.city?.message)} className={inputClass} />
            </Field>
            <Field id="district" label={t('district')} error={errors.district?.message}>
              <input id="district" {...register('district')} {...ariaProps('district', errors.district?.message)} className={inputClass} />
            </Field>
            <Field id="address" label={t('address')} error={errors.address?.message} className="md:col-span-2">
              <input id="address" {...register('address')} {...ariaProps('address', errors.address?.message)} className={inputClass} />
            </Field>
            <Field id="apartment" label={t('apartment')} error={errors.apartment?.message} className="md:col-span-2">
              <input id="apartment" {...register('apartment')} {...ariaProps('apartment', errors.apartment?.message)} className={inputClass} />
            </Field>
          </div>
        </form>
      );
    }

    interface FieldProps {
      id: string; label: string; error: string | undefined;
      className?: string; children: React.ReactNode;
    }
    function Field({ id, label, error, className, children }: FieldProps) {
      const t = useTranslations('Checkout');
      // error is a translation key like "Checkout.errors.required" — strip namespace prefix
      // because useTranslations is already namespaced to "Checkout".
      const resolvedError = error
        ? error.startsWith('Checkout.') ? t(error.replace(/^Checkout\./, '') as never) : error
        : undefined;
      return (
        <div className={className}>
          <label htmlFor={id} className="block text-[10px] uppercase tracking-widest text-white/40 mb-2 font-bold">{label}</label>
          {children}
          {resolvedError && (
            <p id={`${id}-error`} role="alert" className="text-red-400 text-xs mt-2">{resolvedError}</p>
          )}
        </div>
      );
    }
    ```

    Create `src/components/checkout/CheckoutSteps.tsx`:

    ```tsx
    'use client';
    import { useTranslations } from 'next-intl';
    import { cn } from '@/lib/utils';

    interface Props { current: 1 | 2; total?: 2; }

    export function CheckoutSteps({ current, total = 2 }: Props) {
      const t = useTranslations('Checkout');
      const labels = [t('step1'), t('step2')];
      return (
        <>
          <ol className="flex items-center gap-4" aria-label={t('title')}>
            {labels.map((label, i) => {
              const idx = (i + 1) as 1 | 2;
              const active = idx === current;
              return (
                <li key={label} className="flex items-center gap-3" aria-current={active ? 'step' : undefined}>
                  <span className={cn(
                    'size-6 rounded-full flex items-center justify-center text-[10px] font-bold',
                    active ? 'bg-white text-black' : 'border border-white/20 text-white/40'
                  )}>{idx}</span>
                  <span className={cn(
                    'text-sm font-bold uppercase tracking-widest',
                    active ? 'text-white' : 'text-white/40'
                  )}>{label}</span>
                </li>
              );
            })}
          </ol>
          <div role="status" aria-live="polite" className="sr-only">
            {t('stepProgress', { current, total })}
          </div>
        </>
      );
    }
    ```

    Create `src/components/checkout/TrustSignals.tsx`:

    ```tsx
    'use client';
    import { useTranslations } from 'next-intl';
    import { Lock, RotateCcw, ShieldCheck } from 'lucide-react';

    export function TrustSignals() {
      const t = useTranslations('Checkout.trust');
      const items = [
        { icon: Lock, label: t('secureCheckout') },
        { icon: RotateCcw, label: t('returnsPolicy') },
        { icon: ShieldCheck, label: t('sslEncryption') },
      ];
      return (
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 py-4 border-y border-white/10">
          {items.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/50">
              <Icon className="size-3.5" aria-hidden />
              <span>{label}</span>
            </li>
          ))}
        </ul>
      );
    }
    ```

    Modify `src/components/checkout/PaymentGrid.tsx`. Find each payment-method `<button>` element. Add the utilities `min-h-[88px]` (Pitfall 8) and `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black` (UX-09). If existing labels use `isRtl ? ... : ...` ternaries, replace them with `useTranslations('Checkout')`. Brand names (Mada, Apple Pay, Visa) stay literal.
  </action>
  <verify>
    <automated>grep -c "useForm" src/components/checkout/ShippingForm.tsx; grep -c "zodResolver" src/components/checkout/ShippingForm.tsx; grep -c "aria-invalid" src/components/checkout/ShippingForm.tsx; grep -c "min-h-\[88px\]" src/components/checkout/PaymentGrid.tsx; npx tsc --noEmit 2>&amp;1 | grep -E "ShippingForm|CheckoutSteps|TrustSignals|PaymentGrid" | grep -i error; test $? -ne 0</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "useForm" src/components/checkout/ShippingForm.tsx` outputs at least 1
    - `grep -c "zodResolver(shippingSchema)" src/components/checkout/ShippingForm.tsx` outputs 1
    - `grep -c "aria-invalid" src/components/checkout/ShippingForm.tsx` outputs at least 1
    - `grep -c "role=\"alert\"" src/components/checkout/ShippingForm.tsx` outputs at least 1
    - `grep -c "useTranslations" src/components/checkout/ShippingForm.tsx` outputs at least 1
    - `grep -cE "isRtl \\? '" src/components/checkout/ShippingForm.tsx` outputs 0
    - `test -f src/components/checkout/CheckoutSteps.tsx`
    - `grep -c "aria-current" src/components/checkout/CheckoutSteps.tsx` outputs at least 1
    - `grep -c "aria-live" src/components/checkout/CheckoutSteps.tsx` outputs at least 1
    - `test -f src/components/checkout/TrustSignals.tsx`
    - `grep -c "min-h-\[88px\]" src/components/checkout/PaymentGrid.tsx` outputs at least 1
    - `grep -c "focus-visible:ring" src/components/checkout/PaymentGrid.tsx` outputs at least 1
    - `grep -E "\\b(ml-|mr-|pl-|pr-|left-|right-)" src/components/checkout/ShippingForm.tsx src/components/checkout/CheckoutSteps.tsx src/components/checkout/TrustSignals.tsx src/components/checkout/PaymentGrid.tsx | wc -l` outputs 0
    - `npx tsc --noEmit` exits 0
  </acceptance_criteria>
  <done>Form is RHF+zod+ARIA, progress indicator and trust signals exist, PaymentGrid hardened.</done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Update OrderSummary to halalas + VAT line; rewire checkout/page.tsx to submitCheckoutAction; convert confirmation page to Server Component</name>
  <files>src/components/checkout/OrderSummary.tsx, src/app/[locale]/checkout/page.tsx, src/app/[locale]/checkout/confirmation/page.tsx</files>
  <read_first>
    - src/components/checkout/OrderSummary.tsx (existing layout — keep visual structure, swap math + add VAT line)
    - src/app/[locale]/checkout/page.tsx (existing client component — replace fetch('/api/checkout/mock') with submitCheckoutAction)
    - src/app/[locale]/checkout/confirmation/page.tsx (existing 'use client' — convert to Server Component)
    - src/lib/orders/pricing.ts (computeOrderTotals + formatSAR)
    - src/app/actions/orders.ts (submitCheckoutAction)
    - src/lib/orders/server.ts (getOrderByReference)
    - src/app/[locale]/admin/inventory/page.tsx (Server Component pattern — `export const dynamic = 'force-dynamic'`)
    - .planning/phases/08-cart-checkout-orders/08-PATTERNS.md "OrderSummary.tsx (MODIFY)" + "checkout/page.tsx" + "confirmation/page.tsx" sections
    - .planning/phases/08-cart-checkout-orders/08-CONTEXT.md "Money & pricing" + "Shipping" + "Trust signals" sections
    - messages/en.json messages/ar.json (Order namespace, Checkout.* keys)
  </read_first>
  <behavior>
    OrderSummary:
    - Imports: `useTranslations`, `useLocale` from `next-intl`; `computeOrderTotals`, `formatSAR` from `@/lib/orders/pricing`.
    - Removes inline `isRtl ? ... : ...` strings; replaces with `useTranslations('Checkout')`.
    - Recomputes subtotal+shipping+VAT+total via `computeOrderTotals(items.map(i => ({ unitPriceCents: i.product.price * 100, quantity: i.quantity })))`.
    - Renders FOUR rows: Subtotal, Shipping (or "Free" when shippingCents===0), VAT (15%), Total. All use `formatSAR(cents, locale)`.
    - Uses logical CSS `pe-2` (already present), `border-s/e-` if needed.

    checkout/page.tsx (replace handlePlaceOrder body):
    - Replace `fetch('/api/checkout/mock', ...)` block with `useTransition` + `submitCheckoutAction` call.
    - Server Action input: `{ shipping: shippingData, payment: { method: paymentMethod } }`.
    - On `result.ok === true`, `router.push(\`/checkout/confirmation?ref=${result.data.reference}\`)`.
    - On `result.ok === false`, set `error = t(result.messageKey.replace(/^Checkout\./,''))` and stay on the page (cart preserved).
    - Replace inline isRtl ternaries (h1 "Checkout", "Shipping Information", "Payment Method", buttons) with `useTranslations('Checkout')`.
    - Mount `<CheckoutSteps current={step} />` at the top of the form column.
    - Render `<TrustSignals />` directly above the place-order button.
    - Replace `setIsSubmitting/isSubmitting` with `isPending` from `useTransition`.

    confirmation/page.tsx:
    - Remove `'use client'`. Make it `async export default function ConfirmationPage`.
    - `export const dynamic = 'force-dynamic'`.
    - Read `searchParams.ref` (or fallback `searchParams.orderId` for legacy redirect, treat as ref).
    - If ref absent → call `notFound()` from `next/navigation`.
    - `await getOrderByReference(ref)`. If null → `notFound()`.
    - Use `getTranslations('Order')` (server-side) for labels.
    - Render the existing visual layout but use the canonical reference and use `formatSAR(order.totalCents, locale)`.
    - REMOVE the cart-clear `useEffect` — server already cleared `cartItems` inside the transaction.
  </behavior>
  <action>
    Replace `src/components/checkout/OrderSummary.tsx`:

    ```tsx
    'use client';

    import { useCartStore } from '@/store/cartStore';
    import { useLocale, useTranslations } from 'next-intl';
    import type { Locale } from '@/types/domain';
    import { computeOrderTotals, formatSAR } from '@/lib/orders/pricing';

    interface OrderSummaryProps { locale?: Locale; }

    export function OrderSummary({ locale: localeProp }: OrderSummaryProps) {
      const localeFromIntl = useLocale() as Locale;
      const locale = localeProp ?? localeFromIntl;
      const t = useTranslations('Checkout');
      const { items } = useCartStore();

      const totals = computeOrderTotals(
        items.map(i => ({ unitPriceCents: i.product.price * 100, quantity: i.quantity }))
      );

      return (
        <div className="bg-[#111111] border border-white/10 p-8 space-y-8 sticky top-24">
          <h2 className="text-sm font-bold uppercase tracking-widest text-white/40 border-b border-white/10 pb-4">
            {t('summary')}
          </h2>

          <div className="space-y-6 max-h-[400px] overflow-y-auto pe-2 custom-scrollbar">
            {items.map((item) => (
              <div key={`${item.product.id}-${item.selectedSize}`} className="flex gap-4">
                <div className="relative size-16 bg-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center select-none">
                  <span className="font-semibold tracking-widest text-[8px] uppercase" style={{ color: 'rgba(255,255,255,0.15)' }}>ORKI</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[12px] font-bold uppercase text-white truncate">{item.product.name[locale]}</h3>
                  <p className="text-[10px] text-white/40 mt-1">{item.selectedSize} × {item.quantity}</p>
                </div>
                <p className="text-[12px] font-bold text-white whitespace-nowrap">
                  {formatSAR(item.product.price * 100 * item.quantity, locale)}
                </p>
              </div>
            ))}
          </div>

          <div className="space-y-4 pt-8 border-t border-white/10">
            <Row label={t('subtotal')} value={formatSAR(totals.subtotalCents, locale)} />
            <Row
              label={t('shipping')}
              value={totals.shippingCents === 0
                ? t('freeShipping')
                : formatSAR(totals.shippingCents, locale)}
            />
            <Row label={t('vat')} value={formatSAR(totals.vatCents, locale)} />
            <div className="flex justify-between pt-4 border-t border-white/20">
              <span className="text-white uppercase tracking-widest text-xs font-bold">{t('total')}</span>
              <span className="text-xl font-bold text-white tabular-nums">{formatSAR(totals.totalCents, locale)}</span>
            </div>
          </div>

          <div className="p-4 bg-white/[0.03] border border-white/5 rounded-sm">
            <p className="text-[10px] text-white/30 uppercase tracking-tighter leading-relaxed">{t('termsAcknowledgement')}</p>
          </div>
        </div>
      );
    }

    function Row({ label, value }: { label: string; value: string }) {
      return (
        <div className="flex justify-between text-sm">
          <span className="text-white/40 uppercase tracking-widest text-[10px] font-bold">{label}</span>
          <span className="text-white tabular-nums">{value}</span>
        </div>
      );
    }
    ```

    Replace `src/app/[locale]/checkout/page.tsx`:

    ```tsx
    'use client';

    import { use, useState, useTransition } from 'react';
    import { useTranslations } from 'next-intl';
    import { ShippingForm, type ShippingFormData } from '@/components/checkout/ShippingForm';
    import { OrderSummary } from '@/components/checkout/OrderSummary';
    import { PaymentGrid, type PaymentMethod } from '@/components/checkout/PaymentGrid';
    import { CheckoutSteps } from '@/components/checkout/CheckoutSteps';
    import { TrustSignals } from '@/components/checkout/TrustSignals';
    import { useRouter } from '@/i18n/navigation';
    import { submitCheckoutAction } from '@/app/actions/orders';
    import type { Locale } from '@/types/domain';
    import { Loader2, AlertCircle } from 'lucide-react';
    import { cn } from '@/lib/utils';

    interface CheckoutPageProps { params: Promise<{ locale: string }>; }

    export default function CheckoutPage({ params }: CheckoutPageProps) {
      const { locale } = use(params);
      const router = useRouter();
      const t = useTranslations('Checkout');

      const [step, setStep] = useState<1 | 2>(1);
      const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
      const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
      const [error, setError] = useState<string | null>(null);
      const [isPending, startTransition] = useTransition();

      const handleShippingSubmit = (data: ShippingFormData) => {
        setShippingData(data);
        setStep(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };

      const handlePlaceOrder = () => {
        if (!paymentMethod || !shippingData) return;
        setError(null);
        startTransition(async () => {
          const result = await submitCheckoutAction({
            shipping: shippingData,
            payment: { method: paymentMethod },
          });
          if (!result.ok) {
            // Map messageKey "Checkout.errors.foo" → namespaced t('errors.foo')
            const key = result.messageKey.startsWith('Checkout.')
              ? result.messageKey.replace(/^Checkout\./, '')
              : result.messageKey;
            try { setError(t(key as never)); } catch { setError(t('errors.unknown')); }
            return;
          }
          router.push(`/checkout/confirmation?ref=${result.data.reference}`);
        });
      };

      return (
        <div className="min-h-screen bg-black pt-24 pb-32">
          <div className="max-w-[1280px] mx-auto px-6">
            <h1 className="text-3xl md:text-5xl font-bold uppercase tracking-tighter mb-8 text-white">
              {t('title')}
            </h1>
            <div className="mb-12"><CheckoutSteps current={step} /></div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-7 space-y-16">
                <section className={step === 2 ? 'opacity-40' : ''}>
                  <div className="flex justify-between items-center mb-10">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-white">{t('step1')}</h2>
                    {step === 2 && (
                      <button onClick={() => setStep(1)}
                              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white underline underline-offset-4 min-h-[44px]">
                        {t('edit')}
                      </button>
                    )}
                  </div>
                  {step === 1 ? (
                    <div className="space-y-12">
                      <ShippingForm
                        formId="checkout-shipping-form"
                        defaultValues={shippingData ?? undefined}
                        onValid={handleShippingSubmit}
                      />
                      <button form="checkout-shipping-form" type="submit"
                              className="w-full h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest hover:bg-white/90 transition-colors min-h-[44px]">
                        {t('continueToPayment')}
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-white/60">
                      <p>{shippingData?.firstName} {shippingData?.lastName}</p>
                      <p>{shippingData?.address}, {shippingData?.district}</p>
                      <p>{shippingData?.city}</p>
                    </div>
                  )}
                </section>

                <section className={step === 1 ? 'opacity-40 pointer-events-none' : ''}>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white mb-10">{t('step2')}</h2>
                  <div className="space-y-10">
                    <PaymentGrid locale={locale as Locale} selected={paymentMethod} onSelect={setPaymentMethod} />

                    {error && (
                      <div role="alert" className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3 text-red-400">
                        <AlertCircle className="size-5 shrink-0" aria-hidden />
                        <p className="text-sm">{error}</p>
                      </div>
                    )}

                    <TrustSignals />

                    <button onClick={handlePlaceOrder} disabled={!paymentMethod || isPending}
                            className={cn(
                              "w-full h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest",
                              "disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/90 transition-colors",
                              "flex items-center justify-center gap-3 min-h-[44px]",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                            )}>
                      {isPending ? (
                        <><Loader2 className="size-5 animate-spin" aria-hidden /> {t('processing')}</>
                      ) : (
                        t('placeOrder')
                      )}
                    </button>
                  </div>
                </section>
              </div>

              <div className="lg:col-span-5">
                <OrderSummary locale={locale as Locale} />
              </div>
            </div>
          </div>
        </div>
      );
    }
    ```

    Replace `src/app/[locale]/checkout/confirmation/page.tsx`:

    ```tsx
    import { notFound } from 'next/navigation';
    import { getTranslations } from 'next-intl/server';
    import { Link } from '@/i18n/navigation';
    import { CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
    import { getOrderByReference } from '@/lib/orders/server';
    import { formatSAR } from '@/lib/orders/pricing';
    import type { Locale } from '@/types/domain';

    export const dynamic = 'force-dynamic';

    interface Props {
      params: Promise<{ locale: string }>;
      searchParams: Promise<{ ref?: string; orderId?: string }>;
    }

    export default async function ConfirmationPage({ params, searchParams }: Props) {
      const { locale } = await params;
      const sp = await searchParams;
      const ref = sp.ref ?? sp.orderId;
      if (!ref) notFound();

      const order = await getOrderByReference(ref);
      if (!order) notFound();

      const t = await getTranslations('Order');
      const isRtl = locale === 'ar';
      const loc = locale as Locale;

      return (
        <div className="min-h-screen bg-black flex items-center justify-center py-24 px-6">
          <div className="max-w-xl w-full text-center space-y-12">
            <div className="flex flex-col items-center space-y-6">
              <div className="size-20 rounded-full bg-white/5 flex items-center justify-center">
                <CheckCircle2 className="size-10 text-white" aria-hidden />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white">{t('confirmedTitle')}</h1>
                <p className="text-white/40 uppercase tracking-widest text-xs font-bold">{t('thanks')}</p>
              </div>
            </div>

            <div className="bg-[#111111] border border-white/10 p-8 rounded-lg space-y-4">
              <p className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{t('reference')}</p>
              <p className="text-2xl font-mono font-bold text-white tracking-widest">{order.reference}</p>
              <p className="text-white text-sm">{formatSAR(order.totalCents, loc)}</p>
              <p className="text-[12px] text-white/60 leading-relaxed max-w-sm mx-auto">{t('emailSent')}</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8">
              <Link href="/"
                    className="w-full sm:w-auto px-10 h-14 bg-white text-black rounded-lg font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white/90 transition-colors min-h-[44px]">
                {t('backHome')}
              </Link>
              <Link href="/shop"
                    className="w-full sm:w-auto text-sm font-bold uppercase tracking-widest text-white underline underline-offset-8 hover:text-white/80 transition-colors flex items-center gap-2 min-h-[44px]">
                {t('continueShopping')}
                {isRtl ? <ArrowLeft className="size-4" aria-hidden /> : <ArrowRight className="size-4" aria-hidden />}
              </Link>
            </div>

            <p className="text-[10px] text-white/20 uppercase tracking-tighter">{t('support')}</p>
          </div>
        </div>
      );
    }
    ```

    Run `npx next build` and fix any type/runtime issues.
  </action>
  <verify>
    <automated>grep -c "submitCheckoutAction" src/app/[locale]/checkout/page.tsx; grep -c "useTransition" src/app/[locale]/checkout/page.tsx; grep -c "getOrderByReference" src/app/[locale]/checkout/confirmation/page.tsx; grep -cE "^'use client'" src/app/[locale]/checkout/confirmation/page.tsx; grep -c "computeOrderTotals" src/components/checkout/OrderSummary.tsx; grep -c "formatSAR" src/components/checkout/OrderSummary.tsx; npx next build 2>&amp;1 | tail -5; test ${PIPESTATUS[6]} -eq 0</automated>
  </verify>
  <acceptance_criteria>
    - `grep -c "submitCheckoutAction" src/app/[locale]/checkout/page.tsx` outputs at least 1
    - `grep -c "useTransition" src/app/[locale]/checkout/page.tsx` outputs at least 1
    - `grep -c "fetch('/api/checkout/mock'" src/app/[locale]/checkout/page.tsx` outputs 0
    - `grep -c "<CheckoutSteps" src/app/[locale]/checkout/page.tsx` outputs at least 1
    - `grep -c "<TrustSignals" src/app/[locale]/checkout/page.tsx` outputs at least 1
    - `grep -c "computeOrderTotals" src/components/checkout/OrderSummary.tsx` outputs 1
    - `grep -c "formatSAR" src/components/checkout/OrderSummary.tsx` outputs at least 3
    - `grep -c "getOrderByReference" src/app/[locale]/checkout/confirmation/page.tsx` outputs 1
    - `grep -cE "^'use client'" src/app/[locale]/checkout/confirmation/page.tsx` outputs 0 (now Server Component)
    - `grep -c "useEffect" src/app/[locale]/checkout/confirmation/page.tsx` outputs 0 (no client hooks)
    - `grep -c "clearCart" src/app/[locale]/checkout/confirmation/page.tsx` outputs 0
    - `grep -c "notFound" src/app/[locale]/checkout/confirmation/page.tsx` outputs at least 1
    - `grep -E "\\b(ml-|mr-|pl-|pr-|left-|right-)" src/components/checkout/OrderSummary.tsx src/app/[locale]/checkout/page.tsx src/app/[locale]/checkout/confirmation/page.tsx | wc -l` outputs 0
    - `npx next build` exits 0
  </acceptance_criteria>
  <done>Full checkout flow: cart already DB-backed → click "Continue to Payment" submits validated form → click "Complete Purchase" calls submitCheckoutAction → on success routes to confirmation page that reads the order from DB. Failure preserves cart and shows bilingual error.</done>
</task>

</tasks>

<verification>
- `npx next build` exits 0
- Manual UAT: with a stocked product in the cart, complete checkout → land on confirmation page showing the persisted order with a real ORK-XXXXXX reference
- With phone "+966 50 123 4911", form submits successfully but checkout returns paymentDeclined error AND cart is preserved
</verification>

<success_criteria>
End-to-end checkout works against the real DB. Cart preserved on failure. All UX-01..UX-09 requirements wired through this plan's components and the prior plans' libraries. No raw error strings shown to users.
</success_criteria>

<output>
After completion, create `.planning/phases/08-cart-checkout-orders/08-06-SUMMARY.md`
</output>
