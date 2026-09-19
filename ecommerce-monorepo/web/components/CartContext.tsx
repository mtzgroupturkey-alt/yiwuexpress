'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'

interface CartContextType {
  cartCount: number
  refreshCartCount: () => Promise<void>
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartCount, setCartCount] = useState(0)
  const { isAuthenticated, isInitialized, checkAuth } = useAuth()
  const isFetchingRef = useRef(false)

  const getGuestCartCount = useCallback(() => {
    try {
      if (typeof window === 'undefined') return 0
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
    const guestQty = getGuestCartCount()

    // If not authenticated, calculate strictly from guest cart without hitting backend
    if (!isAuthenticated) {
      setCartCount(guestQty)
      return
    }

    if (isFetchingRef.current) return
    isFetchingRef.current = true

    try {
      const response = await fetch('/api/cart', {
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.data?.cart) {
          const distinctCount = data.data.summary?.itemCount ?? data.data.summary?.totalQuantity ?? 0
          setCartCount(distinctCount + guestQty)
        } else {
          setCartCount(guestQty)
        }
      } else {
        setCartCount(guestQty)
      }
    } catch {
      setCartCount(guestQty)
    } finally {
      isFetchingRef.current = false
    }
  }, [isAuthenticated, getGuestCartCount])

  const clearCart = useCallback(() => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('yiwu_guest_cart')
      }
    } catch {}
    setCartCount(0)
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cart-updated'))
    }
  }, [])

  // Initialize auth state once on mount if not already done
  useEffect(() => {
    if (!isInitialized) {
      checkAuth()
    }
  }, [isInitialized, checkAuth])

  // Sync cart count when auth state changes (e.g. login / logout)
  useEffect(() => {
    refreshCartCount()
  }, [refreshCartCount])

  // Listen to cart-updated and storage events across windows/tabs
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

