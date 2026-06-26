'use client'

import Link from 'next/link'
import { ChefHat, UtensilsCrossed, Coffee, Soup, Wine, Refrigerator } from 'lucide-react'
import { Container } from '@/components/ui/Container'

interface Category {
  id: string
  name: string
  icon: React.ElementType
  productCount: number
  image?: string
  href: string
  color: string
}

export default function CategoryShowcase() {
  const categories: Category[] = [
    {
      id: 'cookware',
      name: 'Cookware',
      icon: Soup,
      productCount: 245,
      href: '/products?category=cookware',
      color: 'from-orange-500 to-red-500'
    },
    {
      id: 'cutlery',
      name: 'Cutlery & Knives',
      icon: UtensilsCrossed,
      productCount: 189,
      href: '/products?category=cutlery',
      color: 'from-blue-500 to-indigo-500'
    },
    {
      id: 'bakeware',
      name: 'Bakeware',
      icon: ChefHat,
      productCount: 156,
      href: '/products?category=bakeware',
      color: 'from-pink-500 to-purple-500'
    },
    {
      id: 'drinkware',
      name: 'Drinkware',
      icon: Coffee,
      productCount: 178,
      href: '/products?category=drinkware',
      color: 'from-green-500 to-teal-500'
    },
    {
      id: 'barware',
      name: 'Barware',
      icon: Wine,
      productCount: 92,
      href: '/products?category=barware',
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 'storage',
      name: 'Storage',
      icon: Refrigerator,
      productCount: 134,
      href: '/products?category=storage',
      color: 'from-cyan-500 to-blue-500'
    }
  ]

  return (
    <section className="py-16 bg-gray-50">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Shop by Category
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Explore our wide range of kitchenware products. From professional cookware to everyday essentials.
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
          {categories.map((category) => {
            const Icon = category.icon
            return (
              <Link
                key={category.id}
                href={category.href}
                className="group relative overflow-hidden rounded-xl bg-white shadow-brand hover:shadow-brand-lg transition-all duration-300"
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${category.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>

                <div className="relative p-6 flex flex-col items-center text-center">
                  {/* Icon Container */}
                  <div className={`w-16 h-16 mb-4 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Category Name */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>

                  {/* Product Count */}
                  <p className="text-sm text-gray-500">
                    {category.productCount} products
                  </p>

                  {/* Hover Arrow */}
                  <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
          >
            View All Products
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </Container>
    </section>
  )
}
