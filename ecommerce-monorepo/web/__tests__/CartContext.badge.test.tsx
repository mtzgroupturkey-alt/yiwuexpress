import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { CartProvider, useCart } from '@/components/CartContext'

// Regression: cart badge must reflect distinct product lines (itemCount),
// NOT the summed unit quantity (totalQuantity). Previously "1 product x 8
// units" showed a badge of 8. Found via QA on 2026-07-20.
const COUNT = ({ which }: { which: 'itemCount' | 'totalQuantity' }) => {
  const { cartCount } = useCart()
  return <span data-testid={`badge-${which}`}>{cartCount}</span>
}

describe('CartContext badge count', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        if (url.includes('/api/auth/profile')) {
          return new Response(JSON.stringify({}), { status: 200 })
        }
        if (url.includes('/api/cart')) {
          return new Response(
            JSON.stringify({
              success: true,
              data: {
                cart: { items: [] },
                summary: { itemCount: 1, totalQuantity: 8 },
              },
            }),
            { status: 200 }
          )
        }
        return new Response('{}', { status: 404 })
      })
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('uses itemCount (distinct products), not totalQuantity (units)', async () => {
    render(
      <CartProvider>
        <COUNT which="itemCount" />
      </CartProvider>
    )

    await waitFor(() => expect(screen.getByTestId('badge-itemCount').textContent).toBe('1'))
  })
})
