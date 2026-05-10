---
phase: 10
phase_name: Authentication & Security Core
phase_slug: authentication-and-security-core
created: 2026-05-10
status: context-gathered
---

# Phase 10 Context

## Domain

User authentication, sessions, security headers, CSRF, lockout, and admin gating for the ORKI ecommerce app. The app is bilingual (EN/AR), guest-first, and runs Next.js 15 App Router on Vercel with Supabase Postgres + Drizzle. Phase 10 adds the auth gate; everything else (catalog, cart, checkout, admin) already works for guests.

Phase scope is fixed by ROADMAP §"Phase 10: Authentication & Security Core" and REQUIREMENTS SEC-01..SEC-09. Discussion clarified HOW, not WHAT.

## Locked by ADRs (do not re-decide)

- **Provider:** Supabase Auth via `@supabase/ssr` + `supabase-js` — ADR-002.
- **Sessions:** httpOnly cookies via `@supabase/ssr` cookie-based session helpers (SEC-01).
- **Email/password + password reset email + lockout:** Supabase built-in (covers SEC-06 generic errors and SEC-07 lockout out of the box; thresholds configurable in dashboard).
- **Database:** Supabase Postgres. Drizzle owns `public.*`; Supabase manages `auth.*` (ADR-001).
- **App-data ORM:** Drizzle stays. Cross-schema FKs to `auth.users(id)` typed manually since Drizzle does not introspect the `auth` schema (ADR-002 §6).
- **Schema readiness:** `carts.userId` and `orders.userId` already exist as nullable `text` columns with indexes (Phase 8). Phase 10 adds the FK constraint + tightens with RLS — additive, not breaking. Guest-first stays default.
- **Authorization:** Server Actions + Postgres RLS policies. RLS attaches the user JWT to every request automatically.
- **Transactional emails (ECOM-03):** Resend, owned by Phase 8 follow-up. Supabase only sends auth-related emails (signup confirmation, password reset). Out of scope here.
- **Direct Supabase env vars:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server-only). Provisioning lives in `.env.local` under existing Supabase project ref `gkcaakimmvsctwpvccwt`.

## Decisions (this discussion)

### Auth methods scope
- **Decision:** Email + password only in Phase 10. No OAuth providers, no magic link.
- **Rationale:** Smallest surface area; faster ship; less bilingual UX to design and translate; matches "Core" phase intent. OAuth (Google / Apple) and magic link explicitly deferred — see "Deferred Ideas".

### Email confirmation gate
- **Decision:** No email confirmation required. New accounts can log in immediately after signup.
- **Rationale:** User direction — "I don't think we need to confirm emails." Reduces signup friction. Supabase project setting: disable "Confirm email" in Auth → Settings → Email Auth.
- **Risk acknowledged:** Throwaway/typo emails can create ghost accounts. Mitigated by (a) Supabase per-IP rate limits and (b) the password-reset flow surfacing the email at first reset attempt. Re-evaluate post-launch if abuse appears.

