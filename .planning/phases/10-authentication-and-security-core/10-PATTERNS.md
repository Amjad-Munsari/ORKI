---
phase: 10
phase_name: Authentication & Security Core
phase_slug: authentication-and-security-core
mapped: 2026-05-10
---

# Phase 10 — Patterns Map

This map tells the planner exactly which existing files to mirror when authoring each new/modified file in Phase 10. Excerpts include line numbers when load-bearing. Several files have **no in-repo analog** (Supabase clients, RLS migration, security headers, Playwright config); for those, the planner must follow the verbatim canonical pattern from `10-RESEARCH.md` cited inline below.

CONTEXT.md and RESEARCH.md agree on every decision relevant here. No conflicts.

---

## File Classification

### NEW — Supabase clients (no in-repo analog)

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/supabase/client.ts` | infra (browser client factory) | request-response | none | NO ANALOG — copy `@supabase/ssr` canonical from RESEARCH §2.5 / §6 |
| `src/lib/supabase/server.ts` | infra (SSR client factory, RLS-bound) | request-response | `src/lib/cart/session.ts` (cookies + `'server-only'`) | partial (cookie-handling shape only) |
| `src/lib/supabase/admin.ts` | infra (service-role client) | request-response | `src/lib/db/client.ts` (singleton + `'server-only'` + env-gated) | role-match |

### NEW — Auth library

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/auth/schemas.ts` | utility (zod) | transform | `src/lib/checkout/schemas.ts` (referenced from `ShippingForm.tsx:7`) + `src/lib/env.ts` z.object pattern | exact |
| `src/lib/auth/errors.ts` | utility (error mapper) | transform | `src/app/actions/cart.ts:30-37` (`ActionResult` discriminated union) | role-match |
| `src/lib/auth/audit.ts` | service (DB write) | event-driven | `src/lib/cart/session.ts` (`'server-only'` + Drizzle insert) | role-match |
| `src/lib/auth/admin-allowlist.ts` | utility (env-driven check) | request-response | `src/lib/env.ts` (env-driven helper) | partial |

### NEW — Server Actions

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/actions/auth.ts` | controller (Server Action) | request-response | `src/app/actions/cart.ts` (entire file, 113 lines) | exact |

### NEW — Route handler

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/api/auth/callback/route.ts` | route handler (recovery callback) | request-response | `src/app/api/cart/route.ts` (NextResponse + try/catch envelope) | role-match |

### NEW — Auth pages (auth route group)

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/[locale]/(auth)/login/page.tsx` | page (RSC) | request-response | `src/app/[locale]/checkout/confirmation/page.tsx:1-50` (RSC + getTranslations + centred chrome) | role-match |
| `src/app/[locale]/(auth)/signup/page.tsx` | page (RSC) | request-response | same | role-match |
| `src/app/[locale]/(auth)/forgot-password/page.tsx` | page (RSC) | request-response | same | role-match |
| `src/app/[locale]/(auth)/reset-password/page.tsx` | page (mixed RSC + token-verify client island) | event-driven | `src/app/[locale]/checkout/page.tsx` (client form + Server Action) | partial |

> **Layout note:** UI-SPEC §"Page Chrome (Auth Routes)" intentionally does NOT specify a shared `(auth)/layout.tsx`. The four pages each emit identical `<main className="min-h-[calc(100vh-80px)] bg-black flex items-center justify-center py-24 px-6">` chrome. Optional: extract to a layout if duplication exceeds budget. The `(auth)` parens make it a Next.js [route group](https://nextjs.org/docs/app/building-your-application/routing/route-groups) — does NOT add a URL segment.

### NEW — Account pages

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/app/[locale]/account/layout.tsx` | layout (auth gate) | request-response | `src/app/[locale]/admin/layout.tsx` (sticky chrome) — but minimal pass-through is the pattern. RESEARCH §2.5 gate. | role-match |
| `src/app/[locale]/account/page.tsx` | page (RSC, RLS-gated) | CRUD | `src/app/[locale]/admin/inventory/page.tsx` (`force-dynamic` + RSC fetch + table component) | role-match |
| `src/app/[locale]/account/orders/[reference]/page.tsx` | page (RSC, RLS-gated) | request-response | `src/app/[locale]/admin/orders/[reference]/page.tsx` (existing — `getOrderByReference` + `notFound()`) | exact |

