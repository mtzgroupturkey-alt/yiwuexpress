'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface QuoteCartItem {
  productId: string
  productName: string
  productSku: string
  productImage?: string | null
  quantity: number
  minOrderQty: number
  targetPrice?: number | null
  customerNotes?: string
  selectedOptions?: Record<string, string> | null
  variantId?: string | null
}

interface QuoteCartContextType {
  items: QuoteCartItem[]
  quoteCount: number
  totalUnits: number
  addToQuote: (item: {
    productId: string
    productName: string
    productSku: string
    productImage?: string | null
    quantity: number
    minOrderQty?: number
    targetPrice?: number | null
    customerNotes?: string
    selectedOptions?: Record<string, string> | null
    variantId?: string | null
  }) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateItem: (productId: string, updates: Partial<QuoteCartItem>) => void
  removeFromQuote: (productId: string) => void
  clearQuoteCart: () => void
}

const QuoteCartContext = createContext<QuoteCartContextType | undefined>(undefined)

const STORAGE_KEY = 'b2b_quote_cart'

export function QuoteCartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<QuoteCartItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load from LocalStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          setItems(parsed)
        }
      }
    } catch (e) {
      console.error('Error loading quote cart from storage:', e)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Persist to LocalStorage whenever items change
  useEffect(() => {
    if (!isLoaded) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.error('Error saving quote cart to storage:', e)
    }
  }, [items, isLoaded])

  const addToQuote = useCallback((newItem: {
    productId: string
    productName: string
    productSku: string
    productImage?: string | null
    quantity: number
    minOrderQty?: number
    targetPrice?: number | null
    customerNotes?: string
    selectedOptions?: Record<string, string> | null
    variantId?: string | null
  }) => {
    setItems((prev) => {
      const areOptionsEqual = (a?: Record<string, string> | null, b?: Record<string, string> | null) => {
        if (!a && !b) return true
        if (!a || !b) return false
        const keysA = Object.keys(a).sort()
        const keysB = Object.keys(b).sort()
        if (keysA.length !== keysB.length) return false
        return keysA.every((k) => a[k] === b[k])
      }

      const existingIndex = prev.findIndex(
        (i) => i.productId === newItem.productId && areOptionsEqual(i.selectedOptions, newItem.selectedOptions)
      )
      const moq = newItem.minOrderQty && newItem.minOrderQty > 0 ? newItem.minOrderQty : 1
      const initialQty = Math.max(newItem.quantity, moq)

      if (existingIndex > -1) {
        const updated = [...prev]
        const existing = updated[existingIndex]
        updated[existingIndex] = {
          ...existing,
          quantity: existing.quantity + initialQty,
          targetPrice: newItem.targetPrice !== undefined ? newItem.targetPrice : existing.targetPrice,
          customerNotes: newItem.customerNotes !== undefined ? newItem.customerNotes : existing.customerNotes,
        }
        return updated
      }

      return [
        ...prev,
        {
          productId: newItem.productId,
          productName: newItem.productName,
          productSku: newItem.productSku,
          productImage: newItem.productImage || null,
          quantity: initialQty,
          minOrderQty: moq,
          targetPrice: newItem.targetPrice ?? null,
          customerNotes: newItem.customerNotes || '',
          selectedOptions: newItem.selectedOptions || null,
          variantId: newItem.variantId || null,
        },
      ]
    })
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const validQty = Math.max(1, quantity)
          return { ...item, quantity: validQty }
        }
        return item
      })
    )
  }, [])

  const updateItem = useCallback((productId: string, updates: Partial<QuoteCartItem>) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          return { ...item, ...updates }
        }
        return item
      })
    )
  }, [])

  const removeFromQuote = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId))
  }, [])

  const clearQuoteCart = useCallback(() => {
    setItems([])
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (e) {}
  }, [])

  const quoteCount = items.length
  const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <QuoteCartContext.Provider
      value={{
        items,
        quoteCount,
        totalUnits,
        addToQuote,
        updateQuantity,
        updateItem,
        removeFromQuote,
        clearQuoteCart,
      }}
    >
      {children}
    </QuoteCartContext.Provider>
  )
}

const defaultFallback: QuoteCartContextType = {
  items: [],
  quoteCount: 0,
  totalUnits: 0,
  addToQuote: () => {},
  updateQuantity: () => {},
  updateItem: () => {},
  removeFromQuote: () => {},
  clearQuoteCart: () => {},
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext)
  if (!context) {
    return defaultFallback
  }
  return context
}
