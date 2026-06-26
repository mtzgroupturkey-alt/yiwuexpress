'use client'

import { useState, useEffect } from 'react'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Search, MapPin, Calendar, Truck, CheckCircle2, Clock } from 'lucide-react'

interface ShipmentDetails {
  id: string
  trackingNumber: string
  origin: string
  destination: string
  status: string
  estimatedDelivery: string | null
  actualDelivery: string | null
  carrier: string | null
  notes: string | null
  service: {
    name: string
  }
}

interface TrackingEvent {
  status: string
  description: string
  location: string
  timestamp: string
  completed: boolean
}

export default function TrackPage() {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    shipment: ShipmentDetails
    trackingEvents: TrackingEvent[]
    estimatedDelivery: string
    currentStatus: string
  } | null>(null)

  const trackShipment = async (num: string) => {
    setLoading(true)
    setError('')
    setResult(null)

    try {
      const response = await fetch(`/api/shipments/track/${num.trim()}`)
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No shipment found with this tracking number.')
        }
        throw new Error('Failed to fetch tracking details. Please try again.')
      }
      const data = await response.json()
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Server error')
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingNumber.trim()) return
    await trackShipment(trackingNumber)
  }

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const num = params.get('num')
      if (num) {
        setTrackingNumber(num)
        trackShipment(num)
      }
    }
  }, [])

  // Pre-fill search with seed number to help the user test it easily
  const fillSampleNumber = () => {
    setTrackingNumber('YWE87349823CN')
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
        {/* Tracking Input Container */}
        <section className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-brand p-6 md:p-8 -mt-12 relative z-20">
            <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Enter tracking number (e.g. YWE87349823CN)..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-800 font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition-colors disabled:opacity-55"
              >
                {loading ? 'Tracking...' : 'Track'}
              </button>
            </form>

            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>Enter a valid YIWU EXPRESS tracking code</span>
              <button 
                onClick={fillSampleNumber}
                className="text-secondary-600 hover:underline font-semibold"
              >
                Use Sample Tracking Code
              </button>
            </div>
          </div>

          {/* Results Container */}
          <div className="max-w-3xl mx-auto mt-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-center font-medium">
                {error}
              </div>
            )}

            {result && (
              <div className="space-y-6">
                {/* Status Summary Card */}
                <div className="bg-white rounded-2xl shadow-brand p-6 border border-gray-100">
                  <div className="flex flex-wrap justify-between items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div>
                      <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Tracking Number</span>
                      <h2 className="text-2xl font-bold text-gray-900 mt-1">{result.shipment.trackingNumber}</h2>
                    </div>
                    <div className="bg-primary-50 text-primary-700 px-4 py-2 rounded-full font-bold text-sm border border-primary-100">
                      {result.currentStatus}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block uppercase">Route</span>
                        <span className="font-semibold text-gray-800">{result.shipment.origin}</span>
                        <span className="mx-1.5 text-gray-400">→</span>
                        <span className="font-semibold text-gray-800">{result.shipment.destination}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block uppercase">Est. Delivery</span>
                        <span className="font-semibold text-gray-800">
                          {result.shipment.estimatedDelivery 
                            ? new Date(result.shipment.estimatedDelivery).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                            : 'Pending Update'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Truck className="w-5 h-5 text-gray-400 mt-0.5" />
                      <div>
                        <span className="text-xs text-gray-400 font-semibold block uppercase">Carrier & Service</span>
                        <span className="font-semibold text-gray-800">
                          {result.shipment.carrier || 'YIWU EXPRESS'} • {result.shipment.service.name}
                        </span>
                      </div>
                    </div>
                  </div>

                  {result.shipment.notes && (
                    <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4 text-sm text-gray-600">
                      <strong>Notes:</strong> {result.shipment.notes}
                    </div>
                  )}
                </div>

                {/* Progress Timeline Card */}
                <div className="bg-white rounded-2xl shadow-brand p-6 border border-gray-100">
                  <h3 className="text-lg font-bold text-gray-900 mb-6">Tracking Milestones</h3>
                  
                  <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-gray-200">
                    {result.trackingEvents.map((event, idx) => {
                      const isLast = idx === result.trackingEvents.length - 1
                      return (
                        <div key={event.status} className="relative group">
                          {/* Dot Indicator */}
                          <div className={`absolute -left-[30px] top-1 w-6 h-6 rounded-full flex items-center justify-center border-4 ${
                            event.completed 
                              ? 'bg-primary-600 border-primary-100 text-white' 
                              : 'bg-white border-gray-200'
                          }`}>
                            {event.completed && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>

                          <div>
                            <div className="flex flex-wrap justify-between items-center gap-2">
                              <h4 className="font-bold text-gray-900">{event.status}</h4>
                              <span className="text-xs text-gray-400 font-medium">
                                {event.timestamp ? new Date(event.timestamp).toLocaleString() : ''}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                            <span className="inline-block mt-2 text-xs bg-gray-100 text-gray-500 font-semibold px-2 py-1 rounded">
                              📍 {event.location}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </SharedLayout>
  )
}
