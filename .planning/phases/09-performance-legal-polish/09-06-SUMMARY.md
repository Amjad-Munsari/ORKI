---
phase: 09-performance-legal-polish
plan: 06
subsystem: legal-cookie-scaffold
tags: [cookie-consent, future-proofing, scaffold, i18n, rtl, tailwind-v4]
requires:
  - "messages/en.json::CookieBanner namespace (delivered by Plan 09-01)"
  - "messages/ar.json::CookieBanner namespace (delivered by Plan 09-01)"
  - "src/i18n/navigation.ts::Link export"
provides:
  - "src/lib/cookie-consent.ts::readCookieConsent / writeCookieConsent / hasCookieConsent / ConsentValue"
  - "src/components/CookieBanner.tsx::CookieBanner (future-proofing scaffold, NOT mounted)"
affects: []
tech-stack:
  added: []
  patterns:
    - "Client-safe cookie helper with SSR guards (typeof document === 'undefined')"
    - "Future-proofing scaffold pattern — component built and type-checked but deliberately unmounted"
    - "next-intl translations consumed inside a 'use client' component via useTranslations namespace"
    - "Logical CSS RTL: inline-end-0 + symmetric p-6 m-6 (Tailwind v4 logical-CSS-safe)"
key-files:
  created:
    - "src/lib/cookie-consent.ts"
    - "src/components/CookieBanner.tsx"
  modified:
    - ".planning/phases/09-performance-legal-polish/deferred-items.md (appended pre-existing build env note)"
decisions:
  - "Banner is built but NOT imported anywhere — VALIDATION LGL-02 'no banner this phase' assertion passes"
  - "Symmetric Tailwind utilities (p-6, m-6) are logical-CSS-safe in v4 — recorded as JSDoc rationale per Issue #7 cosmetic note"
  - "Cookie helper is client-safe (no 'server-only' import); SSR-safe via typeof document guards so it's import-safe in server contexts"
  - "Cookie attributes hard-coded to SameSite=Lax, path=/, 365-day expiry per RESEARCH.md and STRIDE T-09-06-03 disposition"
metrics:
  duration: "~5 min"
  completed: "2026-05-10"
  tasks: 2
  files: 2
---

# Phase 9 Plan 06: Cookie Consent Scaffold Summary

**One-liner:** Future-proofing cookie-consent scaffold (helper + banner) — both files type-check cleanly, banner is deliberately NOT mounted in any layout this phase per CONTEXT §2 / VALIDATION LGL-02.

## Objective Delivered

LGL-02 future-proofing: the codebase now contains a working `CookieBanner` component and a typed `cookie_consent` helper module. When (and if) GA4 / Meta Pixel / retargeting cookies are added in a future phase, mounting becomes a one-line `<CookieBanner locale={locale} />` insert in `src/app/[locale]/layout.tsx`. Today, no analytics cookies are set, so the banner is intentionally absent from the rendered tree.

## Files Created

### 1. `src/lib/cookie-consent.ts` (28 lines)

API surface (locked):

| Export                | Signature                                                | Purpose                                                                         |
| --------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| `ConsentValue`        | `'accepted' \| 'rejected' \| 'pending'`                  | Type union for consent state                                                    |
| `readCookieConsent()` | `() => ConsentValue`                                     | Reads `cookie_consent` cookie; returns `'pending'` when absent or unrecognized  |
| `writeCookieConsent()`| `(value: 'accepted' \| 'rejected') => void`              | Writes cookie with 365-day expiry, `SameSite=Lax`, `path=/`                     |
| `hasCookieConsent()`  | `() => boolean`                                          | Convenience predicate — true when value is `'accepted'` or `'rejected'`         |

- Cookie name: literal `cookie_consent`
- SSR-safe: both read/write functions guard with `typeof document === 'undefined'`
- Client-safe: no `'server-only'` import; can be imported anywhere

### 2. `src/components/CookieBanner.tsx` (60 lines)

