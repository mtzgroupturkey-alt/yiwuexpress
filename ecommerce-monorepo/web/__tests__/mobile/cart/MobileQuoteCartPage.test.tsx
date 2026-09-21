import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileQuoteCartPage } from '@/components/mobile/cart/MobileQuoteCartPage'
import { QuoteCartItem } from '@/components/QuoteCartContext'

const mockPush = vi.fn()
const mockBack = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
  usePathname: () => '/en/quote-cart',
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/components/MobileProvider', () => ({
  useMobile: () => ({
    isMobile: true,
    isIOS: false,
    isAndroid: false,
    isSearchOpen: false,
    toggleDrawer: vi.fn(),
    toggleSearch: vi.fn(),
  }),
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: {
      companyName: 'Global Trade',
      companyLogo: null,
    },
  }),
}))

vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 0 }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: 2 }),
}))

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'WHOLESALE' }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: true }),
}))

describe('MobileQuoteCartPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const mockItems: QuoteCartItem[] = [
    {
      productId: 'prod-1',
      productName: 'Commercial Espresso Machine',
      productSku: 'CEM-2026',
      productImage: '/test-machine.jpg',
      quantity: 5,
      minOrderQty: 2,
      targetPrice: 350,
      customerNotes: 'Need EU 220V plug',
      selectedOptions: { Voltage: '220V', Color: 'Silver' },
    },
    {
      productId: 'prod-2',
      productName: 'Heavy Duty Induction Cooker',
      productSku: 'HDIC-5000',
      productImage: '/test-cooker.jpg',
      quantity: 10,
      minOrderQty: 5,
      targetPrice: 120,
    },
  ]

  const defaultProps = {
    items: mockItems,
    quoteCount: 2,
    totalUnits: 15,
    guestInfo: {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Trade LLC',
      phone: '+1 555-1234',
      taxId: 'US-987654321',
    },
    setGuestInfo: vi.fn(),
    shipping: {
      country: 'United States',
      city: 'Los Angeles',
      address: '123 Harbor Blvd',
      targetDeliveryDate: '2026-10-15',
      preferredShippingMode: 'SEA',
    },
    setShipping: vi.fn(),
    customerNotes: 'Urgent wholesale project',
    setCustomerNotes: vi.fn(),
    submitting: false,
    onQuantityChange: vi.fn(),
    onUpdateItem: vi.fn(),
    onRemoveItem: vi.fn(),
    onClearCart: vi.fn(),
    onSubmit: vi.fn(),
    onBrowseCatalog: vi.fn(),
  }

  it('renders EmptyState when quote cart items array is empty', () => {
    render(
      <MobileQuoteCartPage
        {...defaultProps}
        items={[]}
        quoteCount={0}
        totalUnits={0}
      />
    )

    expect(screen.getByText('Your Quote Cart is Empty')).toBeInTheDocument()
    const browseBtn = screen.getByRole('button', { name: /explore catalog/i })
    fireEvent.click(browseBtn)
    expect(defaultProps.onBrowseCatalog).toHaveBeenCalled()
  })

  it('renders quote items list, wholesale badge, and sticky submit bar', () => {
    render(<MobileQuoteCartPage {...defaultProps} />)

    // Wholesale badge check
    expect(screen.getByText('B2B Wholesale RFQ')).toBeInTheDocument()
    expect(screen.getByText(/2 Items · 15 Units/i)).toBeInTheDocument()

    // Products check
    expect(screen.getByText('Commercial Espresso Machine')).toBeInTheDocument()
    expect(screen.getByText('Heavy Duty Induction Cooker')).toBeInTheDocument()
    expect(screen.getByText('SKU: CEM-2026')).toBeInTheDocument()

    // Sticky submit button
    const submitBtn = screen.getByTestId('mobile-quote-submit-btn')
    expect(submitBtn).toBeInTheDocument()
    expect(screen.getByText('15 Total Units')).toBeInTheDocument()
  })

  it('calls onQuantityChange when increment or decrement buttons are clicked', () => {
    render(<MobileQuoteCartPage {...defaultProps} />)

    const decBtn = screen.getAllByLabelText('Decrease quantity')[0]
    fireEvent.click(decBtn)
    expect(defaultProps.onQuantityChange).toHaveBeenCalledWith('prod-1', 4, 2, { Voltage: '220V', Color: 'Silver' })

    const incBtn = screen.getAllByLabelText('Increase quantity')[0]
    fireEvent.click(incBtn)
    expect(defaultProps.onQuantityChange).toHaveBeenCalledWith('prod-1', 6, 2, { Voltage: '220V', Color: 'Silver' })
  })

  it('calls onRemoveItem when trash button is clicked', () => {
    render(<MobileQuoteCartPage {...defaultProps} />)

    const removeBtn = screen.getByLabelText('Remove Commercial Espresso Machine')
    fireEvent.click(removeBtn)
    expect(defaultProps.onRemoveItem).toHaveBeenCalledWith('prod-1', { Voltage: '220V', Color: 'Silver' })
  })

  it('calls onClearCart when Clear button is clicked', () => {
    render(<MobileQuoteCartPage {...defaultProps} />)

    const clearBtn = screen.getByRole('button', { name: 'Clear' })
    fireEvent.click(clearBtn)
    expect(defaultProps.onClearCart).toHaveBeenCalled()
  })
})
