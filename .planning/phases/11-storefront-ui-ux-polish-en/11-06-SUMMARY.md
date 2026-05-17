---
phase: 11-storefront-ui-ux-polish-en
plan: "06"
subsystem: ui
tags: [imagery, placeholder, deterministic, no-asset-deps, editorial]

# Dependency graph
requires:
  - phase: 11-01
    provides: --color-placeholder-bg and --color-placeholder-mark CSS vars already defined

provides:
  - src/lib/placeholder-variant.ts — getPlaceholderVariant(slug) + getPlaceholderVariantName(slug)
  - PlaceholderImage variant prop: 'ghost' | 'color' | 'texture' | 'type' (default 'ghost')
  - ProductCard wired to deterministic slug → variant
  - PDPGallery wired with optional slug prop → variant

affects:
  - All catalog product cards (shop, category pages)
  - PDP gallery placeholder (when slug passed by Plan 11-08)
  - Any future component calling PlaceholderImage

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "FNV-1a 32-bit hash for deterministic slug → variant mapping — SSR-stable, no dependencies"
    - "SVG inline feTurbulence for noise texture — no external asset, server-rendered"
    - "Variant sub-components (GhostMark, ColorBlock, GrainTexture, TypographicMark) — conditionally rendered via prop"

key-files:
  created:
    - src/lib/placeholder-variant.ts
  modified:
    - src/components/PlaceholderImage.tsx
    - src/components/shop/ProductCard.tsx
    - src/components/pdp/PDPGallery.tsx

key-decisions:
  - "getPlaceholderVariant is a pure FNV-1a hash mod 4 — same slug always returns same variant index (0..3)"
  - "GhostMark uses --color-placeholder-mark CSS var (rgba(255,255,255,0.15)) — removed hardcoded rgba"
  - "ColorBlock uses three literal hex values (#0A0A0A/#111111/#1A1A1A) for the graduated band effect — intentional, not a token collapse candidate"
  - "TypographicMark uses inline fontSize: '15vw' — viewport-fluid type intentionally outside Tailwind scale"
  - "PDPGallery slug prop is optional — back-compat; Plan 11-08 will wire the slug from the PDP route"
  - "SVG filter ids (orki-grain) are document-scoped but each rect references its own filter in-scope — safe for multi-instance rendering per browser spec"

# Metrics
duration: 20min
completed: 2026-05-17
---

# Phase 11 Plan 06: Varied Placeholder Imagery System Summary

**4-variant deterministic placeholder system (ghost / color-block / grain-noise / typographic-wordmark) selected per product slug via FNV-1a hash — closes F-Vis-1 for catalog and PDP image slots.**

## Performance

- **Duration:** ~20 min
- **Started:** 2026-05-17T00:00:00Z
- **Completed:** 2026-05-17T00:20:00Z
- **Tasks:** 3
- **Files modified:** 4 (1 created, 3 modified)

## Accomplishments

- Created `src/lib/placeholder-variant.ts` — FNV-1a pure function `getPlaceholderVariant(slug) → 0|1|2|3` and convenience name form `getPlaceholderVariantName(slug) → 'ghost'|'color'|'texture'|'type'`
- Extended `PlaceholderImage` with `variant` prop — 4 distinct visual treatments, all on near-black field, real-image swap-in path preserved
- Wired `ProductCard` to call `getPlaceholderVariantName(product.slug)` and pass result to `PlaceholderImage`
- Wired `PDPGallery` with optional `slug?` prop (back-compat); computes variant from slug when provided

## Hash Function Snapshot Test Results

Verified deterministic: same slug always returns the same variant across runs.

| Slug | Index | Variant |
|---|---|---|
| `orki-hoodie-01` | 0 | ghost |
| `orki-tee-01` | 0 | ghost |
| `orki-cargo-01` | 0 | ghost |
| `orki-hoodie-02` | 2 | texture |
| `orki-bomber-01` | 3 | type |

## Visual Specs per Variant

| Index | Name | Visual |
|---|---|---|
| 0 | ghost | Centered `ORKI` mark — `font-semibold tracking-widest text-2xl uppercase`, color = `var(--color-placeholder-mark)` (rgba(255,255,255,0.15)) |
| 1 | color | Three horizontal bands: `#0A0A0A` / `#111111` / `#1A1A1A` — graduated near-black, no mark |
| 2 | texture | `bg-[var(--color-placeholder-bg)]` + inline SVG `feTurbulence` noise at `opacity-[0.04]` — no external asset |
| 3 | type | Massive `ORKI` wordmark at `15vw` / `rgba(255,255,255,0.06)` — viewport-fluid, fills ~70% of container height |

## Task Commits

1. **Task 1: Create deterministic placeholder-variant helper** — `2efec7e` (feat)
2. **Task 2: Extend PlaceholderImage with 4 variant renderers** — `d200d8c` (feat)
3. **Task 3: Wire ProductCard + PDPGallery to deterministic variant** — `9f11d25` (feat)

## Files Created/Modified

- `src/lib/placeholder-variant.ts` — FNV-1a hash helper, two exports
- `src/components/PlaceholderImage.tsx` — variant prop + 4 sub-component renderers; hardcoded `#0A0A0A` on ghost/texture/type fields replaced with `bg-[var(--color-placeholder-bg)]`
- `src/components/shop/ProductCard.tsx` — import + compute + pass `variant={variant}`
- `src/components/pdp/PDPGallery.tsx` — optional `slug?` prop + compute + pass `variant={variant}`

## Decisions Made

- FNV-1a hash chosen for SSR stability (no globals, no I/O, no Math.random/Date)
- GhostMark now uses `--color-placeholder-mark` CSS var rather than hardcoded rgba
- ColorBlock's three hex values are intentional graduated palette — not collapsed to CSS vars
- PDPGallery slug is optional for back-compat; Plan 11-08 provides the slug from the PDP route params

## Deviations from Plan

None — plan executed exactly as written. All acceptance criteria met on first pass.

## Known Stubs

- PDPGallery's `slug` prop is optional and defaults to `'ghost'` — the wiring of the actual slug value from PDP route params is deferred to Plan 11-08, which owns the PDP gallery upgrade. This is an intentional deferred stub, not a visual regression (ghost is the existing behavior).

## Threat Flags

None — no network endpoints, auth paths, or schema changes introduced. Pure UI rendering logic.

## Self-Check

- [x] `src/lib/placeholder-variant.ts` exists and exports `getPlaceholderVariant` + `getPlaceholderVariantName`
- [x] `src/components/PlaceholderImage.tsx` has 4 variant renderers
- [x] `src/components/shop/ProductCard.tsx` passes `variant={variant}` to PlaceholderImage
- [x] `src/components/pdp/PDPGallery.tsx` passes `variant={variant}` to PlaceholderImage
- [x] `src/types/domain.ts` unchanged — no Product interface fields added
- [x] Commits 2efec7e, d200d8c, 9f11d25 exist on worktree-agent-a2cfe5d1aba80b2bb
- [x] `npx tsc --noEmit` exits 0 (no errors in plan files)
- [x] `npm run lint` exits 0
