'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import ProductCard from '@/components/products/ProductCard'
import { ChevronRight, TrendingUp } from 'lucide-react'

export function BestSellers() {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'best-sellers', 8],
    queryFn: () => api.get('/api/products?sort=popular&limit=8'),
    staleTime: 5 * 60 * 1000,
  })

  const products = (data?.data || []).map((p: any) => ({
    ...p,
    image: p.thumbnail || p.images?.[0] || undefined,
    category: p.category?.name || p.category,
  }))

  if (isLoading || products.length === 0) {
    return null
  }

  return (
    <Container maxWidth="2xl" className="py-8 md:py-12">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1a3a5c]">
            Best Sellers
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Our most popular products loved by customers
          </p>
        </div>
        <Link
          href="/products?sort=popular"
          className="flex items-center gap-1 text-sm text-[#1a3a5c] hover:text-[#c9a84c] transition font-medium"
        >
          View All
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
        {products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  )
}
