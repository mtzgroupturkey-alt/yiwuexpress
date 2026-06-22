'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AdminAuthContextType {
  isAdmin: boolean
  loading: boolean
  token: string | null
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  loading: true,
  token: null
})

export const useAdminAuth = () => useContext(AdminAuthContext)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const checkAdminAccess = async () => {
      try {
        // Ensure we're on client side and localStorage is available
        if (typeof window === 'undefined') return
        
        const storedToken = localStorage.getItem('token')
        
        if (!storedToken) {
          router.push('/auth/login')
          setLoading(false)
          return
        }

        setToken(storedToken)

        // Verify admin access using dedicated auth endpoint
        const response = await fetch('/api/admin/auth', {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        })

        if (response.status === 403) {
          alert('Admin access required')
          router.push('/')
          return
        }

        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/auth/login')
          return
        }

        if (!response.ok) {
          throw new Error('Invalid token')
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Admin auth error:', error)
        if (typeof window !== 'undefined') {
          localStorage.removeItem('token')
        }
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router, mounted])

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading, token }}>
      {children}
    </AdminAuthContext.Provider>
  )
}