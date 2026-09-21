import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileOrderSummaryCard, CheckoutSummaryItem } from '@/components/mobile/checkout/MobileOrderSummaryCard'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('MobileOrderSummaryCard (components/mobile/checkout/MobileOrderSummaryCard.tsx)', () => {
  const sampleItems: CheckoutSummaryItem[] = [
    {
      id: 'it-1',
      name: 'Industrial Torque Wrench',
      quantity: 2,
      price: 65,
    },
  ]

  it('renders order summary collapsed header with total price', () => {
    render(
      <MobileOrderSummaryCard
        items={sampleItems}
        subtotal={130}
        shippingFee={20}
        total={150}
      />
    )

    expect(screen.getByTestId('mobile-order-summary-card')).toBeInTheDocument()
    expect(screen.getByText(/Order Summary \(2 items\)/i)).toBeInTheDocument()
    expect(screen.getByText('$150.00')).toBeInTheDocument()
  })

  it('expands to reveal item details and subtotal breakdown on click', () => {
    render(
      <MobileOrderSummaryCard
        items={sampleItems}
        subtotal={130}
        shippingFee={20}
        total={150}
      />
    )

    const trigger = screen.getByRole('button', { name: /order summary/i })
    fireEvent.click(trigger)

    expect(screen.getByText('Industrial Torque Wrench')).toBeInTheDocument()
    expect(screen.getAllByText('$130.00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('$20.00')).toBeInTheDocument()
  })
})

