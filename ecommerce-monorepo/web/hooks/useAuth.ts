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
        set({ isLoading: true })
        try {
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include', // Important: send cookies
            body: JSON.stringify({ email, password }),
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || 'Login failed')
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
          const response = await fetch('/api/auth/me', {
            credentials: 'include', // Send httpOnly cookie
          })

          if (!response.ok) {
            throw new Error('Authentication failed')
          }

          const { data: user } = await response.json()
          set({ user, isAuthenticated: true, isLoading: false })
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
