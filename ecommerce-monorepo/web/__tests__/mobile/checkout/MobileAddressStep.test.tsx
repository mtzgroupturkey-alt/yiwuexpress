import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileAddressStep, AddressFormData } from '@/components/mobile/checkout/MobileAddressStep'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

describe('MobileAddressStep (components/mobile/checkout/MobileAddressStep.tsx)', () => {
  const sampleFormData: AddressFormData = {
    customerName: 'Alice Zhang',
    customerEmail: 'alice@example.com',
    customerPhone: '+1 234 567 8900',
    shippingAddress: '456 Industrial Blvd',
    shippingCity: 'Chicago',
    shippingPostalCode: '60601',
    shippingCountryId: 'c-us',
  }

  const sampleCountries = [
    { id: 'c-us', name: 'United States' },
    { id: 'c-cn', name: 'China' },
  ]

  it('renders input fields with provided form values', () => {
    render(
      <MobileAddressStep
        formData={sampleFormData}
        onChange={vi.fn()}
        countries={sampleCountries}
      />
    )

    expect(screen.getByTestId('mobile-address-step')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Alice Zhang')).toBeInTheDocument()
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('+1 234 567 8900')).toBeInTheDocument()
    expect(screen.getByDisplayValue('456 Industrial Blvd')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Chicago')).toBeInTheDocument()
    expect(screen.getByDisplayValue('60601')).toBeInTheDocument()
  })

  it('triggers onChange when inputs change', () => {
    const handleChange = vi.fn()
    render(
      <MobileAddressStep
        formData={sampleFormData}
        onChange={handleChange}
        countries={sampleCountries}
      />
    )

    const nameInput = screen.getByPlaceholderText(/e\.g\. John Doe/i)
    fireEvent.change(nameInput, { target: { value: 'Robert Miller' } })

    expect(handleChange).toHaveBeenCalledWith({ customerName: 'Robert Miller' })
  })

  it('renders validation error messages', () => {
    render(
      <MobileAddressStep
        formData={sampleFormData}
        onChange={vi.fn()}
        countries={sampleCountries}
        errors={{ customerName: 'Full Name is required' }}
      />
    )

    expect(screen.getByText('Full Name is required')).toBeInTheDocument()
  })
})
