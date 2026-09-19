'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useWishlist } from '@/hooks/useWishlist'
import Link from 'next/link'
import { ProductImage } from '@/components/ui/ProductImage'
import { Heart, ShoppingCart, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/design-system/Container'

export default function WishlistPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, isInitialized } = useAuth()
  const { wishlist, isLoading, removeFromWishlist } = useWishlist()
  const t = useTranslations('DashboardPages')
  const tw = useTranslations('DashboardPages.wishlist')

  useEffect(() => {
    if (isInitialized && !authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/wishlist')
    }
  }, [isInitialized, authLoading, isAuthenticated, router])

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#00407a' }}></div>
          <p className="text-xs text-slate-500 font-medium">{t('loadingWishlist')}</p>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            {tw('title')}
            {wishlist?.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-100">
                {wishlist.length} {wishlist.length !== 1 ? tw('items') : tw('item')}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Saved wholesale items and product bookmarks
          </p>
        </div>

        <Link
          href="/store"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-bold rounded-xl transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>{tw('browseProducts')}</span>
        </Link>
      </div>

      {/* Wishlist Items */}
      <div>
        {wishlist?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-400">
              <Heart className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{tw('empty')}</h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm">{tw('emptyDesc')}</p>
            <Link
              href="/store"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold rounded-xl transition-colors shadow-2xs"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              {tw('browseProducts')}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {wishlist?.map((item: any) => {
              const product = item.product || item
              const slug = product.slug || item.productId
              const image = product.images?.[0] || product.image || product.thumbnail

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all duration-200 group flex flex-col justify-between"
                >
                  <div>
                    <Link href={`/products/${slug}`} className="relative block aspect-square bg-slate-50 overflow-hidden">
                      <ProductImage
                        src={image}
                        alt={product.name || 'Product image'}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </Link>
                    <div className="p-3.5">
                      <Link href={`/products/${slug}`}>
                        <h3 className="text-xs font-bold text-slate-900 hover:text-[#00407a] transition-colors line-clamp-2 leading-snug">
                          {product.name}
                        </h3>
                      </Link>
                      <p className="text-sm font-black text-slate-900 mt-2">
                        ${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}
                      </p>
                    </div>
                  </div>

                  <div className="p-3.5 pt-0 flex items-center gap-2">
                    <Link
                      href={`/products/${slug}`}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-[#00407a] hover:bg-[#003366] text-white text-xs font-bold py-2 px-3 rounded-xl transition-colors shadow-2xs"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>{tw('addToCart')}</span>
                    </Link>
                    <button
                      onClick={() => handleRemove(product.id || item.productId)}
                      className="p-2 border border-slate-200 rounded-xl hover:border-rose-200 hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Container>
  )
}