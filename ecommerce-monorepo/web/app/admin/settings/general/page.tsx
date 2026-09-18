'use client'

import { useEffect, useState } from 'react'
import {
  Settings, Save, AlertCircle, CheckCircle, RefreshCw, Store, ShoppingBag, Users,
  Building2, Truck, ShieldCheck, Clock, FileText, Percent, Layers, HelpCircle
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

interface WarehouseOption {
  id: string
  code: string
  name: string
  country: string
  city: string | null
  isDefaultSales: boolean
  isDefaultProcurement: boolean
}

interface GeneralSettings {
  storeMode: 'WHOLESALE' | 'RETAIL' | 'BOTH'
  defaultSalesWarehouseId: string | null
  defaultProcurementWarehouseId: string | null
  retailEnabled: boolean
  showBackorderOption: boolean
  backorderLeadTimeDays: number
  wholesaleEnabled: boolean
  wholesaleApprovalRequired: boolean
  wholesaleDefaultMoq: number
  wholesaleDiscountPercent: number | null
  rfqEnabled: boolean
  rfqModel: 'RFQ' | 'INSTANT'
  rfqDefaultExpiryDays: number
  rfqAllowGuestSubmissions: boolean
  rfqAutoSuggestCatalogPrice: boolean
  reservationExpiryHours: number
}

export default function GeneralSettingsPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth()
  const { dict } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([])

  const [settings, setSettings] = useState<GeneralSettings>({
    storeMode: 'WHOLESALE',
    defaultSalesWarehouseId: null,
    defaultProcurementWarehouseId: null,
    retailEnabled: true,
    showBackorderOption: true,
    backorderLeadTimeDays: 28,
    wholesaleEnabled: true,
    wholesaleApprovalRequired: false,
    wholesaleDefaultMoq: 10,
    wholesaleDiscountPercent: 15.0,
    rfqEnabled: true,
    rfqModel: 'RFQ',
    rfqDefaultExpiryDays: 7,
    rfqAllowGuestSubmissions: true,
    rfqAutoSuggestCatalogPrice: true,
    reservationExpiryHours: 24,
  })

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchSettings()
    }
  }, [authLoading, isAdmin])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/store-mode', {
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSettings({
          storeMode: data.settings?.storeMode || 'WHOLESALE',
          defaultSalesWarehouseId: data.settings?.defaultSalesWarehouseId || null,
          defaultProcurementWarehouseId: data.settings?.defaultProcurementWarehouseId || null,
          retailEnabled: data.settings?.retailEnabled ?? true,
          showBackorderOption: data.settings?.showBackorderOption ?? true,
          backorderLeadTimeDays: data.settings?.backorderLeadTimeDays ?? 28,
          wholesaleEnabled: data.settings?.wholesaleEnabled ?? true,
          wholesaleApprovalRequired: data.settings?.wholesaleApprovalRequired ?? false,
          wholesaleDefaultMoq: data.settings?.wholesaleDefaultMoq ?? 10,
          wholesaleDiscountPercent: data.settings?.wholesaleDiscountPercent ?? 15.0,
          rfqEnabled: data.settings?.rfqEnabled ?? true,
          rfqModel: data.settings?.rfqModel || 'RFQ',
          rfqDefaultExpiryDays: data.settings?.rfqDefaultExpiryDays ?? 7,
          rfqAllowGuestSubmissions: data.settings?.rfqAllowGuestSubmissions ?? true,
          rfqAutoSuggestCatalogPrice: data.settings?.rfqAutoSuggestCatalogPrice ?? true,
          reservationExpiryHours: data.settings?.reservationExpiryHours ?? 24,
        })
        if (data.warehouses) {
          setWarehouses(data.warehouses)
        }
        setError('')
      } else {
        setError(data.error || 'Failed to load settings')
      }
    } catch (err) {
      setError('Network error loading settings')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/settings/store-mode', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setSuccess('Sales channels & RFQ configuration updated successfully!')
        setTimeout(() => setSuccess(''), 4000)
      } else {
        setError(data.error || 'Failed to update settings')
      }
    } catch (err) {
      setError('Network error saving settings')
    } finally {
      setSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Authenticating...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">{dict.common?.loading || 'Loading settings...'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-sm text-white">
            <Settings size={22} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales & Fulfillment Channels</h2>
            <p className="text-sm text-gray-500">Configure retail, wholesale B2B, RFQ workflows, and warehouse fulfillment routing</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            fetchSettings()
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 shadow-sm disabled:opacity-50 transition"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          {dict.common?.reset || 'Refresh'}
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200">
          <AlertCircle size={20} className="text-red-600 flex-shrink-0" />
          <span className="text-sm font-medium text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle size={20} className="text-emerald-600 flex-shrink-0" />
          <span className="text-sm font-medium text-emerald-800">{success}</span>
        </div>
      )}

      {/* 1. Storefront Operational Mode */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-2">
          <Store size={20} className="text-blue-600" />
          <h3 className="text-lg font-bold text-gray-900">Storefront Operational Mode</h3>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Controls how the storefront presents itself to public visitors and which commerce channels are accessible.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              value: 'WHOLESALE',
              label: 'Wholesale Only (B2B)',
              description: 'Exclusively tailored for commercial buyers, bulk orders, and RFQ quotations.',
              icon: Store,
              badge: 'B2B Enterprise',
            },
            {
              value: 'RETAIL',
              label: 'Retail Only (B2C)',
              description: 'Standard direct-to-consumer shop with instant checkout, retail pricing, and parcel delivery.',
              icon: ShoppingBag,
              badge: 'B2C Storefront',
            },
            {
              value: 'BOTH',
              label: 'Hybrid Mode (Both)',
              description: 'Supports both retail consumer purchases and wholesale B2B quotes with an active header toggle.',
              icon: Users,
              badge: 'Hybrid Dual-Mode',
            }
          ].map((mode) => {
            const Icon = mode.icon
            const isSelected = settings.storeMode === mode.value
            
            return (
              <div
                key={mode.value}
                onClick={() => setSettings(prev => ({ ...prev, storeMode: mode.value as 'WHOLESALE' | 'RETAIL' | 'BOTH' }))}
                className={`relative p-5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 shadow-md ring-1 ring-blue-500'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-blue-600 rounded-full p-1 shadow-sm">
                      <CheckCircle size={14} className="text-white" />
                    </div>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-md">
                        {mode.badge}
                      </span>
                    </div>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">{mode.label}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed">{mode.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Multi-Warehouse Routing Contracts */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <Building2 size={20} className="text-indigo-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Multi-Warehouse Routing & Stock Contracts</h3>
            <p className="text-xs text-gray-500">Designate the physical distribution centers responsible for domestic order fulfillment vs source procurement.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Default Sales Warehouse (Domestic Fulfillment)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Primary regional distribution center from which storefront orders are reserved and dispatched.
            </p>
            <select
              value={settings.defaultSalesWarehouseId || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultSalesWarehouseId: e.target.value || null }))}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
            >
              <option value="">-- Select Fulfillment Warehouse --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.country === 'Belarus' ? '🇧🇾' : wh.country === 'China' ? '🇨🇳' : '🏢'} {wh.name} ({wh.code}) {wh.city ? `— ${wh.city}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Default Procurement Hub (Source Factory Hub)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              Origin warehouse for purchase orders, factory consolidation, and export container loading.
            </p>
            <select
              value={settings.defaultProcurementWarehouseId || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, defaultProcurementWarehouseId: e.target.value || null }))}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition shadow-sm"
            >
              <option value="">-- Select Procurement Hub --</option>
              {warehouses.map((wh) => (
                <option key={wh.id} value={wh.id}>
                  {wh.country === 'China' ? '🇨🇳' : wh.country === 'Belarus' ? '🇧🇾' : '🏢'} {wh.name} ({wh.code}) {wh.city ? `— ${wh.city}` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="max-w-xl">
            <label className="block text-sm font-semibold text-gray-800">
              Inventory Hold Reservation Window (Hours)
            </label>
            <p className="text-xs text-gray-500">
              Duration that physical inventory remains reserved for pending orders/quotes before automated release worker returns stock to the available pool.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min="1"
              max="168"
              value={settings.reservationExpiryHours}
              onChange={(e) => setSettings(prev => ({ ...prev, reservationExpiryHours: parseInt(e.target.value) || 24 }))}
              className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-center font-bold text-gray-900 focus:ring-2 focus:ring-blue-500 shadow-sm"
            />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hours</span>
          </div>
        </div>
      </div>

      {/* 3. Retail Channel (B2C) Configuration */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <ShoppingBag size={20} className="text-emerald-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Retail Channel (B2C) Configuration</h3>
            <p className="text-xs text-gray-500">Settings governing consumer checkout, parcel shipping, and cross-border backorders.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-200">
            <div>
              <p className="text-sm font-bold text-gray-900">Enable Retail Sales</p>
              <p className="text-xs text-gray-500">Allow individual consumers to browse and purchase items at retail MSRP.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.retailEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, retailEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-200">
            <div>
              <p className="text-sm font-bold text-gray-900">Allow Backorders from China Procurement Hub</p>
              <p className="text-xs text-gray-500">When regional sales warehouse stock is 0, allow customers to backorder directly from the China hub.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.showBackorderOption}
                onChange={(e) => setSettings(prev => ({ ...prev, showBackorderOption: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {settings.showBackorderOption && (
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-emerald-50/40 border border-emerald-100">
              <div>
                <label className="block text-sm font-semibold text-gray-800">
                  Backorder Delivery SLA Display (Days)
                </label>
                <p className="text-xs text-gray-600">
                  Estimated lead time shown on storefront product cards for backordered sea/rail items (e.g. 28 days).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="7"
                  max="90"
                  value={settings.backorderLeadTimeDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, backorderLeadTimeDays: parseInt(e.target.value) || 28 }))}
                  className="w-24 px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-center font-bold text-gray-900 focus:ring-2 focus:ring-emerald-500 shadow-sm"
                />
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Days</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Wholesale Channel (B2B) & RFQ Engine */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-6">
        <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
          <Layers size={20} className="text-blue-600" />
          <div>
            <h3 className="text-lg font-bold text-gray-900">Wholesale Channel (B2B) & Request for Quote (RFQ)</h3>
            <p className="text-xs text-gray-500">Industry-standard B2B quotation workflows, quotation cart isolation, and volume pricing controls.</p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Wholesale enabled toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-200">
            <div>
              <p className="text-sm font-bold text-gray-900">Enable Wholesale Channel</p>
              <p className="text-xs text-gray-500">Activates wholesale catalog views, volume pricing tiers, and commercial quotation flows.</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.wholesaleEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, wholesaleEnabled: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {/* Purchasing Model Radio */}
          <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/40">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              Wholesale Purchasing Model
            </label>
            <p className="text-xs text-gray-500 mb-3">
              Choose how wholesale customers interact with your catalog and finalize commercial purchases.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => setSettings(prev => ({ ...prev, rfqModel: 'RFQ', rfqEnabled: true }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  settings.rfqModel === 'RFQ'
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="rfqModel"
                  checked={settings.rfqModel === 'RFQ'}
                  onChange={() => {}}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">Request for Quote (RFQ) — Recommended</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Customers submit quote requests via a separate Quote Cart; sales admin reviews warehouse stock, sets custom prices, freight, and sends signed offer.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setSettings(prev => ({ ...prev, rfqModel: 'INSTANT' }))}
                className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-start gap-3 ${
                  settings.rfqModel === 'INSTANT'
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="rfqModel"
                  checked={settings.rfqModel === 'INSTANT'}
                  onChange={() => {}}
                  className="mt-1 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <p className="text-sm font-bold text-gray-900">Instant Cart Checkout</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Wholesale buyers checkout immediately with fixed catalog wholesale prices and enforced MOQs without manual sales quotation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RFQ Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-200">
              <div>
                <p className="text-sm font-bold text-gray-900">Allow Guest RFQ Submissions</p>
                <p className="text-xs text-gray-500">Unregistered buyers can request quotes by providing company name & Tax ID.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.rfqAllowGuestSubmissions}
                  onChange={(e) => setSettings(prev => ({ ...prev, rfqAllowGuestSubmissions: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50/70 border border-gray-200">
              <div>
                <p className="text-sm font-bold text-gray-900">Require Account Verification</p>
                <p className="text-xs text-gray-500">Only verified B2B customer accounts can submit quotations.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.wholesaleApprovalRequired}
                  onChange={(e) => setSettings(prev => ({ ...prev, wholesaleApprovalRequired: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>

          {/* Quantitative Rules */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Default Fallback MOQ
              </label>
              <p className="text-[11px] text-gray-500 mb-2">Used when a product has no custom MOQ configured.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="10000"
                  value={settings.wholesaleDefaultMoq}
                  onChange={(e) => setSettings(prev => ({ ...prev, wholesaleDefaultMoq: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-gray-500 uppercase">Units</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Quote Validity Period
              </label>
              <p className="text-[11px] text-gray-500 mb-2">Default validUntil duration set on newly issued quotations.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={settings.rfqDefaultExpiryDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, rfqDefaultExpiryDays: parseInt(e.target.value) || 7 }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-gray-500 uppercase">Days</span>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-white">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Suggested Baseline Discount
              </label>
              <p className="text-[11px] text-gray-500 mb-2">Pre-fills admin quote pricing when catalog wholesale price is blank.</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="90"
                  value={settings.wholesaleDiscountPercent ?? 15.0}
                  onChange={(e) => setSettings(prev => ({ ...prev, wholesaleDiscountPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-xs font-semibold text-gray-500 uppercase">% Off</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between p-4 rounded-2xl bg-white/95 backdrop-blur shadow-lg border border-gray-200">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <HelpCircle size={16} className="text-gray-400" />
          <span>Changes take effect immediately on storefront routing and the admin RFQ pricing workspace.</span>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-7 py-3 rounded-xl text-white font-semibold shadow-md hover:shadow-lg transition disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
        >
          <Save size={18} />
          {saving ? 'Saving Settings...' : 'Save Configuration'}
        </button>
      </div>
    </div>
  )
}
