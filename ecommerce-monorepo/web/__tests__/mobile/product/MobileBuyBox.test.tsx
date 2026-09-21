import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileBuyBox } from '@/components/mobile/product/MobileBuyBox'
import { Product } from '@/app/[locale]/design-3/types'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({
    isWholesaleSession: false,
  }),
}))

describe('MobileBuyBox (components/mobile/product/MobileBuyBox.tsx)', () => {
  const sampleProduct: Product = {
    id: 'prod-55',
    name: 'Precision Milling Spindle',
    brand: 'PreciseTech',
    category: 'machinery',
    rating: 4.8,
    reviewsCount: 15,
    image: '/spindle.jpg',
    price: 350,
    oldPrice: 400,
    moq: 2,
    inStock: true,
  }

  it('renders unit price, discount, MOQ, and subtotal calculation', () => {
    render(
      <MobileBuyBox
        product={sampleProduct}
        quantity={3}
        onQuantityChange={vi.fn()}
        onAddToCart={vi.fn()}
      />
    )

    expect(screen.getByTestId('mobile-buy-box')).toBeInTheDocument()
    expect(screen.getByText('$350.00')).toBeInTheDocument()
    expect(screen.getByText('$400.00')).toBeInTheDocument()
    expect(screen.getByText(/Min. Order Quantity/i)).toBeInTheDocument()
    // Subtotal: 350 * 3 = 1050
    expect(screen.getByText('$1050.00')).toBeInTheDocument()
  })

  it('triggers onAddToCart when Add to Shopping Cart button is clicked', () => {
    const handleAddToCart = vi.fn()
    render(
      <MobileBuyBox
        product={sampleProduct}
        quantity={2}
        onQuantityChange={vi.fn()}
        onAddToCart={handleAddToCart}
      />
    )

    const addBtn = screen.getByRole('button', { name: /add to shopping cart/i })
    fireEvent.click(addBtn)
    expect(handleAddToCart).toHaveBeenCalledTimes(1)
  })
})
