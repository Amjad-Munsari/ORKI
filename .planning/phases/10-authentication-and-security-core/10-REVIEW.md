---
phase: 10-authentication-and-security-core
reviewed: 2026-05-11T00:00:00Z
depth: standard
files_reviewed: 61
files_reviewed_list:
  - eslint.config.mjs
  - messages/ar.json
  - messages/en.json
  - next.config.ts
  - package.json
  - playwright.config.ts
  - scripts/apply-10-02-migration.ts
  - src/app/[locale]/(auth)/forgot-password/page.tsx
  - src/app/[locale]/(auth)/login/page.tsx
  - src/app/[locale]/(auth)/reset-password/page.tsx
  - src/app/[locale]/(auth)/signup/page.tsx
  - src/app/[locale]/account/layout.tsx
  - src/app/[locale]/account/orders/[reference]/page.tsx
  - src/app/[locale]/account/page.tsx
  - src/app/[locale]/admin/audit/page.tsx
  - src/app/[locale]/admin/layout.tsx
  - src/app/[locale]/checkout/confirmation/page.tsx
  - src/app/actions/auth.ts
  - src/app/api/auth/callback/route.ts
  - src/components/account/OrderRow.tsx
  - src/components/account/OrdersList.tsx
  - src/components/admin/AuditTable.tsx
  - src/components/auth/ForgotPasswordForm.tsx
  - src/components/auth/LoginForm.tsx
  - src/components/auth/ResetPasswordForm.tsx
  - src/components/auth/SignOutButton.tsx
  - src/components/auth/SignupForm.tsx
  - src/components/auth/UserMenu.tsx
  - src/components/forms/Field.tsx
  - src/components/nav/MobileNavDrawer.tsx
  - src/components/nav/Navbar.tsx
  - src/components/order/OrderDetailView.tsx
  - src/lib/auth/admin-allowlist.ts
  - src/lib/auth/audit.ts
  - src/lib/auth/errors.ts
  - src/lib/auth/schemas.ts
  - src/lib/cart/merge-on-signin.ts
  - src/lib/cart/session.ts
  - src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql
  - src/lib/db/migrations/meta/_journal.json
  - src/lib/db/schema.ts
  - src/lib/env.ts
  - src/lib/orders/server.ts
  - src/lib/supabase/admin.ts
  - src/lib/supabase/client.ts
  - src/lib/supabase/server.ts
  - src/middleware.ts
  - tests/actions/auth.test.ts
  - tests/audit/auth-events.test.ts
  - tests/auth/lockout.test.ts
  - tests/auth/signin.test.ts
  - tests/auth/signup.test.ts
  - tests/e2e/admin-gate.spec.ts
  - tests/e2e/cart-merge.spec.ts
  - tests/e2e/csrf.spec.ts
  - tests/e2e/password-reset.spec.ts
  - tests/rls/cross-user-deny.test.ts
  - tests/security/csp.test.ts
  - tests/security/headers.test.ts
  - tests/setup/next-cookies-mock.ts
  - tests/setup/supabase-test-client.ts
findings:
  critical: 1
  warning: 9
  info: 6
  total: 16
status: issues_found
---

# Phase 10: Code Review Report

**Reviewed:** 2026-05-11
**Depth:** standard
**Files Reviewed:** 61
**Status:** issues_found

## Summary

Phase 10 (Authentication & Security Core) ships a coherent Supabase-Auth stack with strong separation between SSR (RLS-bound) and service-role clients, a service-role-only audit log, an admin email allowlist gate, six security headers, and a race-safe guest-cart merge. The orchestrator's eight specific concerns mostly hold up under review: the service-role import fence is correctly configured (CR-CHECK-3), no file outside `src/lib/supabase/admin.ts` imports the admin client (CR-CHECK-4), `mergeGuestCartIntoUserCart` is wrapped in a Drizzle transaction with `FOR UPDATE` locking and is structurally race-safe (CR-CHECK-1), `writeAuthEvent` is fire-and-forget and never throws (CR-CHECK-7), the RLS policies use `(SELECT auth.uid())` per the planner-cache rule (CR-CHECK-8), and `apply-10-02-migration.ts` is correctly not wired into any npm script (CR-CHECK-6).

