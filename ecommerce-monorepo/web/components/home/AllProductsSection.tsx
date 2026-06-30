'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/Container'
import ProductGrid from '@/components/products/ProductGrid'
import { Pagination } from '@/components/ui/Pagination'

interface Product {
  id: string
  slug: string
  name: string
  description?: string
  price: number
  compareAtPrice?: number | null
  thumbnail?: string | null
  stock: number
  sku: string
  category?: {
    id: string
    name: string
    slug: string
  } | null
  minOrder?: number
  wholesalePrice?: number
  isFeatured?: boolean
  isNewArrival?: boolean
}

interface ProductsResponse {
  success: boolean
  data: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export function AllProductsSection() {
  const [currentPage, setCurrentPage] = useState(1)
  const limit = 20

  const { data, isLoading, error } = useQuery<ProductsResponse>({
    queryKey: ['all-products', currentPage],
    queryFn: async () => {
      const response = await fetch(`/api/products?page=${currentPage}&limit=${limit}`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
  })

  const products = data?.data || []
  const pagination = data?.pagination || { page: 1, limit, total: 0, pages: 1 }

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Scroll to top of section
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Error state
  if (error) {
    return (
      <section className="py-16 bg-white">
        <Container maxWidth="2xl">
          <div className="text-center py-12">
            <div className="text-red-600 text-lg font-semibold mb-4">
              Failed to load products
            </div>
            <p className="text-gray-600 mb-6">
              We encountered an error while loading products. Please try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#102a43] transition-colors"
            >
              Reload Page
            </button>
          </div>
        </Container>
      </section>
    )
  }

  // Empty state
  if (!isLoading && products.length === 0) {
    return (
      <section className="py-16 bg-white">
        <Container maxWidth="2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a3a5c]">
              All Products
            </h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              Discover our complete collection of quality products
            </p>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No products available at the moment.
            </p>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <Container maxWidth="2xl">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a3a5c]">
            All Products
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            Discover our complete collection of quality products
          </p>
          {!isLoading && (
            <p className="text-sm text-gray-400 mt-2">
              Showing {products.length} of {pagination.total} products
            </p>
          )}
        </div>

        {/* Product Grid */}
        <ProductGrid
          products={products}
          columns={4}
          isLoading={isLoading}
        />

        {/* Pagination */}
        {!isLoading && pagination.pages > 1 && (
          <div className="mt-12">
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </Container>
    </section>
  )
}
