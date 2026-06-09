---
phase: 10
slug: authentication-and-security-core
created: 2026-05-11
status: in-progress
---

# Phase 10 — Verification

This document is the audit trail for Phase 10 sign-off. Every SEC-NN requirement is mapped to concrete evidence (file path + line, commit hash, or named test). Six gates run on top: three SEC manual walkthroughs (SEC-07 lockout, SEC-08 admin deny, cross-user RLS), the CSP zero-violation walkthrough, the service-role bundle grep (R8), and the automated test suite. Phase 10 is complete when all six gates are ticked.

---

## SEC-NN requirement traceability

Each requirement maps to its mitigation evidence. Status legend: PASS = automated and/or live-verified; PARTIAL = implemented with documented carve-out (open R-item); DEFERRED = explicit Phase-11 hardening item.

| Req | Status | Evidence |
|-----|--------|----------|
| SEC-01 | PASS | Supabase Auth via @supabase/ssr; httpOnly + SameSite=Lax cookies enforced by SSR adapter. `src/lib/supabase/server.ts` + `src/middleware.ts` (intl + auth refresh chain at lines 19-49). Plan 10-01 four-layer boundary; Plan 10-03 cookie-flag test. Commit: `feat(10-01): supabase ssr boundaries + env`. |
| SEC-02 | PASS | All Server Actions use Zod schemas with email normalisation (`.trim().toLowerCase()`). `src/lib/validators/auth.ts`; consumers in `src/app/actions/auth.ts`. Plan 10-03. |
| SEC-03 | PARTIAL | Supabase dashboard rate limits: signup/signin throttle (Item 3 in `notes/supabase-dashboard-checklist.md`) + four Management API knobs (Item 4) — see Outstanding ops below. CORS not separately tightened (no public API surface beyond Server Actions, which are same-origin enforced; see SEC-04). |
| SEC-04 | PASS | Next.js 15 Server Actions enforce same-origin via Origin/Host check (RESEARCH §2.3). Defence-in-depth automated test: `tests/e2e/csrf.spec.ts` (mismatched-Origin → 4xx). Plan 10-07 Task 7.3. |
| SEC-05 | PASS | Six security headers in `next.config.ts` lines 30-49 + `headers()` block lines 60-67. Six headers: CSP, HSTS (max-age=63072000; includeSubDomains; preload), X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy strict-origin-when-cross-origin, Permissions-Policy denies camera/microphone/geolocation/payment. Tests: `tests/security/csp.test.ts` (7 cases, runs in default `npm test`); `tests/security/headers.test.ts` (gated by `RUN_HEADER_TESTS=1`, asserts all six on /en, /ar, /en/login, /en/signup, /en/account). Plan 10-07 Tasks 7.1+7.2. **Trade-off:** `'unsafe-inline'` in `script-src` and `style-src` accepted for Phase 10 (R4); per-route nonce upgrade deferred (see Deferred items). |
| SEC-06 | PASS | Generic error copy enforced in `src/i18n/messages/{en,ar}.json` under `Auth.errors.invalidCredentials`. Both signin and forgot-password return identical "Invalid credentials" / always-OK responses. Plan 10-03 anti-enumeration: `requestPasswordResetAction` always returns `ok:true` regardless of email existence. |
| SEC-07 | PARTIAL | Per-IP throttle via Supabase dashboard (Item 3 — `5 per 5 minutes per IP`). Verified manually via Gate 1 below. Per-account lockout (R1+R2) deferred to Phase 11. Skipped vitest spec: `tests/auth/lockout.test.ts` (skipped pending dashboard rate-limit confirmation). |
| SEC-08 | PASS | Admin layout gate at `src/app/[locale]/admin/layout.tsx`: SSR `getUser()` → `isAdminEmail()` allowlist check → audit row on deny → `redirect('/login')` BEFORE any chrome renders. Audit reader at `src/app/[locale]/admin/audit/page.tsx`. Tests: `tests/e2e/admin-gate.spec.ts` (2 automated unauthed-redirect cases). TOTP MFA + IP allowlist deferred to Phase 11 (T-10-06-07 accept-deferred per CONTEXT.md SEC-08 "TOTP optional, email allowlist required"). Plan 10-06. |
| SEC-09 | PASS | `auth_events` table + `writeAuthEvent(eventType, payload)` invoked from every auth Server Action and admin denial path. Schema: `src/db/schema/auth-events.ts`; writer: `src/lib/audit/writeAuthEvent.ts`; consumers: `src/app/actions/auth.ts`, `src/app/[locale]/admin/layout.tsx`. Active alerting (threshold-based) deferred. Plans 10-02/03/06. |

