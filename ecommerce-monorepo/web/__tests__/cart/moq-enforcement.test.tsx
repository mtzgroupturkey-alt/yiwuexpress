import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CartItem } from '@/components/cart/CartItem'
import { MobileCartItem, MobileCartItemData } from '@/components/mobile/cart/MobileCartItem'

import { NextIntlClientProvider } from 'next-intl'

const messages = {
  Cart: {
    perUnit: '/ unit',
    weightPerUnit: '{n} kg',
    remove: 'Remove',
  },
}

function renderWithIntl(ui: React.ReactElement) {
  return render(
    <NextIntlClientProvider locale="en" messages={messages}>
      {ui}
    </NextIntlClientProvider>
  )
}

vi.mock('@/components/LocaleLink', () => ({
  LocaleLink: ({ children, href, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

vi.mock('@/components/ui/ProductImage', () => ({
  ProductImage: ({ alt }: any) => <img alt={alt} />,
}))

vi.mock('@/hooks/useCurrency', () => ({
  useCurrency: () => ({
    formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
  }),
}))

describe('Cart UI MOQ Enforcement', () => {
  describe('CartItem (Desktop/Mobile steppers)', () => {
    const wholesaleItem = {
      id: 'ci-wholesale-1',
      productId: 'p-1',
      quantity: 5,
      mode: 'WHOLESALE',
      product: {
        id: 'p-1',
        name: 'Bulk Industrial Ball Bearings',
        slug: 'bulk-ball-bearings',
        price: 50,
        wholesalePrice: 30,
        minOrderQty: 5,
        thumbnail: '/bearing.jpg',
        stock: 100,
        weightKg: 0.2,
      },
    }

    const retailItem = {
      id: 'ci-retail-1',
      productId: 'p-2',
      quantity: 2,
      mode: 'RETAIL',
      product: {
        id: 'p-2',
        name: 'Retail Ball Bearing',
        slug: 'retail-ball-bearing',
        price: 50,
        wholesalePrice: 30,
        minOrderQty: 5,
        thumbnail: '/bearing.jpg',
        stock: 100,
        weightKg: 0.2,
      },
    }

    it('disables decrement button when wholesale item quantity is at minOrderQty', () => {
      renderWithIntl(
        <CartItem
          item={wholesaleItem}
          onUpdateQuantity={vi.fn()}
          onRemove={vi.fn()}
          updating={false}
        />
      )

      expect(screen.getByText('MOQ: 5')).toBeInTheDocument()
      expect(screen.getByText('Wholesale')).toBeInTheDocument()

      const decButtons = screen.getAllByRole('button', { name: /decrease quantity/i })
      decButtons.forEach((btn) => {
        expect(btn).toBeDisabled()
      })
    })

    it('allows decrement when wholesale item quantity is above minOrderQty', () => {
      const handleUpdate = vi.fn()
      renderWithIntl(
        <CartItem
          item={{ ...wholesaleItem, quantity: 6 }}
          onUpdateQuantity={handleUpdate}
          onRemove={vi.fn()}
          updating={false}
        />
      )

      const decButtons = screen.getAllByRole('button', { name: /decrease quantity/i })
      expect(decButtons[0]).not.toBeDisabled()
      fireEvent.click(decButtons[0])
      expect(handleUpdate).toHaveBeenCalledWith('ci-wholesale-1', 5)
    })

    it('enforces min=1 for retail items even if product has minOrderQty defined', () => {
      const handleUpdate = vi.fn()
      renderWithIntl(
        <CartItem
          item={retailItem}
          onUpdateQuantity={handleUpdate}
          onRemove={vi.fn()}
          updating={false}
        />
      )

      expect(screen.queryByText('MOQ: 5')).not.toBeInTheDocument()

      const decButtons = screen.getAllByRole('button', { name: /decrease quantity/i })
      expect(decButtons[0]).not.toBeDisabled()
      fireEvent.click(decButtons[0])
      expect(handleUpdate).toHaveBeenCalledWith('ci-retail-1', 1)
    })
  })

  describe('MobileCartItem (Mobile stepper)', () => {
    it('enforces MOQ for wholesale mode and displays badges', () => {
      const handleUpdate = vi.fn()
      const wholesaleMobileItem: MobileCartItemData = {
        id: 'm-1',
        productId: 'p-1',
        name: 'Precision Milling Tool',
        price: 25,
        quantity: 10,
        stock: 100,
        moq: 10,
        mode: 'WHOLESALE',
      }

      render(
        <MobileCartItem
          item={wholesaleMobileItem}
          onUpdateQuantity={handleUpdate}
          onRemove={vi.fn()}
        />
      )

      expect(screen.getByText('Wholesale')).toBeInTheDocument()
      expect(screen.getByText('MOQ: 10')).toBeInTheDocument()

      const decButton = screen.getByRole('button', { name: /decrease quantity/i })
      expect(decButton).toBeDisabled()
    })

    it('allows decrementing to 1 for retail mode', () => {
      const handleUpdate = vi.fn()
      const retailMobileItem: MobileCartItemData = {
        id: 'm-2',
        productId: 'p-2',
        name: 'Precision Milling Tool Single',
        price: 35,
        quantity: 2,
        stock: 100,
        moq: 10,
        mode: 'RETAIL',
      }

      render(
        <MobileCartItem
          item={retailMobileItem}
          onUpdateQuantity={handleUpdate}
          onRemove={vi.fn()}
        />
      )

      expect(screen.queryByText('MOQ: 10')).not.toBeInTheDocument()

      const decButton = screen.getByRole('button', { name: /decrease quantity/i })
      expect(decButton).not.toBeDisabled()
      fireEvent.click(decButton)
      expect(handleUpdate).toHaveBeenCalledWith('m-2', 1)
    })
  })
})
