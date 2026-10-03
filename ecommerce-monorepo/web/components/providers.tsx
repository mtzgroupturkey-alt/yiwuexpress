'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { MotionConfig } from 'framer-motion'
import { CartProvider } from './CartContext'
import { QuoteCartProvider } from './QuoteCartContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  useEffect(() => {
    const handleRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason
      const isChunkError =
        reason?.name === 'ChunkLoadError' ||
        reason?.message?.includes('Loading chunk') ||
        reason?.message?.includes('ChunkLoadError')

      if (isChunkError) {
        const lastReload = sessionStorage.getItem('chunk_reload_retry')
        const now = Date.now()
        if (!lastReload || now - parseInt(lastReload, 10) > 10000) {
          sessionStorage.setItem('chunk_reload_retry', now.toString())
          window.location.reload()
        }
      }
    }

    window.addEventListener('unhandledrejection', handleRejection)
    return () => window.removeEventListener('unhandledrejection', handleRejection)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <CartProvider>
          <QuoteCartProvider>
            <Toaster position="top-right" />
            {children}
          </QuoteCartProvider>
        </CartProvider>
      </MotionConfig>
    </QueryClientProvider>
  )
}