However, one BLOCKER was found that is likely to crash the password-reset page in the browser: `src/lib/supabase/client.ts` carries `'use client'` and imports the strict `@/lib/env` module, which `safeParse`s `SUPABASE_SERVICE_ROLE_KEY` (a non-`NEXT_PUBLIC_` env var) and throws on module load when the value is undefined — which is exactly what happens in a client bundle. Nine WARNINGS cover CSP weakening (`unsafe-inline` on script-src per CR-CHECK-2), HSTS shipping in development, hard-coded `/en` locales in password-reset redirects, a `text-right` directional-class violation in the admin layout, a doc-vs-implementation drift for the audit writer, an over-collapsing Supabase error mapper, and migration idempotency gaps.

## Critical Issues

### CR-01: Client-only Supabase factory imports server `env` and will crash the browser on load

**File:** `src/lib/supabase/client.ts:14`
**Issue:** The file starts with `'use client'` (line 1) and is consumed by `ResetPasswordForm.tsx` (Client Component, `useEffect` mount call). It imports `env` from `@/lib/env`, which performs a strict `safeParse` requiring `SUPABASE_SERVICE_ROLE_KEY: z.string().min(100)` and `SUPABASE_ADMIN_EMAILS: z.string().min(1)`. Next.js strips non-`NEXT_PUBLIC_*` env vars from client bundles, so in the browser `process.env.SUPABASE_SERVICE_ROLE_KEY` is `undefined`. The schema fails, and `env.ts` line 49 throws `new Error('Missing or invalid environment variables: ...')` at module init — which means every browser load of `/[locale]/reset-password` (the only consumer) blows up before the recovery flow can run.

This contradicts the file docblock's own promise: "Browser-only Supabase client. Anon key + cookies-handled-by-browser." The fix is to read the two `NEXT_PUBLIC_*` values directly from `process.env` (Next.js inlines those at build) instead of going through the server-side `env` object.

**Fix:**
```typescript
'use client';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in the client bundle.',
    );
  }
  return createBrowserClient(url, anon);
}
```

Defense-in-depth: also split `src/lib/env.ts` into two modules — a server-only one that validates all keys (and `import 'server-only'` at the top to fail the build if a client module ever imports it), plus a tiny client-safe constants module if you ever need typed `NEXT_PUBLIC_*` access on the client.

## Warnings

### WR-01: CSP `script-src` permits `'unsafe-inline'` — significant XSS posture weakening (CR-CHECK-2)

**File:** `next.config.ts:33`
**Issue:** `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com` allows arbitrary inline scripts to execute, which neutralizes CSP's primary XSS mitigation. The docblock (lines 17-20) acknowledges this as a "Phase-10 simplification" tied to next-intl/base-ui/motion emitting inline content, but the codebase's actual usage shows only `style-src 'unsafe-inline'` would be required for those libraries — none of next-intl, base-ui, or motion emit inline scripts. Inline styles via CSS-in-JS are common; inline `<script>` blocks are not.

The risk: any successful XSS (via a Supabase profile field, an Order shipping address rendered without escaping, etc.) becomes immediately exploitable since the attacker's injected `<script>` is permitted by CSP. This is at least a WARNING per the orchestrator's CR-CHECK-2 escalation criterion.

**Fix:** Move to a nonce-based script-src (Next.js 15 supports per-request nonces via middleware) or, as a minimum interim step, audit which files emit inline scripts and verify only first-party content does. Either remove `'unsafe-inline'` from `script-src` and keep it on `style-src` only, or document in `10-VERIFICATION.md` exactly which third-party library demands script-level `unsafe-inline` (with line refs) so the next phase can plan the upgrade.

### WR-02: HSTS header shipped in development (not production-only)

**File:** `next.config.ts:48`
**Issue:** `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` is attached to every response via the unconditional `headers()` config (line 65-72), with no `process.env.NODE_ENV === 'production'` guard. Two-year HSTS with preload on a dev `http://localhost:3000` response is harmless to localhost itself, but if a developer ever tunnels their dev server through an HTTPS reverse proxy (ngrok, Tailscale Funnel) the response can pin HSTS on a real hostname for two years. The project's security expectations (from the orchestrator brief) explicitly call out "HSTS must be production-only."

**Fix:**
```typescript
const isProd = process.env.NODE_ENV === 'production';
const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
  { key: 'X-Frame-Options', value: 'DENY' },
  // ...rest
];
```

### WR-03: Doc/implementation drift — `writeAuthEvent` claims admin client, uses Drizzle

