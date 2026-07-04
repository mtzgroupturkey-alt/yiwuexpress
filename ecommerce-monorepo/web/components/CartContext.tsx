'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CartContextType {
  cartCount: number
  refreshCartCount: () => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)

  const refreshCartCount = useCallback(async () => {
    try {
      const response = await fetch('/api/cart', {
        credentials: 'include', // Important for cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.cart) {
          setCartCount(data.data.summary.totalQuantity || 0)
        } else {
          setCartCount(0)
        }
      } else if (response.status === 401) {
        // Not logged in
        setCartCount(0)
      }
    } catch (err) {
      console.error('Failed to fetch cart count', err)
      setCartCount(0)
    }
  }, [])

  const clearCart = useCallback(() => {
    setCartCount(0)
  }, [])

  useEffect(() => {
    refreshCartCount()
  }, [refreshCartCount])

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
