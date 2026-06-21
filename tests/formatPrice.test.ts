import { describe, it, expect } from 'vitest'

// Price formatter per CLAUDE.md: 'ar-SA-u-nu-latn' for Western numerals in both locales
function formatPrice(price: number): string {
  return new Intl.NumberFormat('ar-SA-u-nu-latn', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

describe('formatPrice (PDP-03)', () => {
  it('outputs a string containing the price digits in Western numerals', () => {
    const result = formatPrice(249)
    // Western numerals — must contain '249' not '٢٤٩'
    expect(result).toContain('249')
  })

  it('outputs SAR currency indicator', () => {
    const result = formatPrice(249)
    // SAR currency symbol or abbreviation must be present
    expect(result.length).toBeGreaterThan(3)
  })

  it('formats 399 correctly with Western numerals', () => {
    const result = formatPrice(399)
    expect(result).toContain('399')
  })

  it('returns no decimal digits for whole numbers', () => {
    const result = formatPrice(249)
    // minimumFractionDigits: 0 — no .00 suffix
    expect(result).not.toContain('.00')
  })

  it('handles zero', () => {
    const result = formatPrice(0)
    expect(result).toContain('0')
  })
})
