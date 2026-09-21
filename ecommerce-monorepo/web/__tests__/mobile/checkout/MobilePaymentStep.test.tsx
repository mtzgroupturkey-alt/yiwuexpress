import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobilePaymentStep } from '@/components/mobile/checkout/MobilePaymentStep'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('MobilePaymentStep (components/mobile/checkout/MobilePaymentStep.tsx)', () => {
  it('renders payment method options and allows selection', () => {
    const handleSelectPayment = vi.fn()
    render(
      <MobilePaymentStep
        selectedPaymentMethod="card"
        onSelectPaymentMethod={handleSelectPayment}
        agreeTerms={false}
        onToggleAgreeTerms={vi.fn()}
      />
    )

    expect(screen.getByTestId('mobile-payment-step')).toBeInTheDocument()
    expect(screen.getByText('Credit / Debit Card')).toBeInTheDocument()
    expect(screen.getByText('PayPal Global Wallet')).toBeInTheDocument()
    expect(screen.getByText('Trade Assurance Escrow')).toBeInTheDocument()

    const paypalOption = screen.getByText('PayPal Global Wallet').closest('button')
    fireEvent.click(paypalOption!)

    expect(handleSelectPayment).toHaveBeenCalledWith('paypal')
  })

  it('handles terms agreement checkbox toggle', () => {
    const handleToggleTerms = vi.fn()
    render(
      <MobilePaymentStep
        selectedPaymentMethod="card"
        onSelectPaymentMethod={vi.fn()}
        agreeTerms={false}
        onToggleAgreeTerms={handleToggleTerms}
      />
    )

    const checkbox = screen.getByRole('checkbox')
    expect(checkbox).not.toBeChecked()

    fireEvent.click(checkbox)
    expect(handleToggleTerms).toHaveBeenCalledWith(true)
  })
})
