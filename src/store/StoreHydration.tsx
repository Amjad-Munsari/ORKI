'use client'
import { useEffect } from 'react'
import { useCartStore } from './cartStore'

// Renders nothing — triggers cart rehydration after client mount.
// useEffect only runs on the client, so localStorage access is safe.
// Must be placed inside NextIntlClientProvider in layout.tsx.
export function StoreHydration() {
  useEffect(() => {
    useCartStore.persist.rehydrate()
  }, [])

  return null
}
