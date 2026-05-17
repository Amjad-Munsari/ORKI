'use client'

import { useState, useRef } from 'react'
import { Link } from '@/i18n/navigation'
import { motion, AnimatePresence } from 'motion/react'

interface ShopDropdownProps {
  label: string
  items: {
    label: string
    href: string
  }[]
}

export function ShopDropdown({ label, items }: ShopDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setIsOpen(true)
  }

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false)
    }, 150) // Small delay to prevent flickering
  }

  return (
    <div 
      className="relative h-full flex items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href="/shop"
        className="flex items-center gap-1 text-sm font-medium tracking-tight hover:opacity-60 transition-opacity"
      >
        {label}
      </Link>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute top-full start-0 min-w-[160px] bg-white border border-black/5 shadow-xl py-2 z-50"
          >
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block px-6 py-3 text-sm font-medium hover:bg-black/5 transition-colors whitespace-nowrap"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
