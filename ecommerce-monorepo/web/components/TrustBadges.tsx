'use client'

import { Check, Shield, Truck, CreditCard, Headphones, Award, Globe } from 'lucide-react'
import { Container } from '@/components/ui/Container'

interface Badge {
  icon: React.ElementType
  title: string
  description: string
  color: string
}

export default function TrustBadges() {
  const badges: Badge[] = [
    {
      icon: Check,
      title: 'Quality Products',
      description: 'Rigorously tested and inspected',
      color: 'text-green-600 bg-green-50'
    },
    {
      icon: Globe,
      title: 'Global Shipping',
      description: 'Deliver to 50+ countries worldwide',
      color: 'text-blue-600 bg-blue-50'
    },
    {
      icon: Shield,
      title: 'Secure Payment',
      description: 'SSL encrypted transactions',
      color: 'text-primary-600 bg-primary-50'
    },
    {
      icon: CreditCard,
      title: 'Wholesale Prices',
      description: 'Best rates for bulk orders',
      color: 'text-secondary-600 bg-secondary-50'
    },
    {
      icon: Truck,
      title: 'Customs Support',
      description: 'Full documentation assistance',
      color: 'text-purple-600 bg-purple-50'
    },
    {
      icon: Headphones,
      title: '24/7 Support',
      description: 'Always here to help you',
      color: 'text-accent-600 bg-accent-50'
    }
  ]

  return (
    <section className="py-16 bg-white">
      <Container>
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Why Shop With Us?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your trusted partner for quality kitchenware from Yiwu. We're committed to providing 
            the best products and services for your business.
          </p>
        </div>

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
          {badges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center p-6 bg-gray-50 rounded-xl hover:bg-white hover:shadow-brand transition-all duration-300"
              >
                {/* Icon */}
                <div className={`p-4 rounded-full ${badge.color} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <Icon className="w-7 h-7" />
                </div>

                {/* Title */}
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {badge.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-gray-600">
                  {badge.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-sm text-gray-500">
            <Award className="w-5 h-5 text-secondary-500" />
            <span>Trusted by over <strong className="text-gray-900">1,500+ businesses</strong> worldwide</span>
          </div>
        </div>
      </Container>
    </section>
  )
}
