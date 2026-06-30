'use client'

import { useQuery } from '@tanstack/react-query'
import { Container } from '@/components/ui/Container'
import { SharedLayout } from '@/components/layout/SharedLayout'
import TrustBadges from '@/components/TrustBadges'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { AllProductsSection } from '@/components/home/AllProductsSection'
import ProductGrid from '@/components/products/ProductGrid'
import BlogSection from '@/components/BlogSection'
import { Users, Globe, Clock, Shield } from 'lucide-react'

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

export default function Home() {
  // Fetch featured products
  const { data: featuredData, isLoading: featuredLoading } = useQuery<ProductsResponse>({
    queryKey: ['featured-products'],
    queryFn: async () => {
      const response = await fetch('/api/products?featured=true&limit=8')
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })

  // Fetch new arrivals
  const { data: newArrivalsData, isLoading: newArrivalsLoading } = useQuery<ProductsResponse>({
    queryKey: ['new-arrivals'],
    queryFn: async () => {
      const response = await fetch('/api/products?new=true&limit=8')
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })

  const stats = [
    { value: '1500+', label: 'Business Partners', icon: Users },
    { value: '50+', label: 'Countries Served', icon: Globe },
    { value: '99.5%', label: 'On-time Delivery', icon: Clock },
    { value: '24/7', label: 'Customer Support', icon: Shield },
  ]

  return (
    <SharedLayout showHero={true}>
      <div className="bg-gray-50">
        {/* Stats Section */}
        <section className="py-12 bg-white border-b border-gray-100">
        <Container maxWidth="2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-12 h-12 mb-3 bg-primary-50 rounded-full group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </Container>
      </section>

      {/* Trust Badges */}
      <TrustBadges />

      {/* Parent Categories - Show all top-level categories */}
      <CategoryGrid variant="parent" />

      {/* All Products Section - NEW: Display all products with pagination */}
      <AllProductsSection />

      {/* Featured Products */}
      <section className="py-16 bg-gray-50">
        <Container maxWidth="2xl">
          <ProductGrid
            title="Featured Products"
            subtitle="Hand-picked selection of our most popular kitchenware items"
            products={featuredData?.data || []}
            columns={4}
            isLoading={featuredLoading}
          />
        </Container>
      </section>

      {/* New Arrivals */}
      <section className="py-16 bg-white">
        <Container maxWidth="2xl">
          <ProductGrid
            title="New Arrivals"
            subtitle="Discover the latest additions to our kitchenware collection"
            products={newArrivalsData?.data || []}
            columns={4}
            isLoading={newArrivalsLoading}
          />
        </Container>
      </section>

      {/* Blog Section */}
      <BlogSection />

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-white">
        <Container maxWidth="2xl" className="text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Expand Your Business Globally?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who trust YIWU EXPRESS for their international trade needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.location.href = '/products'}
              className="px-8 py-3 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors"
            >
              Browse Products
            </button>
            <button 
              onClick={() => window.location.href = '/contact'}
              className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-colors"
            >
              Contact Our Team
            </button>
          </div>
        </Container>
      </section>
      </div>
    </SharedLayout>
  )
}