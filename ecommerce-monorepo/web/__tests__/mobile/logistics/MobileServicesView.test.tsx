import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobileServicesView, MobileServiceItem } from '@/components/mobile/logistics/MobileServicesView'

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

const mockServices: MobileServiceItem[] = [
  {
    id: 'svc-001',
    title: 'Ocean Freight FCL',
    type: 'shipping',
    description: 'Full container load sea freight from China to anywhere.',
    features: ['Door to door', 'Real-time tracking'],
    price: 1200,
  },
  {
    id: 'svc-002',
    title: 'Customs Clearance',
    type: 'customs',
    description: 'Hassle-free customs clearance in your destination country.',
    price: 350,
  },
  {
    id: 'svc-003',
    title: 'China Sourcing',
    type: 'sourcing',
    description: 'Expert factory sourcing and quality control in China.',
    price: null,
  },
]

describe('MobileServicesView', () => {
  it('renders all services by default', () => {
    render(<MobileServicesView services={mockServices} />)
    expect(screen.getByText('Ocean Freight FCL')).toBeInTheDocument()
    expect(screen.getByText('Customs Clearance')).toBeInTheDocument()
    expect(screen.getByText('China Sourcing')).toBeInTheDocument()
  })

  it('renders filter tabs', () => {
    render(<MobileServicesView services={mockServices} />)
    expect(screen.getByText('All Services')).toBeInTheDocument()
    expect(screen.getByText('Shipping')).toBeInTheDocument()
    expect(screen.getByText('Customs')).toBeInTheDocument()
  })

  it('filters services by tab selection', () => {
    render(<MobileServicesView services={mockServices} />)
    fireEvent.click(screen.getByText('Shipping'))
    expect(screen.getByText('Ocean Freight FCL')).toBeInTheDocument()
    expect(screen.queryByText('Customs Clearance')).not.toBeInTheDocument()
  })

  it('filters services by search query', () => {
    render(<MobileServicesView services={mockServices} />)
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'sourcing' } })
    expect(screen.getByText('China Sourcing')).toBeInTheDocument()
    expect(screen.queryByText('Ocean Freight FCL')).not.toBeInTheDocument()
  })

  it('shows loading skeletons when isLoading=true', () => {
    render(<MobileServicesView services={[]} isLoading={true} />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('calls onSelectService when card is tapped', () => {
    const onSelectService = vi.fn()
    render(<MobileServicesView services={mockServices} onSelectService={onSelectService} />)
    const cards = document.querySelectorAll('[data-testid="mobile-services-view"] .cursor-pointer')
    fireEvent.click(cards[0])
    expect(onSelectService).toHaveBeenCalledWith(mockServices[0])
  })

  it('shows empty state when no services match', () => {
    render(<MobileServicesView services={mockServices} />)
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: 'xxxxxxnonexistent' } })
    expect(screen.getByText('No Services Found')).toBeInTheDocument()
  })
})
