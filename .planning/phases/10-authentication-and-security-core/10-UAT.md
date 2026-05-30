---
status: partial
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
  severity: blocker
  test: 4
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis

- truth: "Forgot-password success state shows a single 'back to sign-in' affordance"
  status: failed
  reason: "User reported: works, but why are there two 'back to sign-in' buttons"
  severity: minor
  test: 6
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis

- truth: "Password-reset email link opens the reset-password form and lets the user set a new password"
  status: failed
  reason: "User reported: clicking the reset link lands back on /en/forgot-password (callback hit invalid_link path — ?code exchange failed). Round-trip never completes. Secondary: benign fdprocessedid hydration console warning (browser-extension injected)."
  severity: major
  test: 7
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis

- truth: "A guest's cart is merged into the user's account cart after sign-in (item retained)"
  status: failed
  reason: "User reported: nope, it doesn't merge"
  severity: major
  test: 10
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis

- truth: "Auth/nav pages hydrate without a real (non-extension) hydration mismatch"
  status: failed
  reason: "User reported: console hydration mismatch on MobileNavDrawer SheetTrigger — Base UI generated id diverges server/client (base-ui-_R_1pn9etb_ vs _R_76r9etb_). Genuine useId divergence in Navbar tree, not extension-injected. Recurring auth-page hydration issue."
  severity: major
  test: 12
  root_cause: ""     # Filled by diagnosis
  artifacts: []      # Filled by diagnosis
  missing: []        # Filled by diagnosis
  debug_session: ""  # Filled by diagnosis
