# ADR-002: Auth Provider — Supabase Auth (Phase 10)

**Date:** 2026-05-10
**Status:** Accepted (deferred implementation)
**Implementation phase:** Phase 10 (Authentication & Security Core)
**Related:** ADR-001 (database provider)

## Context

Phase 10 of the v2.0 milestone covers Authentication & Security Core (SEC-01..09): user registration, login via httpOnly cookies, generic-error login failures with lockout, server-side validation, security headers, CSRF.

Original assumption (set in Phase 5/6 context): build auth from scratch — bcrypt hashing, JWT or session-table-based sessions, password-reset email flow, custom rate limiting. Estimate: ~5 days.

ADR-001 made Supabase the database platform. Supabase ships a first-class Auth product (`@supabase/ssr` + `supabase-js`) that covers ~80% of this scope out of the box.

## Decision

**Phase 10 will use Supabase Auth, not a custom auth implementation.**

Specifically:

1. **Sessions:** Supabase Auth via `@supabase/ssr` cookie-based session helpers for Next.js App Router.
2. **Email/password:** built-in. Includes signup confirmation, password reset, email change.
3. **Rate limiting / lockout:** Supabase has per-IP rate limits configurable in the dashboard. SEC-02 ("locks after repeated failures") satisfied by default thresholds (configurable).
4. **Generic error messages (SEC-02):** Supabase already returns generic "invalid credentials" without leaking which of `email`/`password` was wrong.
5. **Drizzle continues to own application data.** Auth tables live in the `auth.*` schema (Supabase-managed). Application tables live in `public.*` (Drizzle-managed). Cross-schema FKs use `auth.users.id` from the application side — typed manually in Drizzle since Drizzle doesn't introspect the `auth` schema.
6. **`carts.userId` and `orders.userId` (added in Phase 8 schema)** become FKs to `auth.users(id)` once Supabase Auth is on. Until Phase 10 ships, those columns stay nullable and unconstrained — guest-first stays the default.

## What this changes vs. the original Phase 10 plan

| Concern | Original | With Supabase Auth |
|---|---|---|
| Password storage | bcrypt + custom users table | Built-in (auth.users) |
| Session storage | httpOnly cookie + sessions table OR JWT | Built-in (`@supabase/ssr` cookie) |
| Password reset email | Custom Resend template + token table | Built-in (Supabase sends; templates customizable) |
| Lockout | Custom counter + Redis or DB | Built-in rate limits |
| CSRF | Custom token issue/verify | SameSite cookie + Supabase's PKCE flow |
| Magic links / OAuth (later) | Build from scratch | Built-in toggles |
| Estimated Phase 10 cost | ~5 days | ~2 days (mostly UI + Drizzle joins to auth.users) |

## What does NOT change

- **API security headers (SEC-03/06/07).** Still custom — set in `next.config.ts` and route handlers. Supabase Auth doesn't cover these.
- **Server-side input validation (SEC-05).** Still zod schemas, owned per-route. Independent of auth provider.
- **Authorization logic.** What a logged-in user can DO is application logic. Implemented in Server Actions + RLS policies.
- **Transactional emails (ECOM-03, owned by Phase 8).** Still Resend for order-related emails. Supabase only sends auth-related emails (confirmation, reset).

## Consequences

### Positive
- Phase 10 estimate halves. SEC-01..04 mostly become "wire up `@supabase/ssr`."
- Magic links / OAuth providers (Apple, Google) become free toggles, opening Phase 11+ options.
- RLS policies on the existing schema become straightforward — Supabase Auth attaches the user JWT to every request automatically.
- Password-reset flow becomes free; we only have to style the email template.

### Negative
- Phase 10 plans (not yet written) need to be authored against this decision rather than custom-auth assumptions. No drift cost yet because Phase 10 is deferred.
- Auth schema lives outside Drizzle's introspection. Cross-schema FKs to `auth.users(id)` need manual typing.
- Adds one more dependency on Supabase as a platform (already accepted in ADR-001).

### Neutral
- Phase 8 explicitly stays guest-first (nullable `userId`). When Phase 10 ships, the ALTER to add the `auth.users` FK is additive, not breaking.

## Verification deferred

This ADR is a forward-looking decision. Verification happens when Phase 10 plans are authored:
1. Phase 10 plans must reference `@supabase/ssr` and `supabase-js`, not bcrypt + custom session table.
2. Phase 10 plans must not duplicate functionality already in Supabase Auth (lockout, password reset, generic errors).
3. Phase 10 plans must add the `carts.userId → auth.users.id` and `orders.userId → auth.users.id` FK constraints.

## References
- ADR-001: Database provider
- Phase 10 (deferred): `.planning/ROADMAP.md` § "Phase 10: Authentication & Security Core (DEFERRED)"
- Supabase Auth docs: `https://supabase.com/docs/guides/auth/server-side/nextjs`
