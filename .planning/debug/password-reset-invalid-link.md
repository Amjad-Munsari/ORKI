---
status: diagnosed
trigger: "Password-reset email link lands back on /en/forgot-password?error=invalid_link instead of the reset-password form (UAT Test 7, find_root_cause_only)"
created: 2026-05-30T22:30:00Z
updated: 2026-05-30T22:45:00Z
---

## Current Focus

hypothesis: CONFIRMED — Supabase default recovery email delivers a `token_hash` + `type=recovery` verify link (PKCE/verifyOtp shape), but the callback at /api/auth/callback ONLY handles `?code` via exchangeCodeForSession. No `code` param arrives → callback falls through to the invalid_link branch.
test: Read all flow files + verified Supabase default email-template shape against current docs.
expecting: Callback has no token_hash/verifyOtp branch AND the email template was never customized to emit `?code` → mismatch confirmed.
next_action: Diagnosis complete. Return ROOT CAUSE FOUND.

## Symptoms

expected: Clicking the reset link from the email lands on /en/reset-password showing the new-password form (valid link) or a branded 'link expired' page (invalid link).
actual: Clicking the reset link lands the user back on /en/forgot-password?error=invalid_link — i.e. /api/auth/callback ran its failure branch because the `?code` exchange never happened.
errors: redirect to /en/forgot-password?error=invalid_link
reproduction: Test 7 in .planning/phases/10-authentication-and-security-core/10-UAT.md
started: Discovered during UAT 2026-05-30 (flow never worked end-to-end against a real Supabase email)

## Eliminated

- hypothesis: redirectTo URL doesn't match the callback route / omits ?next (investigation_focus H1)
  evidence: src/app/actions/auth.ts:231-233 builds a correct, well-formed redirectTo — `${origin}/api/auth/callback?next=/${locale}/reset-password`. The path, the route, and the ?next param are all correct. This is NOT the bug.
  timestamp: 2026-05-30T22:40:00Z

- hypothesis: Single-use link consumed by a prior click / email-scanner prefetch (investigation_focus H4)
  evidence: Symptom is 100% reproducible on first click during UAT, not intermittent. A consumed-link failure would be intermittent and would still require the callback to have received (and rejected) a real code. The callback receives NO code at all. Not the cause (though it is a real secondary risk for token_hash links too).
  timestamp: 2026-05-30T22:40:00Z

## Evidence

- timestamp: 2026-05-30T22:35:00Z
  checked: src/app/api/auth/callback/route.ts (full GET handler)
  found: The handler reads ONLY `searchParams.get('code')` (line 35). If `code` is falsy it skips the exchange entirely and returns `${origin}/${locale}/forgot-password?error=invalid_link` (lines 52-54). There is NO handling for `token_hash` + `type=recovery`, and NO call to `supabase.auth.verifyOtp(...)`. The only session-establishing call is `exchangeCodeForSession(code)` at line 44.
  implication: If the email link arrives WITHOUT a `?code` param, this route can only ever produce invalid_link — exactly the observed symptom.

- timestamp: 2026-05-30T22:36:00Z
  checked: src/app/actions/auth.ts requestPasswordResetAction (lines 209-246)
  found: Calls `supabase.auth.resetPasswordForEmail(email, { redirectTo: ${origin}/api/auth/callback?next=/${locale}/reset-password })`. The redirectTo is correct and well-formed. Crucially, `redirectTo` only controls WHERE Supabase sends the user back — it does NOT control whether the email carries `?code` or `?token_hash`. That is governed by the Supabase email TEMPLATE, which uses `{{ .ConfirmationURL }}` / `{{ .TokenHash }}` server-side.
  implication: The application code requests the reset correctly; the failure is downstream in how Supabase formats the link vs how the callback parses it.

