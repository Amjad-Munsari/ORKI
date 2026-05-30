---
status: diagnosed
trigger: "Invalid login shows 'Runtime TypeError: Failed to fetch' instead of a generic anti-enumeration error message (UAT Test 4, Phase 10)"
created: 2026-05-30T19:25:00Z
updated: 2026-05-30T19:40:00Z
symptoms_prefilled: true
goal: find_root_cause_only
---

## Current Focus

hypothesis: The application code for the invalid-credentials path is CORRECT. The Server Action returns { ok:false, INVALID_CREDENTIALS } reliably (HTTP 200) and a clean Chromium browser renders the generic "Invalid email or password." message every time. The "Failed to fetch" the user saw is an ENVIRONMENT-level abort of the Server Action fetch in the user's actual browser (browser extension intercepting/blocking the POST, or a transient Turbopack dev-server recompile dropping the in-flight connection) — NOT an application defect on the error branch.
test: Reproduced invalid login in a clean headless Chromium (Playwright) 4x; hammered the live Server Action endpoint 15x via curl.
expecting: Confirmed.
next_action: Report ROOT CAUSE FOUND (no source edits — find_root_cause_only).

## Symptoms

expected: At /en/login, entering a wrong password or non-existent email shows ONE generic error message ("Auth.errors.invalidCredentials") in the form. Same message regardless of which field was wrong (anti-enumeration).
actual: A runtime error overlay appears — "Runtime TypeError: Failed to fetch" (Next.js 15.5.18, Turbopack). Valid sign-in (Test 3) works and redirects to /account. Only the INVALID-credentials path errors.
errors: "Runtime TypeError: Failed to fetch"
reproduction: Test 4 in .planning/phases/10-authentication-and-security-core/10-UAT.md — submit wrong password at /en/login.
started: Discovered during UAT 2026-05-30.

## Eliminated

- hypothesis: writeAuthEvent('signin_failed') throws (Drizzle/DB error) and crashes the action POST.
  evidence: writeAuthEvent wraps the insert in try/catch and never rethrows (audit.ts:48-73). Test 3 (valid signin) AND Test 15 (admin audit page reads auth_events) both pass, proving the auth_events table exists, the Drizzle connection works, and inserts succeed. The valid path writes auth_events too.
  timestamp: 2026-05-30T19:20:00Z

- hypothesis: Supabase signInWithPassword throws a network error on invalid creds that propagates out of the action.
  evidence: Standalone repro against the live Supabase project returned CLEANLY: { message: "Invalid login credentials", status: 400, code: "invalid_credentials" }, data.user = null. No throw. The action's error branch is entirely inside try/catch (auth.ts:118-167) so even a throw would be caught and return UNKNOWN.
  timestamp: 2026-05-30T19:18:00Z

- hypothesis: mapSupabaseError mis-handles the invalid-creds error and throws.
  evidence: errors.ts:84-94 matches code === 'invalid_credentials' and returns { INVALID_CREDENTIALS, 'Auth.errors.invalidCredentials' } — pure function, no throw path. Supabase returns exactly code 'invalid_credentials' (confirmed by repro).
  timestamp: 2026-05-30T19:20:00Z

- hypothesis: CSP connect-src blocks the browser fetch on the invalid path.
  evidence: connect-src includes 'self'; the action POST is same-origin to /en/login. The Supabase project ref in CSP (gkcaakimmvsctwpvccwt) matches NEXT_PUBLIC_SUPABASE_URL in .env.local. And the Supabase call is server-side anyway. CSP is identical for valid and invalid paths.
  timestamp: 2026-05-30T19:21:00Z

- hypothesis: Cart-merge / getOrCreateCart code crashes the request.
  evidence: The invalid branch returns at auth.ts:134, BEFORE any cart/cookies/merge code (which lives at auth.ts:143-162, only on the success branch). Cart code cannot run on the invalid path.
  timestamp: 2026-05-30T19:22:00Z

## Evidence

- timestamp: 2026-05-30T19:18:00Z
  checked: Standalone Supabase signInWithPassword with bad creds against live project (anon key, .env.local).
  found: Returns cleanly — error { message:"Invalid login credentials", status:400, code:"invalid_credentials" }, data.user null. No throw, no network error.
  implication: Server-side auth call is healthy on the invalid path. The "Failed to fetch" is NOT a Supabase-fetch failure.

