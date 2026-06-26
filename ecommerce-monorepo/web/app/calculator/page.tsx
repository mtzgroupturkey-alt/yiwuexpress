'use client'

import { useState } from 'react'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Calculator, ArrowRight, Info, HelpCircle, PackageOpen, Award, CheckCircle } from 'lucide-react'

export default function CalculatorPage() {
  // Input State
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [weight, setWeight] = useState('')
  const [length, setLength] = useState('')
  const [width, setWidth] = useState('')
  const [height, setHeight] = useState('')
  const [serviceType, setServiceType] = useState('air')
  const [insurance, setInsurance] = useState(false)

  // Output State
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [estimate, setEstimate] = useState<{
    estimatedPrice: number
    currency: string
    breakdown: {
      baseRate: number
      weightKg: number
      multiplier: number
      destinationFactor: number
    }
  } | null>(null)

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin || !destination || !weight) {
      setError('Please fill in Origin, Destination, and Weight.')
      return
    }

    setLoading(true)
    setError('')
    setEstimate(null)

    try {
      const response = await fetch('/api/quotes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin,
          destination,
          weight,
          dimensions: `${length}x${width}x${height}`,
          serviceType,
          insuranceRequired: insurance
        })
      })

      if (!response.ok) {
        throw new Error('Failed to calculate. Please try again.')
      }

      const data = await response.json()
      setEstimate(data)
    } catch (err: any) {
      setError(err.message || 'Server error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SharedLayout 
      pageTitle="Freight Cost Calculator"
      pageDescription="Get an instant shipping cost estimate based on cargo weights, volume dimensions, and international routes"
      breadcrumbs={[
        { name: 'Calculator', href: '/calculator' }
      ]}
      backgroundImage="/images/calculator-bg.jpg"
    >
      <div className="bg-gray-50">
        {/* Main Grid */}
        <section className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 -mt-12 relative z-20">
            {/* Input Form Card */}
            <div className="col-span-1 lg:col-span-1 bg-white rounded-2xl shadow-brand p-6 border border-gray-100 h-fit">
              <h2 className="text-xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-secondary-600" />
                Cargo Details
              </h2>

              <form onSubmit={handleCalculate} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Origin *</label>
                    <input
                      type="text"
                      placeholder="e.g. Yiwu, China"
                      value={origin}
                      onChange={(e) => setOrigin(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 mb-1">Destination *</label>
                    <input
                      type="text"
                      placeholder="e.g. Russia"
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 text-sm"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 150"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Dimensions (cm)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      placeholder="Length"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 text-sm text-center"
                    />
                    <input
                      type="number"
                      placeholder="Width"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 text-sm text-center"
                    />
                    <input
                      type="number"
                      placeholder="Height"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 text-sm text-center"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Freight Speed *</label>
                  <select
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-800 bg-white text-sm"
                  >
                    <option value="air">Air Freight Express (3-5 Days)</option>
                    <option value="sea">Sea Freight Economy (20-30 Days)</option>
                    <option value="express">Door-to-Door Courier (7-12 Days)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="insurance"
                    checked={insurance}
                    onChange={(e) => setInsurance(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="insurance" className="text-sm font-semibold text-gray-600 cursor-pointer">
                    Add Cargo Insurance (+ $50.00)
                  </label>
                </div>

                {error && (
                  <div className="text-sm font-medium text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Estimating...' : 'Get Instant Estimation'}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Estimation Results Card */}
            <div className="col-span-1 lg:col-span-2 space-y-6">
              {!estimate && !loading ? (
                <div className="bg-white rounded-2xl shadow-brand p-8 border border-gray-100 text-center flex flex-col justify-center items-center h-full min-h-[350px]">
                  <PackageOpen className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-bold text-gray-800">No Estimation Yet</h3>
                  <p className="text-gray-400 text-sm max-w-sm mt-1">
                    Fill in your cargo weight, shipping route, and selection on the left to see your quotation preview.
                  </p>
                </div>
              ) : loading ? (
                <div className="bg-white rounded-2xl shadow-brand p-8 border border-gray-100 text-center flex flex-col justify-center items-center h-full min-h-[350px] animate-pulse">
                  <Calculator className="w-12 h-12 text-gray-200 animate-spin mb-4" />
                  <div className="bg-gray-100 h-6 w-1/3 rounded mb-2"></div>
                  <div className="bg-gray-100 h-4 w-1/2 rounded"></div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl shadow-brand p-6 border border-gray-100 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-4">Quotation Preview</h3>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 rounded-xl p-6 border border-gray-100">
                    <div>
                      <span className="text-xs text-gray-400 block font-semibold uppercase tracking-wider">Estimated Total Cost</span>
                      <span className="text-4xl font-black text-primary-600 mt-1 block">
                        ${((estimate?.estimatedPrice ?? 0) + (insurance ? 50 : 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">Estimated in {estimate?.currency}</span>
                    </div>

                    <a
                      href={`/quotes?service=${serviceType}&weight=${weight}&origin=${origin}&destination=${destination}`}
                      className="px-6 py-3 bg-secondary-500 hover:bg-secondary-600 text-white font-bold rounded-lg shadow transition-colors w-full md:w-auto text-center"
                    >
                      Lock in this Rate
                    </a>
                  </div>

                  {/* Estimation Breakdown */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wider">Calculation Details</h4>
                    <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 text-sm">
                      <div className="flex justify-between p-3.5">
                        <span className="text-gray-500">Service Category Rate</span>
                        <strong className="text-gray-800">${estimate?.breakdown.baseRate.toFixed(2)} / kg</strong>
                      </div>
                      <div className="flex justify-between p-3.5">
                        <span className="text-gray-500">Total Cargo Weight</span>
                        <strong className="text-gray-800">{estimate?.breakdown.weightKg} kg</strong>
                      </div>
                      <div className="flex justify-between p-3.5">
                        <span className="text-gray-500">Freight Speed Factor</span>
                        <strong className="text-gray-800">x{estimate?.breakdown.multiplier}</strong>
                      </div>
                      <div className="flex justify-between p-3.5">
                        <span className="text-gray-500">Regional Route Factor ({destination})</span>
                        <strong className="text-gray-800">x{estimate?.breakdown.destinationFactor}</strong>
                      </div>
                      {insurance && (
                        <div className="flex justify-between p-3.5 bg-emerald-50/50">
                          <span className="text-emerald-700 font-medium">Cargo Liability Insurance</span>
                          <strong className="text-emerald-700">+$50.00</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notice Alert */}
                  <div className="flex gap-2.5 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs text-amber-800">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>Disclaimer:</strong> This calculator provides automatic price approximations. Fuel surcharges, volumetric adjustments, customs inspection duties, and local warehousing storage rates are finalized at order booking.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </SharedLayout>
  )
}
