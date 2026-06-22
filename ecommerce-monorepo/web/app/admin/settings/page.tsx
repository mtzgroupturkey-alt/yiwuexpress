'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsPage() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to company info by default
    router.replace('/admin/settings/company')
  }, [router])

  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
        <p className="text-sm text-gray-500">Loading settings...</p>
      </div>
    </div>
  )
}