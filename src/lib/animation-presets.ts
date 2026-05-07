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
} as const;

// Type helper for consumers
export type AnimationPresetKey = keyof typeof animationPresets;
