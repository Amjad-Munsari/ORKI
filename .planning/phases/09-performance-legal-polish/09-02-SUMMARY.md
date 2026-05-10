---
phase: 09
plan: 02
subsystem: performance-legal-polish
tags: [legal, pdpl, gdpr, i18n, rsc, rtl, cookies, wave-2]
requires:
  - src/lib/seo.ts buildMetadata helper (Plan 09-01)
  - messages/{en,ar}.json Legal namespace skeleton (Plan 09-01)
  - src/app/[locale]/legal/layout.tsx pass-through layout (Plan 09-01)
provides:
  - src/components/legal/LegalArticle.tsx (shared chrome wrapper)
  - src/components/legal/CookieTable.tsx (strictly-necessary cookies table)
  - /[locale]/legal/privacy page (16 sections, generateMetadata, RSC)
  - /[locale]/legal/terms page (16 sections, generateMetadata, RSC)
  - /[locale]/legal/cookies page (7 sections + CookieTable, RSC)
  - Filled section bodies in messages/{en,ar}.json under Legal.{privacy,terms,cookies}.section{N}.body
affects:
  - Phase 9 wave 3+ plans (legal pages exist; sitemap and validation gates can target real URLs)
tech-stack:
  added: []
  patterns:
    - "Shared chrome component for legal pages (LegalArticle): Server Component with translations slot"
    - "Sectioned-content render pattern: const SECTIONS = [...] as const; SECTIONS.map(key => <section><h2/><p/></section>)"
    - "AR-LEGAL-REVIEW + USER-CONFIRM literal-token flags inside JSON body strings — greppable for pre-launch review"
key-files:
  created:
    - src/components/legal/LegalArticle.tsx
    - src/components/legal/CookieTable.tsx
    - src/app/[locale]/legal/privacy/page.tsx
    - src/app/[locale]/legal/terms/page.tsx
    - src/app/[locale]/legal/cookies/page.tsx
  modified:
    - messages/en.json
    - messages/ar.json
decisions:
  - "Last-updated date hard-coded '10 May 2026' per UI-SPEC §Copywriting Contract — same string in EN and AR display (Western numerals)"
  - "8 [USER-CONFIRM] markers retained in EN bodies (commercial registration ×2, Supabase region ×2, retention periods ×2, postal address ×2) — flagged for human review before publish"
  - "All 39 AR section bodies prefixed with literal '[AR-LEGAL-REVIEW] ' token — required by Pitfall 6 (formal Saudi legal-Arabic register pending native-speaker review)"
  - "Cookies page renders <CookieTable> after section2 body (UI-SPEC line 254-267 placement); section3 body explicitly enumerates 'no analytics cookies', 'no marketing cookies', 'no third-party trackers' (LGL-02 grep gate)"
metrics:
  duration: ~12 min
  completed: 2026-05-10
  tasks_total: 3
  tasks_completed: 3
  files_created: 5
  files_modified: 2
  commits: 3
requirements:
  - LGL-01
  - LGL-02
  - LGL-03
  - LGL-04
---

# Phase 9 Plan 02: Legal Pages — Privacy, Terms, Cookies Summary

Builds the three KSA-PDPL + GDPR-aligned legal pages (`/[locale]/legal/{privacy,terms,cookies}` in EN + AR — six URLs total), the shared `LegalArticle` chrome wrapper, and the `CookieTable` strictly-necessary cookies table. Replaces every `[DRAFT]` body placeholder in `messages/{en,ar}.json` with full PDPL+GDPR-aligned copy (16 sections each for Privacy and Terms; 7 for Cookies). Satisfies LGL-01 (Privacy page exists), LGL-02 (Cookie Policy exists, no banner needed), LGL-03 (Terms page exists), and LGL-04 (Privacy section 12 documents the controller-contact rights-exercise mechanism: email `privacy@orki.sa` with a 30-day SLA per PDPL Art. 11).

## Tasks Completed

| Task | Name | Commit | Files |
|---|---|---|---|
| 1 | LegalArticle + CookieTable shared components | `102368b` | `src/components/legal/LegalArticle.tsx`, `src/components/legal/CookieTable.tsx` |
| 2 | Fill Legal section bodies in EN + AR | `68da1af` | `messages/en.json`, `messages/ar.json` |
| 3 | Privacy / Terms / Cookies pages | `b7ae6f0` | `src/app/[locale]/legal/{privacy,terms,cookies}/page.tsx` |

## Verification Gates Passed

