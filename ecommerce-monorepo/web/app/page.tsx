'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import ServiceCard from '@/components/service-card'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { Service } from '@prisma/client'
import { Truck, Globe, Shield, Clock, Package, Users, BarChart, MapPin } from 'lucide-react'

interface ServiceResponse {
  services: Service[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function Home() {
  const [page, setPage] = useState(1)
  const [serviceType, setServiceType] = useState<string>('')
  const [search, setSearch] = useState('')

  const { data, isLoading, error } = useQuery<ServiceResponse>({
    queryKey: ['services', page, serviceType, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(serviceType && { type: serviceType }),
        ...(search && { search }),
      })
      const response = await fetch(`/api/services?${params}`)
      if (!response.ok) throw new Error('Failed to fetch services')
      return response.json()
    },
  })

  const serviceTypes = [
    { value: 'shipping', label: 'Shipping', icon: Truck },
    { value: 'customs', label: 'Customs', icon: Shield },
    { value: 'warehousing', label: 'Warehousing', icon: Package },
    { value: 'sourcing', label: 'Sourcing', icon: Users },
  ]

  const stats = [
    { value: '1500+', label: 'Business Partners', icon: Users },
    { value: '50+', label: 'Countries Served', icon: Globe },
    { value: '99.5%', label: 'On-time Delivery', icon: Clock },
    { value: '24/7', label: 'Customer Support', icon: Shield },
  ]

  const features = [
    {
      title: 'Global Network',
      description: 'Connect with businesses in over 50 countries through our extensive trade network.',
      icon: Globe,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
    },
    {
      title: 'Fast Shipping',
      description: 'Express air freight and sea freight options with real-time tracking.',
      icon: Truck,
      color: 'text-accent-500',
      bgColor: 'bg-accent-50',
    },
    {
      title: 'Customs Expertise',
      description: 'Professional customs clearance and documentation services worldwide.',
      icon: Shield,
      color: 'text-secondary-500',
      bgColor: 'bg-secondary-50',
    },
    {
      title: 'Quality Assurance',
      description: 'Rigorous quality control and inspection services at Yiwu market.',
      icon: BarChart,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
    },
  ]

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center text-accent-600">
            Error loading services: {(error as Error).message}
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-primary text-white">
        <div className="absolute inset-0 chinese-pattern opacity-10"></div>
        <div className="container mx-auto px-4 py-16 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center mb-6 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="text-sm font-medium">From Yiwu, China</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Your Gateway to
              <span className="block text-secondary-400">Global Trade</span>
            </h1>
            
            <p className="text-xl text-gray-200 mb-8">
              YIWU EXPRESS connects businesses worldwide with professional logistics, 
              customs clearance, and sourcing services from the world&apos;s largest small commodities market.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors shadow-lg">
                Request Quote
              </button>
              <button className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-colors">
                Track Shipment
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-primary-600 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose YIWU EXPRESS?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive trade solutions backed by years of experience in international logistics and Yiwu market expertise.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-brand hover:shadow-brand-lg transition-shadow">
                  <div className={`inline-flex p-3 rounded-lg ${feature.bgColor} ${feature.color} mb-4`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Our Professional Services
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              End-to-end logistics and trade solutions for businesses of all sizes.
            </p>
          </div>

          {/* Service Categories */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            <button
              onClick={() => setServiceType('')}
              className={`px-6 py-2 rounded-full flex items-center gap-2 ${
                serviceType === '' 
                  ? 'bg-primary-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Services
            </button>
            {serviceTypes.map((type) => {
              const Icon = type.icon
              return (
                <button
                  key={type.value}
                  onClick={() => setServiceType(type.value)}
                  className={`px-6 py-2 rounded-full flex items-center gap-2 ${
                    serviceType === type.value 
                      ? 'bg-primary-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {type.label}
                </button>
              )
            })}
          </div>

          {/* Services Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-gray-100 rounded-xl p-6 animate-pulse">
                  <div className="bg-gray-200 h-8 rounded-lg mb-4 w-3/4"></div>
                  <div className="bg-gray-200 h-4 rounded mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded mb-4 w-2/3"></div>
                  <div className="bg-gray-200 h-10 rounded-lg"></div>
                </div>
              ))}
            </div>
          ) : data?.services && data.services.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>

              {/* Pagination */}
              {data.pagination.pages > 1 && (
                <div className="flex justify-center items-center space-x-2 mt-12">
                  <button
                    onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="px-4 py-2">
                    Page {page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage(prev => Math.min(prev + 1, data.pagination.pages))}
                    disabled={page === data.pagination.pages}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No services found</div>
              <button
                onClick={() => { setServiceType(''); setSearch(''); }}
                className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                View All Services
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">
            Ready to Expand Your Business Globally?
          </h2>
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses who trust YIWU EXPRESS for their international trade needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-8 py-3 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-colors">
              Get Started Today
            </button>
            <button className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-colors">
              Contact Our Team
            </button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}