### NEW — Auth components

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/components/auth/LoginForm.tsx` | component (RHF client form) | request-response | `src/components/checkout/ShippingForm.tsx` (RHF + `Field` helper + `ariaProps`) | exact |
| `src/components/auth/SignupForm.tsx` | component (RHF client form + checkbox) | request-response | `ShippingForm.tsx` + UI-SPEC §"Checkbox" inline spec | exact / partial |
| `src/components/auth/ForgotPasswordForm.tsx` | component (RHF, single field) | request-response | `ShippingForm.tsx` (subset) | exact |
| `src/components/auth/ResetPasswordForm.tsx` | component (RHF + token effect) | request-response | `ShippingForm.tsx` + token-handling per RESEARCH §6 | partial |
| `src/components/auth/SignOutButton.tsx` | component (form-action button) | event-driven | `src/components/admin/InventoryTable.tsx:17,23-27` (`useTransition` + Server Action) | role-match |
| `src/components/auth/UserMenu.tsx` | component (dropdown) | event-driven | `src/components/nav/CategoryDropdown.tsx` / `src/components/nav/ShopDropdown.tsx` (base-ui menu) | role-match |
| `src/components/account/OrdersList.tsx` | component (presentational list) | — | `src/components/admin/InventoryTable.tsx` (table over data) | partial |
| `src/components/account/OrderRow.tsx` | component (link card) | — | `src/components/cart/CartItem.tsx` (block card) + UI-SPEC §"`<OrderRow>` spec" | role-match |
| `src/components/order/OrderDetailView.tsx` | component (refactor) | — | `src/app/[locale]/checkout/confirmation/page.tsx:52-109` (lift the `[#111111]` card markup) | exact (extract) |

### MODIFY — existing files

| Modified file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/middleware.ts` | infra (middleware) | request-response | self (4 lines today) — wrap with Supabase per RESEARCH §7 #10 | n/a |
| `src/lib/env.ts` | config (zod) | — | self — extend the `z.object` per RESEARCH §7 #7 | exact (additive) |
| `src/lib/db/schema.ts` | model | CRUD | self — change `text('user_id')` → `uuid('user_id')` on `carts` (line 109) and `orders` (line 162); add `auth_events` pgTable | exact (extension) |
| `src/lib/cart/session.ts` | service | request-response | self — add merge hook after the existing cookie-or-create logic (line 45+) | exact (extension) |
| `src/app/[locale]/admin/layout.tsx` | layout (gate) | request-response | self + `src/lib/auth/admin-allowlist.ts` + RESEARCH §2.5 SSR getUser pattern | exact (extension) |
| `src/components/nav/Navbar.tsx` | component | — | self (existing `MobileNavDrawer`/`CartTrigger`/`LanguageSwitcher` slot pattern, lines 50-66) | exact (additive) |
| `src/components/nav/MobileNavDrawer.tsx` | component | — | self | exact (additive) |
| `messages/en.json` & `messages/ar.json` | i18n | — | self (`Footer.legal`, `Order.*`, `Checkout.*` precedents from Phase 8/9) | exact (additive) |
| `next.config.ts` | config | — | self (current 18-line file) — fresh `headers()` block | n/a (fresh) |

### NEW — Migration

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql` | migration (hand-authored) | batch | `src/lib/db/migrations/0001_phase8_cart_orders.sql` (drizzle-kit emitted file shape) | partial |
| `src/lib/db/migrations/meta/_journal.json` (modified) | migration manifest | — | self — add `0002` entry with `breakpoints: false` per RESEARCH §6 last row | exact (additive) |

> Existing `0001_phase8_cart_orders.sql` was drizzle-kit-generated. `0002` is **hand-authored** because drizzle-kit cannot emit RLS policies, cross-schema FKs to `auth.users(id)`, or `ALTER COLUMN ... USING ::uuid`. Pattern: register manually in `meta/_journal.json`. Workflow documented in `08-01-SUMMARY.md`.

### NEW — Tests

| New file | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `tests/auth/signup.test.ts` | test (integration) | — | `tests/integration/cart-merge.test.ts` (live-DB pattern) | role-match |
| `tests/auth/signin.test.ts` | test | — | same | role-match |
| `tests/auth/lockout.test.ts` | test (slow, manual) | — | none — flag with `it.skip` for CI per RESEARCH §3 | role-match |
| `tests/actions/auth.test.ts` | test (unit) | — | `tests/products.test.ts` (vitest unit) | role-match |
| `tests/security/headers.test.ts` | test (curls live) | — | none — pattern in RESEARCH §3 | NO ANALOG |
| `tests/security/csp.test.ts` | test (assertion on string) | — | `tests/products.test.ts` | role-match |
| `tests/audit/auth-events.test.ts` | test (live DB) | — | `tests/integration/cart-merge.test.ts` | role-match |
| `tests/rls/cross-user-deny.test.ts` | test (live DB + Supabase clients) | — | `tests/integration/cart-merge.test.ts` | partial |
| `tests/setup/supabase-test-client.ts` | test fixture | — | `tests/helpers/test-db.ts` (cleanup helpers + `hasDbUrl` gate) | role-match |
| `tests/e2e/csrf.spec.ts` | test (Playwright) | — | none — net-new framework | NO ANALOG |
| `tests/e2e/admin-gate.spec.ts` | test (Playwright) | — | none | NO ANALOG |
| `tests/e2e/cart-merge.spec.ts` | test (Playwright) | — | none | NO ANALOG |
| `tests/e2e/password-reset.spec.ts` | test (Playwright) | — | none | NO ANALOG |
| `playwright.config.ts` | test config | — | none — net-new (Wave 0 install) | NO ANALOG |

---

## Per-file Pattern Assignments

### `src/lib/supabase/client.ts` (NEW — browser client factory)

**Analog:** none in repo. Use the **canonical `@supabase/ssr` browser pattern** from RESEARCH §2.5.

**What to copy:**
```ts
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

**What to diverge:** No `'server-only'` here — this file MUST be importable from Client Components. Do not attach cookies (browser cookies handled automatically by `createBrowserClient`).

**Notes:** Single function export; do NOT cache the instance (Supabase docs explicitly recommend creating per-call). Used only in Client Components (e.g., a future `useSupabase()` hook). Phase 10 has minimal client-side Supabase usage — `getUser()` is server-side only. UI-SPEC §"Header Changes" reads user via the SSR client in `Navbar` (RSC), not this client.

---

### `src/lib/supabase/server.ts` (NEW — SSR client factory, RLS-bound)

**Analog:** `src/lib/cart/session.ts` (closest cookie-handling helper in repo, lines 1-15).

**What to copy from `cart/session.ts`:**
- `import 'server-only';` at top (line 8)
- `import { cookies } from 'next/headers';` (line 9)
- `await cookies();` async API (line 27)
- File-level docblock describing context constraints (Server Actions, Route Handlers, Server Components)

**Canonical body** (RESEARCH §2.5 / Supabase Next.js guide):
```ts
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* called from RSC — ignore; middleware refresh covers it */ }
        },
      },
    },
  );
}
```

**What to diverge from `cart/session.ts`:** No nanoid, no `db.insert(...)`. This factory does not own a row in our DB — it owns a Supabase JWT cookie pair (`sb-access-token`, `sb-refresh-token`). The `try/catch` swallow on `setAll` is **intentional** per Supabase docs — RSCs can call `getUser()` but cannot write cookies; the cookie write succeeds via middleware refresh.

**Note on `getUser()` vs `getSession()`:** Per RESEARCH §7 #3, **always use `getUser()` in middleware and route gates** (it revalidates against Supabase Auth). Use `getSession()` only for non-security-critical UI ("signed in as ..." line).

---

### `src/lib/supabase/admin.ts` (NEW — service-role client, bypasses RLS)

**Analog:** `src/lib/db/client.ts` lines 1-34 (`'server-only'` + env-gated + singleton).

**What to copy:**
- `import 'server-only';` (line 10 of `db/client.ts`)
- env-gated null fallback (Resend client pattern from `08-PATTERNS.md` line 333)
- Top-of-file docblock explaining the boundary

**Canonical body** (RESEARCH §2.5):
```ts
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * Service-role client. Bypasses RLS. NEVER import from non-admin paths.
 * Enforced by:
 *   1. `'server-only'` (above)
 *   2. ESLint `no-restricted-imports` blocking imports outside src/app/actions/admin/** and src/app/[locale]/admin/**
 *   3. SUPABASE_SERVICE_ROLE_KEY has no NEXT_PUBLIC_ prefix → bundler refuses to inline
 */
export function createAdminClient() {
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    { cookies: { getAll() { return []; }, setAll() {} } },  // intentionally no cookie attach
  );
}
```

**What to diverge from `server.ts`:** **NO cookie attachment.** Per RESEARCH §2.5, the service-role bypass is determined by the Authorization header. If a user JWT leaks in via cookies, the JWT wins and RLS applies — defeating the bypass. Empty `getAll`/`setAll` is the documented Supabase escape hatch.

**Anti-pattern to reject:** Do NOT export this as a top-level singleton like `export const supabaseAdmin = ...`. Make it a factory function so it cannot be inadvertently captured at module load.

---

### `src/lib/auth/schemas.ts` (NEW — zod schemas)

**Analog:** `src/lib/checkout/schemas.ts` (consumed by `ShippingForm.tsx:7`) + `src/lib/env.ts:11-28` (z.object pattern).

**What to copy:**
- `z.object({...})` shape with each field calling `.min(...)` / `.email()` / `.transform()` as needed
- `export type SignupInput = z.infer<typeof signupSchema>;` next to each schema
- Error keys as full namespaced strings (e.g., `'Auth.errors.emailRequired'`) to be resolved by the `Field` helper's `t.replace(/^Auth\./, '')` shim (mirrors `ShippingForm.tsx:178-186` "Schemas store error keys as full dotted paths" pattern)

**Schemas to define** (one per Server Action):
```ts
export const signupSchema = z.object({
  email: z.string().email('Auth.errors.emailInvalid'),
  password: z.string().min(8, 'Auth.errors.passwordTooShort'),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: 'Auth.errors.acceptTermsRequired' }) }),
});

export const signinSchema = z.object({
  email: z.string().email('Auth.errors.emailInvalid'),
  password: z.string().min(1, 'Auth.errors.passwordRequired'),
});

export const requestResetSchema = z.object({
  email: z.string().email('Auth.errors.emailInvalid'),
});

export const setPasswordSchema = z.object({
  password: z.string().min(8, 'Auth.errors.passwordTooShort'),
  confirmPassword: z.string().min(8),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Auth.errors.passwordMismatch',
  path: ['confirmPassword'],
});
```

**What to diverge:** UI-SPEC §"Bilingual Copywriting Contract" defines all error keys; do NOT invent new ones. Reuse `errors.unknown`, `errors.invalidCredentials`, etc. verbatim.

---

### `src/lib/auth/errors.ts` (NEW — Supabase error → messageKey mapper)

**Analog:** `src/app/actions/cart.ts:30-37` (the `ActionResult` discriminated union).

**Pattern:** copy the envelope shape exactly, **extend** the `code` literal union with the auth-specific codes from RESEARCH §6:

```ts
export type AuthActionResult<T = unknown> =
  | { ok: true; data: T }
  | {
      ok: false;
      code:
        | 'INVALID_CREDENTIALS'
        | 'EMAIL_IN_USE'
        | 'WEAK_PASSWORD'
        | 'RATE_LIMITED'
        | 'VALIDATION'
        | 'UNKNOWN';
      fields?: Record<string, string>;
      messageKey: string;
    };
