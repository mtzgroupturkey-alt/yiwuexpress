'use client'

import { Service } from '@prisma/client'
import { Truck, Shield, Package, Users, Clock, Globe, DollarSign } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'

interface ServiceCardProps {
  service: Service
}

export default function ServiceCard({ service }: ServiceCardProps) {
  const [isRequestingQuote, setIsRequestingQuote] = useState(false)

  const getServiceIcon = (type: string) => {
    switch (type) {
      case 'shipping':
        return Truck
      case 'customs':
        return Shield
      case 'warehousing':
        return Package
      case 'sourcing':
        return Users
      default:
        return Globe
    }
  }

  const getServiceColor = (type: string) => {
    switch (type) {
      case 'shipping':
        return 'text-accent-600 bg-accent-50'
      case 'customs':
        return 'text-primary-600 bg-primary-50'
      case 'warehousing':
        return 'text-secondary-600 bg-secondary-50'
      case 'sourcing':
        return 'text-success bg-green-50'
      default:
        return 'text-gray-600 bg-gray-50'
    }
  }

  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'shipping':
        return 'Shipping'
      case 'customs':
        return 'Customs'
      case 'warehousing':
        return 'Warehousing'
      case 'sourcing':
        return 'Sourcing'
      default:
        return 'Service'
    }
  }

  const Icon = getServiceIcon(service.type)
  const colorClasses = getServiceColor(service.type)
  const serviceLabel = getServiceLabel(service.type)

  const handleRequestQuote = async () => {
    try {
      setIsRequestingQuote(true)
      const token = localStorage.getItem('token')
      
      if (!token) {
        window.location.href = '/login?redirect=/quotes/new'
        return
      }

      // Navigate to quote request page
      window.location.href = `/quotes/new?service=${service.id}`
    } catch (error) {
      console.error('Error requesting quote:', error)
      alert('Failed to request quote. Please try again.')
    } finally {
      setIsRequestingQuote(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-brand overflow-hidden hover:shadow-brand-lg transition-all duration-300 border border-gray-100">
      {/* Service Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-start justify-between">
          <div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colorClasses} mb-3`}>
              <Icon className="w-3 h-3 mr-1" />
              {serviceLabel}
            </div>
            <Link href={`/services/${service.id}`}>
              <h3 className="font-semibold text-gray-900 hover:text-primary-600 text-lg truncate">
                {service.name}
              </h3>
            </Link>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary-600">
              ${service.price.toFixed(2)}
            </div>
            <div className="text-sm text-gray-500">starting price</div>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-3 line-clamp-2 h-10">
          {service.description || 'Professional logistics service'}
        </p>
      </div>

      {/* Service Details */}
      <div className="p-6 space-y-4">
        {service.coverage && (
          <div className="flex items-center text-sm">
            <Globe className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">{service.coverage}</span>
          </div>
        )}

        {service.duration && (
          <div className="flex items-center text-sm">
            <Clock className="w-4 h-4 text-gray-400 mr-2" />
            <span className="text-gray-600">{service.duration}</span>
          </div>
        )}

        <div className="flex items-center text-sm">
          <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
          <span className="text-gray-600">Flexible pricing based on requirements</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <button
            onClick={handleRequestQuote}
            disabled={isRequestingQuote}
            className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
              isRequestingQuote
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {isRequestingQuote ? 'Requesting...' : 'Request Quote'}
          </button>
          
          <Link
            href={`/services/${service.id}`}
            className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors text-center"
          >
            Details
          </Link>
        </div>

        {/* Quick Info */}
        <div className="pt-4 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Service includes: Professional handling, documentation, and tracking
          </div>
        </div>
      </div>

      {/* Service Features */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <div className="text-xs text-gray-500">
          <span className="font-medium text-gray-700">Key Features:</span> Professional handling, real-time tracking, insurance options, 24/7 support
        </div>
      </div>
    </div>
  )
}