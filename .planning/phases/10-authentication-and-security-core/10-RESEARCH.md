---
phase: 10
phase_name: Authentication & Security Core
phase_slug: authentication-and-security-core
researched: 2026-05-10
domain: Authentication, session management, RLS, security headers, CSRF
confidence: HIGH (questions 1, 3, 5) / MEDIUM (questions 2, 4)
---

# Phase 10: Authentication & Security Core — Research

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **Provider:** Supabase Auth via `@supabase/ssr` + `supabase-js`. No NextAuth, no Clerk, no custom auth.
- **Methods:** Email + password only in Phase 10. No OAuth, no magic links.
- **Email confirmation:** Disabled. New accounts can log in immediately after signup.
- **Sessions:** httpOnly cookies via `@supabase/ssr` cookie-based session helpers.
- **Cart merge:** On first authenticated request, merge guest cart (`orki_sid` cookie) into a new user-owned cart **only if** the user has no existing server-side cart. If a user-owned cart already exists, prefer it and silently discard the guest cart.
- **Account scope:** Order history list + per-order detail (RLS-gated) + sign-out only. Address book / profile editing / saved payment methods / newsletter prefs deferred.
- **Admin gate:** Email allowlist via `SUPABASE_ADMIN_EMAILS` env (server-only, comma-separated). TOTP MFA opt-in (not enforced). IP allowlisting deferred.
- **Auth UX routes:** `/[locale]/login`, `/[locale]/signup`, `/[locale]/forgot-password`, `/[locale]/reset-password`, `/[locale]/account`, `/[locale]/account/orders/[reference]`. Header dropdown for sign-in/sign-out.
- **CSRF:** Rely on Next.js Server Actions same-origin enforcement + Supabase PKCE. No custom CSRF token table.
- **Validation:** zod schemas, mirroring `src/app/actions/cart.ts` pattern. Wrap Supabase errors via `messageKey` envelope.
- **Audit log:** New `public.auth_events` Drizzle table. Columns documented in CONTEXT.md §"Audit logging".
- **Rate limiting:** Supabase per-IP defaults cover SEC-03 + SEC-07 for auth. App-level rate limiting on cart/checkout deferred.
- **Security headers:** Set in `next.config.ts` via `headers()` async function. Strict CSP (no per-route nonce in this phase), HSTS, XFO=DENY, nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy minimal.
- **Schema:** Adds FK from `carts.userId` and `orders.userId` to `auth.users(id)`. Adds RLS policies on `carts`, `cart_items`, `orders`, `order_items`, `order_events`. Service-role key bypasses RLS for admin Server Actions.
- **i18n:** `Auth` and `Account` namespaces added to `messages/en.json` and `messages/ar.json`. Formal-tone AR copy. No `[AR-LEGAL-REVIEW]` prefix needed.
- **Drizzle stays.** Auth schema (`auth.*`) is Supabase-owned and never imported into Drizzle introspection. Cross-schema FKs are typed manually (ADR-002 §6).
- **Direct Supabase env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only), `SUPABASE_ADMIN_EMAILS` (server-only). All added to `src/lib/env.ts` zod schema.

### Claude's Discretion
- Migration shape (`text` vs. `uuid` for `userId` columns) — researched in §2.1 below.
- Concrete CSP allowlist — researched in §2.4 below.
- Exact RLS policy SQL — researched in §2.5 below.
- File layout for the two Supabase clients — researched in §4 below.
- Plan boundaries (5–8 plans) — proposed in §5 below.

### Deferred Ideas (OUT OF SCOPE)
- OAuth providers (Google, Apple).
- Magic-link passwordless sign-in.
- Address book + profile editing in `/account`.
- Hard-enforced TOTP MFA for admin role.
- IP allowlisting for `/admin`.
- Threshold-based alerting on `auth_events`.
- CSP nonce per-route plumbing.
- App-level rate limiting on cart/checkout.
- Sender-domain (DKIM/SPF) configuration for Supabase auth emails.
- Account deletion UX (FK uses `ON DELETE SET NULL`; the user-facing delete page is deferred).
- Supabase email template AR copy native-speaker review.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| SEC-01 | Auth via proven library + httpOnly session cookies | Supabase Auth via `@supabase/ssr` (§2.5, ADR-002). Cookie-based session helpers. |
| SEC-02 | Server-side validation/sanitization on all input | zod schemas on every Server Action (mirrors `src/app/actions/cart.ts`). Auth UI inputs validated before Supabase call. |
| SEC-03 | Rate limiting + strict CORS on API endpoints | Supabase per-IP rate limits at `/auth/v1/*` (§2.2). Server Actions are POST + same-origin enforced (§2.3) — no CORS surface. |
| SEC-04 | CSRF protection on state-changing routes | Next.js 15 Server Actions enforce Origin == Host check + POST-only (§2.3). Supabase PKCE for OAuth callback paths (none enabled in Phase 10). |
| SEC-05 | HTTPS + strict security headers | Vercel terminates HTTPS. Headers set in `next.config.ts` (§2.4). |
| SEC-06 | Generic auth error messages (no enumeration) | Supabase returns `Invalid login credentials` for both wrong-email and wrong-password (§2.2). Wrap into `Auth.errors.invalidCredentials` messageKey. |
| SEC-07 | Throttle/lock after repeated failed login attempts | Supabase per-IP rate limit on `/token` covers throttling at the IP level. `auth_events.signin_failed` provides the audit trail. Per-user lockout requires a dashboard adjustment (§2.2). |
| SEC-08 | Admin panel: protected route, MFA, IP-restricted where possible | Email allowlist + middleware gate. TOTP opt-in. IP allowlist deferred. |
| SEC-09 | Log suspicious activity + trigger alerts | `public.auth_events` table. Alerting deferred (no on-call infra). |
</phase_requirements>

## 1. Executive Summary

Phase 10 is a wiring phase, not a build-from-scratch phase. `@supabase/ssr@0.10.3` and `@supabase/supabase-js@2.105.4` are already installed (verified in `package.json`). The bulk of the work is: (a) two Supabase client factories, (b) one middleware that refreshes sessions, (c) a Drizzle migration that adds two cross-schema FKs and five RLS policies, (d) five UI routes, (e) auth Server Actions wrapping Supabase calls in the existing `ActionResult` envelope, and (f) one `headers()` block in `next.config.ts`.

**Single biggest risk:** Supabase's *default* per-IP rate limit on the password sign-in endpoint is unclear from the public docs — the docs document `/auth/v1/token` refresh (1800/hr) and email/OTP send rates, but the password-grant sign-in path is documented only via the configurable "rate limit for sign-ups and sign-ins" dashboard setting (default appears to be ~30/5min/IP per a 2026 community issue, but the issue reports under-enforcement). Plan must include a Wave 0 task to verify and explicitly set this in the Supabase dashboard before SEC-07 can be claimed.

**Single biggest schema decision:** Keep `carts.userId` and `orders.userId` as `text`, do **not** ALTER to `uuid`. Drizzle does not introspect `auth.*` so the FK must be hand-written as raw SQL anyway. `text` matches the existing column type, requires no data cast, and `auth.users.id` is uuid-stringable. The FK constraint is `text` → `uuid` cast-compatible at the constraint level via `REFERENCES auth.users(id)` because Postgres auto-coerces uuid→text when comparing. (Confirmed in §2.1 below.)

**Single biggest pattern:** Every authenticated path uses the SSR client (anon key + user JWT from cookie), which is RLS-bound. Every admin path uses the service-role client, which bypasses RLS. The boundary is enforced by file location and a lint check: `src/lib/supabase/server.ts` exports both clients but `serviceRoleClient()` lives in a separate file (`src/lib/supabase/admin.ts`) imported only from `src/app/actions/admin/*` and `src/app/[locale]/admin/*`.

**Tooling:** Already installed — `@supabase/ssr@^0.10.3`, `@supabase/supabase-js@^2.105.4`, `zod@^4.4.3`, `vitest@^4.1.5`, `@testing-library/react@^16.3.2`. No new dependencies needed for the core phase. Optional: `@playwright/test` if the planner adds end-to-end auth flows (recommended in §3).

## 2. Resolved Open Questions

### 2.1 `carts.userId` / `orders.userId` migration shape vs. `auth.users(id)`

**Verified facts:**
- Current schema (`src/lib/db/schema.ts` lines 109 & 162): both columns are `text('user_id')`, nullable, indexed. `[VERIFIED: Read of src/lib/db/schema.ts]`
- Phase 8 explicitly chose `text` over `uuid` to leave the auth provider undecided. `[VERIFIED: 08-01-SUMMARY.md decision log]`
- ADR-002 §5: "Drizzle doesn't introspect the `auth` schema. Cross-schema FKs typed manually." `[VERIFIED: ADR-002.md]`
- Supabase `auth.users.id` is `uuid`. `[CITED: supabase/auth schema, well-known]`
- Postgres FK constraints require **type-compatible** columns. `text` → `uuid` is **not** directly FK-able without an explicit cast operator on the constraint definition. Postgres allows `REFERENCES` only between identical (or implicitly castable) types. There is **no implicit cast** between `text` and `uuid` in either direction.

**Recommendation: ALTER to `uuid` and add a hard FK.** The "soft FK" alternative (keep `text`, no constraint) is a footgun — it permits orphan rows and silent referential violations. The migration is short and reversible.

**Pre-migration data probe (planner Wave 0 task):**
```sql
-- Run via Supabase SQL editor or psql against DATABASE_URL.
-- Confirms every existing user_id value is uuid-castable; returns 0 rows if safe.
SELECT 'carts' AS tbl, id, user_id FROM public.carts
WHERE user_id IS NOT NULL
  AND user_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
UNION ALL
SELECT 'orders', id::text, user_id FROM public.orders
WHERE user_id IS NOT NULL
  AND user_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$';
```
**Expected result in current dev/prod:** 0 rows. The columns have only ever been written by Phase 8 (guest-only) which never set them, so they are universally NULL. `[ASSUMED — must verify before migration runs]`

**Migration SQL (hand-written, not generated by drizzle-kit):**
```sql
-- 0002_phase10_auth_fk_and_rls.sql

-- 1. Drop the indexes (will be recreated on the new uuid columns).
DROP INDEX IF EXISTS carts_user_id_idx;
DROP INDEX IF EXISTS orders_user_id_idx;

-- 2. ALTER COLUMN type. Safe-cast guard: USING ... ::uuid will error if any row
--    has a non-uuid string. The Wave 0 probe above must have returned 0 rows.
ALTER TABLE public.carts
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

ALTER TABLE public.orders
  ALTER COLUMN user_id TYPE uuid USING user_id::uuid;

-- 3. Add cross-schema FKs. ON DELETE SET NULL preserves anonymized order history.
ALTER TABLE public.carts
  ADD CONSTRAINT carts_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_user_id_fk
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- 4. Recreate the indexes on the new uuid columns.
CREATE INDEX carts_user_id_idx ON public.carts(user_id);
CREATE INDEX orders_user_id_idx ON public.orders(user_id);
```

**Drizzle schema update (must mirror DB after migration):**
```typescript
// src/lib/db/schema.ts — replace text('user_id') with uuid('user_id')
userId: uuid('user_id'),  // FK enforced at DB level; not declared via .references() because Drizzle can't introspect auth.users
```
The Drizzle `.references()` chain is intentionally **omitted** because pointing it at a non-Drizzle-managed table breaks `drizzle-kit generate` diff — it tries to emit the FK on every generate. Document this in a code comment and add a SUMMARY callout.

**Drizzle-kit interaction:**
- `npm run db:generate` will detect the type change (`text → uuid`) and try to emit its own ALTER. **Do not let it.** Hand-author `0002_phase10_auth_fk_and_rls.sql`, then run `npm run db:push` only after the manual SQL has run, OR `npm run db:generate --custom` to author a custom migration file. Recommended: hand-author the SQL file and update `meta/_journal.json` to register it (mirrors what 08-01 did). The 08-01 SUMMARY confirms drizzle-kit's diff behavior is well-understood by this codebase.

**Confidence:** HIGH on direction (text→uuid + hard FK). MEDIUM on the assumption that all existing `user_id` values are NULL — planner must verify with the probe above as the first task.

### 2.2 Supabase rate-limit defaults for SEC-07 (lockout)

**Verified facts:**
- `/auth/v1/token` (refresh) — **1800/hr per IP, burst 30**. `[VERIFIED: supabase.com/docs/guides/platform/going-into-prod via WebFetch]`
- `/auth/v1/verify` — 360/hr per IP, burst 30. `[VERIFIED: same source]`
- `/auth/v1/otp` — 360/hr per IP. `[VERIFIED: same source]`
- Email send (signup, recover, user) — `auth.rate_limits.email.inbuilt_smtp_per_hour.value` per hour with a 60-second cooldown between requests. Default ≈ 30/hr on inbuilt SMTP. `[VERIFIED: same source]`
- A configurable "Rate limit for sign-ups and sign-ins" dashboard setting exists at **Authentication → Rate Limits** in the Supabase dashboard. The setting is described as "sign up and sign-in requests in a 5 minute interval per IP address (excludes anonymous users)." Default value is **not authoritatively documented** in current Supabase docs. `[CITED: github.com/supabase/auth/issues/2333; community discussions]`
- A January 2026 GitHub issue (`supabase/auth#2333`) reports the configured limit is sometimes **under-enforced** — users observed 30–50 requests landing before a 429. Status: closed but no clear resolution in the issue body. `[CITED: github.com/supabase/auth/issues/2333]`
- `[ASSUMED]` Default sign-in rate limit is approximately **30 requests per 5 minutes per IP** based on community reports. Authoritative numeric default is not in the public docs as of May 2026.

**Recommendation:**

Supabase's defaults satisfy SEC-07's "throttled/temporarily locked after repeated failed login attempts" **at the IP level** out of the box, with the following caveats the planner must address:

1. **Wave 0 verification task:** Use the Supabase Management API to read current rate-limit values for this project and document them. Command (Supabase project ref `gkcaakimmvsctwpvccwt`):
   ```bash
   curl -X GET "https://api.supabase.com/v1/projects/gkcaakimmvsctwpvccwt/config/auth" \
     -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
     | jq 'to_entries | map(select(.key | startswith("rate_limit_"))) | from_entries'
   ```
