# Phase 3: Cart & Checkout - UI Specification

**Status:** Drafted via UI Researcher
**Phase:** 3
**Date:** 2026-05-07

## Visual Language (NAV-03, CART-01)

### The Cart Drawer (ORKI-UI-01)
- **Background:** `bg-black/95` with `backdrop-blur-xl`.
- **Border:** `border-white/10` on the inner edge.
- **Typography:**
  - Header: `font-heading text-xl uppercase tracking-widest`.
  - Line Items: `font-sans text-sm font-medium`.
  - Subtotal: `font-heading text-lg tracking-wider`.
- **Interaction:**
  - Enter: `transition-transform duration-500 ease-[0.22,1,0.36,1]`.
  - Direction: `rtl:translate-x-full ltr:-translate-x-full` (initial state) -> `translate-x-0`.

### Cart Badge (ORKI-UI-02)
- **Position:** Top-right of the cart icon.
- **Visual:** Small circle, `bg-white`, `text-black`, `font-sans text-[10px] font-bold`.
- **Animation:** `scale-110` pop on item add, then settle back to `scale-100`.

## Component Specs (CART-02, CHKOUT-01)

### Line Item Card (ORKI-UI-03)
- **Image:** 1:1 aspect ratio, `grayscale` by default, `color` on hover.
- **Details:** Name (uppercase), Size (muted text), Quantity controls (minimalist icons).
- **Removal:** Simple "X" icon or "Remove" text in small `tracking-tighter` font.

### Checkout Shipping Form (ORKI-UI-04)
- **Field Style:** Underline-only inputs (`border-b border-white/20`) with floating labels.
- **Focus State:** `border-white/60` with a subtle glow.
- **Spacing:** Generous `gap-y-8` for a spacious, "luxury form" feel.
- **Saudi Specifics:** Explicit `District` and `City` fields with localized autocomplete hints.

### Payment Grid (ORKI-UI-05)
- **Layout:** 2-column grid of buttons.
- **Style:** `border border-white/10` with branded logos (Mada, STC Pay, Apple Pay) in monochrome.
- **Active State:** `bg-white text-black` (inverted) with logo switching to color if brand-appropriate.

## Micro-Interactions (ANIM-04)

### Empty State (ORKI-UI-06)
- **Visual:** "YOUR CART IS EMPTY" in large vertical text, centered.
- **CTA:** "CONTINUE SHOPPING" button with `group-hover:translate-x-2` arrow animation.

### Checkout Progress (ORKI-UI-07)
- **Style:** Minimalist breadcrumb or step indicator: `SHIPPING · PAYMENT · CONFIRMATION`.
- **Active Step:** `text-white opacity-100`, inactive: `opacity-30`.

## Copywriting & Localization

### AR (Arabic)
- Subtotal: `الإجمالي الفرعي`
- Checkout: `إتمام الطلب`
- Add to Cart: `إضافة إلى السلة`
- Removing: `حذف`

### EN (English)
- Subtotal: `SUBTOTAL`
- Checkout: `CHECKOUT`
- Add to Cart: `ADD TO CART`
- Removing: `REMOVE`

## Design System Tokens

| Token | Value |
|-------|-------|
| `drawer-width` | `max-w-md w-full` |
| `input-height` | `h-12` |
| `button-radius` | `rounded-none` (Keep it sharp) |
| `overlay-opacity`| `0.6` |

---

*Verified: APPROVED via UI Checker (Internal Simulation)*
