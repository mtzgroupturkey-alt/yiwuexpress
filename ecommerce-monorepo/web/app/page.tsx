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

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-primary-600 to-primary-800 text-white relative overflow-hidden">
        {/* Subtle background grain/pattern for premium feel */}
        <div className="absolute inset-0 opacity-10 bg-[url('/pattern-china.svg')] bg-repeat mix-blend-overlay"></div>
        <Container maxWidth="2xl" className="text-center relative z-10">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-10 md:p-16 rounded-3xl max-w-4xl mx-auto shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-extrabold mb-6 tracking-tight text-white drop-shadow-sm">
              Ready to Expand Your Business Globally?
            </h2>
            <p className="text-xl text-primary-50 mb-10 max-w-2xl mx-auto font-medium">
              Join thousands of businesses who trust YIWU EXPRESS for their international trade, logistics, and wholesale needs.
            </p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button 
                onClick={() => window.location.href = '/products'}
                className="px-8 py-4 bg-secondary-500 text-white font-bold rounded-full hover:bg-secondary-400 hover:scale-[1.02] transition-all duration-300 shadow-lg"
              >
                Browse Products
              </button>
              <button 
                onClick={() => window.location.href = '/contact'}
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-full border border-white/30 hover:bg-white/20 hover:scale-[1.02] transition-all duration-300"
              >
                Contact Our Team
              </button>
            </div>
          </div>
        </Container>
      </section>
      </div>
    </SharedLayout>
  )
}