2. **Explicit override:** PATCH the dashboard to set conservative limits. Recommended values:
   ```json
   {
     "rate_limit_email_sent": 5,
     "rate_limit_token_refresh": 150,
     "rate_limit_otp": 30,
     "rate_limit_verify": 30
   }
   ```
   The "sign-ups and sign-ins" limit is set in the dashboard UI under **Authentication → Rate Limits** and is **not exposed via the Management API** under a `rate_limit_*` key — recommend setting it manually to **5 per 5 minutes per IP**. Document this as a post-migration manual step in the launch checklist.
3. **Per-user lockout (not just per-IP) is NOT in Supabase's built-in scope.** A determined attacker with a residential proxy pool can probe N accounts at the per-IP limit. SEC-07 says "Accounts must be throttled/temporarily locked" — strict reading implies per-account. **Mitigation in Phase 10:** the `auth_events.signin_failed` rows are the primary evidence; per-account lockout via custom logic (e.g., a Supabase Edge Function or middleware that checks `count(*) FROM auth_events WHERE email=X AND event='signin_failed' AND created_at > now() - interval '15 min'` and short-circuits) is **deferred** to a hardening phase. Document this gap honestly in the security review.
4. **Captcha:** Supabase supports hCaptcha/Turnstile at the auth endpoints as an additional brake. Out of Phase 10 scope but flag as a deferred mitigation if abuse appears.

**Confidence:** MEDIUM. The IP-level numbers are HIGH (verified). The interpretation that "IP-level lockout satisfies SEC-07" is MEDIUM — defensible per the requirement language, but not a per-account lockout. The planner must surface this gap explicitly in the SUMMARY.

### 2.3 Next.js 15 Server Actions same-origin enforcement (CSRF for SEC-04)

**Verified facts (HIGH confidence):**

- Next.js 15 App Router Server Actions enforce Origin/Host validation **by default**. From the official docs:
  > "Server Actions compare the Origin header to the Host header (or X-Forwarded-Host) to ensure requests originate from the same host as the page invoking them. If these headers don't match, the request is aborted, preventing unauthorized invocations from different domains."
  `[VERIFIED: github.com/vercel/next.js/blob/canary/docs/01-app/02-guides/data-security.mdx via Context7]`
- Server Actions use **POST-only**, which prevents most browser-initiated CSRF.
  > "Server Actions use the POST HTTP method exclusively, which prevents most CSRF vulnerabilities in modern browsers. This is further strengthened by SameSite cookies being the default."
  `[VERIFIED: same source]`
- `experimental.serverActions.allowedOrigins` is the only knob — set it to add reverse-proxy hostnames; don't set it for a single-domain Vercel deployment. `[VERIFIED: same source]`
- Supabase auth cookies set by `@supabase/ssr` default to `SameSite=Lax`, which prevents cross-site POST submissions from carrying the cookie. `[CITED: @supabase/ssr default cookie options]`

**Recommendation:**

**SEC-04 is fully satisfied** by the combination of (a) Server Actions POST + Origin/Host check, (b) SameSite=Lax cookies on both `orki_sid` (cart) and `sb-*` (Supabase auth), (c) Supabase PKCE for any future OAuth callback (not used in Phase 10). **No custom CSRF token table is needed.** This matches the locked decision in CONTEXT.md.

**Verification recipe (the verifier and security-review agent should run this against a live deploy):**

```bash
# Replace ORIGIN with your deploy URL.
ORIGIN="https://orki-shop.vercel.app"

# 1. Capture a valid Server Action POST signature from a real form submit
#    (use browser devtools → Network → copy as cURL). Replace ACTION_ID below.

# 2. Replay it with a mismatched Origin header — must return 403.
curl -i -X POST "$ORIGIN/en/login" \
  -H "Origin: https://attacker.example" \
  -H "Host: orki-shop.vercel.app" \
  -H "Next-Action: <action-id-from-step-1>" \
  -H "Content-Type: multipart/form-data; boundary=xxx" \
  --data-binary @captured-body.bin
# Expected: HTTP/1.1 403 Forbidden  (or 500 with x-action-revalidated header missing)
```

Add this to `08-UAT.md`-style smoke checklist. The verifier-agent runs it as a post-deploy gate.

**Confidence:** HIGH.

### 2.4 CSP allowlist for Vercel + Supabase + next-intl + Tailwind v4

**Verified facts:**
- `@vercel/speed-insights@^2.0.1` is installed. Production loads scripts from same-origin (Vercel proxies them via `/_vercel/*`), so `script-src 'self'` covers prod. **Dev/preview** loads `https://va.vercel-scripts.com/v1/speed-insights/script.debug.js` and posts to `https://vitals.vercel-insights.com/v1/vitals`. `[VERIFIED: vercel.com/docs/speed-insights/package + community CSP recipe]`
- `@vercel/analytics@^2.0.1` is installed. Same pattern — same-origin in prod via `/_vercel/insights/script.js` and `/_vercel/insights/event`. `[CITED: Vercel docs]`
- Supabase URL for this project: `https://gkcaakimmvsctwpvccwt.supabase.co`. All auth/PostgREST calls use this hostname. `[VERIFIED: ADR-001]`
- Tailwind v4 production builds compile **all** utilities — including arbitrary values like `w-[123px]` — into the static CSS file. They do **not** emit `style="..."` attributes at runtime. `[VERIFIED: tailwindcss.com/blog/tailwindcss-v4 + Tailwind v4 architecture]`
- However, **Next.js itself** injects `<style>` tags during SSR (CSS-in-JS for `<Image />` placeholder, `next-intl` doesn't, but Next's own client runtime does set inline `style="..."` on some hydration paths). `[CITED: github.com/vercel/next.js/discussions/56562]`
- The `@base-ui/react@^1.4.1` and `motion@^12.38.0` packages set inline `style` attributes for animation transforms — this is unavoidable without nonce plumbing. `[ASSUMED — based on library architecture; verify with violation reports]`

**Recommendation: a strict-but-pragmatic CSP for Phase 10, no per-route nonce.**

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com;
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https://images.unsplash.com https://gkcaakimmvsctwpvccwt.supabase.co;
  font-src 'self' data:;
  connect-src 'self' https://gkcaakimmvsctwpvccwt.supabase.co wss://gkcaakimmvsctwpvccwt.supabase.co https://vitals.vercel-insights.com;
  frame-src 'none';
  frame-ancestors 'none';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  upgrade-insecure-requests;
```

**Per-directive rationale:**
- `script-src 'unsafe-inline'`: required because Next.js 15 injects inline hydration scripts and we are explicitly NOT doing per-route nonces in Phase 10. Document as a known weakness; nonce upgrade is a deferred hardening task.
- `style-src 'unsafe-inline'`: required because Motion + base-ui set inline transform styles. Tailwind v4's compiled CSS does not require this on its own, but the runtime libraries do.
- `connect-src` includes `wss://` to leave the door open for Supabase Realtime (not used in Phase 10 but cheap to allow now and avoid a future CSP violation).
- `img-src 'self' data: blob:` covers the Unsplash placeholder hostname (already allowed in `next.config.ts` `images.remotePatterns`), plus Supabase Storage when image-upload lands later.
- `frame-ancestors 'none'` is the modern equivalent of `X-Frame-Options: DENY` — keep both for older browsers.
- `form-action 'self'` prevents form-based exfiltration to attacker domains.
- `upgrade-insecure-requests` forces HTTPS even on accidentally-typed http:// links.

