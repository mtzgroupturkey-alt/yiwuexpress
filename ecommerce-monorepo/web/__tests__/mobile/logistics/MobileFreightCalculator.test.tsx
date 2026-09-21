import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobileFreightCalculator } from '@/components/mobile/logistics/MobileFreightCalculator'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }))
vi.mock('next-intl', () => ({ useLocale: () => 'en' }))
vi.mock('@/components/MobileProvider', () => ({
  useMobile: () => ({ isMobile: true, isSearchOpen: false, toggleDrawer: vi.fn(), toggleSearch: vi.fn() }),
}))
vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({ settings: { companyName: 'Global Trade' } }),
}))
vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 0, totalItems: 0, items: [] }),
}))
vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: 0 }),
}))
vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}))
vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'BOTH' }),
}))
vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: false }),
}))
vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ formatPrice: (n: number) => `$${n.toFixed(2)}` }),
}))

const noop = vi.fn()

describe('MobileFreightCalculator', () => {
  it('renders transport mode pills', () => {
    render(<MobileFreightCalculator onCalculate={noop} />)
    expect(screen.getByText('Sea Freight')).toBeInTheDocument()
    expect(screen.getByText('Air Express')).toBeInTheDocument()
    expect(screen.getByText('Railway Cargo')).toBeInTheDocument()
  })

  it('renders default weight of 150', () => {
    render(<MobileFreightCalculator onCalculate={noop} />)
    expect(screen.getByDisplayValue('150')).toBeInTheDocument()
  })

  it('calls onCalculate when form is submitted', () => {
    const onCalculate = vi.fn()
    render(<MobileFreightCalculator onCalculate={onCalculate} />)
    const button = screen.getByRole('button', { name: /Calculate Freight Quote/i })
    fireEvent.click(button)
    expect(onCalculate).toHaveBeenCalledTimes(1)
    expect(onCalculate).toHaveBeenCalledWith(
      expect.objectContaining({
        origin: expect.any(String),
        destination: expect.any(String),
        serviceType: expect.any(String),
        weight: '150',
        insuranceRequired: true,
      })
    )
  })

  it('shows loading state on button when isLoading=true', () => {
    render(<MobileFreightCalculator onCalculate={noop} isLoading={true} />)
    const button = screen.getByRole('button', { name: /Calculating Freight/i })
    expect(button).toBeDisabled()
  })

  it('renders estimate price when estimate provided', () => {
    const estimate = {
      estimatedPrice: 1250,
      currency: 'USD',
      breakdown: { baseRate: 800, weightKg: 150, multiplier: 1.2, destinationFactor: 1.3 },
    }
    render(<MobileFreightCalculator onCalculate={noop} estimate={estimate} />)
    expect(screen.getByTestId('freight-estimate-result')).toBeInTheDocument()
    expect(screen.getByText('$1250.00')).toBeInTheDocument()
  })

  it('shows error message when error prop provided', () => {
    render(<MobileFreightCalculator onCalculate={noop} error="Calculation failed" />)
    expect(screen.getByText('Calculation failed')).toBeInTheDocument()
  })

  it('CBM volume display updates based on default dimensions (100×80×80 = 0.640 m³)', () => {
    render(<MobileFreightCalculator onCalculate={noop} />)
    // 100*80*80/1000000 = 0.640
    expect(screen.getByText(/0\.640\s*CBM/i)).toBeInTheDocument()
  })
})
