import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { StickyBuyBar } from '@/components/mobile/StickyBuyBar'

vi.mock('next-intl', () => ({
  useLocale: () => 'en',
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
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

describe('StickyBuyBar (components/mobile/StickyBuyBar.tsx)', () => {
  it('renders price, quantity stepper, and Add to Cart button when visible', () => {
    const handleQtyChange = vi.fn()
    const handleAddToCart = vi.fn()

    render(
      <StickyBuyBar
        isVisible={true}
        price={49.99}
        compareAtPrice={69.99}
        quantity={2}
        onQuantityChange={handleQtyChange}
        onAddToCart={handleAddToCart}
        productName="Industrial Tool"
      />
    )

    expect(screen.getByText('$49.99')).toBeInTheDocument()
    expect(screen.getByText('$69.99')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument()
  })

  it('renders Request Quote in wholesale mode', () => {
    render(
      <StickyBuyBar
        isVisible={true}
        price={120.00}
        quantity={10}
        onQuantityChange={vi.fn()}
        onAddToCart={vi.fn()}
        isWholesale={true}
        isInstantWholesale={false}
      />
    )

    expect(screen.getByRole('button', { name: /request quote/i })).toBeInTheDocument()
  })

  it('calls onQuantityChange when plus and minus buttons are clicked', () => {
    const handleQtyChange = vi.fn()
    render(
      <StickyBuyBar
        isVisible={true}
        price={25.00}
        quantity={3}
        onQuantityChange={handleQtyChange}
        onAddToCart={vi.fn()}
        minQty={1}
        maxQty={10}
      />
    )

    const decBtn = screen.getByRole('button', { name: /decrease quantity/i })
    const incBtn = screen.getByRole('button', { name: /increase quantity/i })

    fireEvent.click(decBtn)
    expect(handleQtyChange).toHaveBeenCalledWith(2)

    fireEvent.click(incBtn)
    expect(handleQtyChange).toHaveBeenCalledWith(4)
  })

  it('calls onAddToCart when the CTA button is clicked', () => {
    const handleAddToCart = vi.fn()
    render(
      <StickyBuyBar
        isVisible={true}
        price={25.00}
        quantity={1}
        onQuantityChange={vi.fn()}
        onAddToCart={handleAddToCart}
      />
    )

    const ctaBtn = screen.getByRole('button', { name: /add to cart/i })
    fireEvent.click(ctaBtn)
    expect(handleAddToCart).toHaveBeenCalledTimes(1)
  })

  it('does not render when isVisible is false', () => {
    const { container } = render(
      <StickyBuyBar
        isVisible={false}
        price={25.00}
        quantity={1}
        onQuantityChange={vi.fn()}
        onAddToCart={vi.fn()}
      />
    )

    expect(container.firstChild).toBeNull()
  })
})
