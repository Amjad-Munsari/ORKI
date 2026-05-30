'use client'

import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'

/**
 * Hydration-safe wrapper around motion's `useReducedMotion`.
 *
 * WHY: motion's `useReducedMotion` reads `matchMedia('(prefers-reduced-motion)')`
 * synchronously on the client's FIRST render, but the server has no matchMedia
 * and always resolves to "no reduced motion". Any component that branches its
 * RENDERED OUTPUT (markup or inline style) on the raw value therefore emits
 * different HTML on the server vs the client's first paint for users who have
 * `prefers-reduced-motion: reduce` set — a React hydration mismatch.
 *
 * This hook returns `false` (the server's assumption) for SSR and the first
 * client render, then the user's real preference after mount. Server and client
 * agree on the initial markup; the preference takes effect one tick later.
 *
 * Use this ONLY where the value affects render output. For values used only in
 * effects or event handlers (e.g. scroll `behavior`), the raw `useReducedMotion`
 * is fine and has no hydration impact.
 */
export function useReducedMotionSafe(): boolean {
  const reduced = useReducedMotion()
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated ? !!reduced : false
}
