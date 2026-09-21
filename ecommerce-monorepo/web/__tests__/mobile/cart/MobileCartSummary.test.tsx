import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCartSummary } from '@/components/mobile/cart/MobileCartSummary'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('MobileCartSummary (components/mobile/cart/MobileCartSummary.tsx)', () => {
  it('renders subtotal, weight, and total amount calculation', () => {
    render(
      <MobileCartSummary
        subtotal={500}
        totalWeight={4.2}
        estimatedShipping={30}
        tax={10}
        discount={20}
      />
    )

    expect(screen.getByTestId('mobile-cart-summary')).toBeInTheDocument()
    expect(screen.getByText('Subtotal')).toBeInTheDocument()
    expect(screen.getByText('$500.00')).toBeInTheDocument()
    expect(screen.getByText('4.20 kg')).toBeInTheDocument()
    expect(screen.getByText('$30.00')).toBeInTheDocument()
    expect(screen.getByText('$10.00')).toBeInTheDocument()
    expect(screen.getByText('-$20.00')).toBeInTheDocument()
    // 500 + 30 + 10 - 20 = 520
    expect(screen.getByText('$520.00')).toBeInTheDocument()
  })

  it('allows expanding promo code section and submitting a voucher', () => {
    const handleApplyPromo = vi.fn()
    render(
      <MobileCartSummary
        subtotal={300}
        onApplyPromoCode={handleApplyPromo}
      />
    )

    const toggleBtn = screen.getByText(/have a promo code/i)
    fireEvent.click(toggleBtn)

    const input = screen.getByPlaceholderText(/enter promo code/i)
    fireEvent.change(input, { target: { value: 'GLOBAL50' } })

    const applyBtn = screen.getByRole('button', { name: /apply/i })
    fireEvent.click(applyBtn)

    expect(handleApplyPromo).toHaveBeenCalledWith('GLOBAL50')
  })
})
