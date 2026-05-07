import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

vi.mock('motion/react', () => ({
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  motion: {
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
      <span {...props}>{children}</span>
    ),
  },
  useReducedMotion: () => false,
}))

vi.mock('@/store/cartStore', () => ({
  useCartStore: (selector: (state: { addItem: () => void }) => unknown) =>
    selector({ addItem: vi.fn() }),
}))

import { AddToCartButton } from '@/components/pdp/AddToCartButton'
import type { Product } from '@/types/domain'

const mockProduct: Product = {
  id: 'test-product',
  slug: 'test-product',
  name: { en: 'Test Tee', ar: 'تيشيرت' },
  description: { en: 'Desc', ar: 'وصف' },
  category: 'tops',
  price: 249,
  currency: 'SAR',
  sizes: [{ label: 'M', inStock: true }],
  images: [],
  inStock: true,
}

describe('AddToCartButton (PDP-05)', () => {
  it('is disabled when selectedSize is null', () => {
    render(
      <AddToCartButton
        product={mockProduct}
        selectedSize={null}
        locale="en"
      />
    )
    const button = screen.getByRole('button')
    expect(button).toHaveProperty('disabled', true)
  })

  it('is enabled when a size is selected', () => {
    render(
      <AddToCartButton
        product={mockProduct}
        selectedSize="M"
        locale="en"
      />
    )
    const button = screen.getByRole('button')
    expect(button).toHaveProperty('disabled', false)
  })
})
