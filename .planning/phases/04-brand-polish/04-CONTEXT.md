# Phase 4 Context: Brand & Polish

## Implementation Decisions

### 1. Home Page Architecture
- **Hero Section:** Full-bleed `relative h-[90vh]` container.
  - Image: 4:5 editorial placeholder with `object-cover`.
  - Overlay: Bottom-left aligned large typography. "ORKI / ORIGIN" in Space Grotesk.
  - Scroll Indicator: Minimal vertical line animation.
- **Featured Collection:** Horizontal scroll section or 2x2 grid with asymmetric spacing.
- **Category Navigation:** Two large high-contrast blocks (Tops / Bottoms) with hover-scale images.

### 2. Motion System (Motion + GSAP)
- **Global Page Transitions:** 
  - Implementation: `AnimatePresence` in `layout.tsx`.
  - Effect: `initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}`.
- **Scroll Reveals:** 
  - Headings: GSAP `SplitType` or character-by-character Motion stagger.
  - Images: Subtle parallax (`yPercent: -10`) using ScrollTrigger.
- **Interaction Polish:**
  - Magnetic buttons for primary CTAs.
  - Custom cursor for image galleries (optional, keep minimal).

### 3. Brand Pages
- **About Page:** 
  - Layout: Editorial-heavy, centered max-width text blocks interrupted by full-width high-grain images.
  - Content: Placeholder text focusing on "Underground Saudi Culture".
- **Contact Page:** 
  - Form: Underline-only inputs (matching checkout).
  - Quick Actions: Floating "Chat on WhatsApp" button with branded icon.

### 4. Technical Constraints
- **Performance:** Ensure GSAP ScrollTriggers are killed on component unmount.
- **Accessibility:** Use `useReducedMotion` hook from `motion/react` to disable non-essential movement.
- **RTL Symmetries:** Transitions must feel balanced in both locales (e.g., if sliding, slide direction should respect `dir`).

## Open Questions (None - Proceeding to Planning)
