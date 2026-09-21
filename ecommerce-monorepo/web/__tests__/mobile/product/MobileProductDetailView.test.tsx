import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileProductDetailView } from '@/components/mobile/product/MobileProductDetailView'
import { Product } from '@/app/[locale]/design-3/types'

vi.mock('next/navigation', () => ({
  usePathname: () => '/en/products/cnc-router',
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/components/LocaleLink', () => ({
  LocaleLink: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
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
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('MobileProductDetailView (components/mobile/product/MobileProductDetailView.tsx)', () => {
  const sampleProduct: Product = {
    id: 'prod-99',
    name: 'Industrial CNC Router 3-Axis',
    price: 3200,
    oldPrice: 3600,
    brand: 'MachMaster',
    category: 'machinery',
    rating: 4.9,
    reviewsCount: 29,
    image: '/cnc-router.jpg',
    images: ['/cnc-router.jpg', '/cnc-router-2.jpg'],
    inStock: true,
    moq: 1,
    description: 'High performance industrial CNC router for metal and wood machining.',
  }

  it('renders mobile PDP shell, header title, gallery, brand, and buy box', () => {
    render(<MobileProductDetailView product={sampleProduct} />)

    expect(screen.getByTestId('mobile-pdp')).toBeInTheDocument()
    expect(screen.getAllByText('Industrial CNC Router 3-Axis').length).toBeGreaterThan(0)
    expect(screen.getByText('MachMaster')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-gallery')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-buy-box')).toBeInTheDocument()
  })

  it('handles add to cart action with current quantity', () => {
    const handleAddToCart = vi.fn()
    render(
      <MobileProductDetailView
        product={sampleProduct}
        onAddToCart={handleAddToCart}
      />
    )

    // Trigger add from Buy Box
    const addBtn = screen.getByRole('button', { name: /add to shopping cart/i })
    fireEvent.click(addBtn)

    expect(handleAddToCart).toHaveBeenCalledWith(sampleProduct, 1)
  })

  it('handles back button press', () => {
    const handleBack = vi.fn()
    render(
      <MobileProductDetailView
        product={sampleProduct}
        onBack={handleBack}
      />
    )

    const backBtn = screen.getByRole('button', { name: /go back/i })
    fireEvent.click(backBtn)

    expect(handleBack).toHaveBeenCalledTimes(1)
  })
})
