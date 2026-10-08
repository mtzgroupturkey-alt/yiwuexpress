import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductCard from '../components/products/ProductCard'

let mockCustomerView = {
  view: 'guest' as const,
  isGuest: true,
  isRetail: false,
  isWholesale: false,
  canSeeWholesalePrice: false,
  canRequestQuote: false,
  canAddToWholesaleCart: false,
  isLoading: false,
}

let mockAuthState = {
  isAuthenticated: false,
  user: null,
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('@/hooks/useCustomerView', () => ({
  useCustomerView: () => mockCustomerView,
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: {
      rfqModel: 'INSTANT',
      companyName: 'Global Trade',
      wholesaleDefaultMoq: 1,
    },
    loading: false,
  }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({
    isWholesale: false,
    isRetail: true,
    storeMode: 'RETAIL',
  }),
}))

vi.mock('@/contexts/WholesaleInquiryContext', () => ({
  useWholesaleInquiry: () => ({
    addItem: vi.fn(),
    count: 0,
  }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({
    isWholesaleSession: false,
    enableWholesaleSession: vi.fn(),
  }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({
    addToQuote: vi.fn(),
  }),
}))

vi.mock('@/components/CartContext', () => ({
  useCart: () => ({
    cartCount: 0,
    refreshCartCount: vi.fn(),
    clearCart: vi.fn(),
  }),
}))

vi.mock('../components/products/WishlistButton', () => ({
  WishlistButton: () => <div data-testid="wishlist-btn" />,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key === 'addToCart' ? 'Add to Cart' : key,
}))

vi.mock('@/hooks/useStorefrontTranslation', () => ({
  useStorefrontTranslation: () => ({
    tBadge: (key: string) => key,
  }),
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (val: number) => `$${val}`,
  }),
}))

vi.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

vi.mock('@/components/LocaleLink', () => ({
  LocaleLink: ({ href, children, ...rest }: any) => <a href={href} {...rest}>{children}</a>,
}))

vi.mock('next/image', () => ({
  default: ({ alt, ...rest }: any) => <img alt={alt} {...rest} />,
}))

describe('ProductCard Guest vs Authenticated Cart Visibility', () => {
  const sampleProduct = {
    id: 'prod-chair-1',
    slug: 'ergonomic-office-chair',
    name: 'Ergonomic Executive Office Chair',
    price: 199,
    stock: 25,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does NOT render "Add to Cart" button when visitor is a guest (unauthenticated)', () => {
    mockCustomerView = {
      view: 'guest',
      isGuest: true,
      isRetail: false,
      isWholesale: false,
      canSeeWholesalePrice: false,
      canRequestQuote: false,
      canAddToWholesaleCart: false,
      isLoading: false,
    }
    mockAuthState = {
      isAuthenticated: false,
      user: null,
    }

    render(<ProductCard product={sampleProduct} />)

    // Product information is visible
    expect(screen.getByText('Ergonomic Executive Office Chair')).toBeInTheDocument()
    expect(screen.getByText('$199')).toBeInTheDocument()

    // Add to Cart button MUST NOT be displayed for guests
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument()
  })

  it('renders "Add to Cart" button when visitor is logged in (authenticated)', () => {
    mockCustomerView = {
      view: 'retail' as any,
      isGuest: false,
      isRetail: true,
      isWholesale: false,
      canSeeWholesalePrice: false,
      canRequestQuote: false,
      canAddToWholesaleCart: false,
      isLoading: false,
    }
    mockAuthState = {
      isAuthenticated: true,
      user: { id: 'user-1', name: 'John Doe', email: 'john@example.com', role: 'USER' } as any,
    }

    render(<ProductCard product={sampleProduct} />)

    // Product information is visible
    expect(screen.getByText('Ergonomic Executive Office Chair')).toBeInTheDocument()

    // Add to Cart button MUST be displayed for logged in users
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })
})
