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

  // Check authentication status first (uses public endpoint, no 401)
  const checkAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/status', {
        credentials: 'include',
      })
      if (!response.ok) {
        setIsAuthenticated(false)
        return false
      }
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
      return data.authenticated
    } catch {
      setIsAuthenticated(false)
      return false
    }
  }, [])

  const getGuestCartCount = useCallback(() => {
    try {
      const saved = localStorage.getItem('yiwu_guest_cart')
      if (saved) {
        const items = JSON.parse(saved)
        if (Array.isArray(items)) {
          return items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0)
        }
      }
    } catch {}
    return 0
  }, [])

  const refreshCartCount = useCallback(async () => {
    // If not authenticated, calculate from guest cart
    if (isAuthenticated === false) {
      setCartCount(getGuestCartCount())
      return
    }

    try {
      const response = await fetch('/api/cart', {
        credentials: 'include', // Important for cookies
      })
      
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data.cart) {
          const distinctCount = data.data.summary.itemCount ?? data.data.summary.totalQuantity ?? 0
          const guestQty = getGuestCartCount()
          setCartCount(distinctCount + guestQty)
        } else {
          setCartCount(getGuestCartCount())
        }
      } else if (response.status === 401) {
        // Not logged in
        setIsAuthenticated(false)
        setCartCount(getGuestCartCount())
      }
    } catch (err) {
      console.error('Failed to fetch cart count', err)
      setCartCount(getGuestCartCount())
    }
  }, [isAuthenticated, getGuestCartCount])

  const clearCart = useCallback(() => {
    try {
      localStorage.removeItem('yiwu_guest_cart')
    } catch {}
    setCartCount(0)
    window.dispatchEvent(new CustomEvent('cart-updated'))
  }, [])

  useEffect(() => {
    // Check auth first, then fetch cart
    checkAuth().then((authenticated) => {
      if (authenticated) {
        refreshCartCount()
      } else {
        setCartCount(getGuestCartCount())
      }
    })
  }, [checkAuth, refreshCartCount, getGuestCartCount])

  // Listen to cart-updated and storage events across the window
  useEffect(() => {
    const handleCartUpdated = () => {
      refreshCartCount()
    }
    window.addEventListener('cart-updated', handleCartUpdated)
    window.addEventListener('storage', handleCartUpdated)
    return () => {
      window.removeEventListener('cart-updated', handleCartUpdated)
      window.removeEventListener('storage', handleCartUpdated)
    }
  }, [refreshCartCount])

  // Re-fetch cart when auth status changes
  useEffect(() => {
    if (isAuthenticated === true) {
      refreshCartCount()
    } else if (isAuthenticated === false) {
      setCartCount(getGuestCartCount())
    }
  }, [isAuthenticated, refreshCartCount, getGuestCartCount])

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
