import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SessionModeProvider } from '@/contexts/SessionModeContext'
import { WholesaleInquiryProvider, useWholesaleInquiry } from '@/contexts/WholesaleInquiryContext'
import { MainHeader } from '@/components/layout/MainHeader'

// --- Lightweight mocks for storefront dependencies the header relies on ---

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({ settings: { companyName: 'Global Trade' }, loading: false }),
}))

vi.mock('@/components/CartContext', () => ({
  useCart: () => ({ cartCount: 0, refreshCartCount: vi.fn(), clearCart: vi.fn() }),
}))

vi.mock('@/hooks/useWishlist', () => ({
  useWishlist: () => ({ wishlistCount: 0 }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({
    storeMode: 'BOTH',
    isWholesale: true,
    isRetail: true,
    isBoth: true,
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

vi.mock('next/image', () => ({
  default: ({ alt, ...rest }: any) => <img alt={alt} {...rest} />,
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

vi.mock('@/components/ui/SimpleTypingText', () => ({
  SimpleTypingText: ({ texts }: any) => <span>{Array.isArray(texts) ? texts[0] : ''}</span>,
}))

vi.mock('@/components/layout/UserMenu', () => ({
  UserMenu: () => <div data-testid="user-menu" />,
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

function renderHeader() {
  return render(
    <SessionModeProvider>
      <WholesaleInquiryProvider>
        <MainHeader />
      </WholesaleInquiryProvider>
    </SessionModeProvider>
  )
}

const InquirySeeder = ({ quantity, children }: { quantity: number; children: React.ReactNode }) => {
  const inquiry = useWholesaleInquiry()
  const addItem = inquiry.addItem
  const added = React.useRef(false)
  React.useEffect(() => {
    if (added.current) return
    added.current = true
    addItem({
      productId: 'p1',
      slug: 'p1',
      name: 'Widget',
      wholesalePrice: 1,
      retailPrice: 2,
      quantity,
      minOrderQty: 1,
    })
  }, [addItem, quantity])
  return <>{children}</>
}

describe('Smart Cart Button (hybrid BOTH mode)', () => {
  it('Test Case 1: defaults to retail — shows retail cart, wholesale inquiry trigger is NOT in the document', () => {
    renderHeader()

    expect(screen.getByTestId('retail-cart-trigger')).toBeInTheDocument()
    expect(screen.queryByTestId('wholesale-inquiry-trigger')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /inquiry/i })).not.toBeInTheDocument()

    const container = screen.getByTestId('smart-cart-button-container')
    expect(container.querySelectorAll('a,button').length).toBe(1)
  })

  it('Test Case 1b: morphing to wholesale via the manual toggle detaches the retail cart', () => {
    renderHeader()

    const toggle = screen.getByRole('button', { name: /switch to wholesale/i })
    fireEvent.click(toggle)

    expect(screen.getByTestId('wholesale-inquiry-trigger')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /inquiry/i })).toBeInTheDocument()
    expect(screen.queryByTestId('retail-cart-trigger')).not.toBeInTheDocument()

    const container = screen.getByTestId('smart-cart-button-container')
    expect(container.querySelectorAll('a,button').length).toBe(1)
  })

  it('Test Case 2: wholesale inquiry count drives the single badge without duplicating components', () => {
    render(
      <SessionModeProvider>
        <WholesaleInquiryProvider>
          <InquirySeeder quantity={3}>
            <MainHeader />
          </InquirySeeder>
        </WholesaleInquiryProvider>
      </SessionModeProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /switch to wholesale/i }))
    const container = screen.getByTestId('smart-cart-button-container')
    expect(container.querySelectorAll('a,button').length).toBe(1)

    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('Test Case 3: strict state isolation — retail cart never receives wholesale items', () => {
    render(
      <SessionModeProvider>
        <WholesaleInquiryProvider>
          <InquirySeeder quantity={10}>
            <MainHeader />
          </InquirySeeder>
        </WholesaleInquiryProvider>
      </SessionModeProvider>
    )

    fireEvent.click(screen.getByRole('button', { name: /switch to wholesale/i }))

    expect(screen.getByText('10')).toBeInTheDocument()
    expect(screen.queryByTestId('retail-cart-trigger')).not.toBeInTheDocument()
  })
})