- `'use client'` directive at top — required for `useState`/`useEffect` and `document.cookie` access
- `useTranslations('CookieBanner')` — pulls `body`, `primaryCta`, `secondaryLink` from the namespace delivered by Plan 09-01 in both `messages/en.json` and `messages/ar.json`
- `<Link>` from `@/i18n/navigation` to `/legal/cookies` — locale prefix automatic
- `useEffect` reads consent on mount; component renders `null` if `readCookieConsent() !== 'pending'`
- "Got it" button writes `'accepted'` and hides the banner
- Outer container has `role="region"` + `aria-label="Cookie consent"` for screen-reader landmark
- Positioning: `fixed bottom-0 inline-end-0 z-50` — RTL flips automatically via logical CSS
- Symmetric utilities `p-6 m-6` documented as logical-CSS-safe in JSDoc (Issue #7 cosmetic note)

## Issue #7 Rationale (Recorded in Source)

The JSDoc above the `CookieBanner` function explicitly documents that the symmetric Tailwind v4 utilities `p-6` and `m-6` apply equal padding/margin to both inline-start and inline-end edges, making them RTL-safe without needing `ps-`/`pe-`/`ms-`/`me-` variants. CLAUDE.md's RTL prohibition targets DIRECTIONAL utilities (`pl-`, `pr-`, `ml-`, `mr-`); symmetric variants are unaffected. Future readers reviewing the file will not flag this as a CLAUDE.md violation.

## VALIDATION — No Banner This Phase

Critical assertion (LGL-02 row in VALIDATION):

```bash
$ grep -r 'import.*CookieBanner' src/app/
$ echo $?
1
```

Zero matches in `src/app/` — banner is built but unmounted. A bonus check confirmed zero imports anywhere in `src/`, so the component is fully tree-shakeable and absent from the production bundle (per STRIDE T-09-06-02 disposition).

## Future-Flip Readiness

To enable the banner in a future phase, the only change required is one line inside `src/app/[locale]/layout.tsx`:

```tsx
import { CookieBanner } from '@/components/CookieBanner';
// ...
<CookieBanner locale={locale} />
```

Plus a copy update to `src/app/[locale]/legal/cookies/page.tsx` section 3 to swap "We do not use" → "We use" (per STRIDE T-09-06-05 mitigation requirement).

## Verification Results

| Check                                                       | Result          |
| ----------------------------------------------------------- | --------------- |
| `test -f src/lib/cookie-consent.ts`                         | OK              |
| `test -f src/components/CookieBanner.tsx`                   | OK              |
| Task 1 automated regex (helper API surface present)         | PASS            |
| Task 2 automated regex (use client, useTranslations, no directional classes) | PASS  |
| `grep -r 'import.*CookieBanner' src/app/`                   | 0 matches (LGL-02 PASS) |
| `grep -r 'import.*CookieBanner' src/` (informational)       | 0 matches (fully unmounted) |
| `npx tsc --noEmit` errors in `cookie-consent.ts`            | 0               |
| `npx tsc --noEmit` errors in `CookieBanner.tsx`             | 0               |
| `npm run build`                                             | Halts in pre-existing `src/lib/env.ts` env validation (unrelated to this plan — see Deferred Issues) |

## Deviations from Plan

None — plan executed exactly as written. Both tasks copied verbatim from RESEARCH.md / PATTERNS.md sources cited in the plan.

## Deferred Issues

- **`npm run build` env-var gate (pre-existing).** The production build halts at `src/lib/env.ts:44` requiring `STORAGE_URL` or `DATABASE_URL`. This is pre-existing infrastructure from Phase 8 (data layer) and is not introduced or modified by Plan 09-06. The two new files type-check cleanly under `npx tsc --noEmit` (zero errors in either file path). Logged in `deferred-items.md` under "Pre-existing build-time env validation".
- **Pre-existing `tests/**` and `vitest.config.ts` tsc errors (already documented).** Untouched, out of scope per Plan 09-01 deferred-items entry.

## Threat Flags

None. The two new files surface only client-side `document.cookie` reads/writes; both behaviors are explicitly modelled in the plan's STRIDE register (T-09-06-01 through T-09-06-05) and accepted/mitigated as scoped.

## Commits

| Task | Description                                                | Hash      | Files                                      |
| ---- | ---------------------------------------------------------- | --------- | ------------------------------------------ |
| 1    | feat(09-06): add cookie-consent helper module              | `9c5de0f` | `src/lib/cookie-consent.ts`                |
| 2    | feat(09-06): add CookieBanner future-proofing scaffold (NOT mounted) | `43fc1cc` | `src/components/CookieBanner.tsx`          |

## Self-Check: PASSED

- `src/lib/cookie-consent.ts`: FOUND
- `src/components/CookieBanner.tsx`: FOUND
- Commit `9c5de0f`: FOUND in `git log`
- Commit `43fc1cc`: FOUND in `git log`
- Banner import in `src/app/`: 0 matches (LGL-02 confirmed)
- STATE.md / ROADMAP.md modified: NO (orchestrator owns those writes)
