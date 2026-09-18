import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProductCard from '../components/products/ProductCard'

// Shared mocks
let mockSettings: any = {
  rfqModel: 'INSTANT',
  companyName: 'Global Trade',
  wholesaleDefaultMoq: 5,
}

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({ settings: mockSettings, loading: false }),
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => ({
    isWholesale: true,
    isRetail: false,
    storeMode: 'WHOLESALE',
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
    isWholesaleSession: true,
    enableWholesaleSession: vi.fn(),
  }),
}))

vi.mock('@/components/QuoteCartContext', () => ({
  useQuoteCart: () => ({
    addToQuote: vi.fn(),
  }),
}))

vi.mock('../components/products/WishlistButton', () => ({
  WishlistButton: () => <div data-testid="wishlist-btn" />,
}))

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
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

describe('ProductCard RFQ Model Selector', () => {
  const sampleProduct = {
    id: 'prod-123',
    slug: 'industrial-generator',
    name: 'Industrial Generator 5000W',
    price: 1500,
    wholesalePrice: 1200,
    moq: 10,
    stock: 50,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders "Add to Cart" button with wholesale price and MOQ when rfqModel is INSTANT', () => {
    mockSettings = {
      rfqModel: 'INSTANT',
      companyName: 'Global Trade',
      wholesaleDefaultMoq: 5,
    }

    render(<ProductCard product={sampleProduct} />)

    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
    expect(screen.getByText(/wholesale:\s*\$1200/i)).toBeInTheDocument()
    expect(screen.getByText(/moq:\s*10/i)).toBeInTheDocument()
    expect(screen.queryByText(/request quote/i)).not.toBeInTheDocument()
  })

  it('renders "Request Quote" button when rfqModel is RFQ', () => {
    mockSettings = {
      rfqModel: 'RFQ',
      companyName: 'Global Trade',
      wholesaleDefaultMoq: 5,
    }

    render(<ProductCard product={sampleProduct} />)

    expect(screen.getByRole('button', { name: /request quote/i })).toBeInTheDocument()
    expect(screen.getByText(/request quote \(moq 10\)/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /add to cart/i })).not.toBeInTheDocument()
  })
})