- timestamp: 2026-05-30T22:38:00Z
  checked: Supabase client config — src/lib/supabase/server.ts, client.ts, admin.ts
  found: All use `@supabase/ssr` (createServerClient / createBrowserClient) with NO explicit `flowType`. @supabase/ssr defaults to the PKCE flow.
  implication: Under PKCE, exchangeCodeForSession requires BOTH a `?code` AND a code_verifier cookie that was set in the SAME browser context that initiated the request. Even if a `?code` did arrive, the verifier is stored in a cookie tied to the requesting session — clicking an email link in a fresh/different browser context (the normal recovery scenario) has no verifier. The flow is structurally fragile here. But the primary failure is more basic: no code arrives at all (see template evidence below).

- timestamp: 2026-05-30T22:40:00Z
  checked: Default Supabase recovery email template shape (current Supabase docs, verified via web search 2026-05-30)
  found: The DEFAULT Supabase "Reset Password" email template is `<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery&next=...">Reset Password</a>`. It emits a `token_hash` + `type=recovery` verify link, NOT a `?code=` link. A `?code` (OAuth/PKCE) link is only produced when the email template is customized to use `{{ .ConfirmationURL }}` AND the project is in a code-flow configuration. The recovery email handed to this callback therefore arrives with `token_hash`/`type`, never `code`.
  implication: The callback's `searchParams.get('code')` is null on every real recovery click → unconditional invalid_link. This is the exact mechanism of the bug.

- timestamp: 2026-05-30T22:42:00Z
  checked: Phase 10 planning provenance — 10-RESEARCH.md:565, 10-PATTERNS.md:430, 10-04-PLAN.md:40/606-616
  found: The design was built on a stated (but incorrect) assumption: "Supabase emails a `?code=...&type=recovery` URL → exchange for session" (10-RESEARCH.md:565; 10-PATTERNS.md:430 comment literally says "Receives ?code=...&type=recovery"). The whole callback + ResetPasswordForm verify-on-mount design inherited this assumption. No task ever verified the real email-template output against a live Supabase send (UAT Test 7 is the first real round-trip).
  implication: This is a design-time assumption error baked into the plan, not a typo. The fix must reconcile the callback (and/or the email template) so the token_hash/type=recovery link is actually handled.

- timestamp: 2026-05-30T22:43:00Z
  checked: src/components/auth/ResetPasswordForm.tsx (lines 68-88)
  found: The form's verify-on-mount only calls `supabase.auth.getUser()`. It relies ENTIRELY on the callback having already set a recovery session cookie before the page renders. It does not itself parse a token_hash or hash fragment. So when the callback fails, getUser() returns no user — but the user never even reaches reset-password because the callback redirected to forgot-password first.
  implication: The form is a downstream victim, not a cause. No fix needed there for this symptom (it correctly shows 'expired' if it were ever reached without a session).

## Resolution

root_cause: |
  The /api/auth/callback GET handler only handles the OAuth/PKCE code-exchange shape
  (`?code=` → exchangeCodeForSession), but Supabase's default password-recovery email
  delivers a verify-link shape (`token_hash` + `type=recovery`, intended for
  `supabase.auth.verifyOtp({ type: 'recovery', token_hash })`). Because no `?code`
  query param is present on the recovery click, the callback skips the exchange branch
  (route.ts:41 `if (code)` is false) and falls through to the failure redirect
  (route.ts:52-54), landing the user on /en/forgot-password?error=invalid_link.

  This is BOTH a code bug and a config gap, and they are two ends of the same mismatch:
    - CODE: src/app/api/auth/callback/route.ts has no token_hash/verifyOtp branch (route.ts:35, 41, 44).
    - CONFIG: the Supabase dashboard email template was never customized to emit a
      `{{ .ConfirmationURL }}`/code-style link that this code-only callback expects; the
      default token_hash template is in force (Item 5 "email templates" was left as
      out-of-scope / deferred in notes/supabase-dashboard-checklist.md:55-57).
  The application Server Action (requestPasswordResetAction) is CORRECT and is not at fault.

fix: ""
verification: ""
files_changed: []
