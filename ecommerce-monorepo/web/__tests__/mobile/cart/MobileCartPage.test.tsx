import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCartPage } from '@/components/mobile/cart/MobileCartPage'
import { MobileCartItemData } from '@/components/mobile/cart/MobileCartItem'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/en/cart',
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
  useCart: () => ({ cartCount: 2 }),
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

describe('MobileCartPage (components/mobile/cart/MobileCartPage.tsx)', () => {
  const sampleItems: MobileCartItemData[] = [
    {
      id: 'i1',
      productId: 'p1',
      name: 'Precision Milling Chuck',
      price: 80,
      quantity: 1,
      stock: 20,
    },
    {
      id: 'i2',
      productId: 'p2',
      name: 'Carbide End Mill 4-Flute',
      price: 45,
      quantity: 2,
      stock: 50,
    },
  ]

  it('renders cart items, cost summary, and sticky checkout bar', () => {
    render(
      <MobileCartPage
        items={sampleItems}
        subtotal={170}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={vi.fn()}
      />
    )

    expect(screen.getByTestId('mobile-cart-page')).toBeInTheDocument()
    expect(screen.getByText('Precision Milling Chuck')).toBeInTheDocument()
    expect(screen.getByText('Carbide End Mill 4-Flute')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-cart-summary')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-cart-sticky-bar')).toBeInTheDocument()
  })

  it('renders EmptyState when cart is empty', () => {
    const handleContinueShopping = vi.fn()
    render(
      <MobileCartPage
        items={[]}
        subtotal={0}
        onUpdateQuantity={vi.fn()}
        onRemoveItem={vi.fn()}
        onCheckout={vi.fn()}
        onContinueShopping={handleContinueShopping}
      />
    )

    expect(screen.getByText('Your Cart is Empty')).toBeInTheDocument()
    const startShoppingBtn = screen.getByRole('button', { name: /start shopping/i })
    fireEvent.click(startShoppingBtn)
    expect(handleContinueShopping).toHaveBeenCalledTimes(1)
  })
})
