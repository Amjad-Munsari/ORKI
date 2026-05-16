# ORKI Ecommerce — Project Guide

## Project

Saudi streetwear brand ecommerce site. Dark, underground aesthetic. Bilingual EN/AR with full RTL support. Frontend-complete milestone before any backend integration.

**Reference:** marionshop.framer.website — minimalist, dark, editorial

## GSD Workflow

This project uses GSD (Get Shit Done) for structured execution.

### Current State
See `.planning/STATE.md` for current phase and status.

### Key Commands

| Command | When to use |
|---------|-------------|
| `/gsd-discuss-phase N` | Gather context before planning a phase |
| `/gsd-plan-phase N` | Create detailed execution plan for a phase |
| `/gsd-execute-phase N` | Execute all plans in a phase |
| `/gsd-progress` | Check status, advance workflow |
| `/gsd-verify-work` | Verify phase meets success criteria |

### Phase Order (do not skip)

1. **Foundation** — RTL/i18n architecture, fonts, placeholders, nav, footer
2. **Core Shopping** — Shop, category pages, product detail, all PDP features
3. **Cart & Checkout** — Cart drawer, CartStore, checkout flow, payment UI
4. **Brand & Polish** — Home, About, Contact, animations, reduced-motion

**Never start Phase N+1 before Phase N passes its success criteria.**

## Architecture Constraints

### RTL is non-negotiable
- Always use CSS logical properties: `ms-`, `me-`, `ps-`, `pe-`, `inline-start`, `inline-end`
- Never write: `ml-`, `mr-`, `pl-`, `pr-`, `left-`, `right-` as directional styles
- Set both `lang` and `dir` on `<html>` atomically when locale switches
- All animations must be direction-aware

### Data layer contract
- All product data imports through `/lib/products.ts` only — never directly from `/data/`
- TypeScript `Product` interface in `/types/domain.ts` is the contract between frontend and future backend
- When backend arrives, only `/lib/products.ts` changes — zero component rewrites

### Frontend-first
- No real backend during frontend phase — use static data in `/data/products.ts`
- Checkout uses a mock `/api/checkout` route returning `{ success: true, orderId: 'MOCK-001' }`
- Placeholder images use intentional dark-field editorial treatment, not grey boxes

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 — logical properties only |
| UI primitives | shadcn/ui |
| Animation | Motion (formerly Framer Motion) + GSAP ScrollTrigger |
| i18n | next-intl — URL-based locale routing (`/en/...`, `/ar/...`) |
| Cart state | Zustand + persist middleware (localStorage) |
| Fonts | next/font — Geist (EN) + IBM Plex Sans Arabic (AR) |
| Deployment | Vercel |

**Future (backend phase):** Medusa v2 + Moyasar (Mada + STC Pay)

## Design System

- **Colors:** Black and white — no other palette
- **Mode:** Dark-first
- **Animations:** Mix of subtle (hover, transitions) and bold (scroll reveals) — never distracting
- **Image ratios:** 3:4 catalog cards, 4:5 PDP hero — enforce via aspect-ratio CSS
- **Typography:** Geist (EN) + IBM Plex Sans Arabic (AR) — loaded via next/font
- **Currency:** SAR — formatted via `Intl.NumberFormat` with `'ar-SA-u-nu-latn'` for Western numerals in both locales

## Planning Artifacts

| File | Purpose |
|------|---------|
| `.planning/PROJECT.md` | Project context, requirements, decisions |
| `.planning/REQUIREMENTS.md` | 38 v1 requirements with REQ-IDs |
| `.planning/ROADMAP.md` | 4-phase roadmap with success criteria |
| `.planning/STATE.md` | Current phase and status |
| `.planning/research/` | Domain research: stack, features, architecture, pitfalls |
| `.planning/config.json` | Workflow config (YOLO, standard granularity, parallel) |
