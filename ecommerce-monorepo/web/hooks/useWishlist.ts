'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'

interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug: string
    price: number
    compareAtPrice?: number
    images: string[]
    stock: number
    isNewArrival?: boolean
    category?: {
      name: string
      slug: string
    }
  }
  createdAt: string
}

export function useWishlist() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()

  // Get wishlist
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api.get('/api/wishlist'),
    staleTime: 2 * 60 * 1000,
    retry: false,
    enabled: !!isAuthenticated,
  })

  const wishlist = data?.data || []

  // Check if product is in wishlist
  const isInWishlist = (productId: string): boolean => {
    return wishlist.some((item: WishlistItem) => item.productId === productId)
  }

  // Add to wishlist
  const addMutation = useMutation({
    mutationFn: (productId: string) => api.post('/api/wishlist', { productId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Added to favorites ❤️')
    },
    onError: () => {
      toast.error('Failed to add to favorites')
    },
  })

  // Remove from wishlist
  const removeMutation = useMutation({
    mutationFn: (productId: string) => api.delete(`/api/wishlist/${productId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Removed from favorites')
    },
    onError: () => {
      toast.error('Failed to remove from wishlist')
    },
  })

  // Toggle wishlist
  const toggleWishlist = async (productId: string) => {
    if (isInWishlist(productId)) {
      await removeMutation.mutateAsync(productId)
    } else {
      await addMutation.mutateAsync(productId)
    }
  }

  return {
    wishlist,
    wishlistCount: wishlist.length,
    isLoading,
    isInWishlist,
    addToWishlist: addMutation.mutate,
    removeFromWishlist: removeMutation.mutate,
    toggleWishlist,
    refetch,
  }
}