**Task 1 (component shape):**
- `LegalArticle` exports an async function, uses `max-w-[768px]`, renders `Legal.templateDisclaimer`.
- `CookieTable` exports an async function, uses logical padding `ps-4`/`pe-4` (no `pl-`/`pr-`), references `orkiSidName` and `sbAuthName`.
- `npx tsc --noEmit` is clean for both files.

**Task 2 (i18n bodies):**
- 0 `[DRAFT]` bodies remain in EN; all 39 AR section bodies are prefixed with the literal token `[AR-LEGAL-REVIEW] `.
- `Legal.cookies.section3.body` (EN) contains all three required substrings: `no analytics cookies`, `no marketing cookies`, `no third-party trackers` (LGL-02 grep gate).
- `Legal.terms.section8.body` (EN) contains the literal `14` (returns-period reconciliation).
- `Legal.privacy.section12.body` AND `Legal.privacy.section16.body` (EN) both contain `privacy@orki.sa` (LGL-04 mechanism).
- `Legal.privacy.section11.body` enumerates the six PDPL/GDPR rights: access, rectification, erasure, restriction, portability, objection.
- Both JSON files parse cleanly: `node -e "require('./messages/en.json'); require('./messages/ar.json')"` exits 0.

**Task 3 (pages):**
- All three pages call `buildMetadata({ path: '/legal/<name>', ... })` and have `generateMetadata` exports.
- All three pages use `<LegalArticle>` chrome.
- Cookies page renders `<CookieTable />` exactly once (after section2).
- No `'use client'` directive on any of the three pages.
- `npx tsc --noEmit` clean for all five new files plus the two modified i18n bundles.
- Section count derived from i18n keys: privacy=16, terms=16, cookies=7 (matches success criteria — verified via Object.keys filter).

## Pre-launch Follow-up Required

### `[USER-CONFIRM]` flags (8 occurrences in EN, mirrored in AR)

| Location | What needs human confirmation |
|---|---|
| `Legal.privacy.section1.body` | Commercial registration / company name (controller identification) |
| `Legal.privacy.section5.body` | Supabase Postgres hosting region |
| `Legal.privacy.section8.body` | Supabase region for international-transfer disclosure |
| `Legal.privacy.section9.body` | Order retention period (5 years assumed for KSA tax) |
| `Legal.privacy.section9.body` | Email correspondence retention period (18 months assumed) |
| `Legal.privacy.section16.body` | Postal address |
| `Legal.terms.section2.body` | Commercial registration |
| `Legal.terms.section16.body` | Postal address |

These were intentionally kept inline (not extracted to a config file) so a `grep -r "USER-CONFIRM"` pre-launch sweep surfaces them all at once with full context. They mirror into AR after the `[AR-LEGAL-REVIEW]` prefix.

### `[AR-LEGAL-REVIEW]` flags

All 39 AR section bodies (16 privacy + 16 terms + 7 cookies) are prefixed with the literal token `[AR-LEGAL-REVIEW] `. Per Pitfall 6, the AR copy was drafted in formal Saudi legal Arabic register (using `الشركة` / `أوركي` for the controller, `صاحب البيانات` / `المستخدم` for the user, avoiding colloquial constructions) but still requires native-speaker legal review before publish. Removing the prefix from a section signals that section has been finalized.

### Controller email

The plan uses `privacy@orki.sa` as the controller-contact placeholder per `<threat_model>` row T-09-02-01 mitigation: a generic role-based address. Verify the inbox is provisioned, monitored with a 30-day SLA, and that DKIM/SPF for the `orki.sa` domain are correct before publish.

## Reconciliations Confirmed

- **Returns policy**: `Legal.terms.section8.body` (EN) states "within 14 days of delivery for a full refund" and "Refunds are issued ... within 14 days of our receipt and inspection" — consistent with the sitewide reconciliation Plan 09-01 made (`Checkout.trust.returnsPolicy`, footer benefit-bar, `PDPInfoPanel`, `Shop.returnPolicy`). Cart-cookie max-age (30 days) remains intentionally separate and is documented as the cookie lifetime in the Cookie Policy table — not as a returns window.

- **Cookies vs. analytics**: `Legal.cookies.section4.body` explicitly classifies Vercel Analytics + Speed Insights as cookieless beacons and cites the PDPL strictly-necessary exemption — consistent with LGL-02's "Cookie Policy doc, no banner" decision.

