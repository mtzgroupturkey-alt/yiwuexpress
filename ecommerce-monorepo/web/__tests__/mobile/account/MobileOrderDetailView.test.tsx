import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { MobileOrderDetailView, OrderDetailData } from '@/components/mobile/account/MobileOrderDetailView'

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

const mockOrder: OrderDetailData = {
  id: 'ord-123',
  orderNumber: 'ORD-2024-999',
  status: 'PROCESSING',
  paymentStatus: 'PAID',
  paymentMethod: 'Credit Card',
  total: 620,
  subtotal: 550,
  shippingFee: 50,
  tax: 20,
  discount: 0,
  createdAt: '2024-11-01T10:00:00Z',
  customerName: 'Alexey Romanov',
  customerEmail: 'alexey@example.com',
  customerPhone: '+7 999 123 4567',
  shippingAddress: 'Tverskaya St 12, Apt 4',
  shippingCity: 'Moscow',
  shippingPostalCode: '101000',
  trackingNumber: 'YE-883921-CN',
  carrier: 'China-Russia Railway Line',
  items: [
    {
      id: 'item-1',
      productName: 'CNC Milling Drills 100-Pack',
      productSku: 'CNC-M100',
      quantity: 2,
      price: 275,
      total: 550,
    },
  ],
  shippingCountry: {
    name: 'Russia',
    flag: '🇷🇺',
  },
}

describe('MobileOrderDetailView', () => {
  it('renders order number, status, and milestone progress', () => {
    render(<MobileOrderDetailView order={mockOrder} />)
    expect(screen.getByText('ORD-2024-999')).toBeInTheDocument()
    expect(screen.getByText('PROCESSING')).toBeInTheDocument()
    expect(screen.getByText('Processing')).toBeInTheDocument()
  })

  it('renders purchased items with SKU, quantity, and price', () => {
    render(<MobileOrderDetailView order={mockOrder} />)
    expect(screen.getByText('CNC Milling Drills 100-Pack')).toBeInTheDocument()
    expect(screen.getByText(/CNC-M100/i)).toBeInTheDocument()
    expect(screen.getAllByText('$550.00').length).toBeGreaterThan(0)
  })

  it('renders total and cost breakdown', () => {
    render(<MobileOrderDetailView order={mockOrder} />)
    expect(screen.getByText('$620.00')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
  })

  it('renders customer shipping address and contact info', () => {
    render(<MobileOrderDetailView order={mockOrder} />)
    expect(screen.getByText(/Alexey Romanov/i)).toBeInTheDocument()
    expect(screen.getByText(/Tverskaya St 12/i)).toBeInTheDocument()
    expect(screen.getAllByText(/Russia/i).length).toBeGreaterThan(0)
  })

  it('renders tracking button when trackingNumber is present', () => {
    render(<MobileOrderDetailView order={mockOrder} />)
    expect(screen.getByText('YE-883921-CN')).toBeInTheDocument()
    expect(screen.getByText('Live Cargo Tracking')).toBeInTheDocument()
  })

  it('handles loading state with skeletons', () => {
    render(<MobileOrderDetailView order={null} isLoading={true} />)
    const skeletons = document.querySelectorAll('.animate-pulse')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('calls onBack handler when back button is pressed', () => {
    const onBack = vi.fn()
    render(<MobileOrderDetailView order={mockOrder} onBack={onBack} />)
    const backBtn = screen.getByRole('button', { name: /back/i })
    fireEvent.click(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
  })
})
