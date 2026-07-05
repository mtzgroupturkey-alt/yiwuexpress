'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import Link from 'next/link'
import Image from 'next/image'
import { Heart, ShoppingCart, Trash2, ArrowLeft } from 'lucide-react'

export default function WishlistPage() {
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { wishlist, isLoading, removeFromWishlist } = useWishlist()

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/wishlist')
    }
  }, [authLoading, isAuthenticated, router])

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Loading wishlist...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-gray-500 hover:text-[#1a3a5c]">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1a3a5c]">
            My Wishlist
            {wishlist?.length > 0 && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({wishlist.length} item{wishlist.length !== 1 ? 's' : ''})
              </span>
            )}
          </h1>
        </div>
      </div>

      <div>
        {wishlist?.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your wishlist is empty</h3>
            <p className="text-gray-500 mb-6">Start adding products you love.</p>
            <Link
              href="/products"
              className="inline-block px-6 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlist?.map((item: any) => {
              const product = item.product
              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition group">
                  <Link href={`/products/${product.slug}`} className="relative block aspect-square bg-gray-100">
                    <Image
                      src={product.images?.[0] || '/images/placeholder-product.jpg'}
                      alt={product.name}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className="object-cover group-hover:scale-105 transition"
                    />
                  </Link>
                  <div className="p-4">
                    <Link href={`/products/${product.slug}`}>
                      <h3 className="text-sm font-medium text-gray-800 hover:text-[#1a3a5c] transition line-clamp-2">
                        {product.name}
                      </h3>
                    </Link>
                    <p className="text-lg font-bold text-[#1a3a5c] mt-2">
                      ${product.price?.toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <button className="flex-1 flex items-center justify-center gap-2 bg-[#1a3a5c] hover:bg-[#2a5a8c] text-white text-sm py-2 px-3 rounded-lg transition">
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="p-2 border border-gray-200 rounded-lg hover:border-red-200 hover:bg-red-50 transition"
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500 transition" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}