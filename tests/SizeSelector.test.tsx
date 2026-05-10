import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}))

import { SizeSelector } from '@/components/pdp/SizeSelector'
import type { Size } from '@/types/domain'

const sizes: Size[] = [
  { id: 'test-size-s', label: 'S', stock: 10, inStock: true },
  { id: 'test-size-m', label: 'M', stock: 0, inStock: false },
  { id: 'test-size-l', label: 'L', stock: 10, inStock: true },
]

describe('SizeSelector (PDP-04)', () => {
  it('renders a button for each size', () => {
    render(
      <SizeSelector
        sizes={sizes}
        selectedSize={null}
        onSizeChange={() => {}}
        locale="en"
      />
    )
    expect(screen.getAllByRole('button').length).toBeGreaterThanOrEqual(3)
  })

  it('OOS size button has aria-disabled="true"', () => {
    render(
      <SizeSelector
        sizes={sizes}
        selectedSize={null}
        onSizeChange={() => {}}
        locale="en"
      />
    )
    const buttons = screen.getAllByRole('button')
    const oosButton = buttons.find(b => b.textContent === 'M')
    expect(oosButton).toBeDefined()
    expect(oosButton!.getAttribute('aria-disabled')).toBe('true')
  })

  it('OOS size button has tabIndex=-1', () => {
    render(
      <SizeSelector
        sizes={sizes}
        selectedSize={null}
        onSizeChange={() => {}}
        locale="en"
      />
    )
    const buttons = screen.getAllByRole('button')
    const oosButton = buttons.find(b => b.textContent === 'M')
    expect(oosButton!.getAttribute('tabindex')).toBe('-1')
  })

  it('in-stock size button is clickable and calls onSizeChange', async () => {
    const onSizeChange = vi.fn()
    render(
      <SizeSelector
        sizes={sizes}
        selectedSize={null}
        onSizeChange={onSizeChange}
        locale="en"
      />
    )
    const buttons = screen.getAllByRole('button')
    const sButton = buttons.find(b => b.textContent === 'S')
    await userEvent.click(sButton!)
    expect(onSizeChange).toHaveBeenCalledWith('S')
  })
})
