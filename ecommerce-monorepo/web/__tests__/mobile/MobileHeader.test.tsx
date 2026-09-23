import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileHeader } from '@/components/mobile/MobileHeader'

let mockCartCount = 4
let mockQuoteCount = 0
let mockIsWholesale = false
const mockToggleDrawer = vi.fn()
const mockToggleSearch = vi.fn()
const mockRouterBack = vi.fn()
const mockRouterPush = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: mockRouterPush, back: mockRouterBack }),
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
  })

  it('renders brand wordmark without large logo image on homepage', () => {
    render(<MobileHeader />)

    // Brand text wordmark
    expect(screen.getByText('Global Trade')).toBeInTheDocument()
    // No large logo image tag
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('has md:hidden class to remain hidden on desktop', () => {
    const { container } = render(<MobileHeader />)
    const headerEl = container.querySelector('header')
    expect(headerEl).toHaveClass('md:hidden')
    expect(headerEl).toHaveClass('fixed')
    expect(headerEl).toHaveClass('top-0')
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

  it('caps cart badge at 99+ when cart count exceeds 99', () => {
    mockCartCount = 150
    render(<MobileHeader />)

    expect(screen.getByTestId('mobile-cart-badge')).toHaveTextContent('99+')
  })

  it('shows wholesale quote badge and routes to /quote-cart in wholesale mode', () => {
    mockIsWholesale = true
    mockQuoteCount = 7

    render(<MobileHeader />)

    const quoteLink = screen.getByTestId('mobile-cart-trigger')
    expect(quoteLink).toHaveAttribute('href', '/quote-cart')
    expect(screen.getByTestId('mobile-cart-badge')).toHaveTextContent('7')
  })

  it('triggers search toggle when search button is clicked', () => {
    render(<MobileHeader />)

    const searchBtn = screen.getByTestId('mobile-search-toggle')
    fireEvent.click(searchBtn)

    expect(mockToggleSearch).toHaveBeenCalledTimes(1)
  })

  it('shows custom page title and back arrow when showBack is enabled', () => {
    render(
      <MobileHeader
        title="Product Details"
        showBack={true}
      />
    )

    expect(screen.getByText('Product Details')).toBeInTheDocument()
    const backBtn = screen.getByTestId('mobile-back-button')
    expect(backBtn).toBeInTheDocument()
    expect(screen.queryByTestId('mobile-menu-trigger')).not.toBeInTheDocument()

    fireEvent.click(backBtn)
    expect(mockRouterBack).toHaveBeenCalledTimes(1)
  })

  it('triggers custom onBack callback when provided', () => {
    const onBack = vi.fn()
    render(
      <MobileHeader
        title="Cart"
        showBack={true}
        onBack={onBack}
      />
    )

    const backBtn = screen.getByTestId('mobile-back-button')
    fireEvent.click(backBtn)
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(mockRouterBack).not.toHaveBeenCalled()
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

  it('triggers onCartClick in retail mode', () => {
    mockIsWholesale = false
    const onCartClick = vi.fn()
    render(<MobileHeader onCartClick={onCartClick} />)

    const cartBtn = screen.getByTestId('mobile-cart-trigger')
    fireEvent.click(cartBtn)
    expect(onCartClick).toHaveBeenCalledTimes(1)
  })

  it('does NOT trigger onCartClick in wholesale RFQ mode to prevent opening retail checkout modal', () => {
    mockIsWholesale = true
    const onCartClick = vi.fn()
    render(<MobileHeader onCartClick={onCartClick} />)

    const cartBtn = screen.getByTestId('mobile-cart-trigger')
    fireEvent.click(cartBtn)
    expect(onCartClick).not.toHaveBeenCalled()
  })

  it('dynamically expands search bar on focus, showing cancel button and popular searches', () => {
    render(<MobileHeader />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()

    // Focus search input
    fireEvent.focus(searchInput)

    // Cancel button and Popular Searches tray now visible
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.getByText('Popular Searches')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Electronics' })).toBeInTheDocument()

    // Clicking Cancel collapses search
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
    expect(screen.queryByText('Popular Searches')).not.toBeInTheDocument()
  })

  it('clicking a popular search tag triggers navigation and closes expanded tray', () => {
    render(<MobileHeader />)

    const searchInput = screen.getByPlaceholderText(/search/i)
    fireEvent.focus(searchInput)

    const electronicsTag = screen.getByRole('button', { name: 'Electronics' })
    fireEvent.click(electronicsTag)

    expect(mockRouterPush).toHaveBeenCalledWith('/en/store?search=Electronics')
    expect(screen.queryByText('Popular Searches')).not.toBeInTheDocument()
  })
})
