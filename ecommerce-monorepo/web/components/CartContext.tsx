'use client'

import { createContext, useContext, useState, useEffect, useCallback } from 'react'

interface CartContextType {
  cartCount: number
  refreshCartCount: () => Promise<void>
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)

  const refreshCartCount = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) return

    try {
      const userId = JSON.parse(atob(token.split('.')[1])).userId
      const response = await fetch(`/api/cart?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success && data.data.cart) {
        setCartCount(data.data.summary.totalQuantity)
      } else {
        setCartCount(0)
      }
    } catch (err) {
      console.error('Failed to fetch cart count', err)
    }
  }, [])

  useEffect(() => {
    refreshCartCount()
  }, [refreshCartCount])

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount }}>
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
