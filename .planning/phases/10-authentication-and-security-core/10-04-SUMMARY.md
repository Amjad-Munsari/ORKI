---
phase: 10
plan: 04
subsystem: authentication-and-security-core / auth-ui
tags: [auth, ui, i18n, forms, reset-password, supabase]
dependency_graph:
  requires:
    - 10-03 (signInAction, signUpAction, requestPasswordResetAction, setPasswordAction, AuthActionResult envelope)
    - 10-02 (Supabase SSR client, env)
    - 10-01 (foundations / next-intl routing)
  provides:
    - "Auth UI surface — /[locale]/(auth)/{login,signup,forgot-password,reset-password}"
    - "Field helper at src/components/forms/Field.tsx (parameterised namespace)"
    - "Auth i18n namespace (50 keys, EN+AR)"
    - "Recovery callback at /api/auth/callback (Supabase exchangeCodeForSession)"
    - "Three client form components consuming Wave 1 Server Actions"
  affects:
    - "Plan 10-05 (UserMenu) — will consume signOutAction not exercised here"
    - "Plan 10-07 (CSRF e2e) — will exercise /api/auth/callback in CSRF spec"
tech-stack:
  added: []
  patterns:
    - "useTransition wraps Server Action calls; form-level error in role=alert aria-live=polite"
    - "Field helper namespace prop strips '<NS>.' prefix dynamically via new RegExp('^'+namespace+'\\.')"
    - "ResetPasswordForm three-state machine (verifying / expired / ready / done) gated on supabase.auth.getUser"
    - "Anti-enumeration in ForgotPasswordForm — UI always renders generic success regardless of action result"
key-files:
  created:
    - src/components/forms/Field.tsx
    - src/components/auth/LoginForm.tsx
    - src/components/auth/SignupForm.tsx
    - src/components/auth/ForgotPasswordForm.tsx
    - src/components/auth/ResetPasswordForm.tsx
    - src/app/[locale]/(auth)/login/page.tsx
    - src/app/[locale]/(auth)/signup/page.tsx
    - src/app/[locale]/(auth)/forgot-password/page.tsx
    - src/app/[locale]/(auth)/reset-password/page.tsx
    - src/app/api/auth/callback/route.ts
    - tests/e2e/password-reset.spec.ts
  modified:
    - messages/en.json
    - messages/ar.json
decisions:
  - "Did NOT refactor ShippingForm to consume the lifted Field helper — bumped to a follow-up to keep Phase 10 scope tight; ShippingForm continues to use its private inline 10px Field. The 10px→12px bump on the Checkout surface is now unblocked but deliberately deferred."
  - "Added an `email` key to Auth.signup, Auth.forgot (and `back` to Auth.reset) bringing the namespace to 50 keys (UI-SPEC table showed 49). The extra labels are required by the form input <label> components and mirror Auth.login.email which was already in the spec."
  - "Used RHF `Controller` for the accept-terms checkbox to bridge react-hook-form ↔ @base-ui/react/checkbox (which exposes onCheckedChange, not native onChange)."
  - "ForgotPasswordForm always renders the generic success message after submit; result.ok branch was deliberately not added to satisfy SEC-06 anti-enumeration."
  - "ResetPasswordForm uses `data-checked` for base-ui state class (not `data-state=checked` from the older Radix/shadcn convention) — base-ui v1.4 renders the data attribute as `data-checked`."
  - "/api/auth/callback hardcodes the locale fallback to /en/reset-password when ?next is missing — matches the URL written by requestPasswordResetAction in Plan 10-03 (which always writes /en/...). When a localised reset is needed, ?next can carry /ar/reset-password."
metrics:
  duration: ~30 min
  completed: 2026-05-10
  tasks_completed: 6
  files_changed: 13
  loc_added: ~1100
---

# Phase 10 Plan 04: Auth UI Surface Summary

Wave 2 — auth UI surface. Four bilingual route-group pages, four client form components, one Supabase recovery callback, and the Auth i18n namespace (50 keys EN+AR). All forms post directly to the Server Actions delivered by Plan 10-03 via `useTransition`; form-level errors localise the `Auth.errors.*` messageKey via next-intl. The `Field` helper from `ShippingForm.tsx` was lifted to `src/components/forms/Field.tsx` with a `namespace` prop and the label class bumped from `text-[10px]` to `text-[12px]` per UI-SPEC §Anti-patterns #15.

