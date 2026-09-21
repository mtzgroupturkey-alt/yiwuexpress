import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobileTrackingView, ShipmentDetails } from '@/components/mobile/logistics/MobileTrackingView'

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

const mockShipment: ShipmentDetails = {
  trackingNumber: 'YW-2024-TEST',
  status: 'IN_TRANSIT',
  statusText: 'In Transit',
  origin: 'Ningbo, China',
  destination: 'Moscow, Russia',
  transportMode: 'sea',
  events: [
    {
      id: '1',
      title: 'Picked Up',
      location: 'Ningbo Port',
      timestamp: '2024-11-01',
      completed: true,
      current: false,
      description: 'Cargo collected from warehouse',
    },
    {
      id: '2',
      title: 'At Sea',
      location: 'Pacific Ocean',
      timestamp: '2024-11-10',
      completed: true,
      current: true,
    },
  ],
}

describe('MobileTrackingView', () => {
  it('renders the tracking input form when no shipment', () => {
    render(
      <MobileTrackingView
        shipment={null}
        searchTerm=""
        onSearch={vi.fn()}
        isLoading={false}
        error={null}
      />
    )
    expect(screen.getByPlaceholderText('e.g. YW-8892401-CN')).toBeInTheDocument()
  })

  it('shows shipment tracking number when shipment provided', () => {
    render(
      <MobileTrackingView
        shipment={mockShipment}
        searchTerm="YW-2024-TEST"
        onSearch={vi.fn()}
        isLoading={false}
        error={null}
      />
    )
    expect(screen.getByText('YW-2024-TEST')).toBeInTheDocument()
  })

  it('shows origin and destination', () => {
    render(
      <MobileTrackingView
        shipment={mockShipment}
        searchTerm="YW-2024-TEST"
        onSearch={vi.fn()}
        isLoading={false}
        error={null}
      />
    )
    expect(screen.getByText('Ningbo, China')).toBeInTheDocument()
    expect(screen.getByText('Moscow, Russia')).toBeInTheDocument()
  })

  it('renders milestone events', () => {
    render(
      <MobileTrackingView
        shipment={mockShipment}
        searchTerm="YW-2024-TEST"
        onSearch={vi.fn()}
        isLoading={false}
        error={null}
      />
    )
    expect(screen.getByText('Picked Up')).toBeInTheDocument()
    expect(screen.getByText('At Sea')).toBeInTheDocument()
  })

  it('shows loading state (Track button text changes)', () => {
    render(
      <MobileTrackingView
        shipment={null}
        searchTerm="YW-TEST"
        onSearch={vi.fn()}
        isLoading={true}
        error={null}
      />
    )
    expect(screen.getByRole('button', { name: /Tracking.../i })).toBeInTheDocument()
  })

  it('shows error message', () => {
    render(
      <MobileTrackingView
        shipment={null}
        searchTerm="BAD-001"
        onSearch={vi.fn()}
        isLoading={false}
        error="No shipment found"
      />
    )
    expect(screen.getByText('No shipment found')).toBeInTheDocument()
  })

  it('calls onSearch when form submitted', () => {
    const onSearch = vi.fn()
    render(
      <MobileTrackingView
        shipment={null}
        searchTerm=""
        onSearch={onSearch}
        isLoading={false}
        error={null}
      />
    )
    const input = screen.getByPlaceholderText('e.g. YW-8892401-CN')
    fireEvent.change(input, { target: { value: 'YW-2024-999' } })
    fireEvent.submit(input.closest('form')!)
    expect(onSearch).toHaveBeenCalledWith('YW-2024-999')
  })
})
