'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

/**
 * Lenis-powered smooth scroll provider. Mounted once at the [locale]/layout
 * level so every page picks it up without per-route wiring.
 *
 * Behavior:
 *  - Only instantiates when the user does NOT prefer reduced motion. Reduced-motion
 *    users get native scroll, unchanged. Live-toggling the OS preference also
 *    starts/stops Lenis cleanly without a refresh.
 *  - Pauses while a body-scroll-lock is active (shadcn / base-ui dialogs and
 *    sheets set `data-scroll-locked` on <body> while open). This prevents Lenis
 *    from fighting the lock and lets modals scroll their own inner content.
 *  - Does NOT use Lenis's `wrapper`/`content` mode — kept on the default body
 *    scroller so `position: sticky` continues to work for the PDP info panel.
 *
 * Renders nothing — pure side-effect provider.
 */
export function SmoothScrollProvider() {
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)')

    let lenis: Lenis | null = null
    let rafId: number | null = null
    let mutationObserver: MutationObserver | null = null

    function start() {
      if (lenis) return

      lenis = new Lenis({
        duration: 1.2,
        // Canonical Lenis easing — softly decelerating, no overshoot
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      })

      const raf = (time: number) => {
        lenis?.raf(time)
        rafId = requestAnimationFrame(raf)
      }
      rafId = requestAnimationFrame(raf)

      // Pause/resume on body-scroll-lock toggles (base-ui dialog/sheet pattern)
      const syncLockState = () => {
        const locked = document.body.hasAttribute('data-scroll-locked')
        if (locked) lenis?.stop()
        else lenis?.start()
      }
      mutationObserver = new MutationObserver(syncLockState)
      mutationObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-scroll-locked'],
      })
      syncLockState()
    }

    function stop() {
      if (mutationObserver) {
        mutationObserver.disconnect()
        mutationObserver = null
      }
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      lenis?.destroy()
      lenis = null
    }

    if (!mql.matches) start()

    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) stop()
      else start()
    }
    mql.addEventListener('change', onChange)

    return () => {
      mql.removeEventListener('change', onChange)
      stop()
    }
  }, [])

  return null
}
