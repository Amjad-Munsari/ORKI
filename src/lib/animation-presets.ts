// Animation presets for Motion (motion/react).
// All animation in this project uses these presets — no ad-hoc values.
// Durations in seconds (Motion convention), sourced from UI-SPEC Animation Contract.

export const animationPresets = {
  // Mobile nav drawer slide in — 200ms, decelerating ease (feels responsive)
  navEnter: {
    duration: 0.2,
    ease: [0.23, 1, 0.32, 1] as const,
  },
  // Mobile nav drawer slide out — 160ms, accelerating ease (exits faster than enters)
  navExit: {
    duration: 0.16,
    ease: [0.32, 0.72, 0, 1] as const,
  },
  // General element enter (fade in) — 200ms
  fadeIn: {
    duration: 0.2,
    ease: [0.23, 1, 0.32, 1] as const,
  },
  // General element exit (fade out) — 150ms
  fadeOut: {
    duration: 0.15,
    ease: [0.32, 0.72, 0, 1] as const,
  },
  // Phase 2 additions
  cardHover: {
    duration: 0.3,
    ease: [0, 0, 0.2, 1] as const, // CSS ease-out equivalent — smooth zoom for product card
  },
  badgePop: {
    duration: 0.15,
    ease: [0.34, 1.56, 0.64, 1] as const, // slight overshoot for tactile badge pop
  },
  dropdownOpen: {
    duration: 0.15,
    ease: [0.23, 1, 0.32, 1] as const, // reuse navEnter easing for category dropdown
  },
  successState: {
    duration: 0.15,
    ease: [0.23, 1, 0.32, 1] as const, // AddToCartButton label swap fade
  },
} as const;

// Type helper for consumers
export type AnimationPresetKey = keyof typeof animationPresets;
