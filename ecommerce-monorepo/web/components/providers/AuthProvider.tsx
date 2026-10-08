'use client'

import React, { createContext, useContext, useEffect, useMemo } from 'react'
import { useAuth, User } from '@/hooks/useAuth'
import type { ServerAuthResult, ServerAuthUser } from '@/lib/auth/getServerAuth'

export interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  isLoading: false,
})

export function AuthProvider({
  initialAuth,
  children,
}: {
  initialAuth?: ServerAuthResult
  children: React.ReactNode
}) {
  const storeUser = useAuth((s) => s.user)
  const storeIsAuthenticated = useAuth((s) => s.isAuthenticated)
  const storeIsLoading = useAuth((s) => s.isLoading)

  // Synchronize client zustand store with SSR-validated server state
  useEffect(() => {
    if (initialAuth) {
      if (initialAuth.isAuthenticated && initialAuth.user) {
        useAuth.setState((prev) => ({
          ...prev,
          isAuthenticated: true,
          user: {
            ...prev.user,
            id: initialAuth.user!.id,
            email: initialAuth.user!.email,
            name: initialAuth.user!.name || prev.user?.name || initialAuth.user!.email.split('@')[0],
            role: initialAuth.user!.role as any,
            userType: (initialAuth.user!.userType as any) || prev.user?.userType,
            verificationStatus: (initialAuth.user!.verificationStatus as any) || prev.user?.verificationStatus,
          },
          isLoading: false,
          isInitialized: true,
        }))
      } else {
        // If server determined user is unauthenticated (expired/invalid/no cookie),
        // ensure stale local storage doesn't mislead the client
        useAuth.setState((prev) => ({
          ...prev,
          isAuthenticated: false,
          user: null,
          isLoading: false,
          isInitialized: true,
        }))
      }
    }
  }, [initialAuth])

  // Guaranteed single source of truth for SSR and CSR
  const value = useMemo<AuthContextType>(() => {
    // 1. Server-side rendering pass (strictly uses initialAuth from layout)
    if (typeof window === 'undefined') {
      return {
        isAuthenticated: initialAuth?.isAuthenticated ?? false,
        user: (initialAuth?.user as unknown as User) ?? null,
        isLoading: false,
      }
    }

    // 2. Client-side rendering pass
    const isAuthed = initialAuth !== undefined
      ? (storeIsAuthenticated || initialAuth.isAuthenticated)
      : storeIsAuthenticated

    const activeUser = storeUser || ((initialAuth?.user as unknown as User) ?? null)

    return {
      isAuthenticated: isAuthed,
      user: activeUser,
      isLoading: storeIsLoading,
    }
  }, [initialAuth, storeIsAuthenticated, storeUser, storeIsLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * Universal hook to access SSR-seeded authentication state.
 * Safe to use in any client component.
 */
export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext)
  const storeAuth = useAuth()
  if (context && context.isAuthenticated !== undefined) {
    return context
  }
  return {
    isAuthenticated: storeAuth.isAuthenticated,
    user: storeAuth.user,
    isLoading: storeAuth.isLoading,
  }
}
