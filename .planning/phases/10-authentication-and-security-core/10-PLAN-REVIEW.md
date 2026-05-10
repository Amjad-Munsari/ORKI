---
phase: 10
reviewed: 2026-05-10
verdict: FLAG
---

# Phase 10 - Plan Review

## Verdict

**FLAG** - All seven plans, executed in declared order, will deliver the four ROADMAP success criteria and cover SEC-01..SEC-09 with attributable acceptance evidence. Wave dependencies are sound (no cycles, no broken refs), no same-wave file overlap that breaks correctness, no scope reduction of locked decisions, and every risk in RESEARCH section 8 has an attributable mitigation. Three quality flags (none blocking): (a) tests/rls/cross-user-deny.test.ts is shipped as a structural skeleton with expect(true).toBe(true) and the actual cross-user proof is deferred to manual Gate 3 in 10-VERIFICATION.md; (b) tests/security/csp.test.ts duplicates the CSP builder rather than importing from next.config.ts, allowing silent drift; (c) Plan 10-04 uses autoComplete=email username on login/signup email which is non-standard for password-manager heuristics. No BLOCKERs. Recommend PROCEED with three small in-execution cleanups tracked as follow-ups.

## Coverage Matrix

| SEC-XX | Covered by | Acceptance |
|---|---|---|
| SEC-01 (auth lib + httpOnly cookies) | 10-01 (clients + middleware), 10-02 (FK to auth.users), 10-03 (signUpAction/signInAction), 10-04 (UI) | tests/auth/signup.test.ts creates user and session cookie + cookie-flags assertion in tests/auth/signin.test.ts |
| SEC-02 (server-side validation) | 10-03 Tasks 3.2 + 3.5 (zod schemas + safeParse on every action) | tests/actions/auth.test.ts asserts Supabase NOT called when input is invalid (5 actions x invalid inputs) |
| SEC-03 (rate limiting + CORS) | 10-02 Task 2.5 (Supabase dashboard + Mgmt API rate-limit checklist) | notes/supabase-dashboard-checklist.md items 3 + 4; CORS surface absent (Server Actions same-origin) |
| SEC-04 (CSRF on state-changing routes) | 10-07 Task 7.3 csrf.spec.ts + ambient Next.js 15 same-origin | tests/e2e/csrf.spec.ts asserts mismatched-Origin POST returns 4xx |
| SEC-05 (HTTPS + strict headers) | 10-07 Task 7.1 next.config.ts + Task 7.2 tests | tests/security/headers.test.ts (RUN_HEADER_TESTS) + tests/security/csp.test.ts + Gate 4 manual CSP walk |
| SEC-06 (generic auth errors / no enumeration) | 10-03 Task 3.3 (mapSupabaseError collapses wrong-email + wrong-pass + existing-email-signup), 10-04 Task 4.4 (forgot-password always returns success) | tests/auth/signin.test.ts generic error on invalid creds |
| SEC-07 (account throttle/lock after repeated failures) | 10-02 Task 2.5 (rate-limit checklist), 10-03 (lockout test stub + auth_events.signin_failed), 10-07 Gate 1 (manual SEC-07 walkthrough) | tests/auth/lockout.test.ts (it.skip + manual Gate 1 in 10-VERIFICATION.md) |
| SEC-08 (admin route protected + MFA + IP) | 10-03 Task 3.4 (admin-allowlist), 10-06 Tasks 6.1-6.3 (layout gate + audit page + admin-gate.spec.ts), 10-07 Gate 2 (manual signed-in-non-admin) | tests/e2e/admin-gate.spec.ts (unauthed redirect) + Gate 2 manual signed-in-non-admin walk |
| SEC-09 (audit log of suspicious activity) | 10-02 Task 2.2 (auth_events table + RLS), 10-03 Tasks 3.4-3.5 (writeAuthEvent on every action), 10-06 Task 6.2 (audit page surface) | tests/audit/auth-events.test.ts covers each event type (signup, signin, signin_failed, signout, password_reset_requested, password_changed) |

PASS - every SEC ID is declared in at least one plan requirements: frontmatter and has at least one acceptance test.

## Success Criteria Trace

| Criterion (ROADMAP verbatim) | Plan/Task | Test |
|---|---|---|
| 1. User can register and log in via httpOnly cookies | 10-03 Task 3.5 (signUpAction + signInAction); 10-04 Tasks 4.3-4.4 (login/signup pages + forms); 10-01 Task 1.6 (middleware refresh) | tests/auth/signup.test.ts, tests/auth/signin.test.ts (cookie flags) |
| 2. Invalid login returns generic message and locks after repeated failures | 10-03 Task 3.3 (mapSupabaseError -> INVALID_CREDENTIALS); 10-02 Task 2.5 (rate-limit checklist); 10-07 Task 7.4 (Gate 1) | tests/auth/signin.test.ts generic error + tests/auth/lockout.test.ts (skipped, run manually via Gate 1) |
| 3. API endpoints reject unauthenticated or unvalidated requests | 10-03 Tasks 3.2 + 3.5 (zod gate); 10-05 Task 5.5 (account layout getUser); 10-06 Task 6.1 (admin layout gate); 10-02 Task 2.2 (RLS policies) | tests/actions/auth.test.ts (zod), tests/e2e/admin-gate.spec.ts (unauthed), Gate 3 cross-user RLS deny |
| 4. Security headers and CSRF protections are verified active | 10-07 Task 7.1 (headers); 10-07 Task 7.2 (header + CSP tests); 10-07 Task 7.3 (CSRF spec) | tests/security/headers.test.ts + tests/security/csp.test.ts + tests/e2e/csrf.spec.ts + Gate 4 manual CSP walk |

