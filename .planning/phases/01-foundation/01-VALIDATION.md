---
phase: 1
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-06
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | ESLint (primary automated check) — Jest/Vitest not required for Phase 1 (structural/config phase) |
| **Config file** | `eslint.config.mjs` — Wave 0 creates this |
| **Quick run command** | `npm run lint` |
| **Full suite command** | `npm run lint && npm run build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run lint`
- **After every plan wave:** Run `npm run lint && npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green + manual browser verification of all 5 success criteria in both `/en/` and `/ar/` at all three breakpoints
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 1-01-01 | 01 | 0 | FOUND-01 | — | N/A | Manual (browser) | — | N/A | ⬜ pending |
| 1-01-02 | 01 | 0 | FOUND-02 | — | No physical direction classes | ESLint | `npm run lint` | ❌ W0 | ⬜ pending |
| 1-01-03 | 01 | 0 | FOUND-03 | — | N/A | Manual (browser slow 3G) | — | N/A | ⬜ pending |
| 1-01-04 | 01 | 0 | FOUND-04 | — | N/A | Visual (manual) | — | N/A | ⬜ pending |
| 1-01-05 | 01 | 0 | FOUND-05 | — | N/A | Manual (DevTools responsive) | — | N/A | ⬜ pending |
| 1-01-06 | 01 | 0 | NAV-01 | T-1-01 | hasLocale() rejects invalid locale values | Manual (browser) + ESLint | `npm run lint` | ❌ W0 | ⬜ pending |
| 1-01-07 | 01 | 0 | NAV-02 | — | N/A | Visual (manual) | — | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `eslint.config.mjs` — `@next/eslint-plugin-next` (no-img-element) + `eslint-plugin-tailwindcss` (logical properties rule)
- [ ] `src/i18n/routing.ts` — `defineRouting` config (locales, defaultLocale, localePrefix)
- [ ] `src/i18n/request.ts` — `getRequestConfig` returning messages per locale
- [ ] `src/i18n/navigation.ts` — `createNavigation(routing)` exports
- [ ] `src/middleware.ts` — `createMiddleware(routing)` with matcher
- [ ] `messages/en.json` + `messages/ar.json` — translation files
- [ ] `src/types/domain.ts` — Product, CartItem, Locale, Direction types
- [ ] `src/lib/products.ts` — data access layer stub (empty)
- [ ] `src/data/products.ts` — static data stub (empty array)

*Note: No unit test framework needed for Phase 1. Primary validation is ESLint (catches physical class violations) + browser inspection (RTL layout, font rendering, responsive breakpoints).*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| `/ar/` URL renders Arabic locale with RTL layout | FOUND-01, FOUND-02 | CSS direction + font rendering not unit-testable | Open `/ar/` in browser; inspect `<html dir="rtl" lang="ar">`; confirm nav flows right-to-left |
| No FOUT on font load | FOUND-03 | Requires real browser font loading behavior | Open DevTools → Network tab → throttle to Slow 3G; reload; confirm no flash of unstyled text |
| PlaceholderImage renders at correct aspect ratios | FOUND-04 | CSS aspect-ratio requires visual inspection | Inspect elements at 3:4 and 4:5 slots; confirm no grey box, dark editorial background visible |
| Layout intact at 375px, 768px, 1280px+ | FOUND-05 | Responsive breakpoints require visual verification | Use DevTools Device Mode; test all three widths; confirm no horizontal overflow |
| Mobile nav drawer slides from inline-end (right EN, left AR) | NAV-01 | Direction-aware animation requires browser testing | Test in `/en/` (drawer from right) and `/ar/` (drawer from left) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
