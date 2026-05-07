# Phase 3: Cart & Checkout - Context

**Gathered:** 2026-05-07
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the complete purchase path: from the interactive cart drawer (NAV-03) with persistence (CART-03) and localized controls (CART-02), to a full-featured single-page checkout flow (CHKOUT-01 through CHKOUT-04) ending on a mock order confirmation page (CHKOUT-05).

</domain>

<decisions>
## Implementation Decisions

### Cart Drawer Behavior (NAV-03, CART-01)
- **D-01:** Clicking "Add to Cart" on the PDP will automatically trigger the cart drawer to slide open (confirming the action and driving urgency).
- **D-02:** Quantity controls (+/-) and "Remove" actions are provided inline for every item in the drawer for zero-friction adjustments.
- **D-03:** Motion direction is strictly locale-aware: slides from the right in English (LTR) and from the left in Arabic (RTL).

### Checkout Architecture (CHKOUT-01, CHKOUT-02)
- **D-04:** Checkout is a single-page long-form layout (Express style) to minimize navigation friction during the purchase flow.
- **D-05:** Order summary is sticky on desktop, keeping total SAR price and line items visible while filling out the shipping form.

### Localized Payment & Error Handling (CHKOUT-03, CHKOUT-04)
- **D-06:** Payment method selector uses a branded grid of "quick buttons" for Mada, STC Pay, Apple Pay, etc., tailored for the Saudi market aesthetic.
- **D-07:** Checkout error states (e.g., card declined, OOS at purchase) are rendered as high-visibility inline alerts within the order summary rather than modals, allowing immediate retry.

### Discretion
- Claude has discretion over the specific micro-interactions for the drawer backdrop (blur vs. dim) and the exact layout of the shipping form fields (e.g., Saudi-specific city/district inputs).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Core Requirements
- `.planning/ROADMAP.md` §Phase 3 — [Overall goal and success criteria]
- `.planning/REQUIREMENTS.md` §Cart, §Checkout — [Specific CHKOUT and CART requirement IDs]

### Brand & Design
- `.planning/PROJECT.md` — [Brand personality, colors, and the marionshop reference]

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/components/ui/sheet.tsx`: Already used for `MobileNavDrawer`, provides the foundation for the cart drawer with `side` prop support for RTL.
- `src/components/ui/button.tsx`: Branded button variants already established for checkout forms.

### Established Patterns
- `useCartStore` (Zustand): Already implemented with `persist` and `addItem`/`removeItem` logic; needs extension for `updateQuantity`.
- `StoreHydration`: Already handles client-side rehydration for persisted cart state.

### Integration Points
- `src/components/nav/Navbar.tsx`: Integration point for `CartBadge`.
- `src/app/[locale]/layout.tsx`: Already wraps the app in `NextIntlClientProvider` and `StoreHydration`.

</code_context>

<specifics>
## Specific Ideas
- **"The Drop" Feel:** The cart drawer should feel snappy and editorial — use the same `animationPresets` defined in Phase 1.
- **Saudi Specifics:** Ensure the shipping form has clear fields for `District` and `City`, which are primary for Saudi addresses.

</specifics>

<deferred>
## Deferred Ideas
- **Newsletter Opt-in:** Discussed as a post-checkout "Thank You" page feature, deferred to Phase 4 (Brand & Polish).

</deferred>

---

*Phase: 3-Cart & Checkout*
*Context gathered: 2026-05-07*
