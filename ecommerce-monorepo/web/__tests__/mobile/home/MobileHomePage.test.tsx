import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileHomePage } from '@/components/mobile/home/MobileHomePage'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => ({
    settings: { companyName: 'Global Trade' },
  }),
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => ({
    isWholesaleSession: false,
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

global.fetch = vi.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, data: [] }),
  })
) as any

describe('MobileHomePage (components/mobile/home/MobileHomePage.tsx)', () => {
  it('renders all 7 homepage mobile sections in single column layout', () => {
    render(
      <MobileHomePage
        products={[]}
        categories={[]}
        flashDeals={[]}
        bestSellers={[]}
      />
    )

    // 1. Hero
    expect(screen.getByTestId('mobile-hero')).toBeInTheDocument()
    // 2. Category row
    expect(screen.getByTestId('mobile-category-row')).toBeInTheDocument()
    // 3. Flash deals
    expect(screen.getByTestId('mobile-flash-deals')).toBeInTheDocument()
    // 4. Promo banner
    expect(screen.getByTestId('mobile-promo-banner')).toBeInTheDocument()
    // 5. Best sellers grid
    expect(screen.getByTestId('mobile-bestsellers-grid')).toBeInTheDocument()
    // 6. Brand strip
    expect(screen.getByTestId('mobile-brand-strip')).toBeInTheDocument()
    // 7. Newsletter card
    expect(screen.getByTestId('mobile-newsletter-card')).toBeInTheDocument()
  })

  it('renders all rich native app sections in PWA standalone mode', () => {
    const mockCategories = [
      { id: 'cat-1', name: 'Furniture', slug: 'furniture', itemCount: 10, icon: '🪑' },
      { id: 'cat-2', name: 'Kitchen', slug: 'kitchen', itemCount: 12, icon: '🍳' },
    ]
    const mockProducts = [
      {
        id: 'p-1',
        name: 'Dining Table',
        price: 299,
        category: 'Furniture',
        categorySlug: 'furniture',
        brand: 'Global Trade',
        rating: 4.9,
        reviewsCount: 20,
        image: '/images/product-placeholder.webp',
        inStock: true,
      },
    ]

    render(
      <MobileHomePage
        products={mockProducts as any}
        categories={mockCategories as any}
        flashDeals={mockProducts as any}
        bestSellers={mockProducts as any}
        isStandaloneOverride={true}
      />
    )

    // Verify container mode
    const container = screen.getByTestId('mobile-home-page')
    expect(container).toHaveAttribute('data-mode', 'standalone')

    // 1. Hero
    expect(screen.getByTestId('mobile-hero')).toBeInTheDocument()
    // 2. Category row
    expect(screen.getByTestId('mobile-category-row')).toBeInTheDocument()
    // 3. Flash deals
    expect(screen.getByTestId('mobile-flash-deals')).toBeInTheDocument()
    // 4. New arrivals
    expect(screen.getByTestId('mobile-new-arrivals')).toBeInTheDocument()
    // 5. Trending products
    expect(screen.getByTestId('mobile-trending-products')).toBeInTheDocument()
    // 6. Best sellers grid
    expect(screen.getByTestId('mobile-bestsellers-grid')).toBeInTheDocument()
    // 7. Recommended for you
    expect(screen.getByTestId('mobile-recommended-for-you')).toBeInTheDocument()
    // 8. Deals of the day
    expect(screen.getByTestId('mobile-deals-of-the-day')).toBeInTheDocument()
    // 9. Category sections
    expect(screen.getByTestId('mobile-category-sections')).toBeInTheDocument()
    // 10. Promo banner
    expect(screen.getByTestId('mobile-promo-banner')).toBeInTheDocument()
    // 11. Brand strip
    expect(screen.getByTestId('mobile-brand-strip')).toBeInTheDocument()
    // 12. Newsletter card
    expect(screen.getByTestId('mobile-newsletter-card')).toBeInTheDocument()
  })
})