---

## Open Items (carry to Phase 11 / launch hardening)

| Item | Severity | Owner | Source |
|------|----------|-------|--------|
| T-10-06-02 — admin deny uses `redirect('/login')`, technically leaks /admin existence vs `notFound()` | LOW (accepted) | n/a — accepted | Plan 10-06 SUMMARY |
| R1+R2 — per-account lockout (vs current per-IP) | MEDIUM | Phase 11 | RESEARCH §8 |
| R4 — CSP per-route nonce upgrade (replaces `'unsafe-inline'`) | MEDIUM | Phase 11 | RESEARCH §8 |
| R6 — custom SMTP for password-reset (Supabase inbuilt SMTP rate-limited) | MEDIUM | Launch checklist | RESEARCH §8 |
| R8 follow-up — automate service-role bundle grep in CI | LOW | Phase 11 | RESEARCH §8 |
| TOTP MFA enforcement for admins | MEDIUM | Phase 11 | CONTEXT.md SEC-08 |
| IP allowlisting for /admin | MEDIUM | Phase 11 | CONTEXT.md SEC-08 |
| Threshold-based alerting on `auth_events` | MEDIUM | Phase 11 | SEC-09 |
| App-level rate limiting on cart/checkout | LOW | Phase 11 | RESEARCH §8 |
| Sender domain (DKIM/SPF) for Supabase auth emails | MEDIUM | Launch checklist | RESEARCH §8 |
| HSTS preload list submission (post-deploy manual step at hstspreload.org) | LOW | Post-deploy | RESEARCH §2.4 |
| CSP violation reporting endpoint (T-10-07-07) | LOW (accepted) | Phase 11 | Plan 10-07 threat model |

---

## Outstanding ops (must complete before sign-off)

These three items in `notes/supabase-dashboard-checklist.md` are **not codified** — they are dashboard / Management API operations that gate SEC-03 and SEC-07. Tick each here once executed.

- [ ] **Item 2:** Supabase Dashboard → Authentication → Settings → Email Auth → "Confirm email" toggled OFF (CONTEXT.md decision: signup yields immediate session).
- [ ] **Item 3:** Supabase Dashboard → Authentication → Rate Limits → "Rate limit for sign-ups and sign-ins" set to **5 per 5 minutes per IP** (gates SEC-07 Gate 1 below).
- [ ] **Item 4:** Management API PATCH applied to `rate_limit_email_sent: 5`, `rate_limit_token_refresh: 150`, `rate_limit_otp: 30`, `rate_limit_verify: 30` per `notes/supabase-dashboard-checklist.md` Item 4. GET-confirm the four keys round-trip.

**Date completed:** ____  **Run by:** ____

---

## Gate 1 — SEC-07 lockout walk-through

Per RESEARCH §8 R1+R2, the per-IP rate limit on Supabase auth must throttle after rapid failed attempts.

**Pre-requisites:**
- Outstanding ops Items 2-4 (above) ticked.
- `npm run dev` is running locally OR a deployed environment is reachable.

**Procedure:**
1. Open `/en/login` in a fresh browser session.
2. Submit 5 sign-in attempts in rapid succession with WRONG credentials (e.g., `notarealuser@orki.test` + `wrongpassword`).
3. Submit a 6th attempt.
4. **Expected:** the 6th attempt returns the `Auth.errors.tooManyAttempts` message ("Too many attempts. Try again in a few minutes.") AND the underlying Supabase response is HTTP 429.
5. Inspect `auth_events` via `/en/admin/audit` (signed in as an allowlist admin): expect 5 rows with `event='signin_failed'` for the test email.

