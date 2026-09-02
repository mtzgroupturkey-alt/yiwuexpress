'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

export interface AdminUser {
  id: string
  email: string
  name?: string
  role: string
  profilePhoto?: string | null
}

interface AdminAuthContextType {
  isAdmin: boolean
  loading: boolean
  user: AdminUser | null
}

const AdminAuthContext = createContext<AdminAuthContextType>({
  isAdmin: false,
  loading: true,
  user: null,
})

export const useAdminAuth = () => useContext(AdminAuthContext)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState(false)
  const [user, setUser] = useState<AdminUser | null>(null)
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

        const data = await response.json()
        if (data.user) {
          setUser(data.user)
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
    <AdminAuthContext.Provider value={{ isAdmin, loading, user }}>
      {children}
    </AdminAuthContext.Provider>
  )
}
