'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Search, MapPin, Calendar, Truck, CheckCircle2, Clock, Package } from 'lucide-react'

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  const { data, isLoading, error } = useQuery({
    queryKey: ['track-shipment', searchTerm],
    queryFn: () => api.get(`/api/shipments/track/${searchTerm}`),
    enabled: !!searchTerm,
    retry: false,
  })

  const result = data?.data

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      setSearchTerm(trackingNumber.trim())
    }
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const num = params.get('num')
      if (num) {
        setTrackingNumber(num)
        setSearchTerm(num)
      }
    }
  }, [])

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      DELIVERED: 'bg-green-100 text-green-800',
      IN_TRANSIT: 'bg-blue-100 text-blue-800',
      CUSTOMS: 'bg-yellow-100 text-yellow-800',
      CUSTOMS_HOLD: 'bg-orange-100 text-orange-800',
      CUSTOMS_CLEARED: 'bg-green-100 text-green-800',
      LOADING: 'bg-yellow-100 text-yellow-800',
      AT_SEA: 'bg-indigo-100 text-indigo-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    PAID: 'Paid',
    PROCESSING: 'Processing',
    SHIPPED: 'Shipped',
    PREPARING: 'Preparing for Shipment',
    LOADING: 'Loading',
    IN_TRANSIT: 'In Transit',
    AT_SEA: 'At Sea',
    CUSTOMS: 'Customs Clearance',
    CUSTOMS_HOLD: 'Customs Hold',
    CUSTOMS_CLEARED: 'Customs Cleared',
    DELIVERED: 'Delivered',
  }

  return (
    <SharedLayout 
      pageTitle="Real-Time Shipment Tracking"
      pageDescription="Get immediate status updates, estimated arrival dates, and customs clearances for your international freight"
      breadcrumbs={[
        { name: 'Track Shipment', href: '/track' }
      ]}
      backgroundImage="/images/track-bg.jpg"
    >
      <div className="bg-gray-50">
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-brand p-6 md:p-8 -mt-12 relative z-20">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter tracking number or order number..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-55"
              >
                {isLoading ? 'Tracking...' : 'Track'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Enter a valid tracking or order number</span>
              <button 
                onClick={() => setTrackingNumber('YWE87349823CN')}
                className="text-secondary-600 hover:underline font-semibold"
              >
                Use Sample Code
              </button>
            </div>
          </div>

          <div className="max-w-3xl mx-auto mt-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center font-medium">
                No shipment found with this tracking number.
              </div>
            )}

            {isLoading && (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-gray-500 mt-4">Looking up your shipment...</p>
              </div>
            )}

            {searchTerm && !isLoading && !result && !error && (
              <div className="bg-white rounded-2xl shadow-brand p-12 text-center border border-gray-100">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-700">Shipment Not Found</h3>
                <p className="text-sm text-gray-500 mt-1">
                  No shipment found with: <strong>{searchTerm}</strong>
                </p>
              </div>
            )}

            {result && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl shadow-brand p-6 border border-gray-100">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div>
                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        {result.type === 'order' ? 'Order Number' : 'Tracking Number'}
                      </span>
                      <h2 className="text-2xl font-bold text-gray-900 mt-1">
                        {result.trackingNumber}
                        {result.orderNumber && result.type === 'order' && (
                          <span className="text-sm font-normal text-gray-400 ml-2">
                            (Order #{result.orderNumber})
                          </span>
                        )}
                      </h2>
                    </div>
                    <div className={`${getStatusColor(result.status)} px-4 py-2 rounded-full font-bold text-sm`}>
                      {statusLabels[result.status] || result.status}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block uppercase">Route</span>
                        <span className="font-semibold text-gray-800">{result.origin || 'Yiwu, China'}</span>
                        <span className="mx-1.5 text-gray-400">→</span>
                        <span className="font-semibold text-gray-800">{result.destination}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block uppercase">Est. Delivery</span>
                        <span className="font-semibold text-gray-800">
                          {result.estimatedDelivery 
                            ? new Date(result.estimatedDelivery).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : 'Pending Update'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block uppercase">Carrier</span>
                        <span className="font-semibold text-gray-800">
                          {result.carrier || 'Pending'}
                          {result.carrierType === 'CUSTOMER' && (
                            <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                              Customer's Carrier
                            </span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.containerNumber && (
                    <div className="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-3 text-sm text-indigo-700">
                      <Package className="w-4 h-4 inline mr-1" />
                      Container: {result.containerNumber}
                      {result.containerStatus && (
                        <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusColor(result.containerStatus)}`}>
                          {result.containerStatus}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-white rounded-2xl shadow-brand p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Tracking Milestones</h3>
                  
                  <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                    {(result.statusHistory || []).map((event: any, idx: number) => {
                      const isLast = idx === result.statusHistory.length - 1
                      const completed = event.status === result.status || 
                        (result.statusHistory || []).findIndex((e: any) => e.status === result.status) >= idx
                      return (
                        <div key={idx} className="relative group">
                          <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 ${
                            completed 
                              ? 'bg-primary-600 border-primary-100 text-white' 
                              : 'bg-white border-gray-200'
                          }`}>
                            {completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <h4 className="font-bold text-gray-900">
                                {statusLabels[event.status] || event.status}
                              </h4>
                              <span className="text-xs text-gray-400 font-medium">
                                {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                              </span>
                            </div>
                            {event.note && (
                              <p className="text-sm text-gray-600 mt-1">{event.note}</p>
                            )}
                            {event.location && (
                              <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-1 rounded">
                                📍 {event.location}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    {(!result.statusHistory || result.statusHistory.length === 0) && (
                      <p className="text-gray-400 text-center py-4">No tracking history available</p>
                    )}
                  </div>
                </div>

                {result.actualDelivery && result.status === 'DELIVERED' && (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h3 className="text-lg font-bold text-green-800">Delivered</h3>
                    <p className="text-green-600">
                      Delivered on {new Date(result.actualDelivery).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </SharedLayout>
  )
}
