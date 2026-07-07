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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)

  // Check authentication status first
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/profile', {
        credentials: 'include',
      })
      setIsAuthenticated(response.ok)
      return response.ok
    } catch {
      setIsAuthenticated(false)
      return false
    }
  }, [])

  const refreshCartCount = useCallback(async () => {
    // Only fetch cart if authenticated
    if (isAuthenticated === false) {
      setCartCount(0)
      return
    }

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
        setIsAuthenticated(false)
        setCartCount(0)
      }
    } catch (err) {
      console.error('Failed to fetch cart count', err)
      setCartCount(0)
    }
  }, [isAuthenticated])

  const clearCart = useCallback(() => {
    setCartCount(0)
  }, [])

  useEffect(() => {
    // Check auth first, then fetch cart
    checkAuth().then((authenticated) => {
      if (authenticated) {
        refreshCartCount()
      }
    })
  }, [])

  // Re-fetch cart when auth status changes
  useEffect(() => {
    if (isAuthenticated === true) {
      refreshCartCount()
    } else if (isAuthenticated === false) {
      setCartCount(0)
    }
  }, [isAuthenticated, refreshCartCount])

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