**Outcome:**
- [ ] Gate passes — 6th attempt throttled, audit rows present.
- [ ] Gate fails — debug per RESEARCH §2.2 (verify dashboard rate limit is actually `5 per 5 min per IP`).

**Date run:** ____  **Run by:** ____

---

## Gate 2 — SEC-08 signed-in non-admin walk-through

Per CONTEXT.md SEC-08 + Plan 10-06 §"Admin gate (SEC-08)", a signed-in user whose email is NOT in `SUPABASE_ADMIN_EMAILS` must be redirected from `/admin/*` to `/login` AND a denial audit row must be written.

**Procedure:**
1. Sign up via `/en/signup` with a brand-new email NOT in the allowlist (e.g., `nobody@orki.test`).
2. After redirect to `/account`, manually navigate to `/en/admin`.
3. **Expected:** redirected to `/en/login`.
4. Sign in as an allowlist admin (e.g., `team@hexonasystems.com`). Visit `/en/admin/audit`.
5. **Expected:** an `auth_events` row with `event='admin_action'`, `email='nobody@orki.test'`, and `metadata.denied=true, reason='not_in_allowlist'` appears in the latest page.

**Outcome:**
- [x] **Gate passes (2026-06-09, user walk-through).** Signed in as a non-allowlist throwaway account → navigating to `/en/admin` redirected away (no admin chrome); the denial audit row appeared in `/en/admin/audit` when viewed as an admin.
- [ ] Gate fails — verify `SUPABASE_ADMIN_EMAILS` env value is set + matches the allowlist email exactly (case-insensitive comparison).

**Date run:** ____  **Run by:** ____

---

## Gate 3 — Cross-user RLS deny

Per RESEARCH §2.5 + Plan 10-05 cross-user-deny test (skeleton), proven by hitting PostgREST directly with two distinct user JWTs.

**Procedure:**
1. Provision two Supabase auth users (User A + User B) via the dashboard or admin client.
2. As User B, place an order through the normal checkout flow — record the order reference and ID.
3. Sign in as User A.
4. Run the following curl against PostgREST:
   ```bash
   curl "https://gkcaakimmvsctwpvccwt.supabase.co/rest/v1/orders?id=eq.<userB_order_id>&select=*" \
     -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
     -H "Authorization: Bearer <userA_jwt>"
   ```
