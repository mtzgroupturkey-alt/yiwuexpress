'use client'

import React, { createContext, useContext, ReactNode } from 'react'
import { useStoreSessionStore, StoreMode } from '@/stores/storeSessionStore'

export type { StoreMode }

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

export function StoreModeProvider({ children }: { children: ReactNode }) {
  const storeMode = useStoreSessionStore((s) => s.storeMode)
  const isWholesale = useStoreSessionStore((s) => s.isWholesale)
  const isRetail = useStoreSessionStore((s) => s.isRetail)
  const isBoth = useStoreSessionStore((s) => s.isBoth)
  const loading = useStoreSessionStore((s) => s.loading)
  const error = useStoreSessionStore((s) => s.error)
  const setStoreMode = useStoreSessionStore((s) => s.setStoreMode)

  const refreshStoreMode = async () => {
    try {
      const response = await fetch('/api/settings/store-mode')
      if (response.ok) {
        const data = await response.json()
        setStoreMode(data.storeMode || 'WHOLESALE')
      }
    } catch (err) {
      console.error('Error refreshing store mode:', err)
    }
  }

  const value: StoreModeContextType = {
    storeMode,
    isWholesale,
    isRetail,
    isBoth,
    loading,
    error,
    refreshStoreMode,
  }

  return <StoreModeContext.Provider value={value}>{children}</StoreModeContext.Provider>
}

export function useStoreMode() {
  const storeMode = useStoreSessionStore((s) => s.storeMode)
  const isWholesale = useStoreSessionStore((s) => s.isWholesale)
  const isRetail = useStoreSessionStore((s) => s.isRetail)
  const isBoth = useStoreSessionStore((s) => s.isBoth)
  const loading = useStoreSessionStore((s) => s.loading)
  const error = useStoreSessionStore((s) => s.error)
  const setStoreMode = useStoreSessionStore((s) => s.setStoreMode)

  return {
    storeMode,
    isWholesale,
    isRetail,
    isBoth,
    loading,
    error,
    refreshStoreMode: async () => {
      try {
        const response = await fetch('/api/settings/store-mode')
        if (response.ok) {
          const data = await response.json()
          setStoreMode(data.storeMode || 'WHOLESALE')
        }
      } catch (err) {
        console.error('Error refreshing store mode:', err)
      }
    },
  }
}

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
  if (storeMode === 'BOTH') {
    return { displayPrice: price, priceType: 'both' }
  }
  return { displayPrice: price, priceType: 'retail' }
}

export function shouldEnforceMOQ(storeMode: StoreMode): boolean {
  return storeMode === 'WHOLESALE' || storeMode === 'BOTH'
}

export function getEffectiveMinOrderQty(minOrderQty: number, storeMode: StoreMode): number {
  if (storeMode === 'RETAIL') {
    return 1
  }
  return minOrderQty || 1
}
