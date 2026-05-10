---
phase: 9
slug: performance-legal-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-05-10
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.
> **Source of truth:** `09-RESEARCH.md` § Validation Architecture (lines 1051-1102).
> Planner MUST translate every row in the per-task map below into `<automated>` blocks
> on the corresponding tasks, or declare a Wave 0 gap.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.x (already configured per `package.json:test`) |
| **Config file** | (default config — no `vitest.config.ts` at repo root; verify in Wave 0) |
| **Quick run command** | `npm test` (alias for `vitest run --passWithNoTests`) |
| **Full suite command** | `npm test` |
| **Network smoke command** | `npm run dev` then `curl`/`grep` against `localhost:3000` |
| **Estimated runtime** | ~5–10 s for unit; ~30 s for full smoke battery (after `npm run dev` warm-up) |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test` + full smoke battery (curl + grep against `localhost:3000`)
- **Before `/gsd-verify-work`:** Full smoke battery + manual verification of Vercel Analytics and Speed Insights dashboards (24h post-deploy)
- **Max feedback latency:** ~10 s (unit) / ~30 s (smoke)

---

## Per-Task Verification Map

> Plans cover four sub-domains (Legal / Analytics+SI / Sitemap+robots+metadata / Reliability hygiene)
> after a foundation Wave 0 (route folder + i18n namespace + footer href migration + `seo.ts` helper).
> Task IDs below are placeholders — the planner assigns final `{padded_phase}-{plan}-{task}` IDs.

| Req ID | Behavior | Test Type | Automated Command | File Exists | Status |
|--------|----------|-----------|-------------------|-------------|--------|
| LGL-01 | Privacy Policy renders 200 in EN + AR with full section list | smoke | `curl -sI http://localhost:3000/en/legal/privacy \| grep -E '^HTTP/.* 200'` and same for `/ar/legal/privacy`; then `curl -s http://localhost:3000/en/legal/privacy \| grep -c '<h2'` ≥ 16 | ❌ W0 | ⬜ pending |
| LGL-02 | Cookie Policy enumerates `orki_sid` + Supabase auth cookies; declares no analytics/marketing cookies | smoke | `curl -s http://localhost:3000/en/legal/cookies \| grep -E 'orki_sid\|no analytics'` returns ≥ 2 matches | ❌ W0 | ⬜ pending |
| LGL-02 | `<CookieBanner>` exists as scaffold but is NOT rendered in any layout | grep | `grep -r 'import.*CookieBanner' src/app/` returns 0 lines | ❌ W0 | ⬜ pending |
| LGL-03 | Terms & Conditions renders 200 in EN + AR | smoke | `curl -sI http://localhost:3000/en/legal/terms \| grep -E '^HTTP/.* 200'` and same for `/ar/legal/terms` | ❌ W0 | ⬜ pending |
| LGL-04 | Privacy Policy includes user rights + contact email mechanism | grep | `grep -E 'rights\|contact' messages/en.json \| wc -l` ≥ 2 (Legal.privacy section11/12/16) | ❌ W0 | ⬜ pending |
| PERF-03 | Speed Insights mounted in `[locale]/layout.tsx` | grep | `grep -c '<SpeedInsights' src/app/\[locale\]/layout.tsx` = 1 | ✅ | ⬜ pending |
| PERF-03 | LCP < 2.5s observed in Vercel Speed Insights dashboard 24h post-deploy | manual-only | (manual: visit Vercel dashboard) | ✅ | ⬜ pending |
| PERF-04 | `<Analytics />` mounted in `[locale]/layout.tsx` | grep | `grep -c '<Analytics' src/app/\[locale\]/layout.tsx` = 1 | ✅ | ⬜ pending |
| PERF-04 | First 3-4 catalog cards have `priority` | grep | `grep -E 'priority=\\{i\\s*<\\s*4\\}' src/components/shop/ProductGrid.tsx` returns ≥ 1 | ✅ | ⬜ pending |
| PERF-04 | PDP hero image has `priority` | grep | `grep -E 'priority' src/components/pdp/PDPGallery.tsx` returns ≥ 1 | ✅ | ⬜ pending |
| PERF-05 | `app/global-error.tsx` exists (canonical Next.js 15 name — NOT `app/error.tsx`) | file | `test -f src/app/global-error.tsx && echo OK` returns OK | ❌ W0 | ⬜ pending |
| PERF-05 | `app/[locale]/error.tsx` exists | file | `test -f src/app/\\[locale\\]/error.tsx && echo OK` returns OK | ❌ W0 | ⬜ pending |
| PERF-05 | `app/[locale]/not-found.tsx` exists | file | `test -f src/app/\\[locale\\]/not-found.tsx && echo OK` returns OK | ❌ W0 | ⬜ pending |
| PERF-05 | `/shop` server page wraps DB read in try/catch | grep | `grep -E 'try\\s*\\{' src/app/\[locale\]/shop/page.tsx` returns ≥ 1 | ✅ | ⬜ pending |
| PERF-06 | `.planning/codebase/data-access-pattern.md` doc exists | file | `test -f .planning/codebase/data-access-pattern.md && echo OK` | ❌ W0 | ⬜ pending |
| PERF-06 | Drizzle logger gated on `NODE_ENV` | grep | `grep -E "logger:.*NODE_ENV" src/lib/db/client.ts` returns 1 match | ✅ | ⬜ pending |
| SEO-02 | `sitemap.xml` returns 200 with > 0 `<url>` entries | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -c '<url>'` > 0 | ❌ W0 | ⬜ pending |
| SEO-02 | Sitemap entries include hreflang link alternates | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -c 'hreflang='` > 0 | ❌ W0 | ⬜ pending |
| SEO-02 | Sitemap contains both `/en/` and `/ar/` URLs | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -cE '/en/\|/ar/'` ≥ 18 (9 static × 2 + N products × 2) | ❌ W0 | ⬜ pending |
| SEO-02 | Sitemap excludes admin URLs | smoke | `curl -s http://localhost:3000/sitemap.xml \| grep -c '/admin'` = 0 | ❌ W0 | ⬜ pending |
| SEO-03 | Per-page `metaTitle` ≤ 60 chars | manual-only | inspection during code review of `messages/*.json` Legal.* metaTitle entries | ❌ W0 | ⬜ pending |
| SEO-03 | Per-page `metaDescription` ≤ 160 chars | manual-only | inspection of `messages/*.json` Legal.* metaDescription entries | ❌ W0 | ⬜ pending |
| SEO-03 | Each route's title is unique | grep | `grep -oE '"metaTitle":\\s*"[^"]+"' messages/en.json \| sort \| uniq -d \| wc -l` = 0 | ❌ W0 | ⬜ pending |
| SEO-03 (robots) | `robots.txt` returns 200 with admin disallow | smoke | `curl -s http://localhost:3000/robots.txt \| grep -E 'Disallow.*admin'` returns ≥ 2 | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Verify `vitest.config.ts` exists (or document that default config is sufficient)
- [ ] Create `src/lib/seo.ts` — `buildMetadata({ titleKey, descriptionKey, locale, path })` helper
- [ ] Add `Legal.*` namespace skeleton to `messages/en.json` and `messages/ar.json`
- [ ] Reconcile `app/global-error.tsx` vs UI-SPEC's `app/error.tsx` (research recommends `global-error.tsx`)
- [ ] Confirm Wave 0 gaps from research § Wave 0 Gaps (lines 1097-1101)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| LCP < 2.5s on Saudi networks (RUM) | PERF-03 | Real-user Speed Insights data only meaningful 24h+ post-deploy | Open Vercel dashboard → Speed Insights tab → confirm p75 LCP < 2500 ms after a day of traffic |
| Cookie Policy enumerates the *current* set of cookies | LGL-02 | Cookies set by Supabase/Vercel/our app may evolve; an automated check would over-fit | Open DevTools → Application → Cookies on home, shop, PDP, checkout — diff against the policy table |
| Per-page `metaTitle` ≤ 60 chars and `metaDescription` ≤ 160 chars | SEO-03 | Char-counting JSON entries reliably is fragile under varied keys; faster as a pre-merge inspection | Eyeball `messages/{en,ar}.json` Legal namespace during code review; reject any entry exceeding the limit |
| AR legal register reads as formal Arabic legal language | LGL-01..03 | Cannot be machine-checked; needs native speaker | Native-speaker editor pass before publish, OR ship with `[AR-LEGAL-REVIEW]` flag and a "template" footer disclaimer |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references (vitest config, seo.ts helper, Legal i18n skeleton, global-error path reconciliation)
- [ ] No watch-mode flags (`vitest run`, not `vitest`)
- [ ] Feedback latency < 30 s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