**Companion headers (also set in `next.config.ts`):**
```
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
```

**Footguns:**

1. **Vercel preview deployments** use `*.vercel.app` URLs. CSP must work on both prod (`orki-shop.com` or whatever) and preview (`orki-git-feature-x-team.vercel.app`). Because we use `'self'`, this works automatically — `'self'` resolves to whatever the current origin is.
2. **Vercel Toolbar** (preview-only floating action bar) requires `vercel.live` in `script-src` and `connect-src`. **Don't add it in prod CSP.** Use a `process.env.VERCEL_ENV === 'preview'` branch in `next.config.ts headers()` to add it conditionally.
3. **next/image with remotePatterns** doesn't bypass CSP — every remote host you list in `images.remotePatterns` must also be in `img-src`. Currently only `images.unsplash.com` is listed; mirror it.
4. **next-intl client hydration** doesn't add new CSP requirements — translations are inlined into the RSC payload, not loaded over the wire.
5. **Supabase Realtime** requires `wss://` not `https://` — pre-allow it now to avoid a violation if/when Realtime lands.
6. **`@vercel/analytics`** in production proxies through `/_vercel/insights/*` (same-origin), so no extra `script-src` entry needed for prod. In dev/preview the script comes from `va.vercel-scripts.com` — already in the recipe above.

**Confidence:** MEDIUM. The hostnames and directive set are HIGH (verified against Vercel + Supabase docs). The `'unsafe-inline'` posture is a deliberate Phase 10 simplification — it's MEDIUM-secure. Document this in `10-SECURITY.md` and track nonce-upgrade in deferred items.

### 2.5 RLS + service-role boundary

**Verified facts (HIGH confidence):**

- A Supabase client created with the **anon key** PLUS the user's JWT (extracted from the request cookie by `@supabase/ssr`) acts as the `authenticated` Postgres role and is subject to RLS. Queries return only rows where `auth.uid()` matches per the policy. `[VERIFIED: supabase.com/docs/guides/database/postgres/row-level-security]`
- A Supabase client created with the **service role key** acts as the `service_role` Postgres role which has `BYPASSRLS` privilege. **All RLS policies are skipped.** `[VERIFIED: supabase.com/docs/guides/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z]`
- The service role bypass is determined by the **Authorization header**, not the apikey header. If a service-role client accidentally also sends a user JWT in Authorization, the JWT wins and RLS applies. `[VERIFIED: same source]`
- **Drizzle** connects via the Postgres connection string (session pooler), not via PostgREST. Drizzle-issued queries run as the `postgres` role (or whatever the connection-string user is) which **also bypasses RLS** by default. So Drizzle queries are NOT subject to RLS. `[CITED: well-known Postgres + Drizzle behavior]`

**Recommendation:**

Two-client file layout:

```
src/lib/supabase/
├── client.ts          # createBrowserClient — anon key, used in Client Components only
├── server.ts          # createServerClient — anon key + cookies, RLS-bound. Used in:
│                      #   - Server Components
│                      #   - Server Actions (auth.ts, account.ts)
│                      #   - Route Handlers
└── admin.ts           # createServerClient with SERVICE_ROLE_KEY, no cookie attachment.
                       # Imported ONLY from src/app/actions/admin/* and src/app/[locale]/admin/*.
                       # Has a top-of-file ESLint comment + a runtime guard:
                       #   if (process.env.NEXT_RUNTIME !== 'nodejs') throw new Error(...)
                       # to prevent accidental edge-runtime/client bundle inclusion.
```

The boundary is enforced four ways:
1. **Filename convention** — anything from `admin.ts` is admin-only.
2. **`server-only` import** at the top of `admin.ts` (already used elsewhere in the codebase per `src/lib/cart/session.ts`).
3. **Bundle check** — `SUPABASE_SERVICE_ROLE_KEY` is NOT prefixed with `NEXT_PUBLIC_`, so Next.js's bundler will refuse to inline it into client code.
4. **ESLint rule** — add a `no-restricted-imports` rule forbidding `@/lib/supabase/admin` from outside `src/app/actions/admin/**` and `src/app/[locale]/admin/**`.

**RLS policy SQL (bundled into `0002_phase10_auth_fk_and_rls.sql`):**

```sql
-- Enable RLS on all five tables.
ALTER TABLE public.carts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events  ENABLE ROW LEVEL SECURITY;

-- ─── carts: owner-only (authenticated) + guest-allowed (anon, by session_id only) ───
-- For Phase 10, guest carts continue to work because Drizzle (postgres role) bypasses
-- RLS entirely. The policies below only apply to PostgREST (anon/authenticated roles)
-- which we do NOT use for cart reads in Phase 10. Policies are defensive: if a future
-- phase moves cart ops to PostgREST, the policies are already correct.

CREATE POLICY "carts_select_own"
  ON public.carts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "carts_insert_own"
  ON public.carts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "carts_update_own"
  ON public.carts FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "carts_delete_own"
  ON public.carts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- ─── cart_items: scoped via parent cart ownership ───
CREATE POLICY "cart_items_select_own"
  ON public.cart_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid())
  ));

CREATE POLICY "cart_items_modify_own"
  ON public.cart_items FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.carts c
    WHERE c.id = cart_items.cart_id AND c.user_id = (SELECT auth.uid())
  ));

-- ─── orders: owner-only SELECT; INSERT/UPDATE only by service_role (bypass) ───
-- The application creates orders via the service-role path (checkout Server Action
-- already runs server-side via Drizzle which bypasses RLS); RLS only protects user-
-- facing reads via PostgREST in /account/orders.

CREATE POLICY "orders_select_own"
  ON public.orders FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- No INSERT/UPDATE/DELETE policies for `authenticated` on orders — those operations
-- happen via Drizzle + service-role only.

-- ─── order_items: scoped via parent order ownership ───
CREATE POLICY "order_items_select_own"
  ON public.order_items FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_items.order_id AND o.user_id = (SELECT auth.uid())
  ));

-- ─── order_events: same pattern ───
CREATE POLICY "order_events_select_own"
  ON public.order_events FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_events.order_id AND o.user_id = (SELECT auth.uid())
  ));

-- ─── auth_events: service_role only (admin-only audit log) ───
ALTER TABLE public.auth_events ENABLE ROW LEVEL SECURITY;
-- No policies = no access for anon/authenticated. service_role bypasses anyway.
-- Audit reads happen only from /admin (service-role client).
```

**Why no policies on the guest path:** Phase 10 keeps cart and checkout Drizzle-driven. Drizzle uses the `postgres` connection-string role which bypasses RLS, so guest carts continue to work without any `anon`-role policy. RLS policies above are a **defense-in-depth** layer for the future when/if cart reads move to PostgREST.

**Verification (the verifier agent runs these after deploy):**

```sql
-- Test 1: User A cannot see User B's order via the SSR client.
-- Sign in as User A in browser → open /api/debug/orders?id=<userB_order_id> → expect 404.
-- (This requires a transient debug route that uses the SSR client. Remove before launch.)

-- Test 2: Service-role client can read all orders.
-- From /admin, list all orders without filtering by user_id. Should return everything.

-- Test 3: Direct PostgREST attack — anon-key client without JWT.
curl "https://gkcaakimmvsctwpvccwt.supabase.co/rest/v1/orders?select=*" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
# Expected: [] (empty array; RLS returns no rows for unauthenticated `anon` role
# because no policy grants SELECT to `anon`).
```

