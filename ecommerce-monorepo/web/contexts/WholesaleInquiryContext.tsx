'use client'

import { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react'

/**
 * A single item held in the B2B Wholesale Inquiry basket.
 *
 * This pool is intentionally firewalled from the retail `CartContext` — adding
 * a wholesale-tier variant MUST only ever land here and never bleed into the
 * retail badge computation.
 */
export interface WholesaleInquiryItem {
  productId: string
  slug: string
  name: string
  image?: string | null
  wholesalePrice: number
  retailPrice: number
  quantity: number
  minOrderQty: number
  note?: string
}

interface WholesaleInquiryContextType {
  items: WholesaleInquiryItem[]
  count: number
  addItem: (item: WholesaleInquiryItem) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clear: () => void
  /** True when at least one wholesale-tier variant has been staged. */
  hasItems: boolean
}

const WholesaleInquiryContext = createContext<WholesaleInquiryContextType | undefined>(undefined)

export function WholesaleInquiryProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<WholesaleInquiryItem[]>([])

  const addItem = useCallback((item: WholesaleInquiryItem) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === item.productId)
      if (existing) {
        // Strict isolation: update only the wholesale pool, never the retail cart.
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, ...item } : i
        )
      }
      return [...prev, item]
    })
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(i.minOrderQty, quantity) } : i
      )
    )
  }, [])

  const clear = useCallback(() => setItems([]), [])

  const count = useMemo(() => items.length, [items])
  const hasItems = items.length > 0

  const value: WholesaleInquiryContextType = {
    items,
    count,
    addItem,
    removeItem,
    updateQuantity,
    clear,
    hasItems,
  }

  return (
    <WholesaleInquiryContext.Provider value={value}>
      {children}
    </WholesaleInquiryContext.Provider>
  )
}

export function useWholesaleInquiry() {
  const context = useContext(WholesaleInquiryContext)
  if (context === undefined) {
    throw new Error('useWholesaleInquiry must be used within a WholesaleInquiryProvider')
  }
  return context
}
