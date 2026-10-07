'use client'

import { useAuth } from '@/hooks/useAuth'
import { useSessionMode } from '@/contexts/SessionModeContext'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useSettings } from '@/components/SettingsProvider'

export type CustomerView = 'guest' | 'retail' | 'wholesale'

export interface CustomerViewResult {
  view: CustomerView
  isGuest: boolean
  isRetail: boolean
  isWholesale: boolean
  canSeeWholesalePrice: boolean
  canRequestQuote: boolean
  canAddToWholesaleCart: boolean
  isLoading: boolean
}

export function useCustomerView(): CustomerViewResult {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { sessionMode, isWholesaleSession } = useSessionMode()
  const { storeMode: contextStoreMode } = useStoreMode()
  const { storeMode: settingsStoreMode } = useSettings()

  const currentStoreMode = contextStoreMode || settingsStoreMode || 'WHOLESALE'

  if (isLoading) {
    return {
      view: 'guest',
      isGuest: true,
      isRetail: false,
      isWholesale: false,
      canSeeWholesalePrice: false,
      canRequestQuote: false,
      canAddToWholesaleCart: false,
      isLoading: true,
    }
  }

  // 1. Unauthenticated users are always guests (retail view)
  if (!isAuthenticated || !user) {
    return {
      view: 'guest',
      isGuest: true,
      isRetail: false,
      isWholesale: false,
      canSeeWholesalePrice: false,
      canRequestQuote: false,
      canAddToWholesaleCart: false,
      isLoading: false,
    }
  }

  // 2. Check if user is an approved wholesale customer or administrator
  const isAdmin = user.role === 'ADMIN'
  const isApprovedWholesale =
    isAdmin ||
    ((user.userType === 'WHOLESALE' || user.userType === 'BOTH') &&
      user.verificationStatus === 'APPROVED')

  // If user is not approved wholesale, they see retail view
  if (!isApprovedWholesale) {
    return {
      view: 'retail',
      isGuest: false,
      isRetail: true,
      isWholesale: false,
      canSeeWholesalePrice: false,
      canRequestQuote: false,
      canAddToWholesaleCart: false,
      isLoading: false,
    }
  }

  // 3. User is approved wholesale (or Admin). Check storeMode & sessionMode constraints:
  // Edge Case 3: Wholesale + storeMode = RETAIL -> retail view (no wholesale in retail-only store)
  if (currentStoreMode === 'RETAIL') {
    return {
      view: 'retail',
      isGuest: false,
      isRetail: true,
      isWholesale: false,
      canSeeWholesalePrice: false,
      canRequestQuote: false,
      canAddToWholesaleCart: false,
      isLoading: false,
    }
  }

  // Edge Cases 4 & 5: When storeMode is BOTH or user is BOTH, check session toggle
  if (currentStoreMode === 'BOTH') {
    const isRetailSession = sessionMode === 'retail' && !isWholesaleSession
    if (isRetailSession && !isAdmin) {
      return {
        view: 'retail',
        isGuest: false,
        isRetail: true,
        isWholesale: false,
        canSeeWholesalePrice: false,
        canRequestQuote: false,
        canAddToWholesaleCart: false,
        isLoading: false,
      }
    }
  }

  // Pure wholesale user or BOTH user in wholesale session in WHOLESALE/BOTH store
  return {
    view: 'wholesale',
    isGuest: false,
    isRetail: false,
    isWholesale: true,
    canSeeWholesalePrice: true,
    canRequestQuote: true,
    canAddToWholesaleCart: true,
    isLoading: false,
  }
}
