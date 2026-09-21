import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileHeader } from '@/components/mobile/MobileHeader'

let mockCartCount = 4
let mockQuoteCount = 0
let mockIsWholesale = false
let mockIsSearchOpen = false
const mockToggleDrawer = vi.fn()
const mockToggleSearch = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
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
    isSearchOpen: mockIsSearchOpen,
    toggleDrawer: mockToggleDrawer,
    toggleSearch: mockToggleSearch,
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
  useCart: () => ({ cartCount: mockCartCount }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({ quoteCount: mockQuoteCount }),
}))

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({ count: 0 }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'BOTH' }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: mockIsWholesale }),
}))

describe('MobileHeader (components/mobile/MobileHeader.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCartCount = 4
    mockQuoteCount = 0
    mockIsWholesale = false
    mockIsSearchOpen = false
  })

  it('renders brand name with dynamic Global Trade fallback', () => {
    render(<MobileHeader />)

    expect(screen.getByText('Global Trade')).toBeInTheDocument()
    // Brand initial badge
    expect(screen.getByText('GT')).toBeInTheDocument()
  })

  it('triggers mobile menu drawer when hamburger is clicked', () => {
    render(<MobileHeader />)

    const menuBtn = screen.getByTestId('mobile-menu-trigger')
    expect(menuBtn).toBeInTheDocument()

    fireEvent.click(menuBtn)
    expect(mockToggleDrawer).toHaveBeenCalledTimes(1)
  })

  it('shows retail cart badge and routes to /cart in retail mode', () => {
    render(<MobileHeader />)

    const cartLink = screen.getByTestId('mobile-cart-trigger')
    expect(cartLink).toHaveAttribute('href', '/cart')
    expect(screen.getByTestId('mobile-cart-badge')).toHaveTextContent('4')
  })

  it('shows wholesale quote badge and routes to /quote-cart in wholesale mode', () => {
    mockIsWholesale = true
    mockQuoteCount = 7

    render(<MobileHeader />)

    const quoteLink = screen.getByTestId('mobile-cart-trigger')
    expect(quoteLink).toHaveAttribute('href', '/quote-cart')
    expect(screen.getByTestId('mobile-cart-badge')).toHaveTextContent('7')
  })

  it('toggles search bar when search button is clicked', () => {
    render(<MobileHeader />)

    const searchBtn = screen.getByTestId('mobile-search-toggle')
    fireEvent.click(searchBtn)

    expect(mockToggleSearch).toHaveBeenCalledTimes(1)
  })

  it('shows custom page title and back button when showBack is enabled', () => {
    render(
      <MobileHeader
        title="Product Details"
        showBack={true}
        backHref="/store"
      />
    )

    expect(screen.getByText('Product Details')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /go back/i })).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-menu-trigger')).not.toBeInTheDocument()
  })

  it('handles notification click and renders badge when notificationCount > 0', () => {
    const onNotifClick = vi.fn()
    render(
      <MobileHeader
        notificationCount={3}
        onNotificationsClick={onNotifClick}
      />
    )

    const notifBtn = screen.getByTestId('mobile-notifications-trigger')
    expect(screen.getByText('3')).toBeInTheDocument()

    fireEvent.click(notifBtn)
    expect(onNotifClick).toHaveBeenCalledTimes(1)
  })
})
