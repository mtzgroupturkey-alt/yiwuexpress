'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight } from 'lucide-react'
import { Container } from '@/components/ui/Container'
import { Skeleton } from '@/components/ui/skeleton'

interface Category {
  id: string
  name: string
  slug: string
  image: string | null
  description: string | null
  productCount: number
  isFeatured: boolean
}

interface CategoryGridProps {
  variant?: 'featured' | 'parent'
}

export function CategoryGrid({ variant = 'featured' }: CategoryGridProps) {
  // Build query params based on variant
  const queryParams = variant === 'parent' 
    ? 'parent=null&featured=true' // Fetch only featured parent categories
    : 'featured=true&limit=6' // Fetch featured categories

  const { data, isLoading } = useQuery({
    queryKey: ['categories', variant],
    queryFn: () => api.get(`/api/categories?${queryParams}`),
  })

  const categories: Category[] = data?.data || []

  // Customize section title and subtitle based on variant
  const sectionTitle = variant === 'parent' 
    ? 'Browse by Category' 
    : 'Shop by Category'
  
  const sectionSubtitle = variant === 'parent'
    ? 'Explore our complete range of product categories'
    : 'Explore our wide range of kitchenware products. From professional cookware to everyday essentials.'

  if (isLoading) {
    return (
      <section className="py-16 bg-gray-50">
        <Container maxWidth="2xl">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-[#1a3a5c]">{sectionTitle}</h2>
            <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
              {sectionSubtitle}
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex flex-col items-center">
                <Skeleton className="w-24 h-24 md:w-32 md:h-32 rounded-full" />
                <Skeleton className="h-4 w-20 mt-3" />
                <Skeleton className="h-3 w-12 mt-1" />
              </div>
            ))}
          </div>
        </Container>
      </section>
    )
  }

  if (categories.length === 0) {
    return (
      <section className="py-16 bg-gray-50">
        <Container maxWidth="2xl">
          <div className="text-center py-12">
            <h2 className="text-3xl font-bold text-[#1a3a5c]">{sectionTitle}</h2>
            <p className="text-gray-500 mt-2">No categories available yet.</p>
          </div>
        </Container>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <Container maxWidth="2xl">
        <div className="text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-[#1a3a5c]">
            {sectionTitle}
          </h2>
          <p className="text-gray-500 mt-2 max-w-2xl mx-auto">
            {sectionSubtitle}
          </p>
        </div>

        {/* Category Grid - Circle Design */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 md:gap-8">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?category=${category.slug}`}
              className="group flex flex-col items-center outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-4 rounded-lg"
            >
              {/* Circular Image */}
              <div className="relative w-24 h-24 md:w-32 md:h-32 lg:w-36 lg:h-36">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#1a3a5c]/10 to-[#c9a84c]/10 group-hover:from-[#1a3a5c]/20 group-hover:to-[#c9a84c]/20 transition-all duration-500" />
                {category.image ? (
                  <Image
                    src={category.image}
                    alt={category.name}
                    fill
                    className="rounded-full object-cover ring-2 ring-white shadow-lg group-hover:scale-105 transition-transform duration-300 group-hover:shadow-xl"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center text-4xl shadow-lg group-hover:scale-105 transition-transform duration-300">
                    <span className="text-gray-400">📦</span>
                  </div>
                )}
                {/* Subtle ring on hover */}
                <div className="absolute inset-0 rounded-full ring-2 ring-transparent group-hover:ring-[#c9a84c] transition-all duration-300" />
              </div>

              {/* Category Name */}
              <h3 className="mt-3 text-sm md:text-base font-semibold text-gray-700 text-center group-hover:text-[#1a3a5c] transition-colors">
                {category.name}
              </h3>

              {/* Decorative underline on hover */}
              <div className="w-0 h-0.5 bg-[#c9a84c] group-hover:w-8 transition-all duration-300" />
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-[#1a3a5c] font-medium hover:text-[#c9a84c] transition-colors group outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 rounded-md px-4 py-2"
          >
            View All Categories
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Container>
    </section>
  )
}