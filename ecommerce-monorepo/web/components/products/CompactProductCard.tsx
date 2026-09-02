'use client'

import Link from 'next/link'
import { Star, Shield } from 'lucide-react'
import { ModernProductData } from '@/components/ui/ModernProductCard'

interface CompactProductCardProps {
  product: ModernProductData
  locale?: string
}

export function CompactProductCard({ product, locale = 'en' }: CompactProductCardProps) {
  const primaryImage = product.images?.[0] || product.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80'

  return (
    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-[#0d1e32] border border-gray-100 dark:border-white/10 hover:border-[#c9a84c]/50 transition-all hover:shadow-md group">
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 dark:bg-[#070d16] flex-shrink-0 relative">
        <img
          src={primaryImage}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </div>

      <div className="flex-1 min-w-0">
        <Link href={`/${locale}/products/${product.slug}`}>
          <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate hover:text-[#c9a84c] transition-colors">
            {product.name}
          </h4>
        </Link>
        <div className="flex items-center gap-1 mt-0.5">
          <Star className="w-3 h-3 fill-[#c9a84c] text-[#c9a84c]" />
          <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
            {(product.rating || 4.9).toFixed(1)}
          </span>
        </div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span className="text-sm font-black text-[#1a3a5c] dark:text-[#e5c158]">
            ${product.price.toFixed(2)}
          </span>
          {product.compareAtPrice && product.compareAtPrice > product.price && (
            <span className="text-[10px] text-gray-400 line-through">
              ${product.compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