### Guest cart merge behavior on first sign-in
- **Decision (Claude's discretion — user said "you decide" / no email confirm):** Merge. On the user's first authenticated server request, if an `orki_sid` cookie exists with a non-empty guest cart AND the user has no server-side cart for `auth.users.id`, merge guest items into a new cart owned by the user. If the user already has a server cart, prefer the user's cart and discard the guest cart silently (no surprise overwrites).
- **Rationale:** Mirrors the `migrateLocalCartAction` precedent landed in Phase 8 (one-shot localStorage→DB migration). Preserves intent. Cleaner UX than "replace" or "no merge".
- **Implementation hint:** Reuse the existing `getOrCreateCart()` boundary in `src/lib/cart/session.ts`. Add a one-shot merge step keyed on first-seen `auth.users.id` for a session.

### Account area scope (`/[locale]/account`)
- **Decision (Claude's discretion):** Minimum surface = order history + sign-out.
  - `/[locale]/account` → orders list (reference, date, status, total) — paginated.
  - `/[locale]/account/orders/[reference]` → already exists for guests via reference; reuse the same component, gated by ownership (RLS).
  - Sign-out button in header dropdown.
- **Out of scope (deferred to a later phase):** address book, profile editing (name/phone/email change), saved payment methods, account-level newsletter preferences.
- **Rationale:** Matches phase scope "Authentication & Security Core". Account dashboard expansion is a UX phase, not a security phase.

### Admin gate (SEC-08)
- **Decision (Claude's discretion):** TOTP optional, email allowlist required.
  - `/admin/*` middleware checks the session user's email against `SUPABASE_ADMIN_EMAILS` (comma-separated env var, server-only).
  - Supabase TOTP MFA is enabled at the project level — admins can opt in via account settings. Not enforced in Phase 10 to avoid blocking solo-admin onboarding.
  - IP restriction: deferred — Vercel-edge allowlists require an Enterprise plan or middleware logic on a list of stable IPs the user does not currently maintain.
- **Rationale:** Satisfies SEC-08 "(if built) must be on a protected route, require MFA, and be IP-restricted **where possible**". Allowlist + optional MFA = "where possible" interpretation. Hard MFA enforcement and IP restriction tracked in "Deferred Ideas" for a Phase 11 hardening pass.

### Auth UX surface (routes to build)
- `/[locale]/login` — email + password, "forgot password" link, link to signup.
- `/[locale]/signup` — email + password (≥8 chars per Supabase default), accept-terms checkbox referencing `/legal/terms` and `/legal/privacy`.
- `/[locale]/forgot-password` — email input → triggers Supabase reset email.
- `/[locale]/reset-password` — handles Supabase recovery link → sets new password.
- `/[locale]/account` — orders list (RLS-gated by `auth.users.id`).
- Header: "Sign in" link when logged out; user dropdown ("Account / Sign out") when logged in.

All routes bilingual via existing next-intl pattern (`messages/en.json` + `messages/ar.json` add an `Auth` namespace + `Account` namespace).

### Security headers (SEC-05)
- **Decision:** Set in `next.config.ts` via `headers()` async function. Headers:
  - `Content-Security-Policy` — strict; allow `'self'`, Supabase URL, Vercel Analytics endpoints, `'unsafe-inline'` only for styles (Tailwind generates inline `style=` for some cases). Will need careful tuning during planning.
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` (HSTS).
  - `X-Frame-Options: DENY`.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()` — minimal denylist.
- **CSP nonce:** out of scope for Phase 10 (Next.js's nonce path requires per-route plumbing). Use static CSP with hash-based exemptions where needed.

### CSRF (SEC-04)
- **Decision:** Rely on Next.js Server Actions' built-in same-origin enforcement (Origin/Host header check) + Supabase's PKCE flow for auth callbacks. No custom CSRF token table.
- **Justification:** SEC-04 is satisfied by these primitives. Adding a custom token table duplicates Supabase + Next.js guarantees. Documented as the chosen mitigation in `10-SECURITY.md` (to be produced by `/gsd-secure-phase 10`).
- **Verification path:** Plan-phase researcher must confirm Next.js 15 Server Actions enforce same-origin by default and document the test (e.g., curl with mismatched Origin returns 403).

### Server-side validation (SEC-02)
- **Decision:** Continue zod schemas pattern (already used in `src/app/actions/cart.ts`, checkout). Auth Server Actions (`signUpAction`, `signInAction`, `signOutAction`, `requestPasswordResetAction`, `setPasswordAction`) each validate via a zod schema before calling Supabase.
- **Generic-error mapping:** Supabase returns generic errors by default. Wrap and surface as `Auth.errors.invalidCredentials` etc. via the same `messageKey` envelope used by cart actions.

### Rate limiting (SEC-03)
- **Decision:** Supabase per-IP rate limits at the Supabase edge cover SEC-03 for auth endpoints. Application-level rate limiting on cart/checkout endpoints is out of phase 10 scope and lives in a later hardening phase.

### Audit logging (SEC-09)
- **Decision:** Add a `auth_events` table (Drizzle, `public.auth_events`) writing one row per: `signup`, `signin`, `signin_failed`, `password_reset_requested`, `password_changed`, `signout`, `admin_action`. Columns: `id uuid pk`, `userId text null` (FK auth.users.id when present), `email text null`, `event text not null`, `metadata jsonb`, `ipAddress text`, `userAgent text`, `createdAt timestamptz default now()`.
- **Alerting:** Out of scope for Phase 10 — no on-call infra exists. Table accumulates evidence for forensic review. Threshold-based alerts deferred.

### Schema migration (FK + RLS)
- **Migration adds:**
  1. `ALTER TABLE carts ALTER COLUMN user_id TYPE uuid USING user_id::uuid;` (after a guard verifying all existing values cast cleanly — they should, since `text` was always set from a uuid-shaped Supabase id format) **OR** keep `text` and add a manual FK to `auth.users(id)` since both are uuid-stringable. Researcher to recommend.
  2. `ALTER TABLE carts ADD CONSTRAINT carts_user_id_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;` (set null preserves anonymized order history when an account is deleted).
  3. Same on `orders.user_id`.
  4. RLS policies on `carts`, `cart_items`, `orders`, `order_items`, `order_events` — owner-or-admin-only SELECT/UPDATE/DELETE; INSERT for own-id-only on writable tables.
- **Service-role bypass:** server-side admin operations use the `SUPABASE_SERVICE_ROLE_KEY` client; that client bypasses RLS by design. Keep service-role key server-only and NEVER pass to the browser bundle.

### i18n
- **Decision:** Add `Auth` and `Account` namespaces to `messages/en.json` and `messages/ar.json`. AR copy follows existing formal-tone pattern from Legal namespace (no `[AR-LEGAL-REVIEW]` prefix needed — auth UI is functional, not legal copy).
- **Supabase email templates:** customize EN + AR variants in Supabase dashboard. Sender-domain configuration is a deploy-time task; tracked under "Deferred ops".

## Canonical Refs

Every downstream agent (researcher, planner) MUST read these:

- `.planning/PROJECT.md` — project shape, current milestone, decisions log.
- `.planning/REQUIREMENTS.md` — SEC-01..SEC-09 verbatim source.
- `.planning/ROADMAP.md` §"Phase 10" — phase goal + success criteria.
- `.planning/decisions/ADR-001-database-provider.md` — Supabase Postgres + Drizzle + service-pooler URL.
- `.planning/decisions/ADR-002-auth-provider.md` — Supabase Auth provider decision; cross-schema FK pattern; Phase 10 verification gates.
- `.planning/phases/08-cart-checkout-orders/08-SUMMARY.md` (Plan 08-01 schema) — confirms `carts.userId` / `orders.userId` exist as nullable text columns with indexes.
- `src/lib/db/schema.ts` — current Drizzle schema; lines 109+ (carts.userId), 162+ (orders.userId).
- `src/lib/cart/session.ts` — `getOrCreateCart()` boundary; cart merge will hook here.
- `src/app/actions/cart.ts` — `migrateLocalCartAction` precedent for one-shot merges + ActionResult envelope pattern.
- `src/app/[locale]/admin/` — existing admin tree (currently unprotected; gate goes here).
- `next.config.ts` — security headers go via `headers()` async function.
- `src/middleware.ts` (or to be created) — Supabase session refresh middleware lives here.
- Supabase docs: <https://supabase.com/docs/guides/auth/server-side/nextjs> — primary `@supabase/ssr` integration reference. Researcher to validate against current version.

## Code Context (reusable assets)

- **next-intl pattern:** locale routing already in place at `src/app/[locale]/`; reuse `getTranslations(...)` for RSC, `useTranslations(...)` for client islands.
- **Server Action envelope:** `ActionResult<T>` discriminated union from `src/app/actions/cart.ts` — copy for auth actions.
- **Branded error chrome:** `BrandedErrorPage` already exists for full-page auth errors.
- **Form patterns:** checkout forms in `src/components/checkout/` show the bilingual + RTL form pattern (logical CSS, aria-invalid, role="alert"). Auth forms must follow.
- **Drizzle env validation:** `src/lib/env.ts` zod-validates env vars; add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ADMIN_EMAILS` here.

## Deferred Ideas (out of phase 10 scope)

- OAuth providers (Google, Apple) — pickup in a Phase 11 social-login expansion.
- Magic-link passwordless sign-in.
- Address book + profile editing UI in `/account`.
- Hard-enforce TOTP MFA for admin role.
- Vercel-edge or middleware-based IP allowlisting for `/admin`.
- Threshold-based alerting on `auth_events` (e.g., >N failed logins in 1m → alert).
- CSP nonce per-route plumbing (Next.js 15 capable, but adds complexity).
- Application-level rate limiting on cart/checkout (separate hardening pass).
- Supabase email-template AR copy review by a native-speaker reviewer (tracked in launch-checklist alongside Phase 9 `[AR-LEGAL-REVIEW]` items).
- Sender-domain (DKIM/SPF) configuration for Supabase auth emails.

## Risks / Open Questions for Researcher

1. **`carts.userId` / `orders.userId` type compatibility with `auth.users(id)`:** Are existing values uuid-shaped? Migration needs to choose between `ALTER TYPE text→uuid` vs. keeping text and adding a soft FK. Researcher to verify schema cast.
2. **Supabase rate-limit defaults for SEC-07 lockout:** confirm current thresholds are acceptable as "throttled/temporarily locked after repeated failed login attempts". If too lenient, document override.
3. **Next.js 15 Server Actions same-origin enforcement:** verify the exact behavior + how to test it. Documents CSRF coverage for SEC-04.
4. **CSP for Vercel Analytics + Supabase + next-intl:** enumerate the exact `connect-src` / `script-src` allowlist needed. Tailwind v4 inline-style behavior — does it require `'unsafe-inline'` in `style-src`?
5. **RLS policy interaction with service-role key:** confirm that admin Server Actions using service-role bypass RLS as expected and that anon-key client paths are subject to RLS.

## Out of Scope (re-iterate)

- Live payment gateway integration.
- Account dashboard beyond order list.
- OAuth / magic link / MFA enforcement.
- IP-based admin allowlisting.
- Account deletion UX (the user-initiated GDPR-style delete flow). The DB FK uses `ON DELETE SET NULL`, but the user-facing "delete my account" page is deferred.

---

_Created 2026-05-10 via /gsd:discuss-phase 10. Ready for /gsd:plan-phase 10._
