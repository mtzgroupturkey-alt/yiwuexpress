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
        <section className="py-16 bg-gray-50 border-b border-gray-100">
        <Container maxWidth="2xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div key={index} className="text-center group bg-white p-6 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]">
                  <div className="inline-flex items-center justify-center w-14 h-14 mb-4 bg-primary-50 rounded-full group-hover:bg-primary-100 transition-colors">
                    <Icon className="w-7 h-7 text-primary-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-primary-500 mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
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

      {/* Newsletter Section - Compact */}
      <section className="relative py-12 bg-slate-800 overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

        <Container maxWidth="2xl" className="relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-2xl p-8 md:p-10">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                {/* Left: Content */}
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold mb-3">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Stay Updated
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Get Exclusive Deals & Updates
                  </h2>
                  <p className="text-slate-300 text-sm">
                    Subscribe to our newsletter for wholesale pricing, new arrivals, and industry insights.
                  </p>
                </div>

                {/* Right: Form */}
                <div>
                  <form className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
                    >
                      Subscribe
                    </button>
                  </form>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    We respect your privacy. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
      </div>
    </SharedLayout>
  )
}