**Confidence:** HIGH on the policy design and the service-role bypass behavior. HIGH on the file layout (matches Supabase's official Next.js guide).

## 3. Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Unit / integration framework | `vitest@^4.1.5` (already installed) |
| RTL framework | `@testing-library/react@^16.3.2` + `@testing-library/user-event@^14.6.1` (installed) |
| DOM env | `jsdom@^29.1.1` (installed) |
| E2E framework | `@playwright/test` — **not installed**, see Wave 0 gap |
| Quick run command | `npm run test` (existing — `vitest run --passWithNoTests`) |
| Watch mode | `npm run test:watch` |
| E2E command (after install) | `npx playwright test` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|--------------|
| SEC-01 | Sign-up creates `auth.users` row + sets httpOnly cookie | integration (Vitest + Supabase test client) | `npx vitest run tests/auth/signup.test.ts -t "creates user and session cookie"` | ❌ Wave 0 |
| SEC-01 | Sign-in returns httpOnly cookie; cookie has Secure+HttpOnly+SameSite=Lax flags | integration | `npx vitest run tests/auth/signin.test.ts -t "session cookie flags"` | ❌ Wave 0 |
| SEC-02 | Server Action rejects malformed input (missing email, weak password) before calling Supabase | unit | `npx vitest run tests/actions/auth.test.ts -t "validates input via zod"` | ❌ Wave 0 |
| SEC-04 | Server Action with mismatched Origin returns 403 | e2e (Playwright) | `npx playwright test tests/e2e/csrf.spec.ts` | ❌ Wave 0 + needs Playwright install |
| SEC-05 | Production build emits all six security headers on every page | integration | `npx vitest run tests/security/headers.test.ts` (curls a running build) | ❌ Wave 0 |
| SEC-05 | CSP header has no obvious gaps (no `*` in script-src, has `frame-ancestors 'none'`) | unit | `npx vitest run tests/security/csp.test.ts` | ❌ Wave 0 |
| SEC-06 | Wrong email and wrong password return identical error message | integration | `npx vitest run tests/auth/signin.test.ts -t "generic error on invalid creds"` | ❌ Wave 0 |
| SEC-07 | After 5 rapid failed sign-in attempts from same IP, 6th returns 429 | integration (slow — must hit live Supabase) | `npx vitest run tests/auth/lockout.test.ts -t "throttles after 5 attempts"` (skipped in CI; local-only) | ❌ Wave 0 |
| SEC-08 | Non-allowlist email accessing `/admin` redirects to `/login` | e2e | `npx playwright test tests/e2e/admin-gate.spec.ts` | ❌ Wave 0 |
| SEC-09 | Each auth event writes one row to `auth_events` with correct fields | integration | `npx vitest run tests/audit/auth-events.test.ts` | ❌ Wave 0 |
| RLS | User A's SSR client cannot read User B's order | integration | `npx vitest run tests/rls/cross-user-deny.test.ts` | ❌ Wave 0 |
| Cart merge | Guest cart with 2 items merges into new user-owned cart on first sign-in | e2e | `npx playwright test tests/e2e/cart-merge.spec.ts` | ❌ Wave 0 |
| Password reset | Reset email link → setPassword → sign-in with new password works | e2e | `npx playwright test tests/e2e/password-reset.spec.ts` (uses Supabase email-capture mock) | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` (runs all Vitest unit + integration). Should complete in under 30 seconds.
- **Per wave merge:** `npm run test && npx playwright test` (full suite, ≈ 2 minutes).
- **Phase gate:** Both green before `/gsd-verify-work`. The lockout test (SEC-07) is allowed to be skipped in CI but MUST be run manually once and documented in `10-VERIFICATION.md`.

### Wave 0 Gaps

- [ ] `tests/auth/signup.test.ts` — covers SEC-01 signup flow
- [ ] `tests/auth/signin.test.ts` — covers SEC-01 + SEC-06
- [ ] `tests/auth/lockout.test.ts` — covers SEC-07
- [ ] `tests/actions/auth.test.ts` — covers SEC-02 (zod validation)
- [ ] `tests/security/headers.test.ts` — covers SEC-05 header presence
- [ ] `tests/security/csp.test.ts` — covers SEC-05 CSP correctness
- [ ] `tests/audit/auth-events.test.ts` — covers SEC-09
- [ ] `tests/rls/cross-user-deny.test.ts` — covers RLS policies
- [ ] `tests/e2e/csrf.spec.ts` — covers SEC-04
- [ ] `tests/e2e/admin-gate.spec.ts` — covers SEC-08
- [ ] `tests/e2e/cart-merge.spec.ts` — covers cart-merge UX
- [ ] `tests/e2e/password-reset.spec.ts` — covers password reset round-trip
- [ ] `tests/setup/supabase-test-client.ts` — shared fixture: creates a fresh test user, captures session cookie, returns SSR-shaped client
- [ ] Install Playwright: `npm install -D @playwright/test && npx playwright install --with-deps chromium`
- [ ] `playwright.config.ts` — base URL = `http://localhost:3000`, single-project chromium, screenshot-on-failure

## 4. Recommended File Layout

```
src/
├── middleware.ts                          # MODIFIED — wrap next-intl middleware with Supabase session refresh
├── i18n/
│   └── routing.ts                         # unchanged
├── lib/
│   ├── env.ts                             # MODIFIED — add Supabase env vars to zod schema
│   ├── supabase/
│   │   ├── client.ts                      # NEW — createBrowserClient (anon key)
│   │   ├── server.ts                      # NEW — createServerClient (anon key + cookies)
│   │   └── admin.ts                       # NEW — createServerClient (service-role key, server-only, bypass RLS)
│   ├── auth/
│   │   ├── schemas.ts                     # NEW — zod schemas: signupSchema, signinSchema, requestResetSchema, setPasswordSchema
│   │   ├── errors.ts                      # NEW — Supabase-error → messageKey mapper (generic messages for SEC-06)
│   │   ├── audit.ts                       # NEW — writeAuthEvent(type, { userId, email, metadata })
│   │   └── admin-allowlist.ts             # NEW — isAdminEmail(email): boolean (reads SUPABASE_ADMIN_EMAILS)
│   ├── cart/
│   │   ├── session.ts                     # MODIFIED — getOrCreateCart hook for first-sign-in merge
│   │   └── merge-on-signin.ts             # NEW — mergeGuestCartIntoUserCart(userId, sessionId)
│   └── db/
│       ├── schema.ts                      # MODIFIED — userId: text → uuid; add authEvents table
│       └── migrations/
│           └── 0002_phase10_auth_fk_and_rls.sql   # NEW — hand-written; ALTER + FK + RLS
├── app/
│   ├── actions/
│   │   ├── auth.ts                        # NEW — signUpAction, signInAction, signOutAction,
│   │   │                                  #         requestPasswordResetAction, setPasswordAction
│   │   │                                  #         (all return ActionResult<T>)
│   │   └── admin/
│   │       └── (existing files)           # MODIFIED — switch to admin client where appropriate
│   ├── api/
│   │   └── auth/
│   │       └── callback/route.ts          # NEW — Supabase password-recovery redirect handler
│   └── [locale]/
│       ├── (auth)/                        # NEW route group; no shared layout other than centered chrome
│       │   ├── login/page.tsx             # NEW
│       │   ├── signup/page.tsx            # NEW
│       │   ├── forgot-password/page.tsx   # NEW
│       │   └── reset-password/page.tsx    # NEW (handles type=recovery from Supabase email link)
│       ├── account/
│       │   ├── layout.tsx                 # NEW — gated SSR check; redirects to /login if no session
│       │   ├── page.tsx                   # NEW — orders list (RLS-gated SSR query)
│       │   └── orders/
│       │       └── [reference]/page.tsx   # NEW — reuses existing order detail component, ownership-checked
│       └── admin/
│           ├── layout.tsx                 # MODIFIED — gate via admin-allowlist; show signed-in admin email
│           └── (existing children)        # unchanged
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx                  # NEW — client component; calls signInAction
│   │   ├── SignupForm.tsx                 # NEW
│   │   ├── ForgotPasswordForm.tsx         # NEW
│   │   ├── ResetPasswordForm.tsx          # NEW
│   │   └── SignOutButton.tsx              # NEW — calls signOutAction
│   └── header/
│       ├── UserMenu.tsx                   # NEW — Sign in link OR user dropdown (Account / Sign out)
│       └── (existing files)               # MODIFIED — slot in UserMenu
├── messages/
│   ├── en.json                            # MODIFIED — add Auth + Account namespaces
│   └── ar.json                            # MODIFIED — add Auth + Account namespaces (formal-tone AR)
└── tests/                                 # NEW directory (or extend existing)
    ├── setup/
    │   └── supabase-test-client.ts
    ├── auth/
    ├── actions/
    ├── security/
    ├── audit/
    ├── rls/
    └── e2e/

next.config.ts                             # MODIFIED — add async headers() block with CSP + companions
                                           #         — branch on VERCEL_ENV for preview-only `vercel.live` allowance
playwright.config.ts                       # NEW — base config for e2e tests
```

## 5. Suggested Plan Boundaries

Recommended **7 plans**. Wave 0 is scaffolding; Waves 1+ can parallelize where dependencies permit.

| Plan | Wave | Scope | Touches |
|------|------|-------|---------|
| **10-01: Supabase clients + env + middleware** | 0 | Add Supabase env vars to `src/lib/env.ts`. Create `src/lib/supabase/{client,server,admin}.ts`. Replace `src/middleware.ts` with combined next-intl + Supabase session-refresh middleware. No UI; no schema changes. Acceptance: a debug Server Component renders `user.email` if logged in (logged-out shows `null`). | env.ts, middleware.ts, lib/supabase/* |
| **10-02: Schema migration + RLS + audit table** | 0 | Wave 0 probe (verify all `user_id` are NULL). Hand-author `0002_phase10_auth_fk_and_rls.sql` with: ALTER text→uuid on carts.user_id + orders.user_id, add cross-schema FKs ON DELETE SET NULL, recreate indexes, enable RLS on five tables, add policies from §2.5, create `auth_events` table. Update `schema.ts` to mirror (uuid + authEvents pgTable, no `.references()` on user_id). Push. | schema.ts, migrations/0002*.sql, meta/_journal.json |
| **10-03: Auth Server Actions + zod + audit + error mapping** | 1 | `src/lib/auth/{schemas,errors,audit,admin-allowlist}.ts` + `src/app/actions/auth.ts` exporting all five actions, each returning `ActionResult<T>`. Each action calls `writeAuthEvent` on success and on `signin_failed`. Generic error wrapper for SEC-06. Vitest unit + integration tests for SEC-02, SEC-06, SEC-09. Depends on 10-01 (clients) + 10-02 (auth_events table). | lib/auth/*, app/actions/auth.ts, tests/* |
| **10-04: Auth UI routes (login / signup / forgot / reset)** | 2 | All four `(auth)` route group pages + form components + `messages/{en,ar}.json` Auth namespace. `src/app/api/auth/callback/route.ts` to handle the password-recovery link (Supabase emails a `?code=...&type=recovery` URL → exchange for session → redirect to `/reset-password`). RTL-correct logical CSS only. Depends on 10-03. | app/[locale]/(auth)/*, components/auth/*, messages/*, app/api/auth/callback/route.ts |
| **10-05: Account area + cart merge + header user menu** | 2 | `/account` layout (auth gate via SSR `getUser()`), `/account/page.tsx` (orders list via SSR Drizzle query filtered by `userId = currentUser.id`), `/account/orders/[reference]/page.tsx` (reuses existing component, adds ownership check). `UserMenu` component for header. `lib/cart/merge-on-signin.ts` + hook in `getOrCreateCart`. `Account` i18n namespace. Vitest test for cross-user RLS-deny. Playwright test for cart-merge flow. Depends on 10-04 (sign-in must work). | app/[locale]/account/*, components/header/UserMenu.tsx, lib/cart/merge-on-signin.ts, lib/cart/session.ts, tests/* |
| **10-06: Admin gate + audit log surface** | 2 | Modify `src/app/[locale]/admin/layout.tsx` to: (a) require session, (b) check `isAdminEmail(user.email)`, (c) redirect to `/login` if either fails, (d) display signed-in admin email in header. Wave 0 dashboard task: set `SUPABASE_ADMIN_EMAILS` env var. Audit-log read view at `/admin/audit` (uses admin client to read `auth_events`, paginated). Playwright test for admin-gate-deny. Can run in parallel with 10-05. | app/[locale]/admin/layout.tsx, app/[locale]/admin/audit/page.tsx, tests/e2e/admin-gate.spec.ts |
| **10-07: Security headers + CSP + verification** | 3 | Add `headers()` async block to `next.config.ts` with CSP + HSTS + XFO + nosniff + Referrer-Policy + Permissions-Policy. Branch on `process.env.VERCEL_ENV` to add `vercel.live` for preview only. Vitest test that asserts header presence + CSP shape. Verifier-agent runs CSRF-mismatch curl + cross-user-RLS-deny + admin-gate-deny. Final SEC-07 manual verification (5 rapid sign-in failures → expect 429); document outcome in `10-VERIFICATION.md`. Depends on all above. | next.config.ts, tests/security/* |

**Wave structure summary:**
- **Wave 0 (sequential):** 10-01, 10-02 — both must land before any UI plan can run.
- **Wave 1 (sequential after 0):** 10-03 — actions depend on clients + audit table.
- **Wave 2 (parallel after 1):** 10-04, 10-05, 10-06 — UI plans, no inter-dependencies after auth actions exist.
- **Wave 3 (after 2):** 10-07 — headers and full-suite verification.

## 6. Reusable Patterns

| Pattern | Source file | How to reuse in Phase 10 |
|---------|-------------|--------------------------|
| `ActionResult<T>` discriminated union with `messageKey` envelope | `src/app/actions/cart.ts` (lines 30-37) | Copy into `src/app/actions/auth.ts`. Add codes: `'INVALID_CREDENTIALS' \| 'EMAIL_IN_USE' \| 'WEAK_PASSWORD' \| 'RATE_LIMITED' \| 'VALIDATION' \| 'UNKNOWN'`. |
| `getOrCreateCart()` boundary | `src/lib/cart/session.ts` | The merge hook lives **here**: after the existing cookie-or-create logic, if `auth.uid()` is now present and the cart's `userId` is NULL, call `mergeGuestCartIntoUserCart()` and update the row. |
| `migrateLocalCartAction` one-shot pattern | `src/app/actions/cart.ts` (lines 96-112) | Mirror exactly for cart-merge. Idempotent, returns the merged Cart, never throws raw errors. |
| Zod schemas + Server Action validation | `src/app/actions/cart.ts` and checkout actions | Same pattern: define schema, `safeParse(input)` at the top of each action, return `{ ok: false, code: 'VALIDATION', fields, messageKey }` on failure. |
| `BrandedErrorPage` for full-page error chrome | (existing component in Phase 9) | Use for the Supabase recovery-link expired/invalid case. |
| `getTranslations()` (RSC) + `useTranslations()` (client) | next-intl convention throughout the codebase | Auth namespace keys: `Auth.signin.title`, `Auth.signin.email`, `Auth.signin.password`, `Auth.signin.submit`, `Auth.errors.invalidCredentials`, `Auth.errors.rateLimited`, etc. |
| Logical CSS only (`ms-`, `me-`, `ps-`, `pe-`) | CLAUDE.md non-negotiable | All auth forms must use logical properties. Lint check already in place. |
| `server-only` import guard | `src/lib/cart/session.ts` line 8 | Add to `src/lib/supabase/admin.ts` and `src/lib/auth/audit.ts`. |
| `revalidatePath` after state change | `src/app/actions/cart.ts` lines 49, 66, 83 | Call after `signInAction` (revalidate `/`), `signOutAction` (revalidate `/`), `signUpAction` (revalidate `/`). |
| Migration journal entry pattern | `08-01-SUMMARY.md` describes the drizzle-kit + manual SQL workflow | Add `0002` entry to `meta/_journal.json` with `breakpoints: false` (since it's a single transaction). |

## 7. Pitfalls & Gotchas

1. **Supabase cookie SameSite for cross-site checkout flows.** Phase 10 has no cross-site redirects (no OAuth, no third-party payment redirect). `SameSite=Lax` is correct. **However**, when payment gateway integration lands (deferred), if the gateway uses POST-back redirects (e.g., Moyasar 3D-Secure callback), the Supabase cookie may not be sent on the return-trip POST and the user appears signed-out. Track in deferred items.

2. **RSC vs. client component boundaries for `getUser`.** `await supabase.auth.getUser()` in a Server Component requires `cookies()` to be awaited (Next 15 async API). It must NOT be called from a Client Component — the SSR client cannot read cookies in the browser. Pattern: pass the user object as a prop from the Server Component to the Client Component, or use `useSupabase()` hook backed by `createBrowserClient` for client-side reactivity.

3. **`getUser()` vs. `getSession()`.** `getUser()` revalidates the session against Supabase Auth servers (slower but secure). `getSession()` reads the cookie locally (fast but spoofable if the cookie is forged — though SameSite + httpOnly + signed JWT make this hard). **Use `getUser()` in middleware and route gates.** Use `getSession()` only for non-security-critical read paths (e.g., showing "signed in as" UI).

4. **Drizzle migration ordering with active sessions.** If anyone is signed in mid-migration, the ALTER COLUMN type change on `carts.user_id` and `orders.user_id` will block until their long-running queries finish. In Phase 10 there are no active user sessions yet (auth doesn't ship until this phase), so this is moot — but document for future migrations.

5. **Drizzle's `db:generate` vs. our hand-written `0002_*.sql`.** Drizzle-kit will see the schema diff (text→uuid + new authEvents table) and try to emit its own ALTER. **Resolution path:** hand-author the SQL file first, register it in `meta/_journal.json`, then run `db:generate` only after — drizzle-kit will see the schema in sync and emit nothing. The 08-01-SUMMARY documents exactly this workflow.

6. **`auth.users.id` is uuid, not text.** Existing schema uses `text('user_id')`. The migration changes this to `uuid('user_id')` (recommended in §2.1) which makes the FK type-compatible. **Do not** try to keep text and add a soft FK — Postgres will reject the constraint.

7. **Supabase project ref in env validation.** The current `src/lib/env.ts` zod schema validates only `STORAGE_URL`/`DATABASE_URL`. Must add: `NEXT_PUBLIC_SUPABASE_URL` (URL), `NEXT_PUBLIC_SUPABASE_ANON_KEY` (string, min length 100), `SUPABASE_SERVICE_ROLE_KEY` (string, min length 100), `SUPABASE_ADMIN_EMAILS` (string, comma-separated). The latter two MUST NOT have `NEXT_PUBLIC_` prefix.

8. **`SUPABASE_ADMIN_EMAILS` parsing.** Comma-separated env vars are easy to typo. Trim whitespace, lowercase before comparison. Test: `SUPABASE_ADMIN_EMAILS="alice@orki.com, bob@orki.com "` — both `Alice@Orki.com` and `bob@orki.com` should match.

9. **Cart merge race condition.** Two simultaneous tabs can both trigger `getOrCreateCart()` after sign-in. Without a lock, both might attempt to merge the guest cart and the user cart, producing duplicate items. **Mitigation:** wrap the merge in a `db.transaction` with `SELECT … FOR UPDATE` on the user's cart row; subsequent calls find the merge already done (guest sessionId already null, or items already present). The Phase 8 `submitCheckout` provides the transaction pattern.

10. **`@supabase/ssr` middleware MUST refresh sessions BEFORE the next-intl middleware redirects.** If the middleware order is wrong, the Supabase JWT can expire mid-request and `getUser()` in the destination page returns null. Pattern: combine both into a single `middleware()` function that first calls Supabase's session-refresh logic, then delegates to `createMiddleware(routing)`.

11. **Email-confirmation-disabled gotcha.** Even with email confirmation off, Supabase still requires SMTP to be configured for password reset emails. The default Supabase inbuilt SMTP has very low rate limits (≈ 4/hr) and is for development only. Production needs custom SMTP (e.g., Resend SMTP credentials). Track in deferred ops.

12. **`auth_events.userId` type.** Should be `uuid` (matching `auth.users.id`) but **without** a hard FK — auth events should survive user deletion for forensic purposes. Pattern: `userId: uuid('user_id')` and add `email: text('email')` so the audit log remains useful even after the user row is gone.

13. **`auth.uid()` in RLS policies wrapped in `SELECT`.** The wrapping `(SELECT auth.uid())` is a Supabase performance recommendation — it allows Postgres to cache the result per-statement. Without the SELECT, the function is invoked per-row. Always wrap.

14. **next-intl middleware `matcher` excludes `/api`.** Current matcher is `'/((?!api|trpc|_next|_vercel|.*\\..*).*)'`. The Supabase recovery callback at `/api/auth/callback/route.ts` is **inside** the `/api` path → it will NOT pass through next-intl middleware (correct — it doesn't need locale routing). But it **will** still pass through Supabase session middleware if we keep the matcher consistent. Verify the matcher applies to both pieces of the combined middleware.

15. **`headers()` in next.config.ts applies to all paths by default.** CSP applied to API route handlers can break things if the API route returns inline JSON parsed by the browser. Safe for our use (PostgREST + Server Actions, no inline JSON parsing). Still — exclude `/_next/*` and `/api/*` from CSP if violations appear.

16. **Vercel preview URL fingerprint.** Each preview deploy gets a unique `*-team.vercel.app` URL. Server Actions allowedOrigins doesn't need configuration because `'self'` covers the current origin. But if the user accesses a preview via a branded preview alias (e.g., `preview.orki.com`), then `allowedOrigins: ['preview.orki.com']` is needed. Defer until branded preview aliases exist.

17. **Tailwind v4 Turbopack arbitrary-value bug.** `tailwindcss/issues/19825` reports arbitrary classes like `aspect-[12/5]` may not generate CSS rules in Turbopack mode (Next 16+). The project is on Next 15.3.9 — likely unaffected, but flag for SUMMARY if any visual regression appears in auth UI.

18. **`@base-ui/react` and `motion` set inline `style="..."` attributes.** This is why CSP needs `style-src 'unsafe-inline'`. Removing this directive will break animations and `<Dialog>`/`<Popover>` portals. Tracked under §2.4 footguns.

## 8. Open Risks

| # | Risk | Severity | Mitigation in Plan |
|---|------|----------|--------------------|
| R1 | Supabase password-signin rate limit default is unclear and reportedly under-enforced (§2.2). SEC-07 may not be airtight. | **MEDIUM** | Wave 0 task in 10-02 to (a) probe current rate-limit values via Management API, (b) explicitly PATCH conservative values, (c) manually verify with 5 rapid signin failures. Document gap in `10-VERIFICATION.md`. |
| R2 | SEC-07's strict reading is **per-account** lockout; Supabase only provides per-IP. A residential-proxy attacker can bypass. | **MEDIUM** | Document as known gap; add `auth_events.signin_failed` audit trail; defer custom per-account lockout (Edge Function or middleware) to a hardening phase. |
| R3 | Existing `carts.user_id` / `orders.user_id` rows might not be NULL in dev DB (low chance — Phase 8 was guest-only). | **LOW** | Wave 0 SQL probe (§2.1) before migration runs. If non-NULL non-uuid rows exist, planner halts and fixes before ALTER. |
| R4 | CSP `'unsafe-inline'` posture is a known weakness vs. strict-CSP-with-nonce. | **MEDIUM** | Document explicitly in `10-SECURITY.md`. Track per-route nonce upgrade as a deferred hardening task. Acceptable for Phase 10 because Vercel + next-intl + base-ui + motion all set inline styles/scripts and per-route nonce is explicitly out of scope. |
| R5 | Cart merge race condition (two tabs sign-in simultaneously). | **LOW** | Wrap merge in a transaction with `SELECT … FOR UPDATE` on the user's cart row (§7 #9). |
| R6 | Supabase inbuilt SMTP rate limit (≈ 4/hr) breaks password reset under any real volume. | **LOW for Phase 10** (early-launch traffic minimal) | Defer custom SMTP (Resend SMTP creds) to launch-checklist deferred ops. Document in `10-SECURITY.md`. |
| R7 | RLS policies deployed but not exercised because Drizzle bypasses them. False sense of security if a future phase swaps Drizzle for PostgREST without re-validating policies. | **LOW** | Add a comment block above the RLS policies in the migration explaining they are defense-in-depth and currently exercised only by `/account/orders` SSR reads (which use the SSR client). Add a Vitest cross-user-deny test (§3 RLS row) to prove enforcement. |
| R8 | `SUPABASE_SERVICE_ROLE_KEY` accidentally bundled into client. | **HIGH if it happens, LOW probability** | Three-layer prevention: (1) no `NEXT_PUBLIC_` prefix → Next.js refuses to inline; (2) `import 'server-only'` at top of `admin.ts`; (3) ESLint `no-restricted-imports` rule blocking `@/lib/supabase/admin` from non-admin paths. Verifier-agent must grep the production client bundle for the key prefix as a final gate. |

## Sources

### Primary (HIGH confidence)
- `@supabase/ssr` Context7 docs (`/supabase/ssr`) — middleware + createServerClient pattern. Verified May 2026.
- Next.js 15 official docs via Context7 (`/vercel/next.js`) — Server Actions Origin/Host validation, `serverActions.allowedOrigins`. Verified May 2026.
- Supabase RLS docs — `supabase.com/docs/guides/database/postgres/row-level-security`, `…/auth/row-level-security`, `…/troubleshooting/why-is-my-service-role-key-client-getting-rls-errors-or-not-returning-data-7_1K9z`.
- Vercel CSP docs — `vercel.com/docs/cdn-security/security-headers`, `vercel.com/docs/speed-insights/package`.
- ADR-001 + ADR-002 (in-repo).
- `src/lib/db/schema.ts` (in-repo) — current column types.
- `package.json` (in-repo) — verified installed dependency versions.
- `08-01-SUMMARY.md` (in-repo) — confirms guest-first nullable userId pattern + drizzle-kit workflow.

### Secondary (MEDIUM confidence)
- Supabase rate-limits reference: `supabase.com/docs/guides/auth/rate-limits` and `…/platform/going-into-prod` — token-refresh, OTP, verify, email send numbers verified; password-signin number not authoritatively published.
- Vercel community CSP recipes — `va.vercel-scripts.com` and `vitals.vercel-insights.com` hostnames.

### Tertiary (LOW confidence — flagged for verification)
- `github.com/supabase/auth/issues/2333` — community report of under-enforced sign-in rate limit, January 2026. Closed but no clear resolution. Treat as a reason to verify behavior empirically in Wave 0.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | All existing `carts.user_id` and `orders.user_id` values are NULL (no real users yet). | §2.1 | Migration ALTER fails on type cast. Wave 0 SQL probe catches before damage. |
| A2 | Supabase default sign-in rate limit is approximately 30 requests per 5 minutes per IP (community report). | §2.2 | If actually higher/lower, planner overrides via dashboard PATCH anyway. Setting an explicit value defangs the assumption. |
| A3 | `@base-ui/react` and `motion` set inline `style="..."` attributes that require `style-src 'unsafe-inline'`. | §2.4, §7 #18 | If false, we can drop `'unsafe-inline'` from style-src and tighten the CSP. CSP-violation-report tests in 10-07 will surface this. |
| A4 | Tailwind v4 production builds emit zero inline style attributes from utilities. | §2.4 | Verified in Tailwind docs but not exhaustively tested for every utility. Same CSP-violation tests catch any leak. |
| A5 | Supabase's default cookie config from `@supabase/ssr` uses `SameSite=Lax`, `HttpOnly=true`, `Secure=true` (in prod). | §2.3, §7 #1 | If different, CSRF posture weakens. Verify with browser devtools post-deploy and assert in `tests/auth/signin.test.ts`. |

If this table grows beyond 5 items during planning, flag it back to discuss-phase for explicit user confirmation.

## RESEARCH COMPLETE

All 5 open questions resolved with concrete recommendations. Validation Architecture present for Nyquist gate. Plan boundaries (7) proposed with wave ordering. Reusable patterns and 18 pitfalls documented. 8 open risks flagged with mitigations. Planner can proceed to author plans 10-01..10-07.
