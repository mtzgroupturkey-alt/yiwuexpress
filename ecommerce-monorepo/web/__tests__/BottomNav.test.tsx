import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomNav } from '@/components/mobile/BottomNav'

let mockPathname = '/en'
let mockIsWholesaleSession = false
let mockStoreMode = 'BOTH'
let mockCartCount = 3
let mockQuoteCount = 2
let mockWishlistCount = 5

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
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
  useMobile: () => ({ isMobile: true, isIOS: false, isAndroid: false }),
}))

vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: mockCartCount }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: mockQuoteCount }),
}))

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}))

vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({ wishlistCount: mockWishlistCount }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: mockStoreMode }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: mockIsWholesaleSession }),
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({ settings: { companyName: 'Global Trade' } }),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = ({ children, ...rest }: any) => {
    const { initial, animate, exit, transition, ...dom } = rest
    return React.createElement('div', dom, children)
  }
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('BottomNav (components/mobile/BottomNav.tsx)', () => {
  beforeEach(() => {
    mockPathname = '/en'
    mockIsWholesaleSession = false
    mockStoreMode = 'BOTH'
    mockCartCount = 3
    mockQuoteCount = 2
    mockWishlistCount = 5
  })

  it('renders all 5 core navigation items on regular routes', () => {
    render(<BottomNav />)

    expect(screen.getByRole('link', { name: /home/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /search/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /cart/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /wishlist/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /more/i })).toBeInTheDocument()
  })

  it('shows retail cart badge and routes to /cart in retail mode', () => {
    mockIsWholesaleSession = false
    render(<BottomNav />)

    const cartLink = screen.getByRole('link', { name: /cart/i })
    expect(cartLink).toHaveAttribute('href', '/cart')
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('shows wholesale quote badge and routes to /quote-cart in wholesale mode', () => {
    mockIsWholesaleSession = true
    render(<BottomNav />)

    const quoteLink = screen.getByRole('link', { name: /quotes/i })
    expect(quoteLink).toHaveAttribute('href', '/quote-cart')
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('displays wishlist count badge correctly', () => {
    render(<BottomNav />)
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('hides BottomNav on /checkout route', () => {
    mockPathname = '/en/checkout'
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('renders BottomNav on /quote-cart route with active quotes tab', () => {
    mockPathname = '/en/quote-cart'
    mockIsWholesaleSession = true
    render(<BottomNav />)
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument()
    const quoteLink = screen.getByRole('link', { name: /quotes/i })
    expect(quoteLink).toBeInTheDocument()
  })

  it('hides BottomNav on /quotes/view/[token] route', () => {
    mockPathname = '/en/quotes/view/sample-token-123'
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('opens and closes the More navigation drawer', () => {
    render(<BottomNav />)

    const moreBtn = screen.getByRole('button', { name: /more/i })
    expect(screen.queryByText('Global Trade Platform')).not.toBeInTheDocument()

    // Open drawer
    fireEvent.click(moreBtn)
    expect(screen.getByText('Global Trade Platform')).toBeInTheDocument()
    expect(screen.getByText('Track Cargo')).toBeInTheDocument()
    expect(screen.getByText('Freight Calculator')).toBeInTheDocument()

    // Close drawer
    const closeBtn = screen.getByRole('button', { name: /close menu/i })
    fireEvent.click(closeBtn)
    expect(screen.queryByText('Global Trade Platform')).not.toBeInTheDocument()
  })
})