- **`<CookieTable>` row values**: `orki_sid` 30 days / `sb-*` Session — match the actual cart-cookie max-age set in `src/lib/cart/session.ts:17` (`COOKIE_MAX_AGE = 60 * 60 * 24 * 30`) and the Supabase auth cookie convention (T-09-02-06 mitigation).

## Deviations from Plan

### Auto-fixed Issues

None. All three tasks executed exactly as written in the plan.

### Process Note (not a code deviation)

When initially writing `LegalArticle.tsx` and `CookieTable.tsx`, the `Write` tool resolved the absolute path against the parent ORKI repo (`C:/dev/Antigravity/ORKI/src/components/legal/`) instead of the worktree (`.claude/worktrees/agent-a7bf6dc7fd7dbdde4/src/components/legal/`). This was caught immediately by the next verification step and the files were moved to the correct worktree location before any commit was made. The parent repo's working tree was confirmed clean afterward (no straggler files, no untracked changes outside `.claude/worktrees/`). Subsequent files were written using fully-qualified worktree paths and the issue did not recur.

## Out-of-scope Discoveries (logged, not fixed)

None new in this plan. The pre-existing items already logged in `.planning/phases/09-performance-legal-polish/deferred-items.md` by Plan 09-01 (Phase 8 `PaymentMethod` literal-union mismatch in `checkout/page.tsx`; test-fixture drift) remain out of scope and were not touched.

## Threat-Model Mitigations Applied

| Threat ID | Mitigation realized in this plan |
|---|---|
| T-09-02-01 (controller email IDOR/PII) | Email is the role-based `privacy@orki.sa` and is flagged as `[USER-CONFIRM]`-adjacent for inbox provisioning before publish |
| T-09-02-02 (retention periods) | Both retention values (5y, 18mo) carry inline `[USER-CONFIRM]` markers in EN and AR |
| T-09-02-03 (stored XSS) | All section bodies are static JSON; React text-node escaping applies; no `t.rich()` with user-supplied components used |
| T-09-02-04 (AR copy quality) | All 39 AR section bodies prefixed `[AR-LEGAL-REVIEW]`; LegalArticle footer renders `Legal.templateDisclaimer` on every legal page |
| T-09-02-05 (LegalArticle prop injection) | Props typed `eyebrow/heading/lastUpdated: string`, `locale: Locale`, `children: ReactNode`; no `dangerouslySetInnerHTML` and no element rendering from prop |
| T-09-02-06 (CookieTable row drift) | Hard-coded values (`30 days`, `Session`) match `src/lib/cart/session.ts:17` constant and Supabase auth convention; manual DevTools audit step is in VALIDATION |

## Self-Check: PASSED

**Files exist (worktree paths, all relative to `.claude/worktrees/agent-a7bf6dc7fd7dbdde4/`):**
- FOUND: `src/components/legal/LegalArticle.tsx`
- FOUND: `src/components/legal/CookieTable.tsx`
- FOUND: `src/app/[locale]/legal/privacy/page.tsx`
- FOUND: `src/app/[locale]/legal/terms/page.tsx`
- FOUND: `src/app/[locale]/legal/cookies/page.tsx`
- FOUND: `messages/en.json` (modified — Legal bodies filled)
- FOUND: `messages/ar.json` (modified — Legal bodies filled with [AR-LEGAL-REVIEW] prefix)

**Commits exist on `worktree-agent-a7bf6dc7fd7dbdde4`:**
- FOUND: `102368b` feat(09-02): add LegalArticle + CookieTable shared components
- FOUND: `68da1af` feat(09-02): fill Legal section bodies in EN + AR
- FOUND: `b7ae6f0` feat(09-02): add privacy, terms, cookies legal pages

**Files modified scope check:**
- All commits stayed strictly within the plan's `files_modified` declaration. No files outside that list were touched.

**Verification gates:**
- Task 1 verify gate: PASS (`Task 1 verify: true`).
- Task 2 verify gate: PASS (`Task 2 verify: true`); LGL-04 acceptance: PASS (s12 + s16 contain `privacy@orki.sa`); JSON parse: PASS.
- Task 3 verify gate: PASS (`Task 3 verify: true`); section counts match (16/16/7); `npx tsc --noEmit` clean for plan files.

**Out-of-scope guard:**
- `git diff --diff-filter=D --name-only HEAD~3 HEAD` returns empty — no files deleted across the three plan commits.
- `git status --short` returns empty after final commit — no untracked or unstaged files remain in the worktree.
