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
  const router = useRouter()

  useEffect(() => {
    const checkAdminAccess = async () => {
      const storedToken = localStorage.getItem('token')
      
      if (!storedToken) {
        router.push('/auth/login')
        return
      }

      setToken(storedToken)

      try {
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
        localStorage.removeItem('token')
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router])

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading, token }}>
      {children}
    </AdminAuthContext.Provider>
  )
}