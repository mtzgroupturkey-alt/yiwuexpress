'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { Package, Search, ArrowRight, Eye, Calendar, MapPin, AlertCircle } from 'lucide-react'

interface Shipment {
  id: string
  trackingNumber: string
  origin: string
  destination: string
  status: string
  estimatedDelivery: string | null
  createdAt: string
  service: {
    name: string
    type: string
  }
}

export default function ShipmentsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [filteredShipments, setFilteredShipments] = useState<Shipment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('ALL')
  const router = useRouter()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchShipments(token)
  }, [])

  const fetchShipments = async (token: string) => {
    try {
      setLoading(true)
      setError('')
      const response = await fetch('/api/shipments', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
          return
        }
        throw new Error('Failed to load shipments')
      }

      const data = await response.json()
      setShipments(data.shipments || [])
      setFilteredShipments(data.shipments || [])
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading shipments.')
    } finally {
      setLoading(false)
    }
  }

  // Filter and Search effect
  useEffect(() => {
    let result = shipments

    // Filter by status
    if (activeFilter !== 'ALL') {
      result = result.filter(s => s.status === activeFilter)
    }

    // Filter by search query (tracking number, origin, destination, service name)
    if (searchTerm.trim() !== '') {
      const term = searchTerm.toLowerCase()
      result = result.filter(s => 
        s.trackingNumber.toLowerCase().includes(term) ||
        s.origin.toLowerCase().includes(term) ||
        s.destination.toLowerCase().includes(term) ||
        s.service.name.toLowerCase().includes(term)
      )
    }

    setFilteredShipments(result)
  }, [searchTerm, activeFilter, shipments])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PREPARING':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'IN_TRANSIT':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'IN_CUSTOMS':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'ARRIVED':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const handleTrackDirectly = (trackingNumber: string) => {
    router.push(`/track?num=${trackingNumber}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <div>
          <Navbar />
          <div className="flex justify-center items-center py-32">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 font-medium">Retrieving your shipments...</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Banner Section */}
        <section className="bg-gradient-primary text-white py-12 relative overflow-hidden">
          <div className="absolute inset-0 chinese-pattern opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-3xl font-bold mb-2">My Shipments</h1>
            <p className="text-gray-200 max-w-xl">
              Track the state, milestones, and logistics parameters of all your registered corporate shipments.
            </p>
          </div>
        </section>

        {/* Dashboard Content */}
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Filters and Search Bar */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search shipments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              {['ALL', 'PREPARING', 'IN_TRANSIT', 'IN_CUSTOMS', 'ARRIVED', 'DELIVERED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    activeFilter === filter
                      ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Shipments List */}
          {filteredShipments.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-1">No Shipments Found</h3>
              <p className="text-gray-500 max-w-sm mx-auto text-sm mb-6">
                {searchTerm || activeFilter !== 'ALL' 
                  ? "We couldn't find any shipments matching your filters. Try adjusting your terms." 
                  : "You don't have any shipments registered yet. Complete a quotation and request booking to begin."}
              </p>
              {!searchTerm && activeFilter === 'ALL' && (
                <Link
                  href="/quotes"
                  className="inline-flex items-center px-4 py-2 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 text-sm shadow transition-all"
                >
                  Get a Quote
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredShipments.map((shipment) => (
                <div 
                  key={shipment.id} 
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                >
                  {/* Shipment Main Info */}
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-bold text-gray-900 text-base">{shipment.trackingNumber}</span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusColor(shipment.status)}`}>
                        {shipment.status}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        <span className="font-medium text-gray-800">{shipment.origin}</span>
                        <ArrowRight className="w-3 h-3 text-gray-400" />
                        <span className="font-medium text-gray-800">{shipment.destination}</span>
                      </div>
                      <div className="hidden sm:block text-gray-300">|</div>
                      <div className="text-gray-500">
                        Service: <span className="font-medium text-gray-800">{shipment.service.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Info and Actions */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full md:w-auto justify-between border-t md:border-t-0 pt-4 md:pt-0 border-gray-100">
                    <div className="text-left md:text-right space-y-1">
                      <span className="text-xs text-gray-400 font-semibold uppercase block tracking-wider">Estimated Delivery</span>
                      <span className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        {shipment.estimatedDelivery 
                          ? new Date(shipment.estimatedDelivery).toLocaleDateString()
                          : 'Pending Schedule'}
                      </span>
                    </div>

                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => handleTrackDirectly(shipment.trackingNumber)}
                        className="flex-1 sm:flex-none inline-flex justify-center items-center px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-semibold transition-all shadow-sm"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Quick Track
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />
    </div>
  )
}
