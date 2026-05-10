# Roadmap: ORKI Ecommerce

## Archive

- [Milestone v1.0: Frontend Complete](./milestones/v1.0-ROADMAP.md) - Delivered 2026-05-07

---

## Current Milestone: v2.0 Backend Integration & Technical Foundations

**Goal:** Connect the ORKI frontend to a local database (pre-Supabase) to establish real data flows, authentication, and core ecommerce logic while explicitly deferring live payment gateways.

### Phase 5: Local Database & ORM Setup
**Goal:** Establish local database infrastructure and initial schemas.
**Requirements:** INFRA-01, INFRA-02, INFRA-03, INFRA-04
**Success Criteria:**
1. Local database is running and accessible
2. ORM is configured with strict parameterization
3. Environment variables successfully load and connect to DB
4. Dependencies pass audit and are locked

### Phase 6: Admin Dashboard & Product Management
**Goal:** Build internal tools for managing the product catalog and inventory.
**Success Criteria:**
1. Secure `/admin` route group accessible (initially bypassed or simple check)
2. Product table with CRUD operations (Create, Read, Update, Delete)
3. Inventory management (bulk update stock states)
4. Image management (upload/assignment to products)

### Phase 7: Product Catalog & Dynamic Inventory
**Goal:** Connect the frontend catalog to the database with inventory controls and SEO.
**Requirements:** ECOM-01, ECOM-05, ECOM-06, SEO-01, SEO-04, SEO-05, SEO-06, SEO-07, SEO-08, SEO-09, SEO-10, PERF-01, PERF-02
**Success Criteria:**
1. Products render from DB via SSR/SSG
2. Inventory locking prevents overselling the same item
3. Out-of-stock items show "notify me" rather than failing
4. Images upload automatically convert to WebP and serve from CDN
5. JSON-LD and Open Graph tags validate successfully

### Phase 8: Cart, Checkout State & Order Flow
**Goal:** Build persistent cart and robust order state machine.
**Requirements:** UX-01, UX-02, UX-03, UX-04, UX-05, UX-06, UX-07, UX-08, UX-09, ECOM-02, ECOM-03, ECOM-04
**Success Criteria:**
1. Cart persists for guest and logged-in users
2. Checkout displays total cost and visible progress steps
3. Order state machine correctly transitions pending → confirmed
4. Form validations highlight errors without losing data
5. Simulated payment failure preserves cart state

### Phase 9: Performance, Legal & Polish
**Goal:** Ensure compliance, Web Vitals performance, and final infrastructure requirements.
**Requirements:** LGL-01, LGL-02, LGL-03, LGL-04, PERF-03, PERF-04, PERF-05, PERF-06, SEO-02, SEO-03
**Plans:** 8 plans
**Success Criteria:**
1. Core Web Vitals targets met (LCP < 2.5s)
2. Privacy policy, T&C, and Cookie banners are active
3. N+1 database query checks pass
4. sitemap.xml automatically generates

Plans:
- [x] 09-01-PLAN.md — Wave 0 foundations (seo.ts helper, Legal/Errors/Meta i18n skeleton, footer href migration, returns-policy reconciliation, PDP title-template fix)
- [x] 09-02-PLAN.md — Legal pages (Privacy / Terms / Cookies) + LegalArticle + CookieTable + body copy fill
- [x] 09-03-PLAN.md — Vercel Analytics + Speed Insights mounting + image priority audit
- [x] 09-04-PLAN.md — Sitemap + robots + OG fallback + per-page generateMetadata wiring
- [x] 09-05-PLAN.md — Reliability hygiene (global-error + per-locale error/not-found, Drizzle logger gate, try/catch, N+1 doc)
- [x] 09-06-PLAN.md — CookieBanner scaffold + cookie-consent helper (built, NOT mounted)
- [x] 09-07-PLAN.md — Gap closure wave 1: visible defects + production reliability (CR-01..03, WR-01..03)
- [x] 09-08-PLAN.md — Gap closure wave 2: hygiene + copy + dev-loop polish (WR-04..06, IN-01/02/04/05, smoke-routes UAT helper)

### Phase 10: Authentication & Security Core
**Goal:** Implement secure user authentication and fundamental API security.
**Requirements:** SEC-01, SEC-02, SEC-03, SEC-04, SEC-05, SEC-06, SEC-07, SEC-08, SEC-09
**Plans:** 7 plans (Wave 0..3)
**Success Criteria:**
1. User can register and log in via httpOnly cookies
2. Invalid login returns generic message and locks after repeated failures
3. API endpoints reject unauthenticated or unvalidated requests
4. Security headers and CSRF protections are verified active

Plans:
- [x] 10-01-PLAN.md — Wave 0: Supabase client factories (browser/SSR/admin) + combined Supabase-refresh + next-intl middleware + ESLint admin fence + Playwright config + shared test fixture + Wave-0 smoke test
- [x] 10-02-PLAN.md — Wave 0: Schema migration (FK to auth.users + RLS policies) + auth_events audit table
- [x] 10-03-PLAN.md — Wave 1: Auth Server Actions (signup/signin/signout/password-reset) with zod + audit + error mapping
- [x] 10-04-PLAN.md — Wave 2: Auth UI pages (login / signup / forgot-password / reset-password) + RHF forms
- [ ] 10-05-PLAN.md — Wave 2: Account area + cart-merge on first sign-in + UserMenu in Navbar
- [ ] 10-06-PLAN.md — Wave 2: Admin gate (email allowlist) + audit-log surface
- [ ] 10-07-PLAN.md — Wave 3: Security headers + CSP + final verification + production-bundle service-role-key grep

---

## Backlog

*(Empty)*
