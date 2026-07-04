'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useWishlist } from '@/hooks/useWishlist'
import { Container } from '@/components/ui/Container'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Trash2, ArrowLeft } from 'lucide-react'
import { useState } from 'react'

export default function WishlistPage() {
  const { wishlist, isLoading, removeFromWishlist } = useWishlist()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (productId: string) => {
    setRemovingId(productId)
    try {
      await removeFromWishlist(productId)
    } finally {
      setRemovingId(null)
    }
  }

  if (isLoading) {
    return (
      <Container maxWidth="2xl" className="py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-48 bg-gray-200 rounded" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-200 rounded-lg" />
            ))}
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container maxWidth="2xl" className="py-6 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a3a5c]">
            My Favorites
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>
        <Link
          href="/products"
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-[#1a3a5c] transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Continue Shopping
        </Link>
      </div>

      {/* Wishlist Items */}
      {wishlist.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl">
          <div className="text-6xl mb-4">🤍</div>
          <h3 className="text-lg font-medium text-gray-700">Your favorites list is empty</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
            Start adding products you love by clicking the heart icon on any product.
          </p>
          <Link href="/products">
            <Button className="mt-4 bg-[#1a3a5c] hover:bg-[#2a5a8c]">
              Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
          {wishlist.map((item: any) => {
            const product = item.product
            const isRemoving = removingId === product.id

            return (
              <div
                key={item.id}
                className="group bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 relative"
              >
                {/* Image */}
                <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-gray-100">
                  <Image
                    src={product.images?.[0] || '/images/placeholder-product.jpg'}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {product.isNewArrival && (
                    <Badge className="absolute top-3 left-3 bg-[#c9a84c] text-[#1a1a2e] text-xs font-semibold">
                      NEW
                    </Badge>
                  )}
                  {product.stock === 0 && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white font-bold text-sm">SOLD OUT</span>
                    </div>
                  )}

                  {/* Remove button on image */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRemove(product.id)
                    }}
                    disabled={isRemoving}
                    className="absolute top-3 right-3 p-1.5 bg-white rounded-full shadow-md hover:bg-red-50 transition z-10"
                  >
                    {isRemoving ? (
                      <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500 transition" />
                    )}
                  </button>
                </Link>

                {/* Info */}
                <div className="p-3 space-y-2">
                  {/* Category */}
                  {product.category && (
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                      {product.category.name}
                    </span>
                  )}

                  {/* Name */}
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-sm font-medium text-gray-800 hover:text-[#1a3a5c] transition line-clamp-2">
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

                  {/* Add to Cart Button */}
                  <Button
                    disabled={product.stock === 0}
                    className="w-full bg-[#1a3a5c] hover:bg-[#2a5a8c] text-sm h-9"
                  >
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Container>
  )
}
