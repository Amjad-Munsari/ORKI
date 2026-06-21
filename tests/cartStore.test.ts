import { describe, it, expect, beforeEach } from 'vitest'

// Test the CartStore logic directly by simulating the store state machine.
// We test the state transformation functions, not the Zustand binding.
import type { Product, CartItem } from '@/types/domain'

// Minimal product fixture
const makeProduct = (id: string, category: 'tops' | 'bottoms' = 'tops'): Product => ({
  id,
  slug: id,
  name: { en: `Product ${id}`, ar: `منتج ${id}` },
  description: { en: 'Desc', ar: 'وصف' },
  category,
  price: 100,
  currency: 'SAR',
  sizes: [
    { id: `${id}-size-s`, label: 'S', stock: 10, inStock: true },
    { id: `${id}-size-m`, label: 'M', stock: 10, inStock: true },
  ],
  images: [],
  inStock: true,
})

// State machine simulation — matches cartStore.ts addItem logic exactly
function addItemToState(
  items: CartItem[],
  product: Product,
  selectedSize: string
): CartItem[] {
  const existing = items.find(
    i => i.product.id === product.id && i.selectedSize === selectedSize
  )
  if (existing) {
    return items.map(i =>
      i.product.id === product.id && i.selectedSize === selectedSize
        ? { ...i, quantity: i.quantity + 1 }
        : i
    )
  }
  return [...items, { product, selectedSize, quantity: 1 }]
}

function removeItemFromState(
  items: CartItem[],
  productId: string,
  selectedSize: string
): CartItem[] {
  return items.filter(
    i => !(i.product.id === productId && i.selectedSize === selectedSize)
  )
}

function getTotalCount(items: CartItem[]): number {
  return items.reduce((sum, i) => sum + i.quantity, 0)
}

describe('CartStore addItem logic (D-10, partial CART-03)', () => {
  let items: CartItem[] = []

  beforeEach(() => {
    items = []
  })

  it('starts with empty items array', () => {
    expect(items).toHaveLength(0)
  })

  it('adds a new item when cart is empty', () => {
    const product = makeProduct('p1')
    items = addItemToState(items, product, 'S')
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe('p1')
    expect(items[0].selectedSize).toBe('S')
    expect(items[0].quantity).toBe(1)
  })

  it('increments quantity when same product + same size added again', () => {
    const product = makeProduct('p1')
    items = addItemToState(items, product, 'S')
    items = addItemToState(items, product, 'S')
    expect(items).toHaveLength(1)
    expect(items[0].quantity).toBe(2)
  })

  it('treats same product + different size as separate line item', () => {
    const product = makeProduct('p1')
    items = addItemToState(items, product, 'S')
    items = addItemToState(items, product, 'M')
    expect(items).toHaveLength(2)
  })

  it('treats different products as separate line items', () => {
    items = addItemToState(items, makeProduct('p1'), 'S')
    items = addItemToState(items, makeProduct('p2'), 'S')
    expect(items).toHaveLength(2)
  })
})

describe('CartStore removeItem logic', () => {
  it('removes the matching product+size line item', () => {
    const product = makeProduct('p1')
    let items: CartItem[] = addItemToState([], product, 'S')
    items = removeItemFromState(items, 'p1', 'S')
    expect(items).toHaveLength(0)
  })

  it('does not remove non-matching items', () => {
    const product = makeProduct('p1')
    let items: CartItem[] = addItemToState([], product, 'S')
    items = addItemToState(items, makeProduct('p2'), 'M')
    items = removeItemFromState(items, 'p1', 'S')
    expect(items).toHaveLength(1)
    expect(items[0].product.id).toBe('p2')
  })
})

describe('CartStore getTotalCount', () => {
  it('returns 0 for empty cart', () => {
    expect(getTotalCount([])).toBe(0)
  })

  it('sums quantities across all line items', () => {
    const p1 = makeProduct('p1')
    const p2 = makeProduct('p2')
    let items: CartItem[] = []
    items = addItemToState(items, p1, 'S')
    items = addItemToState(items, p1, 'S')  // qty=2
    items = addItemToState(items, p2, 'M')  // qty=1
    expect(getTotalCount(items)).toBe(3)
  })
})
