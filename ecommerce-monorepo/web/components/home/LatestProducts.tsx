'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'
import { Heart, ShoppingCart, ChevronRight, Star } from 'lucide-react'
import { useState } from 'react'

interface Product {
  id: string
  name: string
  slug: string
  price: number
  compareAtPrice?: number | null
  thumbnail?: string | null
  images?: string[]
  stock: number
  description?: string | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
  createdAt: string
  isFeatured?: boolean
  isNewArrival?: boolean
}

interface ProductCardProps {
  product: Product
}

function ProductCard({ product }: ProductCardProps) {
  const [isWishlist, setIsWishlist] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    setIsAddingToCart(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        alert('Please login to add items to cart')
        window.location.href = '/login'
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
          productId: product.id,
          quantity: 1
        })
      })

      const data = await response.json()

      if (data.success) {
        // Show success state briefly
        setTimeout(() => setIsAddingToCart(false), 1000)
      } else {
        alert(data.error || 'Failed to add item to cart')
        setIsAddingToCart(false)
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add item to cart')
      setIsAddingToCart(false)
    }
  }

  const productImage = product.thumbnail || (product.images && product.images.length > 0 ? product.images[0] : null)

  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300">
      {/* Image */}
      <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-gray-100">
        {productImage && !imageError ? (
          <Image
            src={productImage}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
            <ShoppingCart className="w-16 h-16 text-gray-300" />
          </div>
        )}
        
        {product.isNewArrival && (
          <span className="absolute top-3 left-3 bg-[#c9a84c] text-[#1a1a2e] text-xs font-semibold px-3 py-1 rounded-full">
            NEW
          </span>
        )}
        
        {product.stock === 0 && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-sm">SOLD OUT</span>
          </div>
        )}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            setIsWishlist(!isWishlist)
          }}
          className="absolute top-3 right-3 p-1.5 bg-white/80 backdrop-blur rounded-full hover:bg-white transition"
        >
          <Heart className={`w-4 h-4 ${isWishlist ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
        </button>
      </Link>

      {/* Info */}
      <div className="p-3 md:p-4 space-y-2">
        {/* Category */}
        {product.category && (
          <span className="text-[10px] text-gray-400 uppercase tracking-wider">
            {product.category.name}
          </span>
        )}

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium text-gray-800 hover:text-[#1a3a5c] transition line-clamp-2 min-h-[2.5rem]">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-[#1a3a5c]">
            ${product.price.toFixed(2)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-xs text-gray-400 line-through">
              ${product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={product.stock === 0 || isAddingToCart}
          className={`w-full text-sm h-9 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            isAddingToCart
              ? 'bg-green-500 text-white'
              : product.stock === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-[#1a3a5c] hover:bg-[#2a5a8c] text-white'
          }`}
        >
          {isAddingToCart ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Added!
            </>
          ) : product.stock > 0 ? (
            <>
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </>
          ) : (
            'Out of Stock'
          )}
        </button>
      </div>
    </div>
  )
}

export function LatestProducts() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'latest', 12],
    queryFn: () => api.get('/api/products/latest?limit=12'),
    staleTime: 2 * 60 * 1000,
  })

  const products: Product[] = data?.data || []

  if (isLoading) {
    return (
      <Container maxWidth="2xl" className="py-8 md:py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-64 bg-gray-200 rounded mt-2 animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-lg" />
              <div className="mt-2 h-4 bg-gray-200 rounded w-3/4" />
              <div className="mt-1 h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </Container>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-8 md:py-12 bg-white">
      <Container maxWidth="2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a5c]">
              Latest Products
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Discover our newest arrivals
            </p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm text-[#1a3a5c] hover:text-[#c9a84c] transition font-medium"
          >
            View All
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Product Grid - 12 Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {products.slice(0, 12).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>
    </section>
  )
}
