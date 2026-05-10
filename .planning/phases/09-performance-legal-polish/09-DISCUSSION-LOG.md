# Phase 9 Discussion Log

**Date:** 2026-05-10
**Mode:** discuss (default)
**Areas selected:** all 4 (Legal + cookies, Analytics + perf, Sitemap + metadata, Reliability)

Human-readable audit trail. NOT consumed by downstream agents (researcher / planner / executor read CONTEXT.md instead).

---

## Area 1 — Legal content + cookie consent

### Q1.1 — Legal copy sourcing
**Options presented:** AI-drafts KSA-PDPL/GDPR templates / User provides final copy / Vendor-hosted (Termly/Iubenda) / Skeleton + lorem ipsum
**User choice:** AI-drafts KSA-PDPL/GDPR templates ("might change later")
**Notes:** Marked revisable in CONTEXT.md decisions.

### Q1.2 — Language coverage
**Options presented:** EN+AR together / EN now + AR follow-up / EN only
**User choice:** Both EN + AR ship together
**Notes:** Consistent with project AR-first-class rule. Formal AR legal register required.

### Q1.3 — Cookie consent banner
**Options presented (initial):** No banner / Single accept-reject / Per-category / Vendor (Cookiebot/Iubenda)
**User asked for clarification first.** Claude recommended "No banner — cookieless analytics only" with reasoning: no GA4/pixel in scope, all current cookies strictly necessary, banner would clash with brand, future-proofing cost is tiny.
**Re-presented:** No banner (Recommended) / Single accept-reject / No banner AND no scaffold
**User choice:** No banner, cookieless analytics
**Notes:** Implicitly locks Vercel Analytics for Area 2. Hidden `<CookieBanner>` component scaffolded for future use.

---

## Area 2 — Analytics + performance measurement

(Analytics provider already implicitly locked to Vercel Analytics + Speed Insights from Area 1 cookie decision — not re-asked.)

### Q2.1 — Performance gating
**Options presented:** Real-user only (Recommended) / Lighthouse CI + Speed Insights / Lighthouse CI warn-only + Speed Insights / Manual Lighthouse pre-release
**User choice:** Real-user only (Vercel Speed Insights)
**Notes:** Lighthouse CI added to deferred ideas — revisit after first measured regression.

### Q2.2 — Image-loading strategy
**Options presented:** Above-fold priority + below lazy (Recommended) / Everything eager / Everything lazy / Aggressive (blur+AVIF)
**User choice:** Above-fold priority + below lazy
**Notes:** Blur placeholders + forced AVIF deferred — would touch Phase 6 admin upload.

---

## Area 3 — Sitemap + per-page metadata

### Q3.1 — Sitemap shape
**Options presented:** Bilingual + hreflang dynamic (Recommended) / Bilingual no hreflang / EN only / Static at build
**User choice:** Bilingual + hreflang, dynamic from DB
**Notes:** `revalidate = 3600`. Excludes admin and checkout routes.

### Q3.2 — Metadata convention
**Options presented:** `{Page} | ORKI` (Recommended) / `ORKI — {Page}` / Custom per page
**User choice:** `{Page} | ORKI` + branded OG fallback
**Notes:** Home is custom (`ORKI — Saudi Streetwear`). Products keep dynamic OG.

---

## Area 4 — Reliability (N+1 + graceful degradation)

### Q4.1 — N+1 detection (initial)
**Options presented:** Targeted audit + dev logging (Recommended) / Persistent middleware counter / Targeted audit only / Skip
**User asked for an explanation first.** Claude explained N+1 with a concrete admin-orders example.
**User asked Claude to audit the codebase first.**

### Audit result (delivered before re-asking Q4.1):
- Codebase essentially N+1-free.
- All data-access uses Drizzle's `with` relational pattern.
- Verified: `src/lib/products.ts`, `src/lib/cart/server.ts`, `src/lib/orders/server.ts`.
- One acceptable per-item loop in `transitionOrderStatus` stock-restoration (admin action, transactional, bounded).

### Q4.1 — N+1 guardrail (re-asked given clean audit)
**Options presented:** Drizzle dev-logging + doc note (Recommended) / Dev logging + lint rule / Just doc note / Nothing
**User choice:** Drizzle dev-logging + short doc note
**Notes:** Logger gated to `NODE_ENV !== 'production'`. Doc lives at `.planning/codebase/data-access-pattern.md`.

### Q4.2 — Graceful degradation
**Options presented:** Branded error pages + per-route try/catch (Recommended) / Full read-only fallback (KV) / Default Next pages
**User choice:** Branded error pages + per-route try/catch
**Notes:** Custom `app/error.tsx` and `app/not-found.tsx` in EN+AR. Read-only catalog fallback deferred.

---

## Deferred Ideas (also in CONTEXT.md)

- Lighthouse CI gate (warn or block)
- Vendor banner / vendor-hosted legal
- Catalog read-only fallback (Vercel KV / Edge Config)
- Granular per-category cookie banner
- Image upload pipeline upgrade (blur + AVIF) — Phase 6 admin
- DSAR self-service portal — gated on auth phase

## Scope-creep redirects

None this session — all selected areas stayed within Phase 9 boundary.
