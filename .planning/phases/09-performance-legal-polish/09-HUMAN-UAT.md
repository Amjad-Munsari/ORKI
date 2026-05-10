---
status: partial
phase: 09-performance-legal-polish
source: [09-VERIFICATION.md]
started: 2026-05-10T16:30:00Z
updated: 2026-05-10T17:00:00Z
deferred_to_launch: [1, 2, 3, 8]   # post-deploy traffic / preview-deploy DB / pre-launch native review
pending_manual: [6, 7]              # runtime triggers (force-throw + unknown-route 404)
local_smoked: [4, 5]                # smoke:routes covers DB-free portion
---

## Current Test

[awaiting human testing]

## Tests

### 1. Vercel Speed Insights p75 LCP < 2500ms (post-deploy)
expected: After 24h of production traffic, Vercel project → Speed Insights tab shows p75 LCP under 2.5s
result: [pending]

### 2. Vercel Analytics page-view events arrive in production
expected: After deploy, Vercel project → Analytics tab shows page-view events firing on navigation
result: [pending]

### 3. sitemap.xml returns 200 with ≥ 18 `<url>` entries (live)
expected: `curl -s http://localhost:3000/sitemap.xml | grep -c '<url>'` ≥ 18
local: NOT covered by `npm run smoke:routes` — sitemap.ts hits Drizzle (`getAllProducts()`); requires Vercel preview deploy with real DB. Smoke runner uses stub:// DB URLs.
result: [pending]

### 4. robots.txt returns 200 with locale-prefixed Disallow rules (live)
expected: curl -s /robots.txt shows Disallow: /en/admin/, /ar/admin/, /en/checkout/, /ar/checkout/, /api/
local: now runnable locally via `npm run smoke:routes` (covers /robots.txt = 200 + contains "Disallow:"). For full Disallow-line audit, run preview deploy.
result: smoke-pass-partial
verified: 2026-05-10 — `npm run smoke:routes` PASS on `/robots.txt` (200 + "Disallow:"). Full per-Disallow-line audit still requires preview deploy.

### 5. Per-page `<title>` cascade renders correctly via title.template (live)
expected: curl /en/about → `<title>About | ORKI</title>`; /en/contact → `<title>Contact | ORKI</title>`; /en/shop/tops → `<title>Tops | ORKI</title>`; PDP → `<product name> | ORKI` (single suffix only)
local: now runnable locally via `npm run smoke:routes` for /en/about, /en/contact, /en/legal/privacy, /en/legal/terms (each must contain `| ORKI</title>`). Shop categories + PDP are DB-backed; preview deploy required for those.
result: smoke-pass-partial
verified: 2026-05-10 — `npm run smoke:routes` PASS on /en/about, /en/contact, /en/legal/privacy, /en/legal/terms (each contains `| ORKI</title>`). Shop categories + PDP titles still require preview deploy.

### 6. Branded global-error renders with bilingual copy on top-level uncaught error
expected: Forcibly throw above [locale] segment; branded page with own `<html>`/`<body>` renders with retry CTA
result: [pending]

### 7. Branded 404 renders for unknown route inside [locale] with shop CTA
expected: Visit /en/lkjhasdf and /ar/lkjhasdf → branded 404 (no role='alert') with "Browse shop" CTA
result: [pending]

### 8. AR formal-legal copy review + [AR-LEGAL-REVIEW]/[USER-CONFIRM] removal before launch
expected: Native-speaker legal reviewer signs off; CI guard `grep -E '\[AR-LEGAL-REVIEW\]|\[USER-CONFIRM' messages/ar.json` returns 0 lines pre-launch
result: [pending]

## Summary

total: 8
passed: 0
smoke-pass-partial: 2   # tests 4, 5 — DB-free portion locally verified
issues: 0
pending: 6              # 4 deferred-to-launch (1,2,3,8) + 2 manual runtime (6,7)
skipped: 0
blocked: 0

## Gaps
