---
phase: 10
phase_name: Authentication & Security Core
discussed: 2026-05-10
mode: discuss (default)
---

# Phase 10 Discussion Log

Human-readable record of the gray areas surfaced and how each was decided. Not consumed by downstream agents — they read `10-CONTEXT.md`.

## Areas Selected (multi-select)

All four presented gray areas were answered.

## Q1 — Auth methods scope

**Options presented:**
1. Email + password only
2. Email + password + Google
3. Email + password + Google + Apple
4. Email + password + magic link

**User selection:** Email + password only

**Note:** OAuth (Google, Apple) and magic link explicitly deferred to a later phase.

## Q2 — First sign-in flow (email confirmation + guest cart merge)

**Options presented:**
1. Email confirm required + merge cart
2. Auto-confirm + merge cart
3. Email confirm required + replace cart
4. Auto-confirm + no merge yet

**User selection (verbatim):** "I don't think we need to confirm emails."

**Interpretation + Claude's discretion:**
- Email confirmation: not required (matches user direction explicitly).
- Guest cart merge: user did not pick. Claude defaulted to **merge** (option 2 / 4 split → merge), justified by:
  - Mirrors the `migrateLocalCartAction` precedent landed in Phase 8 for the localStorage→DB migration.
  - Best UX preservation when a guest adds items then signs up.
  - Logic is bounded (one-shot at first authenticated request; user-cart wins if both exist).

## Q3 — Account area scope (`/[locale]/account`)

**Options presented:**
1. Minimum: orders + sign-out
2. Orders + saved addresses
3. Orders + addresses + profile (name/phone/email change)
4. Defer entirely — just login/signout in nav

**User selection (verbatim):** "you decide."

**Claude's discretion:** Minimum (option 1) — orders + sign-out. Justified by:
- Phase title is "Authentication & Security Core" — account dashboard expansion is a UX phase, not a security phase.
- Order detail page already exists for guests (reference-keyed). Reuse with RLS gating.
- Address book / profile editing tracked as deferred ideas for a later UX phase.

## Q4 — Admin MFA timing (SEC-08)

**Options presented:**
1. Phase 10 — Supabase TOTP for admin role
2. Phase 10 — admin only via allowlist + IP restriction
3. Defer MFA to a Phase 11 hardening pass
4. Phase 10 — TOTP optional, allowlist required

**User selection (verbatim):** "you decide"

**Claude's discretion:** Option 4 — TOTP optional, allowlist required. Justified by:
- SEC-08 wording is "MFA and IP-restricted **where possible**". Allowlist + opt-in TOTP = a defensible "where possible" interpretation.
- Doesn't block solo-admin onboarding (no TOTP enrollment friction on day one).
- Hard-enforce TOTP and IP restriction tracked as deferred for a Phase 11 hardening pass.

## Deferred Ideas Captured

- OAuth providers (Google, Apple) → Phase 11 social-login expansion.
- Magic-link passwordless sign-in.
- Address book + profile editing in `/account`.
- Hard-enforced TOTP MFA for admin.
- Vercel-edge IP allowlisting for `/admin`.
- Threshold-based alerting on `auth_events`.
- CSP nonce per-route plumbing.
- Application-level rate limiting on cart/checkout.
- Account-deletion UX (FK uses `ON DELETE SET NULL`; UI deferred).

## Scope Creep Avoided

None during this discussion. All four answers stayed within phase boundary.

## Risks Surfaced for Researcher

Five open questions documented in `10-CONTEXT.md` § "Risks / Open Questions for Researcher" — including `carts.userId` text→uuid migration choice, Supabase rate-limit defaults, Next.js 15 Server Action same-origin enforcement details, exact CSP allowlist, and RLS interaction with the service-role key.

---

_End of discussion log._
