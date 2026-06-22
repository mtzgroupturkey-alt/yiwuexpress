'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Navbar from '@/components/navbar'
import Footer from '@/components/footer'
import { Service, Quote } from '@prisma/client'
import { FileText, Plus, Calculator, ArrowRight, ShieldCheck, Mail, Phone, Calendar } from 'lucide-react'

interface QuoteWithService extends Quote {
  service: Service
}

export default function QuotesPage() {
  const queryClient = useQueryClient()
  const [token, setToken] = useState<string | null>(null)
  
  // Form State
  const [serviceId, setServiceId] = useState('')
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [weight, setWeight] = useState('')
  const [dimensions, setDimensions] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    setToken(localStorage.getItem('token'))
  }, [])

  // Fetch Services (for dropdown selection)
  const { data: servicesData } = useQuery({
    queryKey: ['services-dropdown'],
    queryFn: async () => {
      const res = await fetch('/api/services?limit=100')
      if (!res.ok) throw new Error('Failed to load services')
      return res.json()
    }
  })

  // Fetch User's Quotes
  const { data: quotesData, isLoading: quotesLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const res = await fetch('/api/quotes', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Failed to load quotes')
      return res.json()
    },
    enabled: !!token
  })

  // Submit Mutation
  const createQuoteMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to submit quote')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] })
      setMessage('Quote request submitted successfully! Our agents will contact you shortly.')
      setErrorMessage('')
      // Reset form
      setOrigin('')
      setDestination('')
      setWeight('')
      setDimensions('')
      setDescription('')
    },
    onError: (err: any) => {
      setErrorMessage(err.message || 'An error occurred.')
      setMessage('')
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceId || !origin || !destination) {
      setErrorMessage('Please fill in the service, origin, and destination.')
      return
    }

    const selectedService = servicesData?.services?.find((s: Service) => s.id === serviceId)

    createQuoteMutation.mutate({
      serviceId,
      serviceType: selectedService?.type || 'shipping',
      weight,
      dimensions,
      origin,
      destination,
      description
    })
  }

  const quotesList = Array.isArray(quotesData) ? quotesData : quotesData?.quotes || []

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Banner */}
        <section className="bg-gradient-primary text-white py-16 relative overflow-hidden">
          <div className="absolute inset-0 chinese-pattern opacity-10"></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-4xl font-bold mb-4 font-heading">B2B Service Quotations</h1>
            <p className="text-lg text-gray-200 max-w-xl mx-auto">
              Request wholesale prices for shipping, warehousing, customs documentation, and supplier sourcing.
            </p>
          </div>
        </section>

        {/* Main Grid */}
        <section className="container mx-auto px-4 py-8">
          {!token ? (
            <div className="max-w-md mx-auto bg-white rounded-2xl shadow-brand p-8 text-center -mt-12 relative z-20">
              <ShieldCheck className="w-16 h-16 text-primary-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Business Authorization Required</h2>
              <p className="text-gray-500 mb-6">
                Please log in or register a corporate business account to request quotations and track pricing agreements.
              </p>
              <div className="space-y-3">
                <a
                  href="/login"
                  className="block w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg shadow-md transition-colors"
                >
                  Log In
                </a>
                <a
                  href="/register"
                  className="block w-full py-3 border border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  Register Business
                </a>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-12 relative z-20">
              {/* Request Form */}
              <div className="col-span-1 lg:col-span-1 bg-white rounded-2xl shadow-brand p-6 border border-gray-100 h-fit">
                <h2 className="text-xl font-bold text-gray-900 mb-4 pb-4 border-b border-gray-100 flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-secondary-600" />
                  New Quote Request
                </h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Logistics Service *</label>
                    <select
                      value={serviceId}
                      onChange={(e) => setServiceId(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 bg-white"
                      required
                    >
                      <option value="">Select Service...</option>
                      {servicesData?.services?.map((service: Service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} ({service.duration})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Origin *</label>
                      <input
                        type="text"
                        placeholder="e.g. Yiwu, China"
                        value={origin}
                        onChange={(e) => setOrigin(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Destination *</label>
                      <input
                        type="text"
                        placeholder="e.g. Hamburg, DE"
                        value={destination}
                        onChange={(e) => setDestination(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Weight (kg)</label>
                      <input
                        type="number"
                        placeholder="e.g. 250"
                        value={weight}
                        onChange={(e) => setWeight(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Dimensions (cm)</label>
                      <input
                        type="text"
                        placeholder="L x W x H"
                        value={dimensions}
                        onChange={(e) => setDimensions(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Cargo/Requirements Info</label>
                    <textarea
                      placeholder="Specify product types, material descriptions, packaging, or special handling requirements..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 text-sm"
                    />
                  </div>

                  {message && (
                    <div className="text-sm font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                      {message}
                    </div>
                  )}

                  {errorMessage && (
                    <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                      {errorMessage}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={createQuoteMutation.isPending}
                    className="w-full py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-bold rounded-lg shadow transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {createQuoteMutation.isPending ? 'Submitting...' : 'Submit Quote Request'}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              </div>

              {/* Quotes History */}
              <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-brand p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary-600" />
                  Quotation Agreements
                </h2>

                {quotesLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="border border-gray-100 rounded-xl p-4 animate-pulse">
                        <div className="bg-gray-200 h-6 w-1/3 mb-2 rounded"></div>
                        <div className="bg-gray-200 h-4 w-1/2 rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : quotesList.length === 0 ? (
                  <div className="text-center py-16 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-gray-500 font-medium">No quote requests found.</p>
                    <p className="text-sm text-gray-400 mt-1">Submit the form on the left to request your first commercial rate.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {quotesList.map((quote: QuoteWithService) => {
                      let badgeColor = 'bg-gray-100 text-gray-700'
                      if (quote.status === 'APPROVED') badgeColor = 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      if (quote.status === 'PENDING') badgeColor = 'bg-amber-50 text-amber-700 border border-amber-100'
                      if (quote.status === 'REJECTED') badgeColor = 'bg-rose-50 text-rose-700 border border-rose-100'

                      return (
                        <div key={quote.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-brand transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              <h3 className="font-bold text-gray-900 text-lg">
                                {quote.service?.name || 'Logistics Service'}
                              </h3>
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badgeColor}`}>
                                {quote.status}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-500">
                              📍 Route: <strong className="text-gray-700">{quote.origin}</strong> to <strong className="text-gray-700">{quote.destination}</strong>
                            </p>
                            
                            {quote.weight && (
                              <p className="text-xs text-gray-400">
                                Cargo: {quote.weight} kg {quote.dimensions ? `(${quote.dimensions})` : ''}
                              </p>
                            )}

                            {quote.description && (
                              <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded">
                                &ldquo;{quote.description}&rdquo;
                              </p>
                            )}
                          </div>

                          <div className="text-right flex flex-col items-end gap-1.5 self-stretch md:self-auto border-t border-gray-50 md:border-0 pt-3 md:pt-0">
                            <span className="text-xs text-gray-400 block font-semibold uppercase">COMMERCIAL RATE</span>
                            <span className="text-2xl font-black text-primary-600">
                              {quote.price ? `$${quote.price.toLocaleString()}` : 'Custom Review'}
                            </span>
                            {quote.validUntil && (
                              <span className="text-xs text-gray-400 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                Valid until: {new Date(quote.validUntil).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      <Footer />
    </div>
  )
}
