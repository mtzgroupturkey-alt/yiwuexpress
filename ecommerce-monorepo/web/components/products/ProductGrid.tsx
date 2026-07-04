'use client'

import { useState, useEffect } from 'react'
import ProductCard from './ProductCard'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Star } from 'lucide-react'
import { useCart } from '@/components/CartContext'

interface Product {
  id: string
  slug: string
  name: string
  price: number
  compareAtPrice?: number | null
  thumbnail?: string | null
  stock: number
  sku: string
  isFeatured?: boolean
  isNew?: boolean
  rating?: number
  reviewCount?: number
  category?: {
    id: string
    name: string
    slug: string
  } | null
}

interface ProductGridProps {
  title?: string
  subtitle?: string
  products: Product[]
  columns?: 2 | 3 | 4
  showLoadMore?: boolean
  onLoadMore?: () => void
  onAddToCart?: (productId: string) => void
  isLoading?: boolean
  viewMode?: 'grid' | 'list'
}

export default function ProductGrid({
  title,
  subtitle,
  products,
  columns = 4,
  showLoadMore = false,
  onLoadMore,
  onAddToCart,
  isLoading = false,
  viewMode = 'grid'
}: ProductGridProps) {
  const { refreshCartCount } = useCart()
  const [wishlist, setWishlist] = useState<Set<string>>(new Set())
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  useEffect(() => {
    // Load wishlist from localStorage
    const stored = localStorage.getItem('wishlist')
    if (stored) {
      try {
        setWishlist(new Set(JSON.parse(stored)))
      } catch (error) {
        console.error('Error loading wishlist:', error)
      }
    }
  }, [])

  const handleAddToCart = async (productId: string) => {
    // Use the parent's onAddToCart if provided
    if (onAddToCart) {
      onAddToCart(productId)
      return
    }

    // Default implementation
    try {
      const token = localStorage.getItem('token')
      
      if (!token) {
        // Redirect to login or show modal
        window.location.href = '/login?redirect=/products'
        return
      }

      const userId = JSON.parse(atob(token.split('.')[1])).userId

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          userId,
          productId,
          quantity: 1
        })
      })

      const data = await response.json()

      if (data.success) {
        // Optionally show a toast notification
        console.log('Product added to cart')
        // Trigger cart count update
        refreshCartCount()
      } else {
        console.error('Failed to add to cart:', data.message)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
    }
  }

  const handleToggleWishlist = (productId: string) => {
    setWishlist(prev => {
      const newWishlist = new Set(prev)
      
      if (newWishlist.has(productId)) {
        newWishlist.delete(productId)
      } else {
        newWishlist.add(productId)
      }

      // Save to localStorage
      localStorage.setItem('wishlist', JSON.stringify(Array.from(newWishlist)))

      // Optionally sync with backend if user is logged in
      const token = localStorage.getItem('token')
      if (token) {
        syncWishlistToBackend(Array.from(newWishlist))
      }

      return newWishlist
    })
  }

  const syncWishlistToBackend = async (wishlistArray: string[]) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return

      await Promise.all(wishlistArray.map(productId =>
        fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ productId })
        })
      ))
    } catch (error) {
      console.error('Error syncing wishlist:', error)
    }
  }

  const gridColumns = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  const handleImageError = (productId: string) => {
    setImageErrors(prev => new Set([...prev, productId]))
  }

  // List View Component
  const ListView = () => (
    <div className="space-y-4">
      {products.map((product) => {
        const isSoldOut = product.stock === 0
        const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price
        const discount = hasDiscount 
          ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
          : 0

        return (
          <div key={product.id} className="flex gap-4 bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100">
            {/* Product Image */}
            <Link href={`/products/${product.slug}`} className="relative w-32 h-32 flex-shrink-0 rounded overflow-hidden bg-gray-100">
              {product.thumbnail && !imageErrors.has(product.id) ? (
                <Image
                  src={product.thumbnail}
                  alt={product.name}
                  fill
                  className="object-cover"
                  onError={() => handleImageError(product.id)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                  <ShoppingCart className="w-12 h-12 text-gray-300" />
                </div>
              )}
              {product.isNew && (
                <span className="absolute top-2 left-2 bg-[#c9a84c] text-white text-xs px-2 py-1 rounded">
                  NEW
                </span>
              )}
              {isSoldOut && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-xs">SOLD OUT</span>
                </div>
              )}
            </Link>

            {/* Product Info */}
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <Link href={`/products/${product.slug}`} className="hover:text-[#1a3a5c] transition-colors">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                </Link>
                {product.category && (
                  <p className="text-xs text-gray-500 mt-1">{product.category.name}</p>
                )}
                {product.rating && (
                  <div className="flex items-center mt-2 text-xs">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${i < Math.floor(product.rating!) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="ml-1 text-gray-600">
                      {product.rating} ({product.reviewCount})
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[#1a3a5c] font-bold text-lg">${product.price.toFixed(2)}</span>
                  {hasDiscount && (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ${product.compareAtPrice.toFixed(2)}
                      </span>
                      <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded">
                        -{discount}%
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={() => !isSoldOut && handleAddToCart(product.id)}
                  disabled={isSoldOut}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    isSoldOut
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-[#1a3a5c] text-white hover:bg-[#2a5a8c]'
                  }`}
                >
                  {isSoldOut ? 'Sold Out' : 'Add to Cart'}
                </button>
                <button
                  onClick={() => handleToggleWishlist(product.id)}
                  className="p-2 rounded border border-gray-200 hover:border-[#1a3a5c] transition-colors"
                >
                  <Heart
                    className={`w-4 h-4 ${wishlist.has(product.id) ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
                  />
                </button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )

  return (
    <section className={title || subtitle ? "py-12" : ""}>
      {/* Section Header */}
      {(title || subtitle) && (
        <div className="text-center mb-10">
          {title && (
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
              {title}
            </h2>
          )}
          {subtitle && (
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>
      )}

      {/* Products Grid/List */}
      {isLoading ? (
        <div className={viewMode === 'grid' ? `grid ${gridColumns[columns]} gap-6` : 'space-y-4'}>
          {Array.from({ length: viewMode === 'grid' ? columns * 2 : 6 }).map((_, i) => (
            <div key={i} className={viewMode === 'list' ? 'flex gap-4 bg-white rounded-lg p-4' : 'bg-white rounded-xl overflow-hidden shadow-sm'}>
              {viewMode === 'list' ? (
                <>
                  <div className="w-32 h-32 bg-gray-200 rounded animate-pulse"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded mb-2 w-1/4 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded mb-3 w-1/3 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                  </div>
                </>
              ) : (
                <>
                  <div className="aspect-square bg-gray-200 animate-pulse"></div>
                  <div className="p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2 w-1/2 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded mb-3 animate-pulse"></div>
                    <div className="h-8 bg-gray-200 rounded mb-2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      ) : products.length > 0 ? (
        <>
          {viewMode === 'list' ? (
            <ListView />
          ) : (
            <div className={`grid ${gridColumns[columns]} gap-6`}>
              {products.map((product) => {
              // Map the product structure to match ProductCard expectations
              const mappedProduct = {
                id: product.id,
                slug: product.slug,
                name: product.name,
                price: product.price,
                image: product.thumbnail || undefined,
                category: product.category?.name,
                stock: product.stock,
                wholesalePrice: product.compareAtPrice || undefined,
              }
              
              return (
                <ProductCard
                  key={product.id}
                  product={mappedProduct}
                  onAddToCart={(id) => handleAddToCart(product.id)}
                />
              )
            })}
            </div>
          )}

          {/* Load More Button */}
          {showLoadMore && onLoadMore && (
            <div className="text-center mt-10">
              <button
                onClick={onLoadMore}
                className="px-8 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
              >
                Load More Products
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-16">
          <div className="text-gray-400 mb-4">
            <svg className="w-24 h-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No Products Found
          </h3>
          <p className="text-gray-500">
            We couldn't find any products matching your criteria.
          </p>
        </div>
      )}
    </section>
  )
}
