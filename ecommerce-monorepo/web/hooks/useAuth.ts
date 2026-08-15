'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'USER' | 'SUPPLIER' | 'ADMIN'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  phone?: string
  country?: string
  isActive?: boolean
  createdAt?: string
  supplierProfile?: {
    id: string
    companyName: string
    businessType?: string
  }
}

interface AuthState {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  register: (data: RegisterData) => Promise<User>
  logout: () => Promise<void>
  updateUser: (data: Partial<User>) => void
  checkAuth: () => Promise<void>
}

interface RegisterData {
  name: string
  email: string
  password: string
  phone?: string
  country?: string
}

// Add a flag to prevent multiple simultaneous auth checks
let isCheckingAuth = false

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        console.log('[useAuth] Starting login...', { email })
        set({ isLoading: true })
        try {
          console.log('[useAuth] Sending POST to /api/auth/login')
          console.log('[useAuth] Credentials included:', true)
          
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: send cookies
            body: JSON.stringify({ email, password }),
          })

          console.log('[useAuth] Response status:', response.status)
          console.log('[useAuth] Response OK:', response.ok)
          
          // Log response headers
          console.log('[useAuth] Response headers:')
          response.headers.forEach((value, key) => {
            console.log(`  ${key}: ${value}`)
          })

          if (!response.ok) {
            const error = await response.json()
            console.error('[useAuth] Login failed:', error)
            throw new Error(error.error || 'Login failed')
          }

          const { user } = await response.json()
          console.log('[useAuth] User data received:', {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name
          })
          
          // NO TOKEN - it's in httpOnly cookie
          console.log('[useAuth] Token is in httpOnly cookie (not in response)')

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })

          console.log('[useAuth] State updated, login complete')
          console.log('[useAuth] Checking cookies...')
          console.log('[useAuth] document.cookie:', document.cookie || '(no visible cookies - httpOnly cookies are hidden)')
          
          return user
        } catch (error: any) {
          console.error('[useAuth] Login error:', error)
          set({ isLoading: false })
          throw error
        }
      },

      register: async (data: RegisterData) => {
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: send cookies
            body: JSON.stringify(data),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Registration failed')
          }

          const { user } = await response.json()
          // NO TOKEN - it's in httpOnly cookie

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
          })

          return user
        } catch (error: any) {
          set({ isLoading: false })
          throw error
        }
      },

      logout: async () => {
        try {
          // Call logout endpoint to clear httpOnly cookie
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // Clear local state regardless of API call result
          set({
            user: null,
            isAuthenticated: false,
          })
        }
      },

      updateUser: (data: Partial<User>) => {
        const current = get().user
        if (current) {
          set({ user: { ...current, ...data } })
        }
      },

      checkAuth: async () => {
        // Prevent multiple simultaneous checks
        if (isCheckingAuth) {
          return
        }
        
        // Don't check if already loading
        if (get().isLoading) {
          return
        }
        
        isCheckingAuth = true
        set({ isLoading: true })
        
        try {
          // Use public /api/auth/status endpoint (no 401 for unauthenticated)
          const response = await fetch('/api/auth/status', {
            credentials: 'include',
          })

          if (!response.ok) {
            throw new Error('Auth status check failed')
          }

          const data = await response.json()
          if (data.authenticated && data.user) {
            // Merge persisted user data with fresh auth check
            const currentUser = get().user
            set({
              user: { ...currentUser, ...data.user } as User,
              isAuthenticated: true,
              isLoading: false,
            })
          } else {
            set({ user: null, isAuthenticated: false, isLoading: false })
          }
        } catch {
          set({ user: null, isAuthenticated: false, isLoading: false })
        } finally {
          isCheckingAuth = false
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        // NO TOKEN STORAGE
      }),
    }
  )
)
