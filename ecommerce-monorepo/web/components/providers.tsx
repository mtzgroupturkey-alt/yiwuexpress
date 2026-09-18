'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { MotionConfig } from 'framer-motion'
import { CartProvider } from './CartContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <CartProvider>
          <Toaster position="top-right" />
          {children}
        </CartProvider>
      </MotionConfig>
    </QueryClientProvider>
  )
}