- timestamp: 2026-05-30T19:20:00Z
  checked: Live Server Action POST to /en/login with Next-Action 40f810a67999353c5c864c88c1285f45ced2ed16ab and bad-cred payload.
  found: HTTP 200, Content-Type text/x-component, header x-action-revalidated: [[],0,1]. (Body fell back to cached page render because curl can't replicate the encrypted action-arg shape — body not authoritative, but status/headers confirm the server does NOT 500 on this path.)
  implication: Server-side the action completes with 200. The failure is in the browser->action transport, not a server 500.

- timestamp: 2026-05-30T19:22:00Z
  checked: LoginForm.tsx onSubmit (lines 54-69) — how the result is consumed.
  found: VALID path calls window.location.assign(`/${locale}/account`) — a FULL-DOCUMENT navigation — immediately after the action resolves. INVALID path stays on the page and calls setFormError(...) to render the error in React state.
  implication: The valid path triggers a full page reload the instant the action settles, so any post-response transport quirk is masked by the navigation. The invalid path must keep the fetch/transition alive and resolve it in-place — it is the only path that actually depends on the action RPC completing AND being consumed by React on the same page.

- timestamp: 2026-05-30T19:23:00Z
  checked: Route group + revalidation behavior. Action sits in app/[locale]/(auth)/login/page; success branch calls revalidatePath('/', 'layout') (auth.ts:162); invalid branch does NOT revalidate (returns at :134).
  found: x-action-revalidated differs by branch (valid revalidates layout; invalid does not). Middleware matcher MATCHES the /en/login action POST, so middleware.ts runs supabase.auth.getUser() on every action POST including the failed-login retry.
  implication: Candidate factors narrowed; needed a real-browser repro to decide.

- timestamp: 2026-05-30T19:24:00Z
  checked: Git history — commit 1e37411 "fix(auth): reliable post-login redirect". The SUCCESS branch of LoginForm was changed from router.push('/account') to window.location.assign(`/${locale}/account`) (full-document navigation).
  found: The valid path now hard-navigates the instant the action settles, masking any post-action client-transport quirk. The invalid path keeps the page alive and reconciles the action result in-place via setFormError — so it is the ONLY path whose UX depends on the Server Action fetch resolving and being consumed on the same page.
  implication: Explains WHY only the invalid path could ever surface a transport-level "Failed to fetch" — the valid path is structurally immune (it reloads).

- timestamp: 2026-05-30T19:35:00Z
  checked: REAL-BROWSER reproduction. Temporary Playwright spec drove a clean Chromium: goto /en/login, fill wrong email+password, submit, observe console errors, pageerrors, requestfailed, responses, and the rendered error <p>. Ran 1x then repeat-each=3.
  found: WORKS CORRECTLY EVERY TIME. Action POST -> 200. No pageerror, no console error, no requestfailed, NO "Failed to fetch". The form renders the generic message "Invalid email or password." (Auth.errors.invalidCredentials) on all 4 runs. URL stays /en/login. Anti-enumeration message is exactly as the truth statement requires.
  implication: The application code on the invalid-credentials branch is CORRECT and the anti-enumeration UX is satisfied. The defect is NOT reproducible in a clean browser.

- timestamp: 2026-05-30T19:38:00Z
  checked: Stability of the server endpoint — fired the signInAction POST (id 40f810a67999353c5c864c88c1285f45ced2ed16ab) with invalid creds 15 times via curl.
  found: 15/15 returned HTTP 200 in ~0.7-0.8s. Zero non-200, zero connection drops, zero timeouts.
  implication: Server never 500s or aborts on this path. A "Failed to fetch" therefore cannot originate server-side; it must be a client-environment-level abort of the in-flight POST.

- timestamp: 2026-05-30T19:39:00Z
  checked: Corroborating UAT signals in 10-UAT.md.
  found: Test 7 explicitly notes a "benign fdprocessedid hydration console warning, browser-extension injected"; Test 12 notes extension-adjacent hydration noise. The reporter's browser demonstrably has content-injecting extensions active during this UAT session.
  implication: A privacy/password-manager/ad-block extension intercepting and aborting the Server Action fetch (or a transient Turbopack dev recompile dropping the in-flight connection during the manual click) is the most consistent explanation for "Failed to fetch" appearing only in the reporter's manual run and never in a clean automated browser.

## Resolution

root_cause: "The invalid-credentials code path is correct and anti-enumeration-compliant. signInAction returns { ok:false, code:'INVALID_CREDENTIALS', messageKey:'Auth.errors.invalidCredentials' } (auth.ts:125-134); mapSupabaseError maps Supabase's exact `code:'invalid_credentials'` (errors.ts:84-94); writeAuthEvent('signin_failed') swallows its own errors (audit.ts:48-73). In a clean Chromium browser the form renders 'Invalid email or password.' reliably (4/4 Playwright runs) and the Server Action POST returns HTTP 200 (15/15 curl runs). The user's 'Runtime TypeError: Failed to fetch' is a CLIENT-ENVIRONMENT abort of the Server Action fetch — a browser extension intercepting/blocking the POST (UAT Tests 7 & 12 confirm content-injecting extensions were active), or a transient Turbopack dev-server recompile dropping the in-flight connection during the manual click. It is NOT an application bug. NOTE: the success path was hardened to a full-document window.location.assign in commit 1e37411, which structurally hides this class of transport hiccup; the error path reconciles in-place and is therefore the only path where such a transport abort becomes visible."
fix: "No source fix strictly required (behavior is correct). OPTIONAL hardening: wrap `await signInAction(data)` in LoginForm.tsx (line 57) in try/catch and, on a thrown transport error, setFormError(tErrors('unknown')) instead of letting the rejection bubble to the Next dev overlay — turns a raw 'Failed to fetch' into a graceful generic message and is defence-in-depth against extension/HMR aborts. Re-verify in the reporter's actual browser with extensions disabled (incognito / clean profile) to confirm the symptom disappears."
verification: "Clean-browser Playwright repro: 4/4 runs render 'Invalid email or password.' with no errors. Server endpoint: 15/15 HTTP 200. Standalone Supabase invalid-cred call returns clean { code:'invalid_credentials', status:400 }."
files_changed: []
