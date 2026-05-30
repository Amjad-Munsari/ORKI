---
status: diagnosed
phase: 10-authentication-and-security-core
source: [10-01-SUMMARY.md, 10-02-SUMMARY.md, 10-03-SUMMARY.md, 10-04-SUMMARY.md, 10-05-SUMMARY.md, 10-06-SUMMARY.md, 10-07-SUMMARY.md]
started: 2026-05-30T18:18:12Z
updated: 2026-05-30T22:15:30Z
---

## Current Test

[testing complete — 1 item blocked (Test 9: no order data)]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running dev server. Start the app fresh with Supabase env vars present. Server boots without errors, the 0002 auth migration is applied (or db:migrate is a no-op), and `/en` returns a live page. No middleware crash, no env-validation failure on boot.
result: pass

### 2. Sign Up — New Account
expected: Go to `/en/signup`. Editorial dark page (eyebrow + big H1, bare form, no card). Fill email + password (8+ chars) + tick accept-terms, submit. Account is created and you land on `/account`.
result: pass

### 3. Sign In — Existing Account
expected: Go to `/en/login`, enter valid credentials, submit. You are signed in and redirected to `/account`.
result: pass

### 4. Invalid Login — Generic Error
expected: At `/en/login`, enter a wrong password (or a non-existent email). You see a single generic error message — NOT "email not found" or "wrong password" specifically (anti-enumeration). The same generic message appears regardless of which field was wrong.
result: issue
reported: "Runtime TypeError — 'Failed to fetch'. Next.js 15.5.18 (Turbopack)."
severity: blocker

### 5. Sign Out
expected: While signed in, use the header account menu → Sign out (red-tinted). No confirmation modal. You are signed out and the header reverts to a "Sign in" link.
result: pass

### 6. Forgot Password — Always Generic Success
expected: At `/en/forgot-password`, submit ANY email (registered or not). You always see the same generic "check your email" success message — it never reveals whether the email exists.
result: issue
reported: "works, but why are there two 'back to sign-in' buttons"
severity: minor

### 7. Password Reset Round-Trip
expected: Click the reset link from the email → lands on `/en/reset-password`. A valid link shows the new-password form; set a new password → success + back-to-login. An expired/invalid link shows a branded "link expired" page (not a raw error).
result: issue
reported: "Clicking the password-reset link lands back on /en/forgot-password instead of showing the reset-password form — i.e. /api/auth/callback redirected to forgot-password?error=invalid_link (the ?code exchange failed). Round-trip does not complete. (Also a benign fdprocessedid hydration console warning on the form, browser-extension injected.)"
severity: major

### 8. Account Page — Orders List
expected: At `/en/account` while signed in, you see the editorial chrome (eyebrow + display heading + "signed in as <email>" line) and your orders list. With no orders, an empty-state card with a "Browse the shop" CTA appears.
result: pass

