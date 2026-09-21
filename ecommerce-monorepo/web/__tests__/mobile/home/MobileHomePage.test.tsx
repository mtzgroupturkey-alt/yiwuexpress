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
})
