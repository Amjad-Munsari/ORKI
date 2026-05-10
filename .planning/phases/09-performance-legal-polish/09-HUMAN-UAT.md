---
status: partial
phase: 09-performance-legal-polish
source: [09-VERIFICATION.md]
started: 2026-05-10T16:30:00Z
updated: 2026-05-10T16:30:00Z
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
result: [pending]

### 4. robots.txt returns 200 with locale-prefixed Disallow rules (live)
expected: curl -s /robots.txt shows Disallow: /en/admin/, /ar/admin/, /en/checkout/, /ar/checkout/, /api/
result: [pending]

### 5. Per-page `<title>` cascade renders correctly via title.template (live)
expected: curl /en/about → `<title>About | ORKI</title>`; /en/contact → `<title>Contact | ORKI</title>`; /en/shop/tops → `<title>Tops | ORKI</title>`; PDP → `<product name> | ORKI` (single suffix only)
result: [pending]

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
issues: 0
pending: 8
skipped: 0
blocked: 0

## Gaps