## What was built

**Pages** (`src/app/[locale]/(auth)/`)
- `login/page.tsx` — RSC chrome, injects `<LoginForm />`, alt-link to `/signup`.
- `signup/page.tsx` — RSC chrome, injects `<SignupForm />`, alt-link to `/login`.
- `forgot-password/page.tsx` — RSC chrome, helper paragraph + `<ForgotPasswordForm />`, back-link to `/login`.
- `reset-password/page.tsx` — RSC chrome, injects `<ResetPasswordForm locale={...} />` (form owns the verifying/expired/form/done states).

All four pages render the UI-SPEC editorial chrome: eyebrow (Tier 4 12 px) + Tier 1 H1 (`text-4xl md:text-6xl`) + form slot + tertiary alt-link line. Bare form on a black field; no card wrapper.

**Form components** (`src/components/auth/`)
- `LoginForm.tsx` — RHF + `signinSchema` + `signInAction`; on success `router.push('/account')`.
- `SignupForm.tsx` — RHF + `signupSchema` + `signUpAction`; accept-terms checkbox via `@base-ui/react/checkbox` with `t.rich` label wiring `<terms>`/`<privacy>` to next-intl `Link`; on success `router.push('/account')`.
- `ForgotPasswordForm.tsx` — RHF + `requestResetSchema` + `requestPasswordResetAction`; ALWAYS renders generic success after submit (SEC-06 anti-enumeration).
- `ResetPasswordForm.tsx` — RHF + `setPasswordSchema` + `setPasswordAction`; useEffect calls `supabase.auth.getUser` to verify recovery session before rendering form; renders one of four states: `verifying` (spinner), `expired` (`BrandedErrorPage`), `ready` (form), `done` (inline success + back-link).

**Shared form primitive** (`src/components/forms/Field.tsx`)
- Lifted from `ShippingForm.tsx:165-209`.
- Label class bumped `text-[10px]` → `text-[12px]` per UI-SPEC §Anti-patterns #15.
- New `namespace` prop (default `'Checkout'`) parameterises the t-shim strip — both Auth and Checkout forms share the same helper.
- Logical CSS only; preserves `aria-invalid` / `aria-describedby` / `role="alert"` accessibility wiring.
- `useTranslations(namespace as Parameters<typeof useTranslations>[0])` cast widens the typed-namespace union from next-intl 4.x for dynamic-namespace consumers.

