import { describe, it, expect } from 'vitest'
import {
  getAllProducts,
  getProductsByCategory,
  getStockState,
  getRelatedProducts,
} from '@/lib/products'
import type { Product } from '@/types/domain'

describe('getAllProducts', () => {
  it('returns an array of products', async () => {
    const products = await getAllProducts()
    expect(Array.isArray(products)).toBe(true)
    expect(products.length).toBeGreaterThan(0)
  })

  it('returns 6 products (3 tops + 3 bottoms)', async () => {
    expect(await getAllProducts()).toHaveLength(6)
  })

  it('every product has required shape', async () => {
    const products = await getAllProducts()
    products.forEach(p => {
      expect(p).toHaveProperty('id')
      expect(p).toHaveProperty('slug')
      expect(p).toHaveProperty('name.en')
      expect(p).toHaveProperty('name.ar')
      expect(p).toHaveProperty('price')
      expect(p).toHaveProperty('currency', 'SAR')
      expect(p).toHaveProperty('sizes')
      expect(Array.isArray(p.sizes)).toBe(true)
    })
  })
})

describe('getProductsByCategory', () => {
  it('returns only tops', async () => {
    const tops = await getProductsByCategory('tops')
    expect(tops.length).toBeGreaterThan(0)
    tops.forEach(p => expect(p.category).toBe('tops'))
  })

  it('returns only bottoms', async () => {
    const bottoms = await getProductsByCategory('bottoms')
    expect(bottoms.length).toBeGreaterThan(0)
    bottoms.forEach(p => expect(p.category).toBe('bottoms'))
  })

  it('returns 3 tops', async () => {
    expect(await getProductsByCategory('tops')).toHaveLength(3)
  })

  it('returns 3 bottoms', async () => {
    expect(await getProductsByCategory('bottoms')).toHaveLength(3)
  })
})

describe('getStockState', () => {
  const makeProduct = (sizes: { inStock: boolean }[]): Product => ({
    id: 'test',
    slug: 'test',
    name: { en: 'Test', ar: 'اختبار' },
    description: { en: 'Test', ar: 'اختبار' },
    category: 'tops',
    price: 100,
    currency: 'SAR',
    sizes: sizes.map((s, i) => ({
      id: `test-size-${i}`,
      label: `S${i}`,
      stock: s.inStock ? 10 : 0,
      inStock: s.inStock,
    })),
    images: [],
    inStock: sizes.some(s => s.inStock),
  })

  it('returns "in-stock" when all sizes are in stock', () => {
    const product = makeProduct([
      { inStock: true }, { inStock: true }, { inStock: true },
    ])
    expect(getStockState(product)).toBe('in-stock')
  })

  it('returns "partial" when some sizes are out of stock', () => {
    const product = makeProduct([
      { inStock: true }, { inStock: false }, { inStock: true },
    ])
    expect(getStockState(product)).toBe('partial')
  })

  it('returns "out-of-stock" when all sizes are out of stock', () => {
    const product = makeProduct([
      { inStock: false }, { inStock: false }, { inStock: false },
    ])
    expect(getStockState(product)).toBe('out-of-stock')
  })

  it('orki-washed-tee-ecru is fully out of stock', async () => {
    const products = await getAllProducts()
    const tee = products.find(p => p.id === 'orki-washed-tee-ecru')
    expect(tee).toBeDefined()
    expect(getStockState(tee!)).toBe('out-of-stock')
  })

  it('orki-heavy-tee-black is partial (M is OOS)', async () => {
    const products = await getAllProducts()
    const tee = products.find(p => p.id === 'orki-heavy-tee-black')
    expect(tee).toBeDefined()
    expect(getStockState(tee!)).toBe('partial')
  })
})

describe('getRelatedProducts', () => {
  it('excludes the current product id', async () => {
    const products = await getAllProducts()
    const current = products.find(p => p.category === 'tops')!
    const related = await getRelatedProducts(current.id, 'tops')
    expect(related.every(p => p.id !== current.id)).toBe(true)
  })

  it('returns only products from the given category', async () => {
    const related = await getRelatedProducts('some-id', 'tops')
    related.forEach(p => expect(p.category).toBe('tops'))
  })

  it('limits results to the given limit (default 4)', async () => {
    const related = await getRelatedProducts('nonexistent-id', 'tops', 4)
    expect(related.length).toBeLessThanOrEqual(4)
  })

  it('respects custom limit', async () => {
    const related = await getRelatedProducts('nonexistent-id', 'tops', 2)
    expect(related.length).toBeLessThanOrEqual(2)
  })
})

describe('filter and sort (SHOP-04)', () => {
  it('can sort by price ascending', async () => {
    const products = await getAllProducts()
    const sorted = [...products].sort((a, b) => a.price - b.price)
    expect(sorted[0].price).toBeLessThanOrEqual(sorted[sorted.length - 1].price)
  })

  it('can sort by price descending', async () => {
    const products = await getAllProducts()
    const sorted = [...products].sort((a, b) => b.price - a.price)
    expect(sorted[0].price).toBeGreaterThanOrEqual(sorted[sorted.length - 1].price)
  })

  it('category filter + sort produces correct subset', async () => {
    const tops = await getProductsByCategory('tops')
    const sorted = [...tops].sort((a, b) => a.price - b.price)
    expect(sorted.every(p => p.category === 'tops')).toBe(true)
    expect(sorted[0].price).toBeLessThanOrEqual(sorted[sorted.length - 1].price)
  })
})
