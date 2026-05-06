# ORKI

## What This Is

ORKI is a Saudi Arabian streetwear brand launching its direct-to-consumer ecommerce website. The site sells apparel (tops and bottoms) through a dark, editorial experience targeting streetwear culture enthusiasts. The frontend is built bilingually (EN/AR with full RTL support) and fully complete before any backend integration begins.

## Core Value

A premium underground streetwear shopping experience that feels as intentional as the brand itself — dark, minimal, and unapologetically cultural.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Users can browse products organized by category (Tops, Bottoms)
- [ ] Users can view individual product detail pages with size selection
- [ ] Users can add items to cart and proceed through checkout flow
- [ ] Site supports bilingual experience (EN/AR) with full RTL layout switching
- [ ] Home page communicates brand identity and drives product discovery
- [ ] Brand story / About page communicates ORKI's identity and underground ethos
- [ ] Contact page for customer inquiries
- [ ] All frontend pages are fully built with placeholder imagery before backend integration

### Out of Scope

- Lookbook page — not requested for v1
- Drop countdown / waitlist teaser — not requested for v1
- Headwear, bags, accessories categories — ORKI sells tops and bottoms only at launch
- Backend / API integration — deferred until frontend is fully complete

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
- **Sequence**: Frontend must be feature-complete before backend work begins — backend is out of scope for the current milestone
- **Brand colors**: Black and white palette — all design decisions must work within this constraint

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Frontend-first development | User wants all UI/UX 100% complete before any backend work | — Pending |
| Bilingual EN/AR with RTL | Saudi Arabia primary market requires both languages with full RTL layout | — Pending |
| Category-based shop navigation | Tops & Bottoms are the two product categories for v1 | — Pending |
| Design latitude given to Claude | Logo + colors defined; fonts, layout, motion delegated to Claude | — Pending |
| Placeholder-first photography | Product images unavailable at build time — design with placeholder system | — Pending |

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
*Last updated: 2026-05-06 after initialization*
