import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MobileProductGrid } from '@/components/mobile/store/MobileProductGrid'
import { Product } from '@/app/[locale]/design-3/types'

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}))

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
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

describe('MobileProductGrid (components/mobile/store/MobileProductGrid.tsx)', () => {
  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Product One',
      brand: 'BrandA',
      rating: 4.5,
      reviewsCount: 10,
      image: '/p1.jpg',
      price: 100,
      category: 'cat1',
      inStock: true,
    },
    {
      id: 'p2',
      name: 'Product Two',
      brand: 'BrandB',
      rating: 4.8,
      reviewsCount: 20,
      image: '/p2.jpg',
      price: 200,
      category: 'cat2',
      inStock: true,
    },
  ]

  it('renders products in a grid when not loading', () => {
    render(<MobileProductGrid products={sampleProducts} />)

    expect(screen.getByTestId('mobile-product-grid')).toBeInTheDocument()
    expect(screen.getByText('Product One')).toBeInTheDocument()
    expect(screen.getByText('Product Two')).toBeInTheDocument()
  })

  it('renders loading skeletons when isLoading is true', () => {
    render(<MobileProductGrid products={[]} isLoading={true} />)

    expect(screen.getByTestId('mobile-product-grid-loading')).toBeInTheDocument()
  })

  it('renders EmptyState when products list is empty and not loading', () => {
    render(
      <MobileProductGrid
        products={[]}
        isLoading={false}
        emptyTitle="No catalog items"
      />
    )

    expect(screen.getByText('No catalog items')).toBeInTheDocument()
  })
})
