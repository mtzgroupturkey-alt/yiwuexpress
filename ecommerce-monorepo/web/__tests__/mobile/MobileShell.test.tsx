import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileShell } from '@/components/mobile/MobileShell'

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
    isStandalone: true,
    isDrawerOpen: false,
    isSearchOpen: false,
    closeDrawer: vi.fn(),
    toggleDrawer: vi.fn(),
  }),
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: { companyName: 'Global Trade' },
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

vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({ wishlistCount: 0 }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({ storeMode: 'BOTH' }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({ isWholesaleSession: false }),
}))

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null, logout: vi.fn() }),
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({ currency: { code: 'USD' }, availableCurrencies: [] }),
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

describe('MobileShell (components/mobile/MobileShell.tsx)', () => {
  it('renders mobile layout wrapper, header, main content, and bottom nav', () => {
    render(
      <MobileShell title="Welcome Mobile">
        <div data-testid="page-child">Custom Page Content</div>
      </MobileShell>
    )

    expect(screen.getByTestId('mobile-shell')).toBeInTheDocument()
    expect(screen.getByTestId('mobile-header')).toBeInTheDocument()
    expect(screen.getByText('Welcome Mobile')).toBeInTheDocument()
    expect(screen.getByTestId('page-child')).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: /mobile navigation/i })).toBeInTheDocument()
  })

  it('can hide header or bottom nav if configured', () => {
    render(
      <MobileShell showHeader={false} showBottomNav={false}>
        <div>No Header or Nav</div>
      </MobileShell>
    )

    expect(screen.queryByTestId('mobile-header')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: /mobile navigation/i })).not.toBeInTheDocument()
    expect(screen.getByText('No Header or Nav')).toBeInTheDocument()
  })
})
