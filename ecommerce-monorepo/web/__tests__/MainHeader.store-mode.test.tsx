import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SessionModeProvider } from '@/contexts/SessionModeContext'
import { WholesaleInquiryProvider } from '@/contexts/WholesaleInquiryContext'
import { MainHeader } from '@/components/layout/MainHeader'

// Regression: the icon must reflect the admin-configured store mode, not just
// the session toggle. In pure WHOLESALE mode the B2B inquiry icon shows by
// default even without any manual toggle. Found via QA on 2026-07-20.

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({ settings: { companyName: 'Global Trade' }, loading: false }),
}))
vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 0, refreshCartCount: vi.fn(), clearCart: vi.fn() }),
}))
vi.mock('@/hooks/useWishlist', () => ({ useWishlist: () => ({ wishlistCount: 0 }) }))
vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({
    storeMode: 'WHOLESALE',
    isWholesale: true,
    isRetail: false,
    isBoth: false,
    loading: false,
    error: null,
    refreshStoreMode: vi.fn(),
  }),
}))
vi.mock('@/components/LocaleLink', () => ({
  LocaleLink: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))
vi.mock('next/image', () => ({ default: ({ alt, ...rest }: any) => <img alt={alt} {...rest} /> }))
vi.mock('next/link', () => ({ default: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a> }))
vi.mock('@/components/ui/SimpleTypingText', () => ({
  SimpleTypingText: ({ texts }: any) => <span>{Array.isArray(texts) ? texts[0] : ''}</span>,
}))
vi.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => <div data-testid="user-menu" /> }))
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

describe('Smart Cart Button (pure WHOLESALE store mode)', () => {
  it('shows the wholesale inquiry icon by default when store mode is WHOLESALE', () => {
    render(
      <SessionModeProvider>
        <WholesaleInquiryProvider>
          <MainHeader />
        </WholesaleInquiryProvider>
      </SessionModeProvider>
    )

    expect(screen.getByTestId('wholesale-inquiry-trigger')).toBeInTheDocument()
    expect(screen.queryByTestId('retail-cart-trigger')).not.toBeInTheDocument()
    // No manual toggle is offered in pure mode.
    expect(screen.queryByRole('button', { name: /switch to wholesale/i })).not.toBeInTheDocument()
  })
})
