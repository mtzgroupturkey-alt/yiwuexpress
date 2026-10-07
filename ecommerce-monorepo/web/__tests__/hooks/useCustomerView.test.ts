import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useCustomerView } from '@/hooks/useCustomerView'

let mockAuth = {
  user: null as any,
  isAuthenticated: false,
  isLoading: false,
}

let mockSessionMode = {
  sessionMode: 'retail',
  isWholesaleSession: false,
}

let mockStoreMode = {
  storeMode: 'WHOLESALE',
}

let mockSettings = {
  storeMode: 'WHOLESALE',
}

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => mockAuth,
}))

vi.mock('@/contexts/SessionModeContext', () => ({
  useSessionMode: () => mockSessionMode,
}))

vi.mock('@/contexts/StoreModeContext', () => ({
  useStoreMode: () => mockStoreMode,
}))

vi.mock('@/components/SettingsProvider', () => ({
  useSettings: () => mockSettings,
}))

describe('useCustomerView hook', () => {
  beforeEach(() => {
    mockAuth = {
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }
    mockSessionMode = {
      sessionMode: 'retail',
      isWholesaleSession: false,
    }
    mockStoreMode = {
      storeMode: 'WHOLESALE',
    }
    mockSettings = {
      storeMode: 'WHOLESALE',
    }
  })

  it('Edge Case 1: Guest + storeMode=WHOLESALE -> guest view (cannot see wholesale price)', () => {
    mockAuth.isAuthenticated = false
    mockAuth.user = null
    mockStoreMode.storeMode = 'WHOLESALE'

    const { result } = renderHook(() => useCustomerView())
    expect(result.current.view).toBe('guest')
    expect(result.current.isGuest).toBe(true)
    expect(result.current.canSeeWholesalePrice).toBe(false)
    expect(result.current.canRequestQuote).toBe(false)
  })

  it('Edge Case 2: Retail user + storeMode=WHOLESALE -> retail view', () => {
    mockAuth.isAuthenticated = true
    mockAuth.user = {
      id: 'u-1',
      userType: 'RETAIL',
      verificationStatus: 'UNVERIFIED',
      role: 'USER',
    }
    mockStoreMode.storeMode = 'WHOLESALE'

    const { result } = renderHook(() => useCustomerView())
    expect(result.current.view).toBe('retail')
    expect(result.current.isRetail).toBe(true)
    expect(result.current.canSeeWholesalePrice).toBe(false)
    expect(result.current.canRequestQuote).toBe(false)
  })

  it('Unverified Wholesale user -> retail view', () => {
    mockAuth.isAuthenticated = true
    mockAuth.user = {
      id: 'u-2',
      userType: 'WHOLESALE',
      verificationStatus: 'PENDING',
      role: 'USER',
    }
    mockStoreMode.storeMode = 'WHOLESALE'

    const { result } = renderHook(() => useCustomerView())
    expect(result.current.view).toBe('retail')
    expect(result.current.isRetail).toBe(true)
    expect(result.current.canSeeWholesalePrice).toBe(false)
  })

  it('Edge Case 3: Approved Wholesale + storeMode=RETAIL -> retail view', () => {
    mockAuth.isAuthenticated = true
    mockAuth.user = {
      id: 'u-3',
      userType: 'WHOLESALE',
      verificationStatus: 'APPROVED',
      role: 'USER',
    }
    mockStoreMode.storeMode = 'RETAIL'

    const { result } = renderHook(() => useCustomerView())
    expect(result.current.view).toBe('retail')
    expect(result.current.isRetail).toBe(true)
    expect(result.current.canSeeWholesalePrice).toBe(false)
  })

  it('Edge Case 4: BOTH user + APPROVED + storeMode=BOTH + session retail -> retail view', () => {
    mockAuth.isAuthenticated = true
    mockAuth.user = {
      id: 'u-4',
      userType: 'BOTH',
      verificationStatus: 'APPROVED',
      role: 'USER',
    }
    mockStoreMode.storeMode = 'BOTH'
    mockSessionMode.sessionMode = 'retail'
    mockSessionMode.isWholesaleSession = false

    const { result } = renderHook(() => useCustomerView())
    expect(result.current.view).toBe('retail')
    expect(result.current.isRetail).toBe(true)
    expect(result.current.canSeeWholesalePrice).toBe(false)
  })

  it('Edge Case 5: BOTH user + APPROVED + storeMode=BOTH + session wholesale -> wholesale view', () => {
    mockAuth.isAuthenticated = true
    mockAuth.user = {
      id: 'u-5',
      userType: 'BOTH',
      verificationStatus: 'APPROVED',
      role: 'USER',
    }
    mockStoreMode.storeMode = 'BOTH'
    mockSessionMode.sessionMode = 'wholesale'
    mockSessionMode.isWholesaleSession = true

    const { result } = renderHook(() => useCustomerView())
    expect(result.current.view).toBe('wholesale')
    expect(result.current.isWholesale).toBe(true)
    expect(result.current.canSeeWholesalePrice).toBe(true)
    expect(result.current.canRequestQuote).toBe(true)
  })

  it('Admin user -> wholesale view', () => {
    mockAuth.isAuthenticated = true
    mockAuth.user = {
      id: 'admin-1',
      userType: 'RETAIL',
      verificationStatus: 'UNVERIFIED',
      role: 'ADMIN',
    }
    mockStoreMode.storeMode = 'WHOLESALE'

    const { result } = renderHook(() => useCustomerView())
    expect(result.current.view).toBe('wholesale')
    expect(result.current.isWholesale).toBe(true)
    expect(result.current.canSeeWholesalePrice).toBe(true)
  })
})
