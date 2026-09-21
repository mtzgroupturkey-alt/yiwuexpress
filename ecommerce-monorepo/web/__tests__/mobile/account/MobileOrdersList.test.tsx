import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobileOrdersList, MobileOrderData } from '@/components/mobile/account/MobileOrdersList'

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

const mockOrders: MobileOrderData[] = [
  {
    id: 'ord-001',
    orderNumber: 'ORD-2024-001',
    status: 'PAID',
    total: 250,
    createdAt: '2024-10-15T12:00:00Z',
    items: [{ id: 'item-1' }],
    shippingCountry: { name: 'Russia', flag: '🇷🇺' },
  },
  {
    id: 'ord-002',
    orderNumber: 'ORD-2024-002',
    status: 'SHIPPED',
    total: 890,
    createdAt: '2024-10-18T15:30:00Z',
    items: [{ id: 'item-2' }, { id: 'item-3' }],
    shippingCountry: { name: 'United States', flag: '🇺🇸' },
  },
]

describe('MobileOrdersList', () => {
  it('renders order list with order numbers and status badges', () => {
    render(<MobileOrdersList orders={mockOrders} />)
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument()
    expect(screen.getByText('PAID')).toBeInTheDocument()
    expect(screen.getByText('SHIPPED')).toBeInTheDocument()
  })

  it('renders total formatted price and country info', () => {
    render(<MobileOrdersList orders={mockOrders} />)
    expect(screen.getByText('$250.00')).toBeInTheDocument()
    expect(screen.getByText('$890.00')).toBeInTheDocument()
    expect(screen.getByText(/Russia/i)).toBeInTheDocument()
  })

  it('filters orders by search query input', () => {
    render(<MobileOrdersList orders={mockOrders} />)
    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.change(searchInput, { target: { value: '002' } })
    expect(screen.getByText('ORD-2024-002')).toBeInTheDocument()
    expect(screen.queryByText('ORD-2024-001')).not.toBeInTheDocument()
  })

  it('filters orders by status pill click', () => {
    render(<MobileOrdersList orders={mockOrders} />)
    const paidTab = screen.getByRole('button', { name: 'Paid' })
    fireEvent.click(paidTab)
    expect(screen.getByText('ORD-2024-001')).toBeInTheDocument()
    expect(screen.queryByText('ORD-2024-002')).not.toBeInTheDocument()
  })

  it('calls onSelectOrder when order card is clicked', () => {
    const onSelect = vi.fn()
    render(<MobileOrdersList orders={mockOrders} onSelectOrder={onSelect} />)
    fireEvent.click(screen.getByText('ORD-2024-001'))
    expect(onSelect).toHaveBeenCalledWith('ord-001')
  })

  it('renders loading skeletons when isLoading is true', () => {
    render(<MobileOrdersList orders={[]} isLoading={true} />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders empty state when orders array is empty', () => {
    render(<MobileOrdersList orders={[]} />)
    expect(screen.getByText('No Orders Found')).toBeInTheDocument()
  })
})
