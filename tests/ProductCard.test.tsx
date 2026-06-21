import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock next-intl and i18n/navigation since these require a provider in tests
vi.mock('@/i18n/navigation', () => ({
  Link: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('@/components/PlaceholderImage', () => ({
  PlaceholderImage: ({ alt }: { alt: string }) => <div data-testid="placeholder" aria-label={alt} />,
}))

vi.mock('@/lib/products', () => ({
  getStockState: () => 'in-stock',
}))

import { ProductCard } from '@/components/shop/ProductCard'
import type { Product } from '@/types/domain'

const mockProduct: Product = {
  id: 'test-product',
  slug: 'test-product',
  name: { en: 'Test Tee', ar: 'تيشيرت اختبار' },
  description: { en: 'Test description', ar: 'وصف الاختبار' },
  category: 'tops',
  price: 249,
  currency: 'SAR',
  sizes: [{ id: 'test-size-m', label: 'M', stock: 10, inStock: true }],
  images: [],
  inStock: true,
}

describe('ProductCard (SHOP-03)', () => {
  it('renders the product name in EN locale', () => {
    render(<ProductCard product={mockProduct} locale="en" />)
    expect(screen.getByText('Test Tee')).toBeDefined()
  })

  it('renders the product name in AR locale', () => {
    render(<ProductCard product={mockProduct} locale="ar" />)
    expect(screen.getByText('تيشيرت اختبار')).toBeDefined()
  })

  it('renders the price with Western numerals (contains "249")', () => {
    render(<ProductCard product={mockProduct} locale="en" />)
    const priceEl = screen.getByText((content) => content.includes('249'))
    expect(priceEl).toBeDefined()
  })

  it('renders a placeholder image slot', () => {
    render(<ProductCard product={mockProduct} locale="en" />)
    expect(screen.getByTestId('placeholder')).toBeDefined()
  })

  it('wraps the card in a link to the product PDP', () => {
    render(<ProductCard product={mockProduct} locale="en" />)
    const link = screen.getByRole('link')
    expect(link.getAttribute('href')).toContain('test-product')
  })
})
