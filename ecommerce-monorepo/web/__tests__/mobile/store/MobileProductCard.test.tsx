import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileProductCard } from '@/components/mobile/store/MobileProductCard'
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

describe('MobileProductCard (components/mobile/store/MobileProductCard.tsx)', () => {
  const sampleProduct: Product = {
    id: 'prod-101',
    name: 'Industrial CNC Lathe Machine',
    price: 4500,
    oldPrice: 5000,
    brand: 'PreciseTech',
    category: 'machinery',
    rating: 4.9,
    reviewsCount: 38,
    image: '/cnc.jpg',
    inStock: true,
    moq: 1,
  }

  it('renders product name, brand, rating, discount, and formatted price', () => {
    render(<MobileProductCard product={sampleProduct} />)

    expect(screen.getByText('Industrial CNC Lathe Machine')).toBeInTheDocument()
    expect(screen.getByText('PreciseTech')).toBeInTheDocument()
    expect(screen.getByText('4.9')).toBeInTheDocument()
    expect(screen.getByText('(38)')).toBeInTheDocument()
    expect(screen.getByText('-10%')).toBeInTheDocument()
    expect(screen.getByText('$4500.00')).toBeInTheDocument()
  })

  it('handles card selection and add to cart clicks', () => {
    const handleSelect = vi.fn()
    const handleAddToCart = vi.fn()

    render(
      <MobileProductCard
        product={sampleProduct}
        onSelectProduct={handleSelect}
        onAddToCart={handleAddToCart}
      />
    )

    const card = screen.getByTestId('mobile-product-card')
    fireEvent.click(card)
    expect(handleSelect).toHaveBeenCalledWith(sampleProduct)

    const addBtn = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(addBtn)
    expect(handleAddToCart).toHaveBeenCalledWith(sampleProduct, 1)
  })

  it('handles toggle favorite click', () => {
    const handleToggle = vi.fn()
    render(
      <MobileProductCard
        product={sampleProduct}
        isFavorite={false}
        onToggleFavorite={handleToggle}
      />
    )

    const favBtn = screen.getByRole('button', { name: /toggle wishlist/i })
    fireEvent.click(favBtn)
    expect(handleToggle).toHaveBeenCalledWith('prod-101')
  })
})