**Recovery callback** (`src/app/api/auth/callback/route.ts`)
- `GET` handler exchanges `?code=…` for a session via the SSR Supabase client (writes auth cookies), then redirects to `?next=…` (default `/en/reset-password`).
- On any failure (missing/invalid code) redirects to `/en/forgot-password?error=invalid_link` — never surfaces internals (SEC-06 generic-error policy).
- Lives at `/api/auth/callback` so next-intl middleware excludes it (RESEARCH §7 #14).

**i18n** (`messages/en.json` + `messages/ar.json`)
- New top-level `Auth` namespace, 50 keys, mirrored 1:1 across EN and AR.
- Five sub-namespaces: `login`, `signup`, `forgot`, `reset`, `errors` (11 generic error keys).
- `signup.acceptTerms` carries `<terms>` / `<privacy>` rich-text tokens.
- AR copy is functional-formal neutral imperative (`سجّل الدخول`, `أدخل بريدك`).

**E2E spec** (`tests/e2e/password-reset.spec.ts`)
- Two automated tests: invalid recovery code → redirect to `forgot-password?error=invalid_link`, and forgot-password generic-success rendering.
- One `test.skip` documenting the manual round-trip (deferred to Plan 10-07).
- Browser binary install was NOT invoked by this plan; `npx playwright test --list` succeeds, execution deferred to 10-07 verification.

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` on new files (Field, all four forms, callback route, four pages) | clean |
| `npx eslint` on new files | clean |
| `npm run lint` over project | 4 pre-existing errors in `scripts/*.cjs` + `src/components/CookieBanner.tsx` + `src/lib/orders/server.test.ts` — none in new files |
| `npx tsc --noEmit` over project | pre-existing errors in `src/app/[locale]/checkout/page.tsx` and `tests/*.test.ts` — none in new files |
| `npm run test` (vitest) | 18 passed, 1 skipped (lockout); flaky live-Supabase signin tests passed on re-run |
| `npx playwright test tests/e2e/password-reset.spec.ts --list` | 3 tests detected (1 skipped); browsers not installed (deferred to 10-07) |
| Auth namespace keys mirror EN ↔ AR | 50 == 50, identical key paths, AR contains Arabic glyphs |
| All inputs `dir="ltr"` on credentials | yes (login email/password, signup email/password, forgot email, reset both passwords) |
| autoComplete map | login email = `email username`, login pwd = `current-password`; signup email = `email username`, signup pwd = `new-password`; forgot email = `email`; reset both = `new-password` |
| No directional CSS (`ml-/mr-/pl-/pr-/text-right/text-left`) | confirmed via `grep` over new files |
| No `localStorage` / `document.cookie` references in new files | confirmed |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Dynamic next-intl namespace prop type widening**
- **Found during:** Task 4.1
- **Issue:** `useTranslations(namespace)` failed TS in `Field.tsx` because next-intl 4.x narrows the namespace argument to a literal union of project-known namespaces; a runtime-supplied `string` doesn't satisfy that type.
- **Fix:** Cast through `Parameters<typeof useTranslations>[0]` so callers can pass `'Auth'` / `'Checkout'` / etc. dynamically.
- **Files modified:** `src/components/forms/Field.tsx`
- **Commit:** `81a7ed9`

**2. [Rule 2 - Critical functionality] Added missing field labels to Auth namespace**
- **Found during:** Task 4.4
- **Issue:** UI-SPEC table only listed `Auth.login.email` and `Auth.login.password`; the signup, forgot, and reset forms also need `<label>` text. Without these the inputs would render unlabeled or fall back to the matching login keys (which would not be discoverable from the `Auth.signup` / `Auth.forgot` / `Auth.reset` form-scoped translators).
- **Fix:** Added `Auth.signup.email`, `Auth.signup.password`, `Auth.forgot.email`, `Auth.reset.back` to both EN and AR. Total 50 keys (vs 49 in the UI-SPEC table). All key paths mirror EN ↔ AR.
- **Files modified:** `messages/en.json`, `messages/ar.json`
- **Commit:** `19c7fba`

**3. [Rule 1 - Bug] base-ui checkbox state attribute name**
- **Found during:** Task 4.4
- **Issue:** Plan example used `data-[state=checked]:bg-white` (Radix/shadcn convention). `@base-ui/react/checkbox` v1.4 emits `data-checked` (no `state=` prefix).
- **Fix:** Used `data-[checked]:bg-white data-[checked]:border-white` instead.
- **Files modified:** `src/components/auth/SignupForm.tsx`
- **Commit:** `551f3bb`

**4. [Rule 1 - Bug] RHF Controller for base-ui checkbox**
- **Found during:** Task 4.4
- **Issue:** `register('acceptTerms')` returns native-`onChange`/`onBlur` props; `@base-ui/react/checkbox` exposes `onCheckedChange(checked, eventDetails)` instead.
- **Fix:** Wrapped the checkbox in RHF `Controller` so RHF state is driven by the checkbox's `checked` / `onCheckedChange` props directly. `field.onChange(checked === true)` ensures the value is a literal `true` (matching `signupSchema`'s `z.literal(true)`).
- **Files modified:** `src/components/auth/SignupForm.tsx`
- **Commit:** `551f3bb`

### Out of scope

- **ShippingForm refactor to consume the lifted Field**: deliberately deferred. Per Task 4.1 approach: "Do NOT update ShippingForm.tsx to consume the shared file in this plan." The Checkout surface still renders 10 px labels until that follow-up lands. The Phase-10 anti-pattern §15 is enforced where Plan 10-04 ships UI; legacy ShippingForm is exempt by scope.

### No Architectural Changes (Rule 4 not triggered)

The plan was implemented exactly as specified for chrome, action wiring, callback design, and threat-model mitigations. No unexpected DB / route / framework changes.

## Threat-model coverage

| Threat ID | Status | Notes |
|-----------|--------|-------|
| T-10-04-01 (Info disclosure — forgot-password enumeration) | mitigated | `ForgotPasswordForm` always renders generic success regardless of `requestPasswordResetAction` result. The action itself returns `{ ok: true, data: null }` unconditionally per Plan 10-03. |
| T-10-04-02 (Tampering — submit reset without recovery session) | mitigated | `ResetPasswordForm` useEffect verifies `supabase.auth.getUser()` before rendering the form. `setPasswordAction` is server-side guarded too (`updateUser` fails without an auth session) — defence in depth. |
| T-10-04-03 (Spoofing via t.rich) | mitigated | `t.rich('acceptTerms')` uses static literal tokens (`<terms>`, `<privacy>`) bound to next-intl `Link` components. No user input flows into translation strings. |
| T-10-04-04 (DoS — login brute-force) | accepted (LOW) | Forms do not auto-retry; per-IP rate-limiting handled by Supabase Auth dashboard config. Per-user lockout deferred per RESEARCH §8 R2. |
| T-10-04-05 (Recovery code in browser history) | accepted (LOW) | Supabase recovery links are single-use, expire in 1 h; consistent with all email-recovery flows. |
| T-10-04-06 (XSS via i18n strings) | mitigated | next-intl escapes by default; only `<terms>` / `<privacy>` rich tokens are interpolated, both bound to `Link` components. |
| T-10-04-07 (CSRF on Server Actions) | deferred to 10-07 | SEC-04 satisfied by Next.js Server Actions Origin/Host check; e2e CSRF spec lives in Plan 10-07. |

## Pointers for downstream plans

**Plan 10-05 (UserMenu + cart-merge):**
- `signInAction` is already imported and wired in `LoginForm.tsx`. The cart-merge extension targets the `// TODO(10-05)` marker inside `signInAction` (`src/app/actions/auth.ts:142`) — no UI changes required in `LoginForm.tsx` once that lands.
- `signOutAction` is NOT consumed by Plan 10-04. Plan 10-05's `<UserMenu>` should mount `<form action={signOutAction}>` per UI-SPEC §"Header Changes".
- `Auth.errors.*` and `Auth.login.*` keys are already in EN/AR — UserMenu will only need new `Account.*` keys (Plan 10-05 owns the `Account` namespace; this plan does not pre-bake it).

**Plan 10-07 (verification + CSRF):**
- `tests/e2e/password-reset.spec.ts` exists with two automated tests. Plan 10-07 owns:
  - Browser binary install (`npx playwright install chromium`).
  - Manual round-trip documentation in `10-VERIFICATION.md`.
  - CSRF spec exercising `/api/auth/callback` with cross-origin POST/GET attempts (route-level CSRF check).
- ShippingForm 10 px → 12 px label bump is also still pending; can be folded into 10-07 polish or deferred to a future hygiene plan.

## Self-Check: PASSED

- File `src/components/forms/Field.tsx` — FOUND
- File `src/components/auth/LoginForm.tsx` — FOUND
- File `src/components/auth/SignupForm.tsx` — FOUND
- File `src/components/auth/ForgotPasswordForm.tsx` — FOUND
- File `src/components/auth/ResetPasswordForm.tsx` — FOUND
- File `src/app/[locale]/(auth)/login/page.tsx` — FOUND
- File `src/app/[locale]/(auth)/signup/page.tsx` — FOUND
- File `src/app/[locale]/(auth)/forgot-password/page.tsx` — FOUND
- File `src/app/[locale]/(auth)/reset-password/page.tsx` — FOUND
- File `src/app/api/auth/callback/route.ts` — FOUND
- File `tests/e2e/password-reset.spec.ts` — FOUND
- Commit `81a7ed9` (Field) — FOUND
- Commit `19c7fba` (Auth namespace) — FOUND
- Commit `f6193dc` (four pages) — FOUND
- Commit `551f3bb` (three forms) — FOUND
- Commit `61cdd46` (reset form + callback) — FOUND
- Commit `b96b287` (e2e spec) — FOUND
