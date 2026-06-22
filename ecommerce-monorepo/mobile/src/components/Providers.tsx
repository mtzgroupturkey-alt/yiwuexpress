import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as PaperProvider } from 'react-native-paper'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      retry: 1,
    },
  },
})

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <PaperProvider>
        {children}
      </PaperProvider>
    </QueryClientProvider>
  )
}