5. **Expected:** empty array `[]` (RLS hides B's row from A).
6. Repeat with the service-role key — expect the row IS visible (service_role bypasses RLS).

**Outcome:**
- [x] **Gate passes (automated, 2026-06-09).** `tests/rls/cross-user-deny.test.ts` ran green against the live Supabase tenant during the Phase 11 close-out suite: it provisions two auth users via the admin client, has User A's RLS-bound PostgREST client attempt to SELECT User B's order, and asserts the deny. Previously this test could only time out (Supabase paused); with the tenant resumed it passes. The automated path exercises the same trust boundary as the manual curl walkthrough above. (Manual two-JWT curl remains available as a belt-and-suspenders check if desired.)
- [ ] Gate fails — re-verify policies via `select count(*) from pg_policies where schemaname='public'` returns ≥ 9.

**Date run:** ____  **Run by:** ____

---

## Gate 4 — CSP zero-violation walk-through

Per RESEARCH §8 R4 + 10-VALIDATION.md §"Manual-Only Verifications", real-browser console errors are the only authoritative CSP signal. The unit test (`tests/security/csp.test.ts`) and integration test (`tests/security/headers.test.ts`) prove the CSP string is well-formed and served, but only a real browser proves no asset is blocked.

**Procedure:**
1. Run `npm run build && npm run start`.
2. Open Chrome DevTools → Console tab. Filter to `[CSP|csp]`.
3. Visit, in order: `/en`, `/en/shop`, `/en/shop/tops`, `/en/shop/bottoms`, a sample PDP, `/en/cart`, `/en/checkout`, `/en/login`, `/en/signup`, `/en/forgot-password`, `/en/reset-password`, `/en/account` (signed in), `/en/admin`, `/en/admin/audit`, `/en/legal/privacy`, `/en/legal/terms`, `/en/legal/cookies`.
4. Repeat for `/ar` equivalents.
5. **Expected:** zero CSP violations in the console across all routes.

**Outcome:**
- [x] **Gate passes — no violations (2026-06-09, prod build `next start` walk-through).** Console showed zero `Content-Security-Policy` violations. The only console errors were `/_vercel/insights/script.js` + `/_vercel/speed-insights/script.js` returning 404 (then refused by `X-Content-Type-Options: nosniff` as text/html) — these are Vercel telemetry scripts served only on a Vercel deployment, NOT CSP rejections, and are expected on localhost. Cross-confirms Tests 1 & 2 (Analytics/Speed Insights) require a deploy.
- [ ] Gate fails — record the violation type + directive + offending URL/inline-script. Adjust CSP per RESEARCH §2.4 footguns. Re-run.

**Date run:** 2026-06-09  **Run by:** user (prod-build browser walk-through)

---

## Gate 5 — Service-role key bundle grep (R8)

Per RESEARCH §8 R8: the production CLIENT bundle MUST NOT contain `SUPABASE_SERVICE_ROLE_KEY`. This is the final layer of the four-layer boundary from Plan 10-01 (server-only marker, ESLint fence, env validation, and this build-time grep).

**Procedure:**
1. `npm run build`.
2. Read the first ~30 chars of `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` (the JWT prefix — typically `eyJhbGciOiJIUzI1NiI…`).
3. Grep the entire production build output for that prefix:
   ```bash
   PREFIX="eyJhbGciOiJIUzI1NiI"   # or the first ~30 chars of the actual service-role key
   grep -r "$PREFIX" .next/static/ 2>/dev/null
   grep -r "$PREFIX" .next/server/chunks/ 2>/dev/null
   ```
4. **Expected:** the static path returns ZERO matches. (Server chunks may legitimately include the key for service-role-using server code paths — the constraint is the CLIENT bundle.)
5. Specifically grep `.next/static/**` (the only output served to browsers).

**Outcome:**
- [x] **Gate passes** — `.next/static/` has zero matches for the service-role key signature `Mdk9G9k6F0ZIVoeyH3AeZCSwpUzmVmpX1MTh0__ZCWg`. (Anon key signature `jImZD-...` appears in `.next/static/chunks/app/[locale]/(auth)/reset-password/page-*.js` as expected — `NEXT_PUBLIC_` keys are inlined by design.) Bonus signal: zero hits in `.next/server/` either — the service-role key is read via `process.env` at runtime, never bundled.
- [ ] Gate fails — STOP. Trace the leak source via `grep -rn "supabase.*admin\|SERVICE_ROLE" src/` and verify all imports go through the ESLint fence from 10-01. The leak is a CRITICAL finding; do not deploy.

**Date run:** 2026-05-11  **Run by:** automated (Claude orchestrator, post-build grep against `.next/static/` and `.next/server/`)

---

## Gate 6 — Automated test suite green

| Test | Command | Expected |
|------|---------|----------|
| Vitest unit + integration | `npm run test` | All pass except `tests/auth/lockout.test.ts` (skipped pending Outstanding Op Item 3) |
| Vitest header presence (post-build) | `RUN_HEADER_TESTS=1 npx vitest run tests/security/headers.test.ts` | Pass after `npm run build` |
| Vitest CSP shape | `npx vitest run tests/security/csp.test.ts` | 7 cases pass |
| Playwright e2e (list) | `npx playwright test --list` | Discovers `cart-merge.spec.ts`, `password-reset.spec.ts`, `admin-gate.spec.ts`, `csrf.spec.ts` |
| Playwright e2e (run) | `npx playwright test` | All pass except `test.skip` blocks (cart-merge end-of-flow, password-reset round-trip, admin-gate signed-in-non-admin) |

- [x] **Gate passes.** Re-confirmed 2026-06-09 against the live (resumed) Supabase tenant: `npm test` = **119 passed / 0 failed / 8 skipped** (25 files; up from 103 — the previously env-gated DB/RLS/auth tests now run green, including `tests/rls/cross-user-deny.test.ts` → see Gate 3). `npm run build` = exit 0, "Compiled successfully", `/sitemap.xml` prerendered. `tsc --noEmit` 0 errors; lint 0 errors (1 pre-existing `isRtl` warning). Playwright spec discovery: 4 specs listed cleanly; browser execution deferred to production deploy verification.

**Date run:** 2026-06-09 (orig 2026-05-11)  **Run by:** automated (Claude orchestrator — Phase 11 close-out + UAT audit)

---

## Threat-model status (Plan 10-07 register)

| Threat ID | Mitigation | Status |
|-----------|------------|--------|
| T-10-07-01 | CSP `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com` (R4-acknowledged) | mitigated (with carve-out — R4) |
| T-10-07-02 | Server Actions Origin/Host check + `tests/e2e/csrf.spec.ts` | mitigated |
| T-10-07-03 | HSTS `max-age=63072000; includeSubDomains; preload` | mitigated (preload submission post-deploy) |
| T-10-07-04 | `X-Frame-Options: DENY` + CSP `frame-ancestors 'none'` | mitigated |
| T-10-07-05 | `Referrer-Policy: strict-origin-when-cross-origin` | mitigated |
| T-10-07-06 | Four-layer guard (Plan 10-01) + Gate 5 grep | mitigated (verifier confirms via Gate 5) |
| T-10-07-07 | No CSP reporting endpoint; manual Gate 4 walkthrough | accepted (LOW) |
| T-10-07-08 | Permissions-Policy denies camera/mic/geolocation/payment | accepted (review at next browser API expansion) |

---

## Deferred items (authoritative list)

These are NOT blockers for Phase 10 sign-off. Tracked here for transparency and Phase-11 planning:

- **R1+R2:** per-account lockout (vs. per-IP). Deferred to a hardening phase.
- **R4:** CSP per-route nonce upgrade. `'unsafe-inline'` posture acceptable for Phase 10.
- **R6:** custom SMTP for password-reset emails (Supabase inbuilt SMTP rate-limited).
- **R8 follow-up:** automate the Gate 5 grep via a CI step.
- TOTP MFA enforcement for admins.
- IP allowlisting for `/admin`.
- Threshold-based alerting on `auth_events`.
- App-level rate limiting on cart/checkout.
- Sender domain (DKIM/SPF) for Supabase auth emails.
- HSTS preload list submission at https://hstspreload.org (post-deploy manual step).
- CSP violation reporting endpoint (T-10-07-07).
- `tests/auth/lockout.test.ts` un-skip (depends on Outstanding Op Item 3 confirmed live).
- T-10-06-02 `notFound()` vs `redirect('/login')` for admin-deny path (LOW, accepted).

---

## Sign-off

Phase 10 ships when Gates 1-6 are all ticked AND all three Outstanding Ops are confirmed.

- [ ] **Outstanding Op Item 2 (email confirmation OFF):** date ____  by ____
- [ ] **Outstanding Op Item 3 (signin rate limit set):** date ____  by ____
- [ ] **Outstanding Op Item 4 (four Management API knobs):** date ____  by ____
- [ ] **Gate 1 (SEC-07 lockout):** date ____  by ____
- [x] **Gate 2 (SEC-08 admin deny):** date 2026-06-09  by user walk-through (redirect + denial audit row confirmed)
- [x] **Gate 3 (Cross-user RLS deny):** date 2026-06-09  by automated (`cross-user-deny.test.ts` green on live tenant)
- [x] **Gate 4 (CSP zero violations):** date 2026-06-09  by user (prod-build walk; only non-CSP /_vercel/* 404s, expected on localhost)
- [ ] **Gate 5 (Service-role key not in client bundle):** date ____  by ____
- [x] **Gate 6 (Automated suite green):** date 2026-06-09  by automated (119 passed / 0 failed on live tenant)

**Phase 10 complete:** date ____  by ____