```

**Generic-error rule (SEC-06):** UI-SPEC §"Generic-error rule" mandates that wrong-email and wrong-password BOTH map to `Auth.errors.invalidCredentials`. Mapper signature:

```ts
export function mapSupabaseError(err: unknown): { code: AuthActionResult['code']; messageKey: string } {
  // Supabase returns { message: 'Invalid login credentials' } for both wrong-email and wrong-password.
  // Always collapse to invalidCredentials. NEVER differentiate.
  // Map rate-limit (429) to RATE_LIMITED → 'Auth.errors.tooManyAttempts'.
  // Map weak-password (422) to WEAK_PASSWORD → 'Auth.errors.passwordTooShort'.
  // Default: UNKNOWN → 'Auth.errors.unknown'.
}
```

**What to diverge from `cart.ts`:** Cart uses `'Checkout.errors.unknown'`. Auth uses `'Auth.errors.*'`. Cart codes (`INSUFFICIENT_STOCK`, `PRODUCT_NOT_FOUND`) are absent here.

**Anti-pattern (UI-SPEC §"Anti-patterns" #11):** NEVER return "User not found" or "Email already registered" — both wrong-email and existing-email signups must surface as `errors.unknown` plus an `auth_events` row.

---

### `src/lib/auth/audit.ts` (NEW — auth_events writer)

**Analog:** `src/lib/cart/session.ts` (`'server-only'` + Drizzle insert).

**What to copy:**
- Top-of-file `import 'server-only';` (`cart/session.ts:8`)
- Drizzle insert pattern from `cart/session.ts:47-50`
- The CONTEXT.md §"Audit logging" column list verbatim: `id uuid pk, userId uuid null, email text null, event text not null, metadata jsonb, ipAddress text, userAgent text, createdAt timestamptz default now()`

**Function signature** (RESEARCH §6):
```ts
export async function writeAuthEvent(params: {
  type: 'signup' | 'signin' | 'signin_failed' | 'password_reset_requested' | 'password_changed' | 'signout' | 'admin_action';
  userId?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown>;
  request?: Request;  // to extract IP + UA
}): Promise<void>
```

**What to diverge from `cart/session.ts`:** No cookie writes. No return value. Failures are logged via `console.error` and **swallowed** — audit failure must not break the user's auth flow.

**Pitfall (RESEARCH §7 #12):** `auth_events.userId` is `uuid` matching `auth.users.id`, but **do NOT add `.references(authUsers.id)`** in Drizzle — auth events must survive user deletion for forensics. Also keep the `email` column populated alongside `userId` so the audit log remains useful after deletion.

---

### `src/lib/auth/admin-allowlist.ts` (NEW)

**Analog:** `src/lib/env.ts` (env-driven helper pattern).

**Pattern:**
```ts
import 'server-only';
import { env } from '@/lib/env';

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const allow = (env.SUPABASE_ADMIN_EMAILS ?? '')
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}
```

**Pitfall (RESEARCH §7 #8):** Trim whitespace, lowercase BEFORE comparison. Test fixture: `"alice@orki.com, bob@orki.com "` should match `Alice@Orki.com` and `bob@orki.com`.

---

### `src/app/actions/auth.ts` (NEW — Server Actions)

**Analog:** `src/app/actions/cart.ts` (entire file, 113 lines) — exact match.

**File header pattern** (`cart.ts:1-15`):
```ts
'use server';
/**
 * Auth Server Actions (Phase 10).
 *
 * Each action:
 *  1. Parses input via the matching zod schema.
 *  2. Calls the SSR Supabase client (RLS-bound).
 *  3. Writes an auth_events row (success OR signin_failed).
 *  4. Returns AuthActionResult<T>. Raw Supabase errors NEVER cross the wire.
 */
```

**Action signature pattern** (`cart.ts:39-55` — `addToCartAction`):
```ts
export async function signInAction(input: SignInInput): Promise<AuthActionResult<{ userId: string }>> {
  const parsed = signinSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, code: 'VALIDATION', fields: /* ... */, messageKey: 'Auth.errors.unknown' };
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
    if (error) {
      await writeAuthEvent({ type: 'signin_failed', email: parsed.data.email, metadata: { code: error.code } });
      const { code, messageKey } = mapSupabaseError(error);
      return { ok: false, code, messageKey };
    }
    await writeAuthEvent({ type: 'signin', userId: data.user.id, email: data.user.email });
    revalidatePath('/', 'layout');  // re-render Navbar with UserMenu
    return { ok: true, data: { userId: data.user.id } };
  } catch (err) {
    console.error('[signInAction]', err);
    return { ok: false, code: 'UNKNOWN', messageKey: 'Auth.errors.unknown' };
  }
}
```

**Five actions to export** (RESEARCH §4 + §6): `signInAction`, `signUpAction`, `signOutAction`, `requestPasswordResetAction`, `setPasswordAction`.

**What to diverge from `cart.ts`:**
- Each action calls `writeAuthEvent` on success AND on `signin_failed` (cart actions do not write audit events).
- `revalidatePath('/', 'layout')` instead of `'/[locale]/checkout'` — the Navbar/UserMenu lives in the root locale layout.
- `signOutAction` calls `supabase.auth.signOut()` then `redirect('/login')` — uses the Next.js `redirect()` from `next/navigation` per UI-SPEC §"Header Changes" sign-out flow.

**Cart-merge hook:** `signInAction` on success must also invoke `mergeGuestCartIntoUserCart(userId, sessionId)` from `src/lib/cart/merge-on-signin.ts`. This is the only Phase-10 action that mutates cart state.

---

### `src/app/api/auth/callback/route.ts` (NEW — recovery callback)

**Analog:** `src/app/api/cart/route.ts` (entire file, 26 lines).

**What to copy:**
- `import { NextResponse } from 'next/server';` (line 8)
- `try { ... } catch { return NextResponse.json({ ok: false, code: 'UNKNOWN' }, { status: 500 }); }` envelope (lines 12-25)
- File-level docblock describing the route's purpose

**Body** (RESEARCH §4):
```ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Supabase password-recovery redirect handler.
 * Receives ?code=...&type=recovery from the email link → exchanges for session
 * → redirects to /[locale]/reset-password.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/en/reset-password';
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/en/forgot-password?error=invalid_link`);
}
```

**What to diverge from `api/cart/route.ts`:** Method is `GET` (Supabase email link is a GET). No JSON response — pure redirect. Locale handling: hard-code `/en/` then let next-intl middleware redirect to user's locale, OR read `Accept-Language`. RESEARCH §4 keeps it simple.