**File:** `src/lib/auth/audit.ts:5-15` (docblock) and `src/lib/db/schema.ts:269`
**Issue:** `audit.ts` lines 5-15 describe service-role/admin-client semantics, and `schema.ts:269` reads "Writes happen from auth Server Actions via the admin client (Plan 10-03 `writeAuthEvent`); reads happen only from /admin pages." The actual implementation (`audit.ts:56-65`) writes via `db.insert(authEvents).values(...)` — Drizzle, using the postgres connection-string role.

Functionally this works (the postgres role has `BYPASSRLS`, so writes succeed against the no-policies `auth_events` table). But documentation that promises "admin client" while the code uses Drizzle invites future bugs: a reviewer trying to refactor the postgres connection to a less-privileged role will not realize they have just broken audit log writes silently (Drizzle would error, the `try/catch` swallows it, audit rows would disappear without surface signal).

**Fix:** Either (a) update the docblocks in `audit.ts` and `schema.ts` to say "writes happen via Drizzle which uses the postgres connection-string role (BYPASSRLS)" and explicitly call out that the admin client is NOT in the audit path; or (b) refactor `writeAuthEvent` to use `createAdminClient()` from `@/lib/supabase/admin` so the schema comment becomes true. (a) is the cheaper change.

### WR-04: Physical directional class `text-right` in admin layout

**File:** `src/app/[locale]/admin/layout.tsx:112`
**Issue:** The signed-in-as block uses `<div className="text-right">`. CLAUDE.md prohibits physical directional classes (`text-right`/`text-left`) and the codebase already includes a comment about this in `src/components/forms/Field.tsx:13` ("Logical CSS only — no `ml-/mr-/pl-/pr-/text-right/text-left` per CLAUDE.md"). The admin tree is currently EN-only per UI-SPEC, but the rule applies regardless (defense-in-depth — the same class will silently break the day the admin tree gains RTL support).

Note: `text-right` is also present in `src/components/admin/InventoryTable.tsx`, `src/components/admin/OrdersTable.tsx`, and `src/components/admin/ProductEditor.tsx` — those are pre-Phase-10 files but the same fix applies if the team wants to enforce the rule consistently.

**Fix:** Replace with the logical alias:
```tsx
<div className="text-end">
  <div className="text-[10px] font-mono uppercase opacity-40">Signed in as</div>
  <div className="text-xs font-bold tracking-tight" dir="ltr">{user.email}</div>
</div>
```

### WR-05: Password-reset redirect hardcodes `/en` — Arabic users lose locale

**File:** `src/app/actions/auth.ts:225`
**Issue:** `requestPasswordResetAction` builds `redirectTo: ${origin}/api/auth/callback?next=/en/reset-password` regardless of the user's current locale. An Arabic-locale user who submits the forgot-password form receives a recovery email; clicking the link bounces them through the callback into the EN reset page, losing locale (and breaking trust — they expected the brand to remember their language). Same issue at `src/app/api/auth/callback/route.ts:24` (default `next` is `/en/reset-password`) and line 38 (failure redirect to `/en/forgot-password?error=invalid_link`).

**Fix:** Thread the locale through the action signature, or read it from `headers()` (next-intl exposes the active locale via cookies/headers), and build `/${locale}/reset-password` / `/${locale}/forgot-password`:
```typescript
// In requestPasswordResetAction:
import { getLocale } from 'next-intl/server';
const locale = await getLocale();
await supabase.auth.resetPasswordForEmail(parsed.data.email, {
  redirectTo: `${origin}/api/auth/callback?next=/${locale}/reset-password`,
});
```
And in the callback route, accept a locale fallback or parse the `next` parameter to preserve whatever locale was encoded.

### WR-06: `mapSupabaseError` over-collapses `status === 400` to INVALID_CREDENTIALS

**File:** `src/lib/auth/errors.ts:81`
**Issue:** The final branch (`status === 400`) returns `INVALID_CREDENTIALS` / `Auth.errors.invalidCredentials`. Supabase Auth returns 400 for many non-credential failures: malformed email, malformed password payload, validation errors from `updateUser`, etc. A user who legitimately mis-submits the reset form (e.g. an empty password somehow getting through zod) would see "Invalid email or password" — a misleading message.

The mapper already has earlier branches that catch the genuine invalid-credentials case via the `/invalid.*(login|credentials|email|password)/` regex. The trailing `|| status === 400` is the over-collapse.

