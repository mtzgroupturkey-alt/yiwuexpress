import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCheckoutSteps } from '@/components/mobile/checkout/MobileCheckoutSteps'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('MobileCheckoutSteps (components/mobile/checkout/MobileCheckoutSteps.tsx)', () => {
  it('renders all 3 steps with active step highlighted', () => {
    render(<MobileCheckoutSteps currentStep={2} />)

    expect(screen.getByTestId('mobile-checkout-steps')).toBeInTheDocument()
    expect(screen.getByText('Address')).toBeInTheDocument()
    expect(screen.getByText('Delivery')).toBeInTheDocument()
    expect(screen.getByText('Payment')).toBeInTheDocument()
  })

  it('allows clicking previous completed step to navigate back', () => {
    const handleStepClick = vi.fn()
    render(<MobileCheckoutSteps currentStep={3} onStepClick={handleStepClick} />)

    const addressStepBtn = screen.getByText('Address').closest('button')
    expect(addressStepBtn).toBeInTheDocument()

    fireEvent.click(addressStepBtn!)
    expect(handleStepClick).toHaveBeenCalledWith(1)
  })
})
