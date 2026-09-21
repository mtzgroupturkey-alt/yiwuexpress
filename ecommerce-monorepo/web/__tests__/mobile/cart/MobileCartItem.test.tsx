import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCartItem, MobileCartItemData } from '@/components/mobile/cart/MobileCartItem'

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('MobileCartItem (components/mobile/cart/MobileCartItem.tsx)', () => {
  const sampleItem: MobileCartItemData = {
    id: 'ci-1',
    productId: 'p-1',
    name: 'Heavy Duty Hydraulic Valve',
    price: 120,
    quantity: 2,
    stock: 10,
    weightKg: 1.5,
    variantName: '3/4 inch Port',
    image: '/valve.jpg',
  }

  it('renders item name, variant, unit price, total price, and calculated weight', () => {
    render(
      <MobileCartItem
        item={sampleItem}
        onUpdateQuantity={vi.fn()}
        onRemove={vi.fn()}
      />
    )

    expect(screen.getByTestId('mobile-cart-item')).toBeInTheDocument()
    expect(screen.getByText('Heavy Duty Hydraulic Valve')).toBeInTheDocument()
    expect(screen.getByText('3/4 inch Port')).toBeInTheDocument()
    expect(screen.getByText('$240.00')).toBeInTheDocument()
    expect(screen.getByText('$120.00 / unit')).toBeInTheDocument()
    expect(screen.getByText('3.00 kg')).toBeInTheDocument()
  })

  it('handles remove item click', () => {
    const handleRemove = vi.fn()
    render(
      <MobileCartItem
        item={sampleItem}
        onUpdateQuantity={vi.fn()}
        onRemove={handleRemove}
      />
    )

    const removeBtn = screen.getByRole('button', { name: /remove heavy duty hydraulic valve/i })
    fireEvent.click(removeBtn)

    expect(handleRemove).toHaveBeenCalledWith('ci-1')
  })

  it('handles quantity increase and decrease', () => {
    const handleUpdate = vi.fn()
    render(
      <MobileCartItem
        item={sampleItem}
        onUpdateQuantity={handleUpdate}
        onRemove={vi.fn()}
      />
    )

    const incBtn = screen.getByRole('button', { name: /increase quantity/i })
    fireEvent.click(incBtn)
    expect(handleUpdate).toHaveBeenCalledWith('ci-1', 3)

    const decBtn = screen.getByRole('button', { name: /decrease quantity/i })
    fireEvent.click(decBtn)
    expect(handleUpdate).toHaveBeenCalledWith('ci-1', 1)
  })
})