### 9. Order Detail — Ownership Enforced
expected: Open one of YOUR orders at `/account/orders/<reference>` — the order detail card renders with a back-link to /account. Attempting to open an order reference that belongs to a DIFFERENT user returns a 404 / not-found page (never a 403 and never the other user's data).
result: blocked
blocked_by: other
reason: "No current orders exist to open or to test cross-user ownership against. Note: Test 17 (cross-user RLS deny) covers the DB-layer ownership guarantee independently."

### 10. Guest Cart Merge on Sign-In
expected: As a guest (signed out), add an item to the cart. Then sign in. After sign-in your cart still contains the item you added as a guest (guest cart merged into your account cart).
result: issue
reported: "nope, it doesn't merge"
severity: major

### 11. Header Auth Slot
expected: When signed OUT, the header shows a "Sign in" link. When signed IN, it shows an "Account" menu trigger whose visible label is the literal word "Account" — NOT your email address. The email is never rendered as visible header text.
result: pass

### 12. Auth Pages — Chrome & Arabic RTL
expected: The login/signup/forgot/reset pages all share the dark editorial chrome (eyebrow + large H1 + bare form on black, no card). Switch to `/ar/login` — layout mirrors correctly RTL, copy is in Arabic, and the form fields/labels read right-to-left.
result: issue
reported: "Console Error: hydration mismatch on MobileNavDrawer SheetTrigger (src/components/nav/MobileNavDrawer.tsx:60). Mismatched attr is Base UI generated id (server base-ui-_R_1pn9etb_ vs client base-ui-_R_76r9etb_) — NOT extension-injected. React useId counter diverging server/client in Navbar tree. Surfaced on /ar/login. (Visual RTL/chrome itself appeared fine; reported error is the console hydration warning.)"
severity: major

### 13. Admin Gate — Unauthenticated Redirect
expected: While signed out (or in a fresh/incognito session), visit `/en/admin` and `/en/admin/audit`. You are redirected to `/login` — never shown the admin panel.
result: pass

### 14. Admin Gate — Non-Allowlist Signed-In
expected: Sign in with an account whose email is NOT in SUPABASE_ADMIN_EMAILS, then visit `/en/admin`. You are redirected to `/login` (a denied admin_action audit row is written behind the scenes). The admin panel never renders for a non-allowlisted user.
result: pass

### 15. Admin Audit Log Page
expected: Sign in as an allowlisted admin, visit `/en/admin/audit`. A utility dark table lists auth events (Time, Event, Email, User ID, IP, Metadata), newest first, paginated 50/page. The admin chrome shows the live signed-in admin email (not hard-coded "Root Admin"). An "Audit" link exists in the admin sidebar.
result: pass

### 16. Security Headers Present
expected: Load any page and inspect the response headers (DevTools Network tab or curl -I). All six are present: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy, Permissions-Policy. No CSP violations logged in the console on normal pages.
result: pass
note: "curl-verified on /en, /ar, /en/login (localhost:3000). 5 headers present + correct (CSP value matches production recipe exactly). HSTS deliberately production-gated by NODE_ENV check in next.config.ts (WR-02) — absent in dev by design, emitted in prod. Not a defect."

### 17. Cross-User RLS Deny
expected: Verify (via the RLS test or a direct PostgREST/Supabase query as User A) that User A cannot read User B's order rows — the query returns empty, enforced at the database Row-Level-Security layer, not just in app code.
result: pass
note: "`npx vitest run tests/rls/cross-user-deny.test.ts` → 1 passed (6.69s) against the live Supabase project. Provisions two users, signs in as A, asserts SELECT-by-id and SELECT-by-reference of B's order both return []. RLS proven."

## Summary

total: 17
passed: 11
issues: 5
pending: 0
skipped: 0
blocked: 1

## Gaps

- truth: "Submitting invalid login credentials shows a generic anti-enumeration error message"
  status: failed
  reason: "User reported: Runtime TypeError — 'Failed to fetch'. Next.js 15.5.18 (Turbopack)."
  severity: minor   # downgraded from blocker: not an app defect (environmental)
  test: 4
  root_cause: "NOT an application defect. The invalid-credentials branch is correct: signInAction returns a clean AuthActionResult (auth.ts:125-134), mapSupabaseError maps invalid_credentials correctly (errors.ts:84-94), writeAuthEvent swallows its own errors (audit.ts:48-73). Clean-browser Playwright repro succeeded 4/4; live endpoint returned HTTP 200 on 15/15 invalid POSTs. 'Failed to fetch' is a client-side transport abort — content-injecting browser extension or a transient Turbopack HMR recompile dropping the in-flight Server Action POST. Only the error path shows it because the success path uses window.location.assign (full reload) which masks transport hiccups."
  artifacts:
    - path: "src/components/auth/LoginForm.tsx:57"
      issue: "`await signInAction(data)` is unguarded — a transport-level rejection bubbles to the Next dev overlay as 'Failed to fetch' instead of a graceful message (optional hardening point only)."
  missing:
    - "VERIFY FIRST: re-run Test 4 in an incognito window with extensions disabled — symptom should vanish."
    - "OPTIONAL hardening: wrap `await signInAction(data)` in try/catch and on a thrown transport error call setFormError(tErrors('unknown')) so an extension/HMR abort degrades to a generic message."
  debug_session: .planning/debug/invalid-login-failed-to-fetch.md

- truth: "Forgot-password success state shows a single 'back to sign-in' affordance"
  status: failed
  reason: "User reported: works, but why are there two 'back to sign-in' buttons"
  severity: minor
  test: 6
  root_cause: "Two identical 'Back to sign in' links render in the success state. The page chrome renders an UNCONDITIONAL footer back-link (forgot-password/page.tsx:25-32) AND the form's success branch renders its own back-link (ForgotPasswordForm.tsx:70-77). Both use Auth.forgot.back ('Back to sign in') → /login. The intended pattern (login/page.tsx:23-32) has the chrome own the single link and the form render none."
  artifacts:
    - path: "src/components/auth/ForgotPasswordForm.tsx:70-77"
      issue: "Redundant success-state back-link (the duplicate)."
    - path: "src/app/[locale]/(auth)/forgot-password/page.tsx:25-32"
      issue: "Always-present chrome back-link that stays visible during the success state."
  missing:
    - "Remove the form's success-state back-link (ForgotPasswordForm.tsx:70-77) so the chrome's single footer link is the only one — matching the login/signup pattern."
  debug_session: .planning/debug/forgot-password-duplicate-backlink.md

- truth: "Password-reset email link opens the reset-password form and lets the user set a new password"
  status: failed
  reason: "User reported: clicking the reset link lands back on /en/forgot-password (callback hit invalid_link path — ?code exchange failed). Round-trip never completes. Secondary: benign fdprocessedid hydration console warning (browser-extension injected)."
  severity: major
  test: 7
  root_cause: "Param-shape mismatch (code bug + dashboard config gap). The recovery callback only handles the PKCE `?code` shape via exchangeCodeForSession (callback/route.ts:35,41,44), but Supabase's default 'Reset Password' email delivers a `token_hash` + `type=recovery` verifyOtp link — NOT a `?code` link. So `searchParams.get('code')` is null on every real click, the if(code) guard is false, and control falls through to the failure redirect → /forgot-password?error=invalid_link. The plan (10-RESEARCH.md:565) was built on the incorrect assumption that Supabase emails a ?code recovery URL. requestPasswordResetAction's redirectTo (auth.ts:231-233) is correct and NOT at fault."
  artifacts:
    - path: "src/app/api/auth/callback/route.ts:35-54"
      issue: "Only parses ?code / exchangeCodeForSession; no token_hash + type=recovery → verifyOtp branch."
    - path: "Supabase dashboard — Reset Password email template + redirect URL config"
      issue: "Still the default token_hash shape; never reconciled with the code-only callback (deferred per notes/supabase-dashboard-checklist.md:55-57)."
  missing:
    - "Add a token_hash branch to the callback: read token_hash + type, call supabase.auth.verifyOtp({ type: 'recovery', token_hash }), then redirect to next. Keep the existing ?code→exchangeCodeForSession path as a fallback so both shapes work."
    - "Preferred over customizing the email template (verifyOtp matches Supabase's current default and avoids PKCE code_verifier-cookie fragility on cross-context email clicks)."
  debug_session: .planning/debug/password-reset-invalid-link.md

- truth: "A guest's cart is merged into the user's account cart after sign-in (item retained)"
  status: failed
  reason: "User reported: nope, it doesn't merge"
  severity: major
  test: 10
  root_cause: "mergeGuestCartIntoUserCart performs NO item-level union. When the signed-in account already owns a carts row, it takes the DELETE-guest-cart branch (merge-on-signin.ts:46-55); because cart_items.cartId is ON DELETE CASCADE (schema.ts:129), the guest's item is destroyed. The precondition is reliably true by Test 10: the defensive merge hook in getOrCreateCart (session.ts:84-119) fires on every authenticated GET /api/cart, which StoreHydration calls on every page mount (StoreHydration.tsx:83, mounted globally in [locale]/layout.tsx:58) — so the account's first authenticated render (during signup/sign-in) already claimed+stamped a userId-bound cart. New guest item then hits the DELETE branch and is silently discarded. Eliminated: cookie mismatch (both use 'orki_sid'), cookie rotation, merge ordering."
  artifacts:
    - path: "src/lib/cart/merge-on-signin.ts:46-55"
      issue: "DELETE-guest-cart branch with no item-level union; where the guest item is lost."
    - path: "src/lib/db/schema.ts:129"
      issue: "cart_items.cartId ON DELETE CASCADE turns the cart-row DELETE into item destruction."
    - path: "src/lib/cart/session.ts:84-119 + src/store/StoreHydration.tsx:83"
      issue: "Defensive merge fires on every page mount, so the account acquires a userId-bound cart before Test 10, forcing the DELETE branch."
  missing:
    - "Replace the silent DELETE branch with a real item-level union: when a user cart already exists, upsert the guest cart's cart_items into the user's cart (insert with onConflictDoUpdate summing quantities on the (cartId, productId, sizeId) unique index, mirroring addItemToCart in server.ts:42-59) before deleting the now-empty guest cart — all inside the existing transaction."
  debug_session: .planning/debug/guest-cart-not-merging.md

- truth: "Auth/nav pages hydrate without a real (non-extension) hydration mismatch"
  status: failed
  reason: "User reported: console hydration mismatch on MobileNavDrawer SheetTrigger — Base UI generated id diverges server/client (base-ui-_R_1pn9etb_ vs _R_76r9etb_). Genuine useId divergence in Navbar tree, not extension-injected. Recurring auth-page hydration issue."
  severity: major
  test: 12
  root_cause: "The mismatched base-ui- id is a downstream symptom of a server↔client useId counter divergence in the Navbar's motion subtree. CartBadge.tsx:12 and MobileNavDrawer.tsx:31 call the RAW useReducedMotion() from motion/react — not the project's hydration-safe useReducedMotionSafe() wrapper (which documents exactly this hazard). Raw useReducedMotion resolves false on the server but the user's real value on the client's first render, so for a prefers-reduced-motion user the AnimatePresence subtrees render differently. Motion consumes React useId slots inside those subtrees (PresenceChild/PopChild/use-presence) from the SAME counter Base UI's Sheet later draws from. CartBadge renders before MobileNavDrawer (Navbar.tsx:66 vs 72), so the shift cascades into the SheetTrigger id. The `user` prop is stable/serialized and NOT the cause. Prior fix (commit 1e5c2f5) added useReducedMotionSafe but only migrated PageTransition, leaving these two callers raw — explaining the recurring auth-page error."
  artifacts:
    - path: "src/components/nav/CartBadge.tsx:12"
      issue: "Calls raw useReducedMotion() inside AnimatePresence; primary upstream useId-counter divergence point."
    - path: "src/components/nav/MobileNavDrawer.tsx:31"
      issue: "Also calls raw useReducedMotion(); same hazard at the component reporting the mismatch."
    - path: "src/components/pdp/PDPGallery.tsx:26"
      issue: "Another raw useReducedMotion() consumer — audit for the same pattern."
  missing:
    - "Replace raw useReducedMotion() with useReducedMotionSafe() in CartBadge.tsx and MobileNavDrawer.tsx so server and first-client render agree (false), stabilizing the shared useId sequence."
    - "Audit other raw useReducedMotion() consumers whose value affects render output (e.g. PDPGallery.tsx:26)."
    - "Do NOT use suppressHydrationWarning on the SheetTrigger — it only masks the symptom."
  debug_session: .planning/debug/navbar-baseui-hydration-mismatch.md
