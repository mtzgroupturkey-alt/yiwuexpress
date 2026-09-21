import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobileRfqForm } from '@/components/mobile/logistics/MobileRfqForm'

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

const mockServices = [
  { id: 'svc-001', title: 'Ocean Freight' },
  { id: 'svc-002', title: 'Air Freight' },
]

describe('MobileRfqForm', () => {
  it('renders submit button', () => {
    render(<MobileRfqForm services={mockServices} onSubmit={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Submit RFQ/i })).toBeInTheDocument()
  })

  it('populates service dropdown options', () => {
    render(<MobileRfqForm services={mockServices} onSubmit={vi.fn()} />)
    expect(screen.getByText('Ocean Freight')).toBeInTheDocument()
    expect(screen.getByText('Air Freight')).toBeInTheDocument()
  })

  it('uses default origin containing China', () => {
    render(<MobileRfqForm services={mockServices} onSubmit={vi.fn()} />)
    expect(screen.getByDisplayValue(/China/i)).toBeInTheDocument()
  })

  it('calls onSubmit when form submitted with valid data', async () => {
    const onSubmit = vi.fn()
    render(<MobileRfqForm services={mockServices} onSubmit={onSubmit} />)

    // Fill destination (required)
    const destInput = screen.getByPlaceholderText(/Moscow, Russia/i)
    fireEvent.change(destInput, { target: { value: 'Moscow, Russia' } })

    // Fill description (required)
    const descInput = screen.getByPlaceholderText(/CNC tooling/i)
    fireEvent.change(descInput, { target: { value: 'Electronics goods' } })

    fireEvent.submit(screen.getByRole('button', { name: /Submit RFQ/i }).closest('form')!)

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          destination: 'Moscow, Russia',
          description: 'Electronics goods',
        })
      )
    })
  })

  it('shows submitting state when isSubmitting=true', () => {
    render(<MobileRfqForm services={mockServices} onSubmit={vi.fn()} isSubmitting={true} />)
    const button = screen.getByRole('button', { name: /Submitting RFQ/i })
    expect(button).toBeDisabled()
  })

  it('shows error message when error prop provided', () => {
    render(
      <MobileRfqForm
        services={mockServices}
        onSubmit={vi.fn()}
        error="You must be logged in to submit a quote."
      />
    )
    expect(screen.getByText('You must be logged in to submit a quote.')).toBeInTheDocument()
  })

  it('populates initial description when initialData provided', () => {
    render(
      <MobileRfqForm
        services={mockServices}
        onSubmit={vi.fn()}
        initialData={{ description: 'Pre-filled description' }}
      />
    )
    expect(screen.getByDisplayValue('Pre-filled description')).toBeInTheDocument()
  })

  it('shows validation error if destination left blank on submit', async () => {
    render(<MobileRfqForm services={mockServices} onSubmit={vi.fn()} />)
    // Submit with empty destination
    fireEvent.submit(screen.getByRole('button', { name: /Submit RFQ/i }).closest('form')!)
    await waitFor(() => {
      expect(screen.getByText('Destination is required')).toBeInTheDocument()
    })
  })
})
