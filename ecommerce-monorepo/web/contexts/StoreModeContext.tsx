'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type StoreMode = 'WHOLESALE' | 'RETAIL' | 'BOTH'

interface StoreModeContextType {
  storeMode: StoreMode
  isWholesale: boolean
  isRetail: boolean
  isBoth: boolean
  loading: boolean
  error: string | null
  refreshStoreMode: () => Promise<void>
}

const StoreModeContext = createContext<StoreModeContextType | undefined>(undefined)

interface StoreModeProviderProps {
  children: ReactNode
}

export function StoreModeProvider({ children }: StoreModeProviderProps) {
  const [storeMode, setStoreMode] = useState<StoreMode>('WHOLESALE')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStoreMode = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/settings/store-mode')
      const data = await response.json()

      if (response.ok) {
        setStoreMode(data.storeMode || 'WHOLESALE')
      } else {
        setError(data.error || 'Failed to fetch store mode')
        setStoreMode('WHOLESALE') // Fallback to wholesale
      }
    } catch (err) {
      console.error('Error fetching store mode:', err)
      setError('Network error')
      setStoreMode('WHOLESALE') // Fallback to wholesale
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStoreMode()
  }, [])

  const value: StoreModeContextType = {
    storeMode,
    isWholesale: storeMode === 'WHOLESALE' || storeMode === 'BOTH',
    isRetail: storeMode === 'RETAIL' || storeMode === 'BOTH',
    isBoth: storeMode === 'BOTH',
    loading,
    error,
    refreshStoreMode: fetchStoreMode
  }

  return (
    <StoreModeContext.Provider value={value}>
      {children}
    </StoreModeContext.Provider>
  )
}

export function useStoreMode() {
  const context = useContext(StoreModeContext)
  if (context === undefined) {
    throw new Error('useStoreMode must be used within a StoreModeProvider')
  }
  return context
}

// Helper function to get price based on store mode
export function getDisplayPrice(
  price: number,
  wholesalePrice: number | null | undefined,
  storeMode: StoreMode
): { displayPrice: number; priceType: 'retail' | 'wholesale' | 'both' } {
  if (storeMode === 'WHOLESALE' && wholesalePrice) {
    return { displayPrice: wholesalePrice, priceType: 'wholesale' }
  }
  
  if (storeMode === 'RETAIL') {
    return { displayPrice: price, priceType: 'retail' }
  }
  
  // BOTH mode - return retail price as primary, but indicate both are available
  if (storeMode === 'BOTH') {
    return { displayPrice: price, priceType: 'both' }
  }
  
  // Default fallback
  return { displayPrice: price, priceType: 'retail' }
}

// Helper function to check if MOQ should be enforced
export function shouldEnforceMOQ(storeMode: StoreMode): boolean {
  return storeMode === 'WHOLESALE' || storeMode === 'BOTH'
}

// Helper function to get minimum order quantity
export function getEffectiveMinOrderQty(
  minOrderQty: number,
  storeMode: StoreMode
): number {
  if (storeMode === 'RETAIL') {
    return 1 // Retail mode allows single unit purchases
  }
  
  return minOrderQty || 1
}
