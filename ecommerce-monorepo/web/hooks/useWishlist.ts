'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { mapDbProductToDesign3 } from '@/lib/adapters/design3ProductAdapter'
import { Product } from '@/app/[locale]/design-3/types'

export interface WishlistItem {
  id: string
  productId: string
  product: {
    id: string
    name: string
    slug?: string
    price: number
    compareAtPrice?: number
    images?: string[]
    image?: string
    thumbnail?: string
    stock?: number
    isNewArrival?: boolean
    isFeatured?: boolean
    category?: {
      name: string
      slug: string
    }
  }
  createdAt?: string
}

const GUEST_STORAGE_KEY = 'yiwu_guest_wishlist'

export function useWishlist() {
  const queryClient = useQueryClient()
  const { isAuthenticated } = useAuth()
  const [guestWishlist, setGuestWishlist] = useState<WishlistItem[]>([])
  const [isClient, setIsClient] = useState(false)

  // Initialize guest wishlist from localStorage
  useEffect(() => {
    setIsClient(true)
    try {
      const stored = localStorage.getItem(GUEST_STORAGE_KEY)
      if (stored) {
        setGuestWishlist(JSON.parse(stored))
      }
    } catch (e) {
      console.warn('Failed to load guest wishlist from storage', e)
    }
  }, [])

  // Sync guest wishlist changes to localStorage
  const updateGuestStorage = useCallback((items: WishlistItem[]) => {
    setGuestWishlist(items)
    try {
      localStorage.setItem(GUEST_STORAGE_KEY, JSON.stringify(items))
    } catch (e) {
      console.warn('Failed to persist guest wishlist to storage', e)
    }
  }, [])

  // DB Wishlist Query for authenticated users
  const { data: dbData, isLoading: isDbLoading, refetch } = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      const res = await fetch('/api/wishlist', { credentials: 'include' })
      if (!res.ok) {
        if (res.status === 401) return { data: [] }
        throw new Error('Failed to fetch wishlist')
      }
      return res.json()
    },
    staleTime: 60 * 1000,
    retry: false,
    enabled: !!isAuthenticated,
  })

  // Sync guest items to DB on login
  useEffect(() => {
    if (isAuthenticated && guestWishlist.length > 0) {
      const syncItems = async () => {
        for (const item of guestWishlist) {
          try {
            await fetch('/api/wishlist', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ productId: item.productId }),
            })
          } catch {
            // ignore non-db items
          }
        }
        queryClient.invalidateQueries({ queryKey: ['wishlist'] })
        updateGuestStorage([])
      }
      syncItems()
    }
  }, [isAuthenticated, guestWishlist, queryClient, updateGuestStorage])

  const wishlist: WishlistItem[] = useMemo(() => {
    if (isAuthenticated) {
      return dbData?.data || []
    }
    return guestWishlist
  }, [isAuthenticated, dbData, guestWishlist])

  // Set of all favorited product IDs for fast O(1) lookup
  const favoriteIds = useMemo(() => {
    return new Set(wishlist.map((item) => item.productId || item.id))
  }, [wishlist])

  const isInWishlist = useCallback(
    (productId: string): boolean => {
      if (!productId) return false
      return favoriteIds.has(productId)
    },
    [favoriteIds]
  )

  // Add DB Mutation
  const addMutation = useMutation({
    mutationFn: async (product: any) => {
      const productId = typeof product === 'string' ? product : product.id
      const res = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ productId }),
      })
      if (!res.ok) {
        throw new Error('Failed to add to database wishlist')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Added to favorites ❤️')
    },
    onError: (_err, product: any) => {
      // If adding to DB failed (e.g. demo product not in DB), save in guest storage
      const productId = typeof product === 'string' ? product : product.id
      const item: WishlistItem = {
        id: productId,
        productId,
        product: typeof product === 'object' && product !== null ? product : {
          id: productId,
          name: 'Product',
          price: 0,
        },
        createdAt: new Date().toISOString(),
      }
      const updated = [...guestWishlist.filter((i) => i.productId !== productId), item]
      updateGuestStorage(updated)
      toast.success('Added to favorites ❤️')
    },
  })

  // Remove DB Mutation
  const removeMutation = useMutation({
    mutationFn: async (productId: string) => {
      const res = await fetch(`/api/wishlist/${encodeURIComponent(productId)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        throw new Error('Failed to remove from database wishlist')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] })
      toast.success('Removed from favorites')
    },
    onError: (_err, productId: string) => {
      const updated = guestWishlist.filter((i) => i.productId !== productId && i.id !== productId)
      updateGuestStorage(updated)
      toast.success('Removed from favorites')
    },
  })

  // Unified Toggle Wishlist function
  const toggleWishlist = useCallback(
    async (productInput: any) => {
      const productId = typeof productInput === 'string' ? productInput : productInput?.id
      if (!productId) return

      if (favoriteIds.has(productId)) {
        // Remove
        if (isAuthenticated) {
          try {
            await removeMutation.mutateAsync(productId)
          } catch {
            const updated = guestWishlist.filter((i) => i.productId !== productId && i.id !== productId)
            updateGuestStorage(updated)
          }
        } else {
          const updated = guestWishlist.filter((i) => i.productId !== productId && i.id !== productId)
          updateGuestStorage(updated)
          toast.success('Removed from favorites')
        }
      } else {
        // Add
        if (isAuthenticated) {
          try {
            await addMutation.mutateAsync(productInput)
          } catch {
            // Handled in onError
          }
        } else {
          const item: WishlistItem = {
            id: productId,
            productId,
            product: typeof productInput === 'object' && productInput !== null ? productInput : {
              id: productId,
              name: 'Product',
              price: 0,
            },
            createdAt: new Date().toISOString(),
          }
          const updated = [...guestWishlist.filter((i) => i.productId !== productId), item]
          updateGuestStorage(updated)
          toast.success('Added to favorites ❤️')
        }
      }
    },
    [favoriteIds, isAuthenticated, guestWishlist, removeMutation, addMutation, updateGuestStorage]
  )

  // Map to Design 3 Product[] for FavoritesModal
  const favoritesList: Product[] = useMemo(() => {
    return wishlist.map((item) => {
      if (item.product && (item.product as any).department) {
        // Already a Design-3 Product
        return item.product as unknown as Product
      }
      return mapDbProductToDesign3(item.product || item)
    })
  }, [wishlist])

  return {
    wishlist,
    wishlistCount: favoriteIds.size,
    favoriteIds,
    favoritesList,
    isLoading: isAuthenticated ? isDbLoading : !isClient,
    isInWishlist,
    addToWishlist: (p: any) => toggleWishlist(p),
    removeFromWishlist: (id: string) => {
      if (favoriteIds.has(id)) toggleWishlist(id)
    },
    toggleWishlist,
    refetch,
  }
}