PASS - every criterion has at least one automated or manual test traceable to a specific task.
## Wave Dependency Graph

```
Wave 0 (parallel-eligible, sequenced for safety):
  10-01 (depends_on: [])    - Supabase clients + middleware + Playwright + fixture
  10-02 (depends_on: [])    - Schema migration + RLS + auth_events + dashboard checklist

Wave 1:
  10-03 (depends_on: [10-01, 10-02])  - Auth Server Actions + audit + tests

Wave 2 (parallel after 10-03):
  10-04 (depends_on: [10-03])  - Auth UI (login/signup/forgot/reset)
  10-05 (depends_on: [10-03])  - Account + cart-merge + UserMenu
  10-06 (depends_on: [10-03])  - Admin gate + audit surface

Wave 3:
  10-07 (depends_on: [10-01, 10-02, 10-03, 10-04, 10-05, 10-06])  - Headers + CSP + verification
```

PASS - no cycles, all referenced plans exist, wave numbers consistent with depends_on.

**Same-wave file overlap check:**
- 10-01 vs 10-02 (Wave 0): zero file overlap.
- 10-04 vs 10-05 vs 10-06 (Wave 2): both 10-04 AND 10-05 modify messages/en.json + messages/ar.json - sequential JSON-merge edits, not concurrent rewrites. 10-05 also extends src/app/actions/auth.ts (replaces the TODO(10-05) marker placed by 10-03), declared in 10-05 frontmatter so coordinated. Not a blocker but executors must serialize the messages JSON edits. Recommend explicit Wave-2A -> Wave-2B sub-staging if the orchestrator parallel-execute path runs Wave-2 plans concurrently.
## Findings

### BLOCK (must fix before execution)

(none)

### FLAG (recommend fix)

- **[10-05 Task 5.8] tests/rls/cross-user-deny.test.ts is a non-asserting skeleton.** The test file as authored contains expect(true).toBe(true) // placeholder until SSR-client-with-A-session is available. Plan documents this honestly and routes the actual cross-user proof to manual Gate 3 in 10-VERIFICATION.md, but a green npm run test misleads anyone who does not read the file. Recommend either (a) wire an SSR client to A's session cookies in the fixture (signInTestUser already returns sessionCookies - feasible) and assert empty result, OR (b) rename the file to cross-user-deny.skeleton.test.ts and use it.skip with a comment pointing at Gate 3. This is the single most security-relevant test in Phase 10.

- **[10-07 Task 7.2] tests/security/csp.test.ts duplicates the CSP builder.** Plan acknowledges this (12 lines of duplication) but accepts the drift risk. Recommend extracting buildCsp(opts) into src/lib/security/csp.ts and importing from BOTH next.config.ts and the test. Cost is low (~15 minutes); benefit is that any future CSP edit auto-asserts in tests rather than silently drifting.

- **[10-04 Task 4.4] autoComplete="email username" on login + signup email inputs is non-standard.** The HTML autocomplete spec defines email and username as separate values; pairing them is unusual and inconsistently handled by password managers. Recommend autoComplete="username" on the login form (matches password-manager expectations for a returning credential identifier) and autoComplete="email" on the signup form (which identifies a brand-new email rather than a returning credential).

- **[10-04 Task 4.6 + 10-05 Task 5.8] Playwright e2e specs assume specific shop selectors (getByRole button name /add to cart/i).** If the existing PDP Add to cart button uses a different accessible name (especially in the AR locale), the test silently no-ops. Recommend a data-testid="add-to-cart" hook OR explicit selector reference verified against the current PDP markup before the e2e is run.

- **[10-03 Task 3.5] signOutAction redirects without revalidatePath.** signInAction calls revalidatePath("/", "layout") + redirect; signOutAction relies solely on redirect("/login"). Both work, but the inconsistency means a logged-in user landing on a route that uses cookies() might see stale cache after signOut on edge paths. Low severity - Vercel + redirect already invalidates. Recommend a one-liner revalidatePath("/", "layout") before the redirect for symmetry with signIn.

- **[10-04 + 10-05] messages/{en,ar}.json Auth + Account namespace co-edit in Wave 2.** Both plans declare these files in files_modified. Parallel execution requires sequential JSON merges. Recommend explicit Wave-2A -> Wave-2B sub-staging in execute-phase config OR a JSON-merge helper to prevent corruption.

