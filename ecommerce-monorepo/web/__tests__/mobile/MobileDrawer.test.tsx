import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileDrawer } from '@/components/mobile/MobileDrawer'

const mockCloseDrawer = vi.fn()
const mockPush = vi.fn()
const mockLogout = vi.fn()
const mockToggleSessionMode = vi.fn()
const mockSetCurrency = vi.fn()

let mockIsDrawerOpen = true
let mockIsAuthenticated = false
let mockUser: any = null

vi.mock('next/navigation', () => ({
  usePathname: () => '/en',
  useRouter: () => ({ push: mockPush, back: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/components/LocaleLink', () => ({
  LocaleLink: ({ href, children, onClick, ...props }: any) => (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/MobileProvider', () => ({
  useMobile: () => ({
    isMobile: true,
    isIOS: false,
    isAndroid: false,
    isDrawerOpen: mockIsDrawerOpen,
    closeDrawer: mockCloseDrawer,
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

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockUser,
    logout: mockLogout,
  }),
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    currency: 'USD',
    setCurrency: mockSetCurrency,
    currencies: [
      { code: 'USD', symbol: '$' },
      { code: 'EUR', symbol: '€' },
      { code: 'CNY', symbol: '¥' },
    ],
  }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ isBoth: true, storeMode: 'BOTH' }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({
    isWholesaleSession: false,
    toggleSessionMode: mockToggleSessionMode,
  }),
}))

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    const { initial, animate, exit, transition, ...dom } = rest
    return React.createElement('div', { ...dom, ref }, children)
  })
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('MobileDrawer (components/mobile/MobileDrawer.tsx)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsDrawerOpen = true
    mockIsAuthenticated = false
    mockUser = null
  })

  it('renders drawer header with dynamic company name and close button', () => {
    render(<MobileDrawer />)

    expect(screen.getByText('Global Trade')).toBeInTheDocument()
    const closeBtn = screen.getByTestId('mobile-drawer-close')
    expect(closeBtn).toBeInTheDocument()

    fireEvent.click(closeBtn)
    expect(mockCloseDrawer).toHaveBeenCalledTimes(1)
  })

  it('shows Sign In and Register buttons when unauthenticated', () => {
    mockIsAuthenticated = false
    render(<MobileDrawer />)

    expect(screen.getByText('Sign In')).toBeInTheDocument()
    expect(screen.getByText('Register')).toBeInTheDocument()
  })

  it('shows user name and email when authenticated', () => {
    mockIsAuthenticated = true
    mockUser = { name: 'Alice Smith', email: 'alice@example.com' }

    render(<MobileDrawer />)

    expect(screen.getByText('Alice Smith')).toBeInTheDocument()
    expect(screen.getByText('alice@example.com')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  it('calls logout when Sign Out button is clicked', () => {
    mockIsAuthenticated = true
    mockUser = { name: 'Alice Smith', email: 'alice@example.com' }

    render(<MobileDrawer />)

    const logoutBtn = screen.getByText('Sign Out')
    fireEvent.click(logoutBtn)

    expect(mockLogout).toHaveBeenCalledTimes(1)
    expect(mockCloseDrawer).toHaveBeenCalledTimes(1)
  })

  it('switches between Main Menu and Categories tabs', () => {
    render(<MobileDrawer />)

    expect(screen.getByText('My Orders')).toBeInTheDocument()
    expect(screen.getByText('Wishlist')).toBeInTheDocument()

    // Switch to categories tab
    const categoriesTab = screen.getByRole('button', { name: /categories/i })
    fireEvent.click(categoriesTab)

    expect(screen.getByText('Machinery & Equipment')).toBeInTheDocument()
    expect(screen.getByText('Hardware & Tools')).toBeInTheDocument()
    expect(screen.getByText('Electronics & Smart Tech')).toBeInTheDocument()
  })

  it('toggles session mode between Retail and Wholesale', () => {
    render(<MobileDrawer />)

    const toggleBtn = screen.getByRole('button', { name: /toggle store mode/i })
    fireEvent.click(toggleBtn)

    expect(mockToggleSessionMode).toHaveBeenCalledTimes(1)
  })

  it('renders language switcher and navigates to new locale', () => {
    render(<MobileDrawer />)

    const ruBtn = screen.getByRole('button', { name: /русский/i })
    fireEvent.click(ruBtn)

    expect(mockPush).toHaveBeenCalledWith('/ru')
    expect(mockCloseDrawer).toHaveBeenCalledTimes(1)
  })

  it('renders currency switcher and triggers setCurrency', () => {
    render(<MobileDrawer />)

    const eurBtn = screen.getByRole('button', { name: /€ EUR/i })
    fireEvent.click(eurBtn)

    expect(mockSetCurrency).toHaveBeenCalledWith('EUR')
  })
})
