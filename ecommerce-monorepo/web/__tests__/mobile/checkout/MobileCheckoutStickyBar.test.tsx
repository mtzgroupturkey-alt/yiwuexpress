import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCheckoutStickyBar } from '@/components/mobile/checkout/MobileCheckoutStickyBar'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('MobileCheckoutStickyBar (components/mobile/checkout/MobileCheckoutStickyBar.tsx)', () => {
  it('renders total price and "Continue to Delivery" for Step 1', () => {
    const handleNext = vi.fn()
    render(
      <MobileCheckoutStickyBar
        currentStep={1}
        total={250}
        onNext={handleNext}
      />
    )

    expect(screen.getByTestId('mobile-checkout-sticky-bar')).toBeInTheDocument()
    expect(screen.getByText('$250.00')).toBeInTheDocument()
    expect(screen.getByText('Continue to Delivery')).toBeInTheDocument()

    const btn = screen.getByRole('button', { name: /continue to delivery/i })
    fireEvent.click(btn)

    expect(handleNext).toHaveBeenCalledTimes(1)
  })

  it('renders "Place Order" for Step 3 and shows submitting state', () => {
    render(
      <MobileCheckoutStickyBar
        currentStep={3}
        total={300}
        onNext={vi.fn()}
        isSubmitting={true}
      />
    )

    expect(screen.getByText('Placing Order...')).toBeInTheDocument()
  })
})