**Fix:** Drop the `|| status === 400` fallback. Let unhandled 400s fall through to the final UNKNOWN return — that's the safer default and the audit log preserves the raw `code`/`status` for ops triage.
```typescript
if (
  /invalid.*(login|credentials|email|password)/.test(msg) ||
  /invalid.?login.?credentials/.test(msg)
) {
  return {
    code: 'INVALID_CREDENTIALS',
    messageKey: 'Auth.errors.invalidCredentials',
  };
}
return { code: 'UNKNOWN', messageKey: 'Auth.errors.unknown' };
```

### WR-07: Migration `0002_phase10_auth_fk_and_rls.sql` lacks idempotency on most statements (CR-CHECK-8 nuance)

**File:** `src/lib/db/migrations/0002_phase10_auth_fk_and_rls.sql:27-141`
**Issue:** Section 1 (DROP INDEX) correctly uses `IF EXISTS`. Every subsequent statement does not: `ALTER TABLE ... ALTER COLUMN TYPE` (lines 27-28), `ADD CONSTRAINT` (lines 34-39), `CREATE INDEX` (lines 42-43, 60-62), `CREATE TABLE` (line 50), `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` (lines 77-82, idempotent by Postgres semantics), and `CREATE POLICY` (lines 86-137) all fail on re-run if their objects already exist.

The orchestrator's brief asserts the file "uses idempotent guards (IF NOT EXISTS, IF EXISTS)" — it largely does not. The risk is partly contained by the hash-check in `scripts/apply-10-02-migration.ts:60-68`, but if a future operator runs the SQL directly (via `psql`, a Supabase migration UI, or a CI pipeline that doesn't consult the journal), they will encounter "constraint already exists" or "policy already exists" errors mid-application with no rollback unless they wrap the whole thing in a transaction manually.

**Fix:** Add idempotency guards everywhere it's cheap:
- `CREATE INDEX IF NOT EXISTS ...`
- `CREATE TABLE IF NOT EXISTS public.auth_events ...`
- `CREATE POLICY` does not support `IF NOT EXISTS`, so prefix each block with `DROP POLICY IF EXISTS "policy_name" ON public.tablename;`
- The ALTER TYPE / ADD CONSTRAINT pair is one-way by design; document this explicitly in the file header and add a `DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'carts_user_id_fk') THEN ... END IF; END $$;` guard if you want true idempotency.

### WR-08: Unsafe type assertion in SignupForm defaultValues

**File:** `src/components/auth/SignupForm.tsx:56`
**Issue:** `acceptTerms: false as unknown as true` casts a runtime-false value to the type literal `true` to satisfy `signupSchema`'s `z.literal(true)`. This works because react-hook-form treats it as the initial controlled value (and the user must check the box before submit can land on the schema-true path), but the cast itself is a smell — it tells the typechecker something untrue about the runtime value, and any future refactor that reads `defaultValues.acceptTerms` directly will get a type that lies.

**Fix:** Change the schema to permit `false` at the form level and rely on zod's `.refine`:
```typescript
// In schemas.ts:
export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email('Auth.errors.emailInvalid'),
  password: z.string().min(8, 'Auth.errors.passwordTooShort'),
  acceptTerms: z.boolean(),
}).refine((d) => d.acceptTerms === true, {
  message: 'Auth.errors.acceptTermsRequired',
  path: ['acceptTerms'],
});
```
Then `defaultValues.acceptTerms = false` is honest, the type is `boolean`, and the cast disappears.

### WR-09: `getOrCreateCart` defensive merge hook calls `supabase.auth.getUser()` on every invocation

**File:** `src/lib/cart/session.ts:70-99`
**Issue:** Every call to `getOrCreateCart` (which fires from `submitCheckout`, every cart mutation Server Action, and indirectly from any cart drawer hydration) does a full Supabase JWT validation + a DB lookup to check whether the cart needs merging. The plan describes this as "defensive" but it's wired as an unconditional hot-path expense — even already-merged authenticated users pay the cost.

Two concerns: (1) latency (network RTT to Supabase Auth per cart resolution); (2) correctness on Supabase Auth blips — the try/catch swallows the failure, but if `supabase.auth.getUser()` times out, the entire cart resolution silently proceeds without checking for merge, masking the issue.

