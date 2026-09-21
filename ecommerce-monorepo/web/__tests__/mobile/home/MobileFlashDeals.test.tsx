import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileFlashDeals } from '@/components/mobile/home/MobileFlashDeals'
import { Product } from '@/app/[locale]/design-3/types'

const mockPush = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
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

describe('MobileFlashDeals (components/mobile/home/MobileFlashDeals.tsx)', () => {
  const sampleDeals: Product[] = [
    {
      id: 'deal-1',
      name: 'Industrial CNC Lathe Machine',
      price: 1850,
      oldPrice: 2500,
      brand: 'HeavyTools',
      category: 'machinery',
      rating: 4.9,
      reviewsCount: 38,
      image: '/sample-cnc.jpg',
      inStock: true,
      moq: 1,
    },
  ]

  it('renders flash deals title and countdown timer', () => {
    render(<MobileFlashDeals deals={sampleDeals} />)

    expect(screen.getByText('Flash Deals')).toBeInTheDocument()
    expect(screen.getByText('Industrial CNC Lathe Machine')).toBeInTheDocument()
    expect(screen.getByText('$1850.00')).toBeInTheDocument()
    expect(screen.getByText('$2500.00')).toBeInTheDocument()
    // Discount badge: (2500 - 1850) / 2500 = 26%
    expect(screen.getByText('-26%')).toBeInTheDocument()
  })

  it('triggers onAddToCart when plus button is clicked', () => {
    const handleAddToCart = vi.fn()
    render(
      <MobileFlashDeals
        deals={sampleDeals}
        onAddToCart={handleAddToCart}
      />
    )

    const addBtn = screen.getByRole('button', { name: /add to shopping cart/i })
    fireEvent.click(addBtn)

    expect(handleAddToCart).toHaveBeenCalledWith(sampleDeals[0], 1)
  })

  it('triggers onSelectProduct when deal card is clicked', () => {
    const handleSelect = vi.fn()
    render(
      <MobileFlashDeals
        deals={sampleDeals}
        onSelectProduct={handleSelect}
      />
    )

    const card = screen.getByText('Industrial CNC Lathe Machine')
    fireEvent.click(card)

    expect(handleSelect).toHaveBeenCalledWith(sampleDeals[0])
  })
})
