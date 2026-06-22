'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import ServiceCard from '@/components/service-card'
import { Service } from '@prisma/client'
import { Search, Filter, Truck, Shield, Package, Users } from 'lucide-react'

interface ServiceResponse {
  services: Service[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function ServicesPage() {
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
    { value: '', label: 'All Services', icon: Filter },
    { value: 'shipping', label: 'Shipping', icon: Truck },
    { value: 'customs', label: 'Customs Clearance', icon: Shield },
    { value: 'warehousing', label: 'Warehousing', icon: Package },
    { value: 'sourcing', label: 'Sourcing Services', icon: Users },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />
        
        {/* Banner */}
        <section className="bg-gradient-primary text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 chinese-pattern opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl font-bold mb-4">Our Professional Logistics Services</h1>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto">
              Choose from a wide range of reliable and secure international trade solutions tailored to your business needs.
            </p>
          </div>
        </section>

        {/* Search and Filters */}
        <section className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-brand p-6 mb-8 -mt-12 relative z-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              {/* Search Bar */}
              <div className="relative col-span-1 md:col-span-2">
                <Search className="absolute left-3 top-3.5 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search logistics services..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* Calculator Shortcut */}
              <div className="flex justify-end">
                <a
                  href="/calculator"
                  className="inline-flex items-center justify-center px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-semibold rounded-lg shadow transition-colors w-full md:w-auto"
                >
                  Cost Calculator
                </a>
              </div>
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2 mt-6 border-t border-gray-100 pt-6">
              {serviceTypes.map((type) => {
                const Icon = type.icon
                const isActive = serviceType === type.value
                return (
                  <button
                    key={type.value}
                    onClick={() => { setServiceType(type.value); setPage(1); }}
                    className={`px-5 py-2.5 rounded-full flex items-center gap-2 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {type.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Services List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 border border-gray-100 shadow-brand animate-pulse">
                  <div className="bg-gray-200 h-48 rounded-lg mb-4"></div>
                  <div className="bg-gray-200 h-6 rounded w-3/4 mb-2"></div>
                  <div className="bg-gray-200 h-4 rounded w-1/2 mb-4"></div>
                  <div className="bg-gray-200 h-10 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12 text-accent-600 font-medium">
              Error loading services: {(error as Error).message}
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
                    onClick={() => setPage((p) => Math.max(p - 1, 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-gray-600 text-sm">
                    Page {page} of {data.pagination.pages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(p + 1, data.pagination.pages))}
                    disabled={page === data.pagination.pages}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-2xl shadow-brand">
              <p className="text-gray-500 text-lg">No services found matching your criteria.</p>
              <button
                onClick={() => { setServiceType(''); setSearch(''); }}
                className="mt-4 px-6 py-2.5 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>
      </div>
      <Footer />
    </div>
  )
}
