import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCartStickyBar } from '@/components/mobile/cart/MobileCartStickyBar'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('MobileCartStickyBar (components/mobile/cart/MobileCartStickyBar.tsx)', () => {
  it('renders total items count, formatted price, and triggers checkout', () => {
    const handleCheckout = vi.fn()
    render(
      <MobileCartStickyBar
        itemCount={3}
        totalPrice={450}
        onCheckout={handleCheckout}
      />
    )

    expect(screen.getByTestId('mobile-cart-sticky-bar')).toBeInTheDocument()
    expect(screen.getByText('Total (3 items)')).toBeInTheDocument()
    expect(screen.getByText('$450.00')).toBeInTheDocument()

    const checkoutBtn = screen.getByRole('button', { name: /proceed to checkout/i })
    fireEvent.click(checkoutBtn)

    expect(handleCheckout).toHaveBeenCalledTimes(1)
  })

  it('renders wholesale quote CTA when isWholesale is true', () => {
    const handleCheckout = vi.fn()
    render(
      <MobileCartStickyBar
        itemCount={5}
        totalPrice={2500}
        onCheckout={handleCheckout}
        isWholesale={true}
      />
    )

    const quoteBtn = screen.getByRole('button', { name: /submit wholesale quote/i })
    expect(quoteBtn).toBeInTheDocument()
    fireEvent.click(quoteBtn)
    expect(handleCheckout).toHaveBeenCalledTimes(1)
  })
})
