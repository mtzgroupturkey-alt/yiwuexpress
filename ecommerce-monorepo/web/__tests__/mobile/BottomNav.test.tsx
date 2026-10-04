import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { BottomNav } from '@/components/mobile/BottomNav'

const mockOpenDrawer = vi.fn()
const mockToggleDrawer = vi.fn()
let mockIsDrawerOpen = false
let mockIsStandalone = true

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
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
    isStandalone: mockIsStandalone,
    isDrawerOpen: mockIsDrawerOpen,
    openDrawer: mockOpenDrawer,
    toggleDrawer: mockToggleDrawer,
  }),
}))

vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 3 }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: 0 }),
}))

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}))

vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({ wishlistCount: 2 }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'RETAIL' }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: false }),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    return React.createElement('div', rest, children)
  })
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('BottomNav (components/mobile/BottomNav.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDrawerOpen = false
    mockIsStandalone = true
  })

  it('renders bottom navigation in standalone PWA mode', () => {
    render(<BottomNav />)
    expect(screen.getByTestId('mobile-bottom-nav')).toBeInTheDocument()
    expect(screen.getByText('Home')).toBeInTheDocument()
    expect(screen.getByText('Search')).toBeInTheDocument()
    expect(screen.getByText('Cart')).toBeInTheDocument()
    expect(screen.getByText('Wishlist')).toBeInTheDocument()
    expect(screen.getByText('More')).toBeInTheDocument()
  })

  it('hides bottom navigation in normal browser mode unless forceVisible', () => {
    mockIsStandalone = false
    const { container } = render(<BottomNav />)
    expect(container.firstChild).toBeNull()
  })

  it('opens global drawer when More button is clicked', () => {
    render(<BottomNav />)
    const moreBtn = screen.getByRole('button', { name: /more/i })
    expect(moreBtn).toBeInTheDocument()

    fireEvent.click(moreBtn)
    expect(mockToggleDrawer).toHaveBeenCalledTimes(1)
  })
})
