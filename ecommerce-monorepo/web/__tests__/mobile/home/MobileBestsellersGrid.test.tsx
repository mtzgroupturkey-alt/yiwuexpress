import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileBestsellersGrid } from '@/components/mobile/home/MobileBestsellersGrid'
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

describe('MobileBestsellersGrid (components/mobile/home/MobileBestsellersGrid.tsx)', () => {
  const sampleProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Hydraulic Press 50 Ton',
      price: 3200,
      brand: 'Titan',
      category: 'machinery',
      rating: 5.0,
      reviewsCount: 14,
      image: '/press.jpg',
      inStock: true,
      moq: 2,
    },
    {
      id: 'prod-2',
      name: 'Stainless Steel Commercial Mixer',
      price: 890,
      brand: 'ChefLine',
      category: 'kitchen',
      rating: 4.7,
      reviewsCount: 22,
      image: '/mixer.jpg',
      inStock: true,
      moq: 5,
    },
  ]

  it('renders best seller products in 2-column grid format', () => {
    render(<MobileBestsellersGrid products={sampleProducts} />)

    expect(screen.getByText('Best Selling Products')).toBeInTheDocument()
    expect(screen.getByText('Hydraulic Press 50 Ton')).toBeInTheDocument()
    expect(screen.getByText('Stainless Steel Commercial Mixer')).toBeInTheDocument()
    expect(screen.getByText('$3200.00')).toBeInTheDocument()
    expect(screen.getByText('$890.00')).toBeInTheDocument()
  })

  it('handles add to cart action per card', () => {
    const handleAddToCart = vi.fn()
    render(
      <MobileBestsellersGrid
        products={sampleProducts}
        onAddToCart={handleAddToCart}
      />
    )

    const addButtons = screen.getAllByRole('button', { name: /add to cart/i })
    expect(addButtons).toHaveLength(2)

    fireEvent.click(addButtons[0])
    expect(handleAddToCart).toHaveBeenCalledWith(sampleProducts[0], 1)
  })

  it('handles wishlist favorite toggle', () => {
    const handleToggleFavorite = vi.fn()
    const favoriteIds = new Set(['prod-1'])

    render(
      <MobileBestsellersGrid
        products={sampleProducts}
        favoriteIds={favoriteIds}
        onToggleFavorite={handleToggleFavorite}
      />
    )

    const favButtons = screen.getAllByRole('button', { name: /add to wishlist/i })
    fireEvent.click(favButtons[0])

    expect(handleToggleFavorite).toHaveBeenCalledWith('prod-1')
  })
})
