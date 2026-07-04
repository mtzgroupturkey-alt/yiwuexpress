'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

interface AdminAuthContextType {
  isAdmin: boolean
  loading: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  loading: true,
})

export const useAdminAuth = () => useContext(AdminAuthContext)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const checkAdminAccess = async () => {
      try {
        const response = await fetch('/api/admin/auth', {
          credentials: 'include',
        })

        if (response.status === 403) {
          alert('Admin access required')
          router.push('/')
          return
        }

        if (response.status === 401) {
          router.push('/auth/login')
          return
        }

        if (!response.ok) {
          throw new Error('Invalid token')
        }

        setIsAdmin(true)
      } catch (error) {
        console.error('Admin auth error:', error)
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAdminAccess()
  }, [router, mounted])

  return (
    <AdminAuthContext.Provider value={{ isAdmin, loading }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
