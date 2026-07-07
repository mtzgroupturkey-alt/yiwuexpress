'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ShoppingCart, Eye } from 'lucide-react'
import { WishlistButton } from './WishlistButton'

interface Product {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  image?: string
  category?: string
  stock?: number
  minOrder?: number
  wholesalePrice?: number
  colors?: { label: string; value: string }[]
}

interface ProductCardProps {
  product: Product
  onAddToCart?: (productId: string) => void
}

export default function ProductCard({
  product,
  onAddToCart
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

  return (
    <Link href={`/products/${product.slug}`}>
      <div
        className="group relative bg-white rounded-2xl overflow-hidden border border-gray-100/80 shadow-premium hover:shadow-premium-xl hover:-translate-y-2 transition-all duration-500 cursor-pointer flex flex-col"
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
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition-transform duration-700 ${
                isHovered ? 'scale-105' : 'scale-100'
              }`}
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCart className="w-16 h-16 text-gray-300" />
            </div>
          )}

          {/* Image Overlay Gradient on Hover */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-500 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`} />

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {hasWholesale && (
              <span className="bg-gradient-to-r from-[#c9a84c] to-[#e8d48b] text-[#1a1a2e] text-xs font-bold px-4 py-2 rounded-full shadow-gold backdrop-blur-sm border border-white/20">
                WHOLESALE
              </span>
            )}
            {product.stock && product.stock < 10 && (
              <span className="bg-gradient-to-r from-accent-500 to-accent-600 text-white text-xs font-bold px-4 py-2 rounded-full shadow-[0_4px_16px_rgba(231,76,60,0.4)] backdrop-blur-sm border border-white/20">
                LOW STOCK
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <WishlistButton
            productId={product.id}
            className="absolute top-3 right-3 z-10"
            size="md"
          />

          {/* Quick View Button (appears on hover) */}
          <div
            className={`absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/60 to-transparent transition-opacity duration-300 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <button
              className="w-full py-2 bg-white/90 backdrop-blur-sm text-gray-900 font-medium rounded-lg hover:bg-white transition-all flex items-center justify-center gap-2 shadow-lg"
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <Eye className="w-4 h-4" />
              Quick View
            </button>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-6 pb-8 flex-1 flex flex-col">
          {/* Category */}
          {product.category && (
            <p className="label-premium mb-1">
              {product.category}
            </p>
          )}

          {/* Product Name */}
          <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 h-14">
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

          {/* Description */}
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
            <span className="text-3xl font-bold text-gradient-primary">
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
            className={`w-full py-2.5 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden ${
              isAddingToCart
                ? 'bg-green-500 text-white shadow-lg'
                : product.stock === 0
                ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-primary-600 via-primary-500 to-primary-700 text-white shadow-premium hover:shadow-premium-lg hover:-translate-y-1 active:translate-y-0 before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/0 before:to-white/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300'
            }`}
          >
            {isAddingToCart ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
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
