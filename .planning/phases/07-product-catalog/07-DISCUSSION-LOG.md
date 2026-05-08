# Phase 7 Discussion Log: Product Catalog & Dynamic Inventory

**Date:** 2026-05-08
**Phase:** 7
**Participants:** Agent, User

## Areas Discussed

### 1. Data Source Transition
- **Options Presented:** Clean cutover vs. Hybrid/Fallback model.
- **Selection:** Clean cutover (DB-only).
- **Notes:** User explicitly chose the cleaner architectural path recommended by the agent.

### 2. Inventory & Stock UX
- **Options Presented:** Low stock indicators, "Notify Me" behavior.
- **Selection:** Implement Low Stock indicators; Defer "Notify Me".
- **Notes:** "Notify Me" is deferred as it requires notification infrastructure not yet in scope.

### 3. Image Serving Strategy
- **Options Presented:** Local optimized serving vs. CDN integration now.
- **Selection:** Agent's discretion: Local optimized serving.
- **Notes:** Keeps local development isolation; architecture remains ready for CDN swap later.

### 4. Caching & Freshness
- **Options Presented:** Time-based vs. On-demand revalidation.
- **Selection:** On-demand revalidation.
- **Notes:** Best for real-time stock updates triggered by Admin changes.

## Deferred Ideas
- **Notify Me (Back in Stock):** Deferred to a future phase once notification/email infrastructure is ready.
