'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations, useLocale } from 'next-intl'
import { LocaleLink } from '@/components/LocaleLink'
import { Container } from '@/components/ui/Container'
import { 
  Search, 
  Calculator, 
  FileText, 
  ShoppingBag, 
  Truck, 
  ArrowRight, 
  Globe, 
  ShieldCheck,
  CheckCircle2
} from 'lucide-react'

export function QuickTradeTools() {
  const t = useTranslations('Services')
  const locale = useLocale()
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'track' | 'calculate' | 'quote' | 'wholesale'>('track')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [origin, setOrigin] = useState('Yiwu, China')
  const [destination, setDestination] = useState('USA')
  const [cargoVolume, setCargoVolume] = useState('5')
  const [quoteService, setQuoteService] = useState('shipping')
  const [productKeyword, setProductKeyword] = useState('')

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (trackingNumber.trim()) {
      router.push(`/${locale}/track?number=${encodeURIComponent(trackingNumber.trim())}`)
    } else {
      router.push(`/${locale}/track`)
    }
  }

  const handleCalculateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/${locale}/calculator?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&volume=${cargoVolume}`)
  }

  const handleQuoteSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.push(`/${locale}/quotes/new?serviceType=${quoteService}`)
  }

  const handleWholesaleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (productKeyword.trim()) {
      router.push(`/${locale}/wholesale?search=${encodeURIComponent(productKeyword.trim())}`)
    } else {
      router.push(`/${locale}/wholesale`)
    }
  }

  return (
    <div className="relative -mt-6 sm:-mt-10 z-20 mb-12">
      <Container maxWidth="2xl">
        <div className="bg-white rounded-3xl shadow-brand-lg border border-gray-200/80 p-4 sm:p-6 backdrop-blur-md">
          {/* Tool Navigation Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-gray-100 pb-4 mb-5">
            <button
              onClick={() => setActiveTab('track')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'track'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Track Cargo</span>
            </button>

            <button
              onClick={() => setActiveTab('calculate')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'calculate'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Rate Calculator</span>
            </button>

            <button
              onClick={() => setActiveTab('quote')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'quote'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Instant Quote</span>
            </button>

            <button
              onClick={() => setActiveTab('wholesale')}
              className={`flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                activeTab === 'wholesale'
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Bulk Sourcing</span>
            </button>
          </div>

          {/* TAB CONTENT: Track Cargo */}
          {activeTab === 'track' && (
            <form onSubmit={handleTrackSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter Container Number, B/L, or Tracking ID (e.g. YW-89302)..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-sm rounded-2xl shadow-md hover:shadow-gold transition-all duration-200 flex items-center justify-center gap-2 shrink-0"
              >
                Track Now
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB CONTENT: Rate Calculator */}
          {activeTab === 'calculate' && (
            <form onSubmit={handleCalculateSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
              <select
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="Yiwu, China">Origin: Yiwu Hub (China)</option>
                <option value="Ningbo Port">Origin: Ningbo Port</option>
                <option value="Shanghai Port">Origin: Shanghai Port</option>
                <option value="Shenzhen Port">Origin: Shenzhen Hub</option>
              </select>

              <select
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="USA">Destination: United States</option>
                <option value="Germany">Destination: Germany / EU</option>
                <option value="UAE">Destination: UAE / Middle East</option>
                <option value="UK">Destination: United Kingdom</option>
                <option value="Saudi Arabia">Destination: Saudi Arabia</option>
                <option value="Australia">Destination: Australia</option>
              </select>

              <div className="relative w-full">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={cargoVolume}
                  onChange={(e) => setCargoVolume(e.target.value)}
                  placeholder="Est. Volume (CBM)"
                  className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">CBM</span>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                Calculate Rate
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB CONTENT: Instant Quote */}
          {activeTab === 'quote' && (
            <form onSubmit={handleQuoteSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
              <select
                value={quoteService}
                onChange={(e) => setQuoteService(e.target.value)}
                className="w-full sm:col-span-2 px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="shipping">Service: Ocean / Air Freight Logistics</option>
                <option value="customs">Service: Customs Clearance & Dual-Clearance DDP</option>
                <option value="warehousing">Service: Warehouse Storage & Multi-Supplier Consolidation</option>
                <option value="sourcing">Service: Factory Sourcing & Product Quality Audit</option>
              </select>

              <button
                type="submit"
                className="w-full px-6 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                Request 24h Proposal
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TAB CONTENT: Bulk Sourcing */}
          {activeTab === 'wholesale' && (
            <form onSubmit={handleWholesaleSubmit} className="flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <ShoppingBag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={productKeyword}
                  onChange={(e) => setProductKeyword(e.target.value)}
                  placeholder="Search 100,000+ Verified China Wholesale Factory Items (e.g. Solar LED, Electronics)..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-8 py-3.5 bg-secondary-500 hover:bg-secondary-600 text-white font-bold text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 shrink-0"
              >
                Find Factory Prices
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Sub-bar assurances */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gray-100 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Direct factory quotes within 24 hours</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Licensed NVOCC & Customs Dual-Clearance</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Escrow milestone payments & quality inspection</span>
            </div>
          </div>
        </div>
      </Container>
    </div>
  )
}
