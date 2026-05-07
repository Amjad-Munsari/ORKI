# Milestone v2.0 Requirements

## Core Infrastructure
- [ ] **INFRA-01**: Setup local database schema matching target Supabase structure
- [ ] **INFRA-02**: Implement ORM or query builder with strict parameterized queries to prevent SQL injection
- [ ] **INFRA-03**: Secrets and API keys must be managed exclusively via environment variables
- [ ] **INFRA-04**: Dependencies must be auditable (pass npm audit) and versions locked via package-lock.json

## Security (SEC)
- [ ] **SEC-01**: Implement Authentication using a proven library (e.g. NextAuth, Clerk) with httpOnly cookies for session tokens (no localStorage for auth)
- [ ] **SEC-02**: Validate and sanitize all user input server-side
- [ ] **SEC-03**: Implement rate limiting and strict CORS policies on all API endpoints
- [ ] **SEC-04**: Require CSRF protection on all state-changing routes
- [ ] **SEC-05**: Enforce HTTPS and set strict security headers (Content-Security-Policy, Strict-Transport-Security, X-Frame-Options)
- [ ] **SEC-06**: Auth error messages (login, forgot password) must be generic (e.g., "Invalid credentials") to prevent user enumeration
- [ ] **SEC-07**: Accounts must be throttled/temporarily locked after repeated failed login attempts
- [ ] **SEC-08**: Admin panel (if built) must be on a protected route, require MFA, and be IP-restricted where possible
- [ ] **SEC-09**: Log suspicious activity (repeated failures, unusual order sizes) and trigger alerts

## Usability (UX)
- [ ] **UX-01**: Checkout must support guest checkout (no forced account creation)
- [ ] **UX-02**: Checkout flow must be completable in minimum steps with a visible progress indicator
- [ ] **UX-03**: Total cost (including tax/shipping) must be explicitly shown before final confirmation step
- [ ] **UX-04**: Ensure fully functional mobile experience (minimum 44x44px tap targets, no hover-only interactions)
- [ ] **UX-05**: Form validation errors must highlight specific fields and preserve entered data
- [ ] **UX-06**: Raw technical error messages must never be exposed to the user
- [ ] **UX-07**: Trust signals (security badges, return policy) must be visible near the checkout button
- [ ] **UX-08**: Clear recovery path provided if payment/checkout fails mid-process (preserve cart state)
- [ ] **UX-09**: Meet WCAG 2.1 AA accessibility standards (keyboard navigation, screen reader support, color contrast)

## Business Logic (ECOM)
- [ ] **ECOM-01**: Inventory must use optimistic locking or stock reservation to prevent overselling
- [ ] **ECOM-02**: Orders must follow an explicit state machine: pending → confirmed → shipped → delivered → refunded/cancelled
- [ ] **ECOM-03**: Transactional emails (order confirmation, shipping, password reset) must use a reliable provider (e.g., Resend/Postmark)
- [ ] **ECOM-04**: Refund and cancellation logic must be designed into the core system architecture
- [ ] **ECOM-05**: Out-of-stock products must stay live with a "notify me" option (no deletion)
- [ ] **ECOM-06**: Ensure all frequently queried fields (email, order_id, product_id, user_id) have appropriate database indexes

## Legal & Compliance (LGL)
- [ ] **LGL-01**: Publish Privacy Policy covering data collection, storage, and user rights
- [ ] **LGL-02**: Implement a cookie consent banner if analytics/marketing cookies are used
- [ ] **LGL-03**: Publish Terms & Conditions covering refunds, liability, and dispute resolution
- [ ] **LGL-04**: Meet KVKK / GDPR compliance: explicit consent for processing and mechanisms to export or delete personal data

## Performance & Reliability (PERF)
- [ ] **PERF-01**: Images must be automatically resized and converted to WebP on upload (not at request time)
- [ ] **PERF-02**: Serve all static assets via a CDN
- [ ] **PERF-03**: Achieve Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] **PERF-04**: Page load time under 3 seconds with lazy-loaded images
- [ ] **PERF-05**: Graceful degradation: site must not full-crash if third-party APIs go down
- [ ] **PERF-06**: Prevent N+1 database query problems (reviewed before each phase completes)

## SEO (SEO)
- [ ] **SEO-01**: All pages must be SSR or SSG (no client-side-only rendering)
- [ ] **SEO-02**: Automatically generate and maintain an up-to-date sitemap.xml
- [ ] **SEO-03**: Unique <title> (under 60 chars) and meta description (under 160 chars) per page
- [ ] **SEO-04**: Every product page must have one <h1>, a clean URL (/products/slug), and descriptive image alt text
- [ ] **SEO-05**: Descriptive filenames for product images (e.g. black-hoodie.webp)
- [ ] **SEO-06**: Implement JSON-LD structured data (Product schema with Offer and AggregateRating)
- [ ] **SEO-07**: Implement Breadcrumb schema on product and category pages
- [ ] **SEO-08**: Ensure Open Graph tags (og:title, og:description, og:image, og:price) are set on all pages
- [ ] **SEO-09**: Canonical tags must be applied to filtered, sorted, or paginated URLs
- [ ] **SEO-10**: Deleted/removed products must 301 redirect to their parent category (no bare 404s)

## Out of Scope
- Payment gateway integration (Stripe/Moyasar) is explicitly deferred to a future milestone; focus is on order creation mechanics.
- Lookbook and waitlist pages.
- Non-apparel categories.

## Traceability

| Requirement | Phase |
|-------------|-------|
| INFRA-01 | Phase 5 |
| INFRA-02 | Phase 5 |
| INFRA-03 | Phase 5 |
| INFRA-04 | Phase 5 |
| SEC-01 | Phase 6 |
| SEC-02 | Phase 6 |
| SEC-03 | Phase 6 |
| SEC-04 | Phase 6 |
| SEC-05 | Phase 6 |
| SEC-06 | Phase 6 |
| SEC-07 | Phase 6 |
| SEC-08 | Phase 6 |
| SEC-09 | Phase 6 |
| ECOM-01 | Phase 7 |
| ECOM-05 | Phase 7 |
| ECOM-06 | Phase 7 |
| SEO-01 | Phase 7 |
| SEO-04 | Phase 7 |
| SEO-05 | Phase 7 |
| SEO-06 | Phase 7 |
| SEO-07 | Phase 7 |
| SEO-08 | Phase 7 |
| SEO-09 | Phase 7 |
| SEO-10 | Phase 7 |
| PERF-01 | Phase 7 |
| PERF-02 | Phase 7 |
| UX-01 | Phase 8 |
| UX-02 | Phase 8 |
| UX-03 | Phase 8 |
| UX-04 | Phase 8 |
| UX-05 | Phase 8 |
| UX-06 | Phase 8 |
| UX-07 | Phase 8 |
| UX-08 | Phase 8 |
| UX-09 | Phase 8 |
| ECOM-02 | Phase 8 |
| ECOM-03 | Phase 8 |
| ECOM-04 | Phase 8 |
| LGL-01 | Phase 9 |
| LGL-02 | Phase 9 |
| LGL-03 | Phase 9 |
| LGL-04 | Phase 9 |
| PERF-03 | Phase 9 |
| PERF-04 | Phase 9 |
| PERF-05 | Phase 9 |
| PERF-06 | Phase 9 |
| SEO-02 | Phase 9 |
| SEO-03 | Phase 9 |