**Pitfall (RESEARCH §7 #14):** This route is at `/api/auth/callback` → INSIDE the `/api` prefix → next-intl middleware skips it (matcher excludes `/api`). That's correct. But ensure the **combined** middleware function still applies Supabase session refresh to it (or that the route handler creates its own SSR client, as above).

---

### `src/app/[locale]/(auth)/login/page.tsx` (NEW)

**Analog:** `src/app/[locale]/checkout/confirmation/page.tsx:1-50` (RSC + `getTranslations` + centred layout).

**What to copy:**
- Async RSC signature with `params: Promise<{ locale: string }>` (lines 11-20)
- `const t = await getTranslations('Auth.login');` (analog `getTranslations('Order')` line 48)
- `import { Link } from '@/i18n/navigation';` (line 3)
- Outer chrome `<div className="min-h-screen bg-black flex items-center justify-center py-24 px-6">` (line 53) — but UI-SPEC §"Page Chrome" mandates `min-h-[calc(100vh-80px)]` to clear the fixed Navbar

**Body skeleton** (per UI-SPEC §"Layout (login / signup / forgot-password / reset-password)"):
```tsx
export default async function LoginPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations('Auth.login');
  return (
    <main className="min-h-[calc(100vh-80px)] bg-black flex items-center justify-center py-24 px-6">
      <div className="w-full max-w-md space-y-12">
        <header className="text-center space-y-2">
          <p className="text-[12px] uppercase tracking-widest text-white/40 font-bold">{t('eyebrow')}</p>
          <h1 className="text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white leading-none">{t('heading')}</h1>
        </header>
        <LoginForm />
        <p className="text-center text-sm text-white/60">
          {t('alt')} <Link href="/signup" className="underline underline-offset-4 text-white">{t('altCta')}</Link>
        </p>
      </div>
    </main>
  );
}
```

**What to diverge from `confirmation/page.tsx`:** No `searchParams` (login is a clean entry). No `notFound()` branch. No `force-dynamic` needed (the form is the only dynamic surface and lives in a Client Component).

**Repeat for `/signup`, `/forgot-password`, `/reset-password`** with the same shell, swapping the `<LoginForm />` slot and the `getTranslations(...)` namespace.

---

### `src/app/[locale]/(auth)/reset-password/page.tsx` (NEW — token-verify)

**Analog:** `src/app/[locale]/checkout/page.tsx` (RSC shell + Client island for the form).

**Special concern (UI-SPEC §"Reset-password specific chrome"):** Page MUST NOT render the form until the token is verified. Pattern: client-side `useEffect` checks the URL hash, calls `supabase.auth.exchangeCodeForSession()`, then either renders `<ResetPasswordForm />` or `<BrandedErrorPage variant="error">`.

**Reuse:** `BrandedErrorPage` from `src/components/error/BrandedErrorPage.tsx` for the link-expired branch. Props per UI-SPEC: `heading: t('linkExpiredHeading')`, `body: t('linkExpiredBody')`, `ctaLabel: t('requestNewLink')`, `ctaHref: '/forgot-password'`, `variant: 'error'`.

---

### `src/app/[locale]/account/layout.tsx` (NEW — auth gate)

**Analog:** `src/app/[locale]/admin/layout.tsx:1-7` (signature) + RESEARCH §2.5 SSR `getUser()` pattern.

**What to copy from `admin/layout.tsx:1-3`:** `import { Link } from '@/i18n/navigation';` and the async default-export signature.

**What to diverge:** No sidebar chrome. The `/account` UI-SPEC §"Account Page Chrome" is single-column, no sidebar. This layout is a **gate**, not a chrome:

```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  return <>{children}</>;
}
```

**Pitfall (RESEARCH §7 #2 & #3):** Use `getUser()`, not `getSession()`. In RSC layouts, `getUser()` revalidates against Supabase Auth.

---

### `src/app/[locale]/account/page.tsx` (NEW — orders list)

**Analog:** `src/app/[locale]/admin/inventory/page.tsx` (entire file, 23 lines).

**What to copy** (`inventory/page.tsx:1-23`):
- `export const dynamic = 'force-dynamic';` (line 4)
- async default export, fetch via `await getXxx()`, hand to a `<List>` component
- Page header with eyebrow + display H1 (analog lines 11-17)

**What to diverge:**
- Fetch via Drizzle filtered by `userId = currentUser.id` (RLS enforces this at the DB layer too, but Drizzle bypasses RLS — so the userId filter MUST be in the Drizzle query). Add `getOrdersForUser(userId, { limit, offset })` to `src/lib/orders/server.ts`.
- Replace admin's italic `font-black` typography with the auth-page editorial chrome from UI-SPEC §"Account Page Chrome" — `text-4xl md:text-6xl font-bold uppercase tracking-tighter`.
- Hand to `<OrdersList orders={...} email={user.email} />`.

---

### `src/app/[locale]/account/orders/[reference]/page.tsx` (NEW — RLS-gated detail)

**Analog:** `src/app/[locale]/admin/orders/[reference]/page.tsx:1-30` (existing — load via reference + `notFound()`).

**What to copy:**
- `import { notFound } from 'next/navigation';` (line 1)
- `import { getOrderByReference } from '@/lib/orders/server';` (line 3)
- `interface Props { params: Promise<{ reference: string; locale: string }>; }` (line 11)
- `if (!order) notFound();` (line 17)

**What to diverge (UI-SPEC §"`/account/orders/[reference]` chrome"):**
- Add ownership check: `if (order.userId !== user.id) notFound();` — UI-SPEC §"Anti-patterns" mandates `notFound()` (NOT 403) to avoid leaking "this reference exists but isn't yours".
- Render via `<OrderDetailView order={order} />` (the lifted shared component) instead of inline admin chrome.
- Add a back-link to `/account` styled as the ghost-button variant (UI-SPEC §"`/account/orders/[reference]` chrome" bullet 1).
- Add `Signed in as {email}` micro-line in page header (Tier 4 12 px).

---

### `src/components/auth/LoginForm.tsx` (NEW — RHF client form)

**Analog:** `src/components/checkout/ShippingForm.tsx` (entire file, 211 lines) — exact match.

**What to copy verbatim:**
- `'use client'` + `useForm` + `zodResolver` + `useTranslations` imports (lines 1-7)
- `const inputClass` constant (lines 17-19) — keep verbatim, it matches UI-SPEC §"Input"
- `function ariaProps(id, error)` helper (lines 21-26) — keep verbatim
- `useForm<SignInInput>({ resolver: zodResolver(signinSchema), mode: 'onBlur' })` (lines 39-43)
- `useEffect` to focus first error (lines 45-50) — UX-09 / SEC-02 a11y wiring
- `<form noValidate aria-label={t('heading')}>` outer wrapper (lines 53-58)
- The inner private `Field` component (lines 165-210) — **lift this** into `src/components/forms/Field.tsx` so all four auth forms can re-import it (UI-SPEC §"Component Reuse Map" notes either re-import or lift).

**What to diverge from `ShippingForm.tsx`:**
- **Touch-target floor:** the analog uses `text-[10px]` on the label (line 194). UI-SPEC §"Typography" mandates **12 px minimum** (`text-[12px]`). When lifting `Field` to a shared file, change `text-[10px]` → `text-[12px]`. Update `ShippingForm` consumers in a follow-up if scope permits, OR fork the auth `Field` from the lifted version.
- **Error-key namespace:** the strip helper at line 178 strips `^Checkout\./`. The auth `Field` must strip `^Auth\./` instead. **Recommended:** make the lifted `Field` accept a `namespace` prop.
- **Submit button:** the analog has no submit button (the page hosts it). Auth forms inline the submit button per UI-SPEC §"Button (primary / secondary / ghost)" Primary class.
- **Submit handler:** wrap the `signInAction` call in `useTransition` (analog at `InventoryTable.tsx:17,23-27`):
  ```tsx
  const [isPending, startTransition] = useTransition();
  const onSubmit = handleSubmit((data) => startTransition(async () => {
    const result = await signInAction(data);
    if (!result.ok) setFormError(t(result.messageKey.replace(/^Auth\./, '')));
    else router.push('/account');
  }));
  ```
- **Live region for form-level errors** (UI-SPEC §"Accessibility"): add `<div role="alert" aria-live="polite">{formError}</div>` above the submit button.
- **autocomplete map** (UI-SPEC §"autocomplete map"): every input MUST set the listed `autoComplete` attribute (`email` + `username` for the email field on login/signup; `current-password` on login; `new-password` on signup/reset).
- **dir="ltr" on email/password inputs** (UI-SPEC §"Required attributes"): credentials are LTR by content even in AR.

---

### `src/components/auth/SignupForm.tsx` (NEW)

Same as `LoginForm.tsx` plus the **accept-terms checkbox** per UI-SPEC §"Checkbox (signup accept-terms only)":
- Use `@base-ui/react/checkbox` (already in tree per `package.json:23`)
- `t.rich('acceptTerms', { terms: ..., privacy: ... })` for the bilingual interpolated label
- The label MUST contain `<Link>` to both `/legal/terms` and `/legal/privacy` (Phase 9 routes — verified present per `src/app/[locale]/legal/{privacy,terms,cookies}/page.tsx` glob)
- `required` enforced both client-side (zod `z.literal(true)`) and server-side (zod again on the action)

---

### `src/components/auth/ForgotPasswordForm.tsx` (NEW)

Stripped-down `LoginForm` with one input. No submit-button divergence — same primary-CTA chrome.

**Success state (UI-SPEC §"Bilingual Copywriting Contract" `forgot.success`):** after `requestPasswordResetAction` returns `{ ok: true }`, swap the form for an inline success message. **Generic message** regardless of whether the email exists — UI-SPEC §"Anti-patterns" #11 (no email enumeration).

---

### `src/components/auth/ResetPasswordForm.tsx` (NEW)

Same shell + two `type="password"` inputs (`new-password` + `confirm-new-password`) with a `refine` zod check for match (see `schemas.ts` above).

---

### `src/components/auth/SignOutButton.tsx` (NEW)

**Analog:** `src/components/admin/InventoryTable.tsx:17,23-27` (`useTransition` + Server Action call) — but UI-SPEC §"Header Changes" mandates a **form-action** pattern, not `useTransition`:

```tsx
'use client';
import { signOutAction } from '@/app/actions/auth';
import { useTranslations } from 'next-intl';

export function SignOutButton() {
  const t = useTranslations('Account');
  return (
    <form action={signOutAction}>
      <button type="submit" className="w-full text-start px-4 py-3 text-sm text-red-400/90 hover:bg-white/5 transition-colors min-h-[44px]">
        {t('signOut')}
      </button>
    </form>
  );
}
```

**What to diverge from `InventoryTable.tsx`:** Use `<form action={...}>` not `useTransition`. The form-action pattern is preferred for sign-out because (a) it works without JS (progressive enhancement), and (b) the destructive-tinted `text-red-400/90` is the only signal — no confirmation modal (UI-SPEC §"Anti-patterns" #9).

---

### `src/components/auth/UserMenu.tsx` (NEW — header dropdown)

**Analog:** `src/components/nav/CategoryDropdown.tsx` and `src/components/nav/ShopDropdown.tsx` (existing base-ui menu wrappers).

**What to copy** from those:
- `'use client'` directive
- `@base-ui/react/menu` import shape
- `align="end"` for right-side dropdown (auto-flips to `start` in RTL via base-ui)
- `Link` from `@/i18n/navigation`

**What to diverge (UI-SPEC §"When logged in: `<UserMenu>` dropdown"):**
- **Trigger label is "Account", not the email** — emails leak in screenshots. The email goes in `aria-label` only.
- **Trigger color:** UI-SPEC mandates the Navbar is light-themed (`bg-white text-black border-b border-black/5` per `Navbar.tsx:13`). The trigger inherits black-on-white styling. **The dropdown panel itself is dark** (`bg-[#111111] border border-white/10`) — this contrast is intentional.
- **Items list** per UI-SPEC table: `Signed in as {email}` (informational, `text-[12px] uppercase tracking-widest text-white/40`, dir="ltr" on the email span only) + `<Separator />` (existing `components/ui/separator.tsx`) + `Account` link + `Sign out` form.
- **Logged-out variant:** when no user, `<UserMenu>` returns a plain `<Link href="/login">` styled to match Navbar conventions (`Navbar.tsx:29-36` link pattern).

---

### `src/components/account/OrdersList.tsx` + `OrderRow.tsx` (NEW)

**OrdersList analog:** `src/components/admin/InventoryTable.tsx` (table-over-data pattern) — but UI-SPEC §"Account Page Chrome" mandates an `<ol className="space-y-3">`, not a table. So the structure diverges: simple list, empty-state inline.

**OrderRow analog:** `src/components/cart/CartItem.tsx` (block-card pattern with link affordance) + UI-SPEC §"`<OrderRow>` spec" (full markup inline).

**What to copy from `CartItem.tsx`:**
- `Link` from `@/i18n/navigation`
- Logical CSS conventions (`ms-`, `me-`, `ps-`, `pe-`)
- `dir="ltr"` on monospace reference codes (UI-SPEC §"`<OrderRow>` spec" — "always LTR")

**What to copy from UI-SPEC §"`<OrderRow>` spec" (full markup):** the entire `<li><Link>` block including outline-only status pill (`border border-white/30 text-white/80 text-[12px] uppercase tracking-widest px-3 py-1 rounded-none`). All six statuses share one chrome — UI-SPEC §"Anti-patterns" #10 (no color-coded pills).

**Empty state:** rendered inline in `OrdersList` per UI-SPEC §"Empty state — no orders" — uses Tier 1 Display (`text-4xl md:text-6xl font-bold uppercase tracking-tighter`) for the heading.

---

### `src/components/order/OrderDetailView.tsx` (NEW — extract)

**Analog:** `src/app/[locale]/checkout/confirmation/page.tsx:52-109` (the existing `[#111111]` card markup).

**Action:** lift lines 52-109 verbatim into a presentational component accepting `{ order: Order, locale: Locale }`. Both routes (`checkout/confirmation` and `account/orders/[reference]`) consume it. Per UI-SPEC §"`/account/orders/[reference]` chrome" — "lift the reusable parts (header card, items table, totals block) into `src/components/order/OrderDetailView.tsx`".

**Touch-up while extracting:** the source uses `text-[10px]` on the eyebrow (line 70). Phase 10 forbids 10 px (UI-SPEC §"Anti-patterns" #15). Bump to `text-[12px]`. Confirmation page already consumes the lifted component, so the bump cascades — verify visually.

---

### `src/middleware.ts` (MODIFY — wrap with Supabase session refresh)

**Analog:** self (4 lines today, lines 1-8) + RESEARCH §7 #10.

**Current full file:**
```ts
import createMiddleware from 'next-intl/middleware';
import {routing} from './i18n/routing';
export default createMiddleware(routing);
export const config = { matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)' };
```

**What to copy:** The matcher (line 7) — keep verbatim. `createMiddleware(routing)` — keep, but wrap.

**What to diverge** (RESEARCH §7 #10 — Supabase MUST refresh BEFORE next-intl redirects):
```ts
import { type NextRequest, NextResponse } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { createServerClient } from '@supabase/ssr';
import { routing } from './i18n/routing';
import { env } from '@/lib/env';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  let response = intlMiddleware(request);

  // Supabase session refresh — MUST run on every request to avoid expired JWT.
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = intlMiddleware(request);
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    },
  );
  await supabase.auth.getUser();  // refreshes the session if expired

  return response;
}

export const config = { matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)' };
```

**Pitfall (RESEARCH §7 #10):** Order matters — Supabase refresh runs FIRST, then next-intl redirects. Inverted order = expired JWT in the destination page.

**Pitfall (RESEARCH §7 #14):** The matcher excludes `/api`, so `/api/auth/callback` doesn't pass through this middleware — that's correct because the callback handler creates its own SSR client.

---

### `src/lib/env.ts` (MODIFY — add Supabase env vars)

**Analog:** self (43 lines, lines 11-28).

**Current pattern** (line 11):
```ts
const envSchema = z.object({
  STORAGE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
})
```

**What to extend** (RESEARCH §7 #7):
```ts
const envSchema = z.object({
  STORAGE_URL: z.string().url().optional(),
  DATABASE_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  // Phase 10:
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(100),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(100),
  SUPABASE_ADMIN_EMAILS: z.string().min(1),
})
```

Then thread the new keys through `.transform(...)` and surface on the exported `env`. Keep `.refine(...)` chain for `DB_URL`.

**Pitfall:** `SUPABASE_SERVICE_ROLE_KEY` and `SUPABASE_ADMIN_EMAILS` MUST NOT have `NEXT_PUBLIC_` prefix — Next.js refuses to inline non-public env vars into the client bundle. This is one of the three boundary-enforcement layers per RESEARCH §2.5.

---

### `src/lib/db/schema.ts` (MODIFY — uuid cast + auth_events table)

**Analog:** self.

**What to change:**
1. Line 109 (`carts.userId`): `text('user_id')` → `uuid('user_id')`. **No `.references(...)`** — Drizzle cannot introspect `auth.*` (ADR-002 §6). FK is enforced at the DB layer by the migration's `ALTER TABLE ... ADD CONSTRAINT ... FOREIGN KEY ... REFERENCES auth.users(id)`.
2. Line 162 (`orders.userId`): same change.
3. Add new table:
   ```ts
   export const authEvents = pgTable('auth_events', {
     id: uuid('id').primaryKey().defaultRandom(),
     userId: uuid('user_id'),  // no FK — preserves rows after user delete
     email: text('email'),
     event: text('event').notNull(),
     metadata: jsonb('metadata'),
     ipAddress: text('ip_address'),
     userAgent: text('user_agent'),
     createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
   }, (table) => [
     index('auth_events_user_id_idx').on(table.userId),
     index('auth_events_event_idx').on(table.event),
     index('auth_events_created_at_idx').on(table.createdAt),
   ]);
   ```

**What to copy:**
- Existing import block (lines 10-22) — `pgTable, uuid, text, timestamp, jsonb, index` already imported.
- Type-export tail (lines 99-102 pattern):
  ```ts
  export type AuthEventRow = typeof authEvents.$inferSelect;
  export type NewAuthEventRow = typeof authEvents.$inferInsert;
  ```

**Pitfall (RESEARCH §7 #5):** Run `db:generate` only AFTER hand-authoring `0002_phase10_auth_fk_and_rls.sql` and registering it in `meta/_journal.json`. Otherwise drizzle-kit will try to emit its own ALTER and clash.

---

### `src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql` (NEW — hand-authored)

**Analog:** `src/lib/db/migrations/0001_phase8_cart_orders.sql:1-60` — drizzle-kit-emitted shape for syntax conventions only.

**What to copy from `0001`:**
- Statement-breakpoint convention: `--> statement-breakpoint` between top-level statements (Drizzle splits on this marker)
- `CONSTRAINT` naming convention: `<table>_<column>_unique` / `<table>_<column>_fk`

**Body:** copy verbatim from RESEARCH §2.1 (ALTER + FK + index recreate) and §2.5 (RLS + policies + auth_events). Combine into a single file. Annotate sections:

```sql
-- ─── Phase 10: text→uuid + cross-schema FKs ──────────────────────────
DROP INDEX IF EXISTS carts_user_id_idx;
DROP INDEX IF EXISTS orders_user_id_idx;
--> statement-breakpoint
ALTER TABLE public.carts ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE public.orders ALTER COLUMN user_id TYPE uuid USING user_id::uuid;
--> statement-breakpoint
ALTER TABLE public.carts ADD CONSTRAINT carts_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
--> statement-breakpoint
ALTER TABLE public.orders ADD CONSTRAINT orders_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX carts_user_id_idx ON public.carts(user_id);
--> statement-breakpoint
CREATE INDEX orders_user_id_idx ON public.orders(user_id);
--> statement-breakpoint

-- ─── Phase 10: auth_events table ──────────────────────────────────────
CREATE TABLE public.auth_events (...);  -- per Drizzle schema above
--> statement-breakpoint

-- ─── Phase 10: enable RLS + policies ─────────────────────────────────
-- (full block from RESEARCH §2.5, all 5 tables + auth_events)
```

**Manifest update:** add an entry to `src/lib/db/migrations/meta/_journal.json`:
```json
{ "idx": 2, "version": "7", "when": <timestamp>, "tag": "0002_phase10_auth_fk_and_rls", "breakpoints": false }
```
`breakpoints: false` per RESEARCH §6 last row — matches the single-transaction nature.

**Wave 0 probe (RESEARCH §2.1):** before this migration runs, run the SQL probe checking that all existing `user_id` values are NULL or uuid-castable.

---

### `src/lib/cart/session.ts` (MODIFY — add merge hook)

**Analog:** self (entire file, 70 lines).

**What to copy:** the existing function shape (lines 24-61) — keep verbatim through line 50 (cookie+row resolution).

**What to insert** (after line 50, before line 52):
```ts
// Phase 10: first-sign-in merge hook.
// If the request has a Supabase user AND the cart has no userId, merge.
const supabase = await import('@/lib/supabase/server').then((m) => m.createClient());
const { data: { user } } = await supabase.auth.getUser();
if (user && !cart.userId) {
  const { mergeGuestCartIntoUserCart } = await import('./merge-on-signin');
  await mergeGuestCartIntoUserCart(user.id, sessionId);
  // Re-fetch the (possibly merged) cart.
}
```

**What to diverge:** Use **dynamic imports** for `@/lib/supabase/server` and `./merge-on-signin` to avoid breaking guest-only paths if Supabase env vars are missing in dev. Or thread the user object through as a parameter — RESEARCH §6 leaves this to the planner.

**Pitfall (RESEARCH §7 #9):** Two simultaneous tabs can both trigger `getOrCreateCart()` post-sign-in. Wrap the merge in a `db.transaction` with `SELECT ... FOR UPDATE` on the user's existing cart row (Phase 8 `submitCheckout` provides the transaction pattern in `src/lib/orders/server.ts`).

---

### `src/lib/cart/merge-on-signin.ts` (NEW)

**Analog:** `src/app/actions/cart.ts:96-112` (`migrateLocalCartAction` one-shot pattern) + `src/lib/cart/session.ts` shape.

**What to copy:**
- `import 'server-only';` at top (`session.ts:8`)
- One-shot idempotent semantics from `migrateLocalCartAction` (lines 96-112) — never throws raw, returns the merged Cart, safe to call repeatedly
- Drizzle `db.update(carts).set({ userId }).where(...)` pattern (analog `cart.ts:44-46` for the update shape)

**Function signature** (RESEARCH §6):
```ts
export async function mergeGuestCartIntoUserCart(
  userId: string,
  sessionId: string,
): Promise<void>
```

**Logic** (CONTEXT.md §"Guest cart merge behavior"):
- If user has no server cart: claim the guest cart by setting `userId = user.id`.
- If user already has a server cart: prefer it. Discard the guest cart silently — `DELETE FROM carts WHERE session_id = $sessionId`. No item-level merge (CONTEXT explicitly chose "prefer user's cart" not "union items").

---

### `src/app/[locale]/admin/layout.tsx` (MODIFY — admin gate)

**Analog:** self (78 lines).

**What to keep:** the entire visual chrome (lines 8-77).

**What to insert at the top of the function** (lines 3-7 region):
```tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/admin-allowlist';
import { writeAuthEvent } from '@/lib/auth/audit';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');
  if (!isAdminEmail(user.email)) {
    await writeAuthEvent({ type: 'admin_action', userId: user.id, email: user.email, metadata: { denied: true, reason: 'not_in_allowlist' } });
    redirect('/login');
  }
  // ... existing chrome ...
}
```

**What to diverge from current:** Replace the hard-coded `Connected as / Root Admin` chrome at lines 64-67 with `{user.email}`. UI-SPEC §"Admin gate (SEC-08)" mandates the signed-in admin email is visible.

**Pitfall (RESEARCH §7 #2 & #3):** `getUser()` in RSC requires `cookies()` to be awaited. The `createClient()` factory above already does that.

---

### `src/components/nav/Navbar.tsx` (MODIFY — slot in UserMenu)

**Analog:** self (71 lines).

**What to keep:** the entire grid layout (lines 13-70). Right-cluster slot order (lines 50-66) — `<button>Search</button>` → `<CartTrigger />` → `<LanguageSwitcher />` → `<MobileNavDrawer />`.

**What to insert** (between `<CartTrigger />` and `<LanguageSwitcher />`, per UI-SPEC §"When logged out"):
```tsx
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from '@/components/auth/UserMenu';

// Inside the async function:
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();

// In the right cluster, after CartTrigger:
<div className="h-full flex items-center justify-center">
  <UserMenu user={user ? { id: user.id, email: user.email ?? '' } : null} />
</div>
```

**What to diverge from current:** `Navbar` is currently a pure RSC with no auth awareness. Adding `await createClient()` makes every navbar render trigger a Supabase JWT validation. Acceptable per RESEARCH §7 #3 because Navbar is in the root locale layout (one render per request). If perf becomes a concern, defer to `getSession()` for the trigger label and only `getUser()` on protected routes.

---

### `src/components/nav/MobileNavDrawer.tsx` (MODIFY)

**Analog:** self.

**What to insert:** the same `<UserMenu user={...} />` slot inside the mobile sheet, per UI-SPEC §"Mobile" — "the trigger lives inside MobileNavDrawer rather than in the icon cluster".

---

### `next.config.ts` (MODIFY — security headers)

**Analog:** self (18 lines today). No prior `headers()` block in the codebase.

**What to keep** (lines 1-15): the `images.remotePatterns` + `withNextIntl` wrapping. Keep `import './src/lib/env';` at the top to fail at build time on missing env.

**What to insert** (RESEARCH §2.4 — verbatim CSP recipe):
```ts
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://images.unsplash.com https://gkcaakimmvsctwpvccwt.supabase.co; font-src 'self' data:; connect-src 'self' https://gkcaakimmvsctwpvccwt.supabase.co wss://gkcaakimmvsctwpvccwt.supabase.co https://vitals.vercel-insights.com; frame-src 'none'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'; upgrade-insecure-requests" },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  images: { /* unchanged */ },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};
```

**What to diverge:** RESEARCH §2.4 footgun #2 — for Vercel preview deployments, branch on `process.env.VERCEL_ENV === 'preview'` to add `vercel.live` to `script-src` and `connect-src` (preview-only). Do NOT include `vercel.live` in production CSP.

**Pitfall (RESEARCH §7 #15):** `headers()` applies to all paths by default. Currently safe; if violations appear in `/_next/*` or `/api/*`, scope the source pattern.

---

### `messages/en.json` & `messages/ar.json` (MODIFY — additive)

**Analog:** self (existing `Footer.legal` namespace at `en.json:20-25`, `Order.*`, `Checkout.*` precedents established by Phases 8-9).

**What to copy:** the namespace shape — top-level namespaces (`Auth`, `Account`), one level of nesting for sub-groups (`Auth.login.*`, `Auth.errors.*`), camelCase keys, ICU-style interpolation `{count}` / `{email}`.

**What to add** (UI-SPEC §"Bilingual Copywriting Contract" — full key list):
- `Auth.login.*` (eyebrow, heading, email, password, submit, submitting, forgot, alt, altCta)
- `Auth.signup.*` + `Auth.signup.acceptTerms` (rich-text with `<terms>` and `<privacy>` interpolation tags)
- `Auth.forgot.*`, `Auth.reset.*` (including `verifyingLink`, `linkExpiredHeading`, `linkExpiredBody`, `requestNewLink`)
- `Auth.errors.*` — full set: `invalidCredentials`, `emailRequired`, `emailInvalid`, `passwordRequired`, `passwordTooShort`, `passwordMismatch`, `acceptTermsRequired`, `tooManyAttempts`, `sessionExpired`, `linkInvalid`, `unknown`
- `Account.*` (eyebrow, heading, signedInAs (rich text with `<email>` tag), referenceLabel, pagination, nextPage, prevPage, empty.{eyebrow,heading,body,cta}, backToAccount, signOut, signingOut, userMenu, account)
- `Nav.signIn`, `Nav.account` (extend existing `Nav` namespace at `en.json:2-14`)

**AR copy (UI-SPEC §"Bilingual Copywriting Contract" tables):** all keys provided in EN+AR. Formal-tone neutral imperative (`سجّل الدخول`, `أدخل بريدك`). No `[AR-LEGAL-REVIEW]` prefix needed (auth UI is functional, not legal).

---

### `playwright.config.ts` (NEW — Wave 0)

**Analog:** none.

**Body** (RESEARCH §3 Wave 0 Gaps):
```ts
import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  use: { baseURL: 'http://localhost:3000', screenshot: 'only-on-failure' },
  projects: [{ name: 'chromium', use: { ...require('@playwright/test').devices['Desktop Chrome'] } }],
  webServer: { command: 'npm run dev', url: 'http://localhost:3000', reuseExistingServer: !process.env.CI },
});
```

**Pre-step:** `npm install -D @playwright/test && npx playwright install --with-deps chromium`. Required for Wave 0 setup task.

---

### Tests (NEW)

**Existing test analogs in repo:**
- `tests/setup.ts` — vitest global setup (lines 1-46) — keep, extend
- `tests/helpers/test-db.ts` — live-DB cleanup helpers + `hasDbUrl` gate (lines 1-53)
- `tests/integration/cart-merge.test.ts` — closest live-DB integration test pattern

**What to copy from `tests/helpers/test-db.ts`:**
- `hasDbUrl` gate (line 51) — gate every Phase-10 integration test on it; `it.skipIf(!hasDbUrl)` skips in CI without DB credentials
- `cleanPhase8Tables()` pattern (lines 23-27) — add `cleanAuthEvents()` that does `TRUNCATE auth_events`

**`tests/setup/supabase-test-client.ts`:** new fixture to create a fresh test user via service-role client, capture session cookie, return SSR-shaped client. No analog — pattern from RESEARCH §3.

**`tests/security/headers.test.ts`:** curls a running build (or uses `next start` in `beforeAll`) and asserts each header is present and CSP contains `frame-ancestors 'none'`, `default-src 'self'`. No in-repo analog.

**`tests/rls/cross-user-deny.test.ts`:** creates two users via service-role client, signs in as User A, attempts to read User B's order via the SSR client, asserts empty result. No analog.

**`tests/e2e/*.spec.ts`:** Playwright spec format — net-new. Each spec navigates via `baseURL` and asserts on `page.getByRole(...)` / `page.getByText(...)` per UI-SPEC selectors.

---

## Cross-cutting Patterns

### `'server-only'` import guard
**Source:** `src/lib/cart/session.ts:8`, `src/lib/db/client.ts:10`, `src/lib/products.ts:17`.
**Apply to:** `src/lib/supabase/server.ts`, `src/lib/supabase/admin.ts`, `src/lib/auth/audit.ts`, `src/lib/auth/admin-allowlist.ts`, `src/lib/cart/merge-on-signin.ts`.

```ts
import 'server-only';
```

### `ActionResult<T>` envelope
**Source:** `src/app/actions/cart.ts:30-37`.
**Apply to:** all auth Server Actions in `src/app/actions/auth.ts`. Extend code union with `'INVALID_CREDENTIALS' | 'EMAIL_IN_USE' | 'WEAK_PASSWORD' | 'RATE_LIMITED' | 'VALIDATION' | 'UNKNOWN'` per RESEARCH §6.

### Zod schemas + `safeParse` at action top
**Source:** `src/lib/checkout/schemas.ts` (consumed by `ShippingForm.tsx:7`).
**Apply to:** every action in `src/app/actions/auth.ts`. Schema-error keys use full namespaced strings (`'Auth.errors.emailInvalid'`) and the `Field` helper's `t.replace(/^Auth\./, '')` shim resolves them.

### Logical CSS only (CLAUDE.md non-negotiable)
**Source:** `src/components/cart/CartItem.tsx:38` (`-me-1`), `src/components/admin/AdminLayout.tsx:11` (`border-e-2`), `src/components/checkout/ShippingForm.tsx` (no directional classes).
**Apply to:** every new auth/account component. **Anti-pattern (UI-SPEC §"Anti-patterns" #13):** never use `text-right`/`text-left` for directional content; rely on `text-start`/`text-end` (most cases inherit from `dir`). Email/reference/order codes get `dir="ltr"` even in AR.

### `params: Promise<{ locale: string }>` (Next.js 15 async params)
**Source:** `src/app/[locale]/checkout/confirmation/page.tsx:11-20`, `src/app/[locale]/admin/orders/[reference]/page.tsx:11`.
**Apply to:** every new auth and account page.

### `Link` from `@/i18n/navigation` (auto-locale-prefixed)
**Source:** `src/i18n/navigation.ts`; consumed everywhere.
**Apply to:** all internal links in auth + account UI. Never use plain `next/link`.

### Server-side `getTranslations`
**Source:** `src/app/[locale]/checkout/confirmation/page.tsx:48`.
**Apply to:** all auth RSC pages. Client components use `useTranslations` (analog `src/components/nav/LanguageSwitcher.tsx:10`).

### `useTransition` + Server Action invocation (client side)
**Source:** `src/components/admin/InventoryTable.tsx:17,23-27`.
**Apply to:** all four auth forms when calling Server Actions. Sign-out diverges to use `<form action={signOutAction}>` instead (UI-SPEC §"Header Changes").

### Touch-target floor (44 px)
**Source:** `src/app/globals.css` global rule (referenced in UI-SPEC §"Spacing Scale").
**Apply to:** every interactive element in auth UI. Inputs already get `min-h-[44px]` via the lifted `inputClass` from `ShippingForm.tsx:18`.

### a11y wiring (UX-09 / SEC-02)
**Source:** `src/components/checkout/ShippingForm.tsx:21-26` (`ariaProps` helper) + lines 199-207 (error `<p role="alert">` with `aria-describedby`).
**Apply to:** every input in every auth form. Generic-error live region above submit button: `<div role="alert" aria-live="polite">`.

### Bilingual rendering — `next-intl`
**Source:** `src/app/[locale]/layout.tsx:46-66` (`<html lang dir>`), namespace structure in `messages/{en,ar}.json`.
**Apply to:** all new `Auth.*` and `Account.*` strings. Mirror EN ↔ AR 1:1.

### Drizzle `db.transaction` with `SELECT ... FOR UPDATE` (race-safe merges)
**Source:** Phase 8 `submitCheckout` in `src/lib/orders/server.ts` (per `08-PATTERNS.md`).
**Apply to:** `src/lib/cart/merge-on-signin.ts` to prevent the two-tab race (RESEARCH §7 #9).

---

## Anti-patterns to Avoid

1. **Re-using `text-[10px]` from existing forms** — UI-SPEC §"Anti-patterns" #15 forbids 10 px in Phase 10. When lifting `Field` from `ShippingForm.tsx:194`, bump to `text-[12px]`. Do NOT preserve the 10 px micro-text.
2. **Status-pill color coding** — UI-SPEC §"Anti-patterns" #10 + `08-PATTERNS.md`. All 6 order statuses share the same outline-only chrome: `border border-white/30 text-white/80 text-[12px] uppercase tracking-widest px-3 py-1 rounded-none`.
3. **Email enumeration in errors** — UI-SPEC §"Anti-patterns" #11 + SEC-06. Wrong-email and wrong-password BOTH map to `Auth.errors.invalidCredentials`. `forgot.success` is generic regardless of email existence. Existing-email signup surfaces as `errors.unknown` plus `auth_events` row.
4. **`localStorage` for session/auth tokens** — UI-SPEC §"Anti-patterns" #14 + SEC-01. All session handling via `@supabase/ssr` httpOnly cookies. Auth UI must NEVER reference `window.localStorage` or `document.cookie`.
5. **Service-role key in client bundle** — RESEARCH §2.5 boundary enforcement. Three-layer guard (`'server-only'` + no `NEXT_PUBLIC_` prefix + ESLint `no-restricted-imports`). Verifier must grep prod bundle for the key prefix.
6. **`getSession()` in middleware or route gates** — RESEARCH §7 #3. `getSession()` reads cookie locally (spoofable). Always use `getUser()` for security-critical paths.
7. **Drizzle-kit-generated migration for Phase 10** — RESEARCH §7 #5. The `0002` migration is hand-authored because drizzle-kit cannot emit RLS, cross-schema FKs, or `ALTER COLUMN ... USING ::uuid`. Register manually in `meta/_journal.json`.
8. **Drizzle `.references(authUsers.id)`** — Drizzle cannot introspect `auth.*` (ADR-002 §6). Cross-schema FK is enforced at the DB layer ONLY (via the migration's `ALTER TABLE ... ADD CONSTRAINT`). Adding `.references()` to a non-Drizzle table breaks `db:generate` diff.
9. **Cookie attachment on the service-role client** — RESEARCH §2.5. If a user JWT leaks via cookies, RLS engages and the bypass fails. Empty `getAll`/`setAll` is the documented escape hatch.
10. **Hover-only interactions** — UI-SPEC §"Anti-patterns" #12 + UX-04. Every state change on hover must also be available on focus (UserMenu trigger, OrderRow hover state).
11. **Confirmation modal for sign-out** — UI-SPEC §"Anti-patterns" #9. Single-click sign-out is correct; the destructive-tinted `text-red-400/90` is the only signal.
12. **Social-login / CAPTCHA / password-strength meters / trust-badge stickers** — UI-SPEC §"Anti-patterns" #2, #3, #4, #6. All deferred or rejected for brand reasons.

---

## No Analog Found

| File | Role | Reason / Authoritative source |
|---|---|---|
| `src/lib/supabase/{client,server,admin}.ts` | infra | First Supabase clients in repo. Use canonical `@supabase/ssr` pattern from RESEARCH §2.5; cookie + cookies adapter shape from `src/lib/cart/session.ts` is the closest hint. |
| `0002_phase10_auth_fk_and_rls.sql` (RLS portion) | migration | First RLS in repo. Body from RESEARCH §2.5 verbatim. |
| `next.config.ts headers()` block | config | First `headers()` in repo. CSP recipe from RESEARCH §2.4 verbatim. |
| `playwright.config.ts` + `tests/e2e/*.spec.ts` | test framework | First Playwright in repo. Wave 0 install + boilerplate from RESEARCH §3. |
| `tests/security/headers.test.ts`, `tests/security/csp.test.ts` | test | No header-assertion test pattern exists. Use `fetch(`http://localhost:3000`)` against `next start` in `beforeAll`. |
| `tests/rls/cross-user-deny.test.ts` | test | First RLS test. Pattern from RESEARCH §2.5 verification block. |

---

## Metadata

**Analog search scope:** `src/`, `messages/`, `tests/`, `src/lib/db/migrations/`.
**Files scanned:** ~70 (full TS/TSX glob + key migration + i18n + tests).
**Pattern extraction date:** 2026-05-10.
**CONTEXT.md vs RESEARCH.md conflicts:** none — both align on every decision (text→uuid, hand-authored migration, three-client layout, generic-error rule).
**UI-SPEC vs RESEARCH conflicts:** none. UI-SPEC's typography floor (12 px Tier 4) **overrides** the legacy `text-[10px]` in `ShippingForm.tsx:194` — when lifting `Field`, bump to `text-[12px]`.