- **[10-07 Task 7.1] CSP script-src unsafe-inline + style-src unsafe-inline.** Documented honestly as R4 deferral. Not a blocker per RESEARCH section 2.4 footguns, but the unsafe-inline posture weakens SEC-05 - headers exist and are the right ones, but the script CSP weakens XSS protection. Acceptable for Phase 10 because Vercel + next-intl + base-ui + motion all set inline styles/scripts and per-route nonce is explicitly out of scope. Tracked under deferred items in 10-VERIFICATION.md.
### PASS (notable)

- **Wave 0 prerequisites complete in 10-01 + 10-02.** Probe (10-02 Task 2.1), Playwright install + config (10-01 Task 1.7), tests/setup/supabase-test-client.ts fixture (10-01 Task 1.7), failing-first test stubs (10-03 Task 3.1) - all covered. Strong gate discipline.
- **Service-role-key boundary is genuinely four-layered.** import server-only, no NEXT_PUBLIC_ prefix, ESLint no-restricted-imports fence (10-01 Task 1.5), AND production-bundle grep gate in 10-VERIFICATION.md (Gate 5). R8 well-mitigated.
- **Anti-enumeration discipline is consistent across surfaces.** 10-03 Task 3.3 mapper (collapses wrong-email + wrong-pass + existing-email-signup), 10-04 forgot-password always-success, 10-05 Task 5.6 ownership-mismatch -> notFound() (not 403). Same principle applied at every leak point.
- **Manual user_setup is enumerated and traceable.** 10-01 has env vars (Vercel + .env.local), 10-02 has dashboard probe + rate-limit + email-confirm-disable + Mgmt-API PATCH, 10-06 has SUPABASE_ADMIN_EMAILS, 10-07 has Vercel HTTPS confirmation. All required manual steps surface as user_setup blocks in plan frontmatter.
- **Architectural constraints honored.** Logical CSS only (verified in plan acceptance criteria for every UI task), ActionResult<T> envelope reused as AuthActionResult<T> (10-03 Task 3.3), import server-only on admin.ts + audit.ts + admin-allowlist.ts + merge-on-signin.ts, migration ordering hand-author-before-generate (10-02 Task 2.4), getUser() not getSession() in security gates (10-05 Task 5.5 + 10-06 Task 6.1), cart merge wrapped in db.transaction with FOR UPDATE (10-05 Task 5.1).
- **Risk register fully traced.** R1+R2 -> 10-02 Task 2.5 + 10-07 Gate 1; R3 -> 10-02 Task 2.1; R4 -> 10-07 acknowledged + deferred; R5 -> 10-05 Task 5.1 transaction; R6 -> 10-VERIFICATION deferred; R7 -> 10-05 Task 5.8 + 10-VERIFICATION Gate 3; R8 -> 10-01 four-layer + 10-07 Gate 5.
- **Sampling continuity met.** Across the wave order 10-01 -> 10-07, no three consecutive tasks lack an automated verify. Even Wave-0 setup tasks have node-script regex verifies.
- **i18n parity.** 10-04 Task 4.2 and 10-05 Task 5.4 both add EN + AR keys in the same task; verify scripts assert key-shape parity between messages/en.json and messages/ar.json (key-set comparison in the 4.2 verify command).
- **No scope reduction detected.** No "v1", "placeholder", "simplified", "static for now" used to dodge a locked decision. Where things are deferred (TOTP enforcement, IP allowlist, per-account lockout, CSP nonces, custom SMTP), CONTEXT.md explicitly authorizes the deferral or RESEARCH section 8 documents the trade-off.
- **CONTEXT.md compliance.** All locked decisions implemented: provider = Supabase Auth via @supabase/ssr (10-01); email/password only no OAuth (10-04); email confirmation OFF (10-02 dashboard checklist); cart-merge semantics = prefer user cart, silently delete guest (10-05 Task 5.1 verbatim); account scope = orders + signout only (10-05); admin gate = email allowlist + optional TOTP (10-06); CSRF via Server Actions same-origin (10-07); zod validation pattern (10-03); auth_events Drizzle table (10-02); per-IP rate limits (10-02 checklist); strict CSP via next.config.ts (10-07); cross-schema FK with ON DELETE SET NULL (10-02); Auth + Account i18n namespaces (10-04 + 10-05); cross-schema FKs typed manually no .references() (10-02 Task 2.3); env vars added to env.ts zod (10-01 Task 1.1).

## Recommendation

**PROCEED to /gsd-execute-phase 10.**

Three soft asks the executor should pick up as inline cleanups during execution (none blocking):

1. In Plan 10-05 Task 5.8, complete the cross-user-deny.test.ts SSR-client wiring (signInTestUser already returns sessionCookies - wire those into a createServerClient bound to A's session and re-assert the empty PostgREST result) OR rename to *.skeleton.test.ts and it.skip with a Gate 3 pointer.
2. In Plan 10-07 Task 7.2, extract buildCsp into src/lib/security/csp.ts so the test imports the production string (eliminates the duplicated 12-line builder).
3. In Plan 10-04 Task 4.4, change autoComplete="email username" to autoComplete="username" on login email and autoComplete="email" on signup email.

Track items 1-3 as a Phase 10 follow-up line in 10-07-SUMMARY.md if not addressed during execution. None are blockers for shipping Phase 10.