(Performance is out of v1 review scope per the brief, but the correctness aspect — silent fallthrough on Auth failure — is a real concern.)

**Fix:** Guard the hook on whether the resolved cart has `userId === null`, and skip the entire Supabase call when it's already user-bound (the merge has nothing to do in that case):
```typescript
// Only run the merge hook if the resolved cart is guest-bound (userId is null).
// User-bound carts are already merged; checking auth again is wasteful and
// silently fails on Supabase Auth outages.
if (resolvedCart && /* cart not yet known to be user-bound */) {
  // existing hook body
}
```
And add an explicit log line on the catch so Auth outages surface in ops dashboards rather than disappearing.

## Info

### IN-01: `account/page.tsx` defensively returns `null` instead of `notFound()`

**File:** `src/app/[locale]/account/page.tsx:33`
**Issue:** `if (!user) return null;` — the layout already redirects, so this branch is unreachable, but the recovery path is silently empty (a blank screen) rather than the canonical 404. The sibling `account/orders/[reference]/page.tsx:37` uses `notFound()` for the same belt-and-braces check.
**Fix:** Use `notFound()` for consistency: `if (!user) notFound();`.

### IN-02: Dead translation keys

**File:** `messages/en.json:480-482` and `messages/ar.json:480-482`
**Issue:** `Account.pagination`, `Account.nextPage`, `Account.prevPage` are present in both locales, but `OrdersList.tsx` does not consume them — pagination UI is not rendered in `/account`. The translations exist for a future feature.
**Fix:** Either land the pagination UI (referencing `getOrdersForUser`'s `limit`/`offset` opts which are wired) or remove the keys until they are used.

### IN-03: Dead `?? ''` fallback in admin-allowlist

**File:** `src/lib/auth/admin-allowlist.ts:15`
**Issue:** `(env.SUPABASE_ADMIN_EMAILS ?? '')` — but `env.ts` declares this field as `z.string().min(1)` (required), so `env.SUPABASE_ADMIN_EMAILS` is guaranteed non-empty at runtime. The fallback is dead defensive code.
**Fix:** Drop the fallback for clarity:
```typescript
const allow = env.SUPABASE_ADMIN_EMAILS
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);
```

### IN-04: `as never` casts in form error-resolution try/catch blocks

**File:** `src/components/auth/LoginForm.tsx:60-63`, `src/components/auth/SignupForm.tsx:67-70`, `src/components/auth/ResetPasswordForm.tsx:96-99`, `src/components/auth/SignupForm.tsx:187`
**Issue:** Each form uses `setFormError(tErrors(stripped as never))` to call a typed translation with a dynamic key. The `as never` cast bypasses next-intl's typed namespace narrowing; it works because `tErrors` is bound to the `Auth.errors` namespace and the keys are server-controlled, but the pattern repeats four times. A shared helper would centralize the cast.
**Fix:** Extract a small helper `resolveAuthError(tErrors, messageKey)` that handles the strip + try/catch in one place; or accept that this is the documented next-intl escape hatch for dynamic keys and add a single comment to the cast.

### IN-05: `middleware.ts` runs `intlMiddleware(request)` twice on cookie set

**File:** `src/middleware.ts:20, 34`
**Issue:** The initial call on line 20 builds the response; the `setAll` adapter re-runs `intlMiddleware(request)` on line 34 to capture the updated request cookies. This is the documented Supabase SSR + next-intl pattern, so the duplication is intentional, but it does mean every authenticated request pays the intl-routing cost twice when Supabase refreshes the JWT. Worth a comment so a future refactor doesn't try to "simplify" the duplication and break cookie propagation.
**Fix:** Add an inline comment on line 34: `// Re-run intlMiddleware so the new response object sees the just-set request cookies — required by Supabase SSR docs; do not remove.`

### IN-06: `applyMigration.ts` console output mixed style (`→`, `❌`, `✓`)

**File:** `scripts/apply-10-02-migration.ts:34, 47, 71, 78-79, 81, 103, 113`
**Issue:** The script mixes Unicode arrows and check marks with bare emoji. The script is correctly excluded from any npm runner per `package.json`, so this is purely cosmetic — but Windows console hosts often render these glyphs as boxes, hindering forensic review.
**Fix:** None required (one-off script); if you reach for it again, switch to plain ASCII (`->`, `[ok]`, `[fail]`).

---

_Reviewed: 2026-05-11_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
