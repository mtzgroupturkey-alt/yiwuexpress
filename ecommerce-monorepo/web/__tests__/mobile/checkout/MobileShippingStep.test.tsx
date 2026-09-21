import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileShippingStep, ShippingMethodOption } from '@/components/mobile/checkout/MobileShippingStep'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('MobileShippingStep (components/mobile/checkout/MobileShippingStep.tsx)', () => {
  const sampleMethods: ShippingMethodOption[] = [
    {
      id: 'standard',
      name: 'Standard Cargo Line',
      estimatedDays: '7-10 days',
      fee: 20,
      description: 'Fully tracked door-to-door',
    },
    {
      id: 'express',
      name: 'Air Express Priority',
      estimatedDays: '3-5 days',
      fee: 45,
      description: 'Direct air courier line',
    },
  ]

  it('renders shipping methods with prices and estimated delivery times', () => {
    render(
      <MobileShippingStep
        methods={sampleMethods}
        selectedMethod="standard"
        onSelectMethod={vi.fn()}
      />
    )

    expect(screen.getByTestId('mobile-shipping-step')).toBeInTheDocument()
    expect(screen.getByText('Standard Cargo Line')).toBeInTheDocument()
    expect(screen.getByText('7-10 days')).toBeInTheDocument()
    expect(screen.getByText('$20.00')).toBeInTheDocument()
    expect(screen.getByText('Air Express Priority')).toBeInTheDocument()
    expect(screen.getByText('3-5 days')).toBeInTheDocument()
    expect(screen.getByText('$45.00')).toBeInTheDocument()
  })

  it('triggers onSelectMethod when a shipping method is tapped', () => {
    const handleSelect = vi.fn()
    render(
      <MobileShippingStep
        methods={sampleMethods}
        selectedMethod="standard"
        onSelectMethod={handleSelect}
      />
    )

    const expressOption = screen.getByText('Air Express Priority').closest('button')
    fireEvent.click(expressOption!)

    expect(handleSelect).toHaveBeenCalledWith('express')
  })
})
