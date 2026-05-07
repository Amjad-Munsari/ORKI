# ORKI

## What This Is

ORKI is a Saudi Arabian streetwear brand launching its direct-to-consumer ecommerce website. The site sells apparel (tops and bottoms) through a dark, editorial experience targeting streetwear culture enthusiasts. The frontend is built bilingually (EN/AR with full RTL support) and fully complete. We are now preparing for backend integration.

## Core Value

A premium underground streetwear shopping experience that feels as intentional as the brand itself — dark, minimal, and unapologetically cultural.

## Current State

**v1.0 (Frontend Complete) Shipped 2026-05-07**
- Bilingual (EN/AR) with absolute RTL integrity
- Full browse-to-cart-to-checkout mock flow complete
- UI polished with typography, scroll reveals, and pure placeholder editorial treatment (images removed)
- Ready for Backend Integration (Phase 5)

## Current Milestone: v2.0 Backend Integration & Technical Foundations

**Goal:** Connect the ORKI frontend to a local database (pre-Supabase) to establish real data flows, authentication, and core ecommerce logic while explicitly deferring live payment gateways.

**Target features:**
- Setup local database schema and ORM (with strict parameterization and indexing)
- Implement robust Authentication (httpOnly cookies, secure generic messaging, guest checkout support)
- Connect Product Catalog to the local DB (inventory locking, out-of-stock "notify me" states)
- Persistent Cart & Checkout flow (state machine: pending → confirmed → shipped etc.)
- Infrastructure & Foundation (SEO meta tags, JSON-LD structured data, WCAG AA compliance, security headers, WebP image pipeline, legal/KVKK compliance)

<details>
<summary>Previous Requirements (Archived v1.0)</summary>

### Validated
- [x] Users can browse products organized by category (Tops, Bottoms)
- [x] Users can view individual product detail pages with size selection
- [x] Users can add items to cart and proceed through checkout flow
- [x] Site supports bilingual experience (EN/AR) with full RTL layout switching
- [x] Home page communicates brand identity and drives product discovery
- [x] Brand story / About page communicates ORKI's identity and underground ethos
- [x] Contact page for customer inquiries
- [x] All frontend pages are fully built with placeholder imagery before backend integration

</details>

## Requirements (Active)

*(Run `/gsd-new-milestone` to define Phase 5 Backend Integration requirements)*

## Out of Scope

- Lookbook page — not requested for v1
- Drop countdown / waitlist teaser — not requested for v1
- Headwear, bags, accessories categories — ORKI sells tops and bottoms only at launch

## Context

- Reference: marionshop.framer.website — user is drawn specifically to the minimalist layout, dark moody aesthetic, and typography/branding treatment
- Brand personality: Dark & underground — gritty, raw, anti-mainstream streetwear
- Brand assets: Logo is finalized. Black and white color palette confirmed.
- Typography and all remaining design decisions (font choices, spacing, layout details, motion design) are delegated to Claude
- Product photography is not available at build time — design must use a high-quality placeholder system
- Animations: A mix of subtle/refined transitions and bold scroll reveals — the site should have expressive presence without being distracting
- Primary market: Saudi Arabia, with international accessibility via English

## Constraints

- **RTL Support**: Full Arabic RTL layout required — this is a significant frontend architecture decision affecting every component
- **Assets**: No product photography at build time — placeholder system must look intentional, not broken
- **Brand colors**: Black and white palette — all design decisions must work within this constraint

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Frontend-first development | User wants all UI/UX 100% complete before any backend work | Validated |
| Bilingual EN/AR with RTL | Saudi Arabia primary market requires both languages with full RTL layout | Validated |
| Category-based shop navigation | Tops & Bottoms are the two product categories for v1 | Validated |
| Design latitude given to Claude | Logo + colors defined; fonts, layout, motion delegated to Claude | Validated |
| Placeholder-first photography | Product images unavailable at build time — design with placeholder system | Validated |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-08 (v2.0 Start)*
