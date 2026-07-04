import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import apiClient from '../api/client'

export function usePrefetch() {
  const queryClient = useQueryClient()

  const prefetchProduct = useCallback((productId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', productId],
      queryFn: async () => {
        const response = await fetch(`${apiClient.getBaseUrl()}/api/products/${productId}`)
        if (!response.ok) throw new Error('Failed to fetch')
        return response.json()
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    })
  }, [queryClient])

  const prefetchService = useCallback((serviceId: string) => {
    queryClient.prefetchQuery({
      queryKey: ['service', serviceId],
      queryFn: async () => {
        const response = await fetch(`${apiClient.getBaseUrl()}/api/services/${serviceId}`)
        if (!response.ok) throw new Error('Failed to fetch')
        return response.json()
      },
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])

  const prefetchCategory = useCallback((slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['products', 'category', slug],
      queryFn: async () => {
        const response = await fetch(`${apiClient.getBaseUrl()}/api/products?category=${slug}&limit=20`)
        if (!response.ok) throw new Error('Failed to fetch')
        return response.json()
      },
      staleTime: 5 * 60 * 1000,
    })
  }, [queryClient])

  return {
    prefetchProduct,
    prefetchService,
    prefetchCategory,
  }
}
