import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileCheckoutPage } from '@/components/mobile/checkout/MobileCheckoutPage'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => '/en/checkout',
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
  useCart: () => ({ cartCount: 1 }),
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

describe('MobileCheckoutPage (components/mobile/checkout/MobileCheckoutPage.tsx)', () => {
  const sampleItems = [
    {
      id: 'i1',
      name: 'Pneumatic Impact Wrench',
      quantity: 1,
      price: 150,
    },
  ]

  const sampleCountries = [
    { id: 'c-us', name: 'United States' },
    { id: 'c-de', name: 'Germany' },
  ]

  const validFormData = {
    customerName: 'Marcus Vance',
    customerEmail: 'marcus@example.com',
    customerPhone: '+1 555 123 4567',
    shippingAddress: '100 Commerce Way',
    shippingCity: 'New York',
    shippingPostalCode: '10001',
    shippingCountryId: 'c-us',
  }

  it('renders checkout header, progress steps, order summary card, and address step', () => {
    render(
      <MobileCheckoutPage
        items={sampleItems}
        subtotal={150}
        shippingFee={25}
        countries={sampleCountries}
        initialFormData={validFormData}
        onSubmitOrder={vi.fn()}
      />
    )

    expect(screen.getByTestId('mobile-checkout-page')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-checkout-steps')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-order-summary-card')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-address-step')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-checkout-sticky-bar')).toBeInTheDocument()
  })

  it('progresses through steps from Address to Delivery to Payment', () => {
    render(
      <MobileCheckoutPage
        items={sampleItems}
        subtotal={150}
        shippingFee={25}
        countries={sampleCountries}
        initialFormData={validFormData}
        onSubmitOrder={vi.fn()}
      />
    )

    // In step 1, clicking continue progresses to step 2 (Delivery)
    const nextBtn = screen.getByRole('button', { name: /continue to delivery/i })
    fireEvent.click(nextBtn)

    expect(screen.getByTestId('mobile-shipping-step')).toBeInTheDocument()

    // In step 2, clicking continue progresses to step 3 (Payment)
    const continueToPayBtn = screen.getByRole('button', { name: /continue to payment/i })
    fireEvent.click(continueToPayBtn)

    expect(screen.getByTestId('mobile-payment-step')).toBeInTheDocument()
  })
})
