'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Eye } from 'lucide-react'

interface Product {
  id: number
  slug: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  wholesalePrice?: number
  colors?: { label: string; value: string }[]  // hex color swatches
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: number) => void
  onToggleWishlist?: (productId: number) => void
  isInWishlist?: boolean
}

export default function ProductCard({ 
  product, 
  onAddToCart, 
  onToggleWishlist,
  isInWishlist = false 
}: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  const hasWholesale = product.wholesalePrice && product.wholesalePrice < product.price
  const displayPrice = hasWholesale ? product.wholesalePrice : product.price
  const priceLabel = hasWholesale ? 'From' : ''

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!onAddToCart) return
    
    setIsAddingToCart(true)
    try {
      await onAddToCart(product.id)
    } finally {
      setTimeout(() => setIsAddingToCart(false), 1000)
    }
  }

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (onToggleWishlist) {
      onToggleWishlist(product.id)
    }
  }

  return (
    <Link href={`/products/${product.slug}`}>
      <div 
        className="group relative bg-white rounded-xl overflow-hidden shadow-brand hover:shadow-brand-lg transition-all duration-300 cursor-pointer flex flex-col"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 flex-shrink-0">
          {product.image && !imageError ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              className={`object-cover transition-transform duration-500 ${
                isHovered ? 'scale-110' : 'scale-100'
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasWholesale && (
              <span className="bg-secondary-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Wholesale
              </span>
            )}
            {product.stock && product.stock < 10 && (
              <span className="bg-accent-500 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg">
                Low Stock
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg hover:bg-white transition-colors z-10"
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart 
              className={`w-5 h-5 transition-colors ${
                isInWishlist ? 'fill-accent-500 text-accent-500' : 'text-gray-600'
              }`}
            />
          </button>

          {/* Quick View Button (appears on hover) */}
          <div 
            className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              className="w-full py-2 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Quick view functionality can be added here
              }}
            >
              <Eye className="w-4 h-4" />
              Quick View
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 pb-8 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              {product.category}
            </p>
          )}

          {/* Product Name */}
          <h3 className="text-base font-semibold text-gray-900 mb-2 line-clamp-2 h-12">
            {product.name}
          </h3>

          {/* Color Swatches */}
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1.5 mb-2 flex-wrap h-6">
              {product.colors.slice(0, 5).map(color => (
                <div
                  key={color.value}
                  className="w-5 h-5 rounded-full border-2 border-white shadow-sm ring-1 ring-gray-200 flex-shrink-0"
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
              {product.colors.length > 5 && (
                <span className="text-xs text-gray-400">+{product.colors.length - 5}</span>
              )}
            </div>
          )}

          {/* Description - Fixed height or hidden */}
          {product.description && (
            <p className="text-sm text-gray-600 mb-3 line-clamp-2 h-10">
              {product.description}
            </p>
          )}

          {/* Spacer to push buttons to bottom */}
          <div className="flex-1"></div>

          {/* Pricing */}
          <div className="flex items-baseline gap-2 mb-3">
            {priceLabel && (
              <span className="text-xs text-gray-500 font-medium">
                {priceLabel}
              </span>
            )}
            <span className="text-2xl font-bold text-primary-600">
              ${displayPrice?.toFixed(2)}
            </span>
            {hasWholesale && product.price && (
              <span className="text-sm text-gray-400 line-through">
                ${product.price.toFixed(2)}
              </span>
            )}
          </div>

          {/* Min Order Info */}
          {product.minOrder && product.minOrder > 1 && (
            <p className="text-xs text-gray-500 mb-3">
              Min. order: {product.minOrder} units
            </p>
          )}

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAddingToCart || (product.stock !== undefined && product.stock === 0)}
            className={`w-full py-2.5 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
              isAddingToCart
                ? 'bg-green-500 text-white'
                : product.stock === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 shadow-md hover:shadow-lg'
            }`}
          >
            {isAddingToCart ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Added!
              </>
            ) : product.stock === 0 ? (
              'Out of Stock'
            ) : (
              <>
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </>
            )}
          </button>

          {/* Wholesale Inquiry Link */}
          {hasWholesale && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                // Navigate to wholesale inquiry
                window.location.href = `/wholesale?product=${product.id}`
              }}
              className="w-full mt-2 py-2 text-sm text-secondary-600 font-medium hover:text-secondary-700 transition-colors"
            >
              Request Wholesale Quote
            </button>
          )}
        </div>
      </div>
    </Link>
  )
}
