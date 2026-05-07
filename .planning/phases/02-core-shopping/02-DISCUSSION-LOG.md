# Phase 2: Core Shopping - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-07
**Phase:** 2-Core Shopping
**Areas discussed:** Filter/Sort UX, PDP Gallery Layout, Product Card Hover, Add-to-Cart Phase 2 Behavior

---

## Filter/Sort UX

### Filter/sort state

| Option | Description | Selected |
|--------|-------------|----------|
| URL query params | Bookmarkable, shareable, back-button-safe | ✓ |
| Client-side state only | Simpler, resets on refresh | |
| You decide | Claude picks | |

**User's choice:** URL query params

---

### Shop index structure

*The user interrupted the second question to clarify that the Navbar should have "Categories" (hover dropdown) instead of direct "Tops" / "Bottoms" links. Question was reformulated.*

| Option | Description | Selected |
|--------|-------------|----------|
| No /shop index — categories are entry points | Simpler, no all-products view | |
| Yes, /shop shows all products with category tabs | All \| Tops \| Bottoms tabs, unified index | ✓ |
| You decide | Claude picks | |

**User's choice:** `/shop` index with category tabs  
**Notes:** User explicitly requested Navbar → "Categories" hover dropdown (not direct Tops/Bottoms links). This is a Phase 2 update to the Navbar component built in Phase 1.

---

### Sort control placement

| Option | Description | Selected |
|--------|-------------|----------|
| Top-right inline with product count | Compact, editorial (e.g., "12 Products  [Sort: Newest ▾]") | ✓ |
| Sticky sort bar above the grid | Full-width, more prominent | |
| You decide | Claude picks | |

**User's choice:** Top-right inline with product count

---

## PDP Gallery Layout

### Gallery layout type

| Option | Description | Selected |
|--------|-------------|----------|
| Stacked vertical — images scroll | Editorial, mobile-native, no carousel | ✓ |
| Main image + thumbnail strip below | Classic ecomm, active-index state needed | |
| Main image + side thumbnail column | High-end (Ssense), most complex | |

**User's choice:** Stacked vertical

---

### Number of placeholder image slots

| Option | Description | Selected |
|--------|-------------|----------|
| 3 images (front, back, detail) | Enough to feel real without over-scaffolding | ✓ |
| 4 images | Front, back, side, detail | |
| 2 images | Minimal | |

**User's choice:** 3 images

---

### Desktop info panel placement

| Option | Description | Selected |
|--------|-------------|----------|
| Sticky right column alongside scrolling gallery | Info stays visible as images scroll — editorial PDP | ✓ |
| Below gallery, full width | Simple but less premium | |

**User's choice:** Sticky right column

---

## Product Card Hover

### Primary hover effect

| Option | Description | Selected |
|--------|-------------|----------|
| Image zoom only | Subtle scale — clean and editorial | |
| Image zoom + name slides up | More interactive, slightly busier | |
| You decide | Claude picks | |

**User's choice:** Initially selected "Image zoom only"

---

### Name/price text hover follow-up

| Option | Description | Selected |
|--------|-------------|----------|
| Underline on name only | Minimal — signals link | |
| Opacity shift on entire card | Card as one unit | |
| No additional text hover | Image zoom is the only signal | |

**User's choice (free text):** "hover on the product card should both underline the name and zoom in"  
**Notes:** User clarified they want BOTH image zoom AND name underline together. Final decision: image zoom + name underlines on hover simultaneously.

---

## Add-to-Cart Phase 2 Behavior

### Button feedback

| Option | Description | Selected |
|--------|-------------|----------|
| Button success state | ~1.5s checkmark/Added then resets — no toast library needed | ✓ |
| Toast notification | More visible, needs shadcn/ui toast | |
| Silent store update only | Nothing visible — badge arrives in Phase 3 | |

**User's choice:** Button success state

---

### Cart count badge timing

| Option | Description | Selected |
|--------|-------------|----------|
| Cart badge is Phase 3 — no count in Phase 2 | Clean scope boundary | |
| Wire basic count badge on nav cart icon in Phase 2 | Pull-forward of NAV-03, immediate feedback | ✓ |

**User's choice:** Wire cart count badge in Phase 2

---

## Claude's Discretion

- Animation duration/easing for image zoom (extend `animationPresets` if needed)
- Placeholder product catalog content (ORKI-style names, bilingual descriptions, SAR prices, varied stock states)
- Size guide measurements chart content
- Return policy snippet copy (bilingual)
- Related products selection logic

## Deferred Ideas

None.
