import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MobileStorePage } from '@/components/mobile/store/MobileStorePage'
import { Product, Category } from '@/app/[locale]/design-3/types'

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

vi.mock('framer-motion', () => {
  const React = require('react')
  const Passthrough = React.forwardRef(({ children, ...rest }: any, ref: any) => {
    const { initial, animate, exit, transition, drag, dragConstraints, dragElastic, onDragEnd, ...dom } = rest
    return React.createElement('div', { ...dom, ref }, children)
  })
  return {
    motion: new Proxy({}, { get: () => Passthrough }),
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

describe('MobileStorePage (components/mobile/store/MobileStorePage.tsx)', () => {
  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Wireless Bluetooth Earbuds',
      price: 25,
      brand: 'SoundPro',
      category: 'audio',
      rating: 4.6,
      reviewsCount: 42,
      image: '/earbuds.jpg',
      inStock: true,
    },
    {
      id: 'p2',
      name: 'Smart Robotic Vacuum',
      price: 320,
      brand: 'CleanBot',
      category: 'appliances',
      rating: 4.8,
      reviewsCount: 19,
      image: '/vacuum.jpg',
      inStock: true,
    },
  ]

  const sampleCategories: Category[] = [
    { id: 'c1', name: 'Audio', slug: 'audio', itemCount: 10, icon: 'headphones' },
    { id: 'c2', name: 'Appliances', slug: 'appliances', itemCount: 15, icon: 'home' },
  ]

  it('renders filter bar, product count, and product list', () => {
    render(
      <MobileStorePage
        products={sampleProducts}
        categories={sampleCategories}
      />
    )

    expect(screen.getByTestId('mobile-store-page')).toBeInTheDocument()
    expect(screen.getByText(/showing/i)).toBeInTheDocument()
    expect(screen.getByText('Wireless Bluetooth Earbuds')).toBeInTheDocument()
    expect(screen.getByText('Smart Robotic Vacuum')).toBeInTheDocument()
  })

  it('filters by search keyword when initialSearch is supplied', () => {
    render(
      <MobileStorePage
        products={sampleProducts}
        categories={sampleCategories}
        initialSearch="vacuum"
      />
    )

    expect(screen.getByText('Smart Robotic Vacuum')).toBeInTheDocument()
    expect(screen.queryByText('Wireless Bluetooth Earbuds')).not.toBeInTheDocument()
  })

  it('handles add to cart action from card', () => {
    const handleAddToCart = vi.fn()
    render(
      <MobileStorePage
        products={sampleProducts}
        categories={sampleCategories}
        onAddToCart={handleAddToCart}
      />
    )

    const addButtons = screen.getAllByRole('button', { name: /add to cart/i })
    fireEvent.click(addButtons[0])
    expect(handleAddToCart).toHaveBeenCalledWith(sampleProducts[0], 1)
  })
})
