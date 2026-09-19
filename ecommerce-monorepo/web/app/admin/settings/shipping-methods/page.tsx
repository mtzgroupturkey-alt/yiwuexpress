'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Truck,
  Plane,
  Ship,
  Train,
  ShieldCheck,
  DollarSign,
  Save,
  CheckCircle,
  AlertCircle,
  Clock,
  Globe2,
  ExternalLink,
  Package,
  Layers,
  Settings2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

interface ShippingMethod {
  id: string
  name: string
  code: string
  description: string
  estimatedDays: string
  baseRate: number
  ratePerKg: number
  ratePerCbm?: number
  minWeightKg: number
  maxWeightKg: number
  volumetricDivisor: number
  enabled: boolean
  badge?: string
}

interface GlobalShippingSettings {
  freeShippingThreshold: number
  fuelSurchargePercent: number
  cargoInsurancePercent: number
  defaultOrigin: string
  allowCustomerPickup: boolean
  requireSignatureOnDelivery: boolean
}

export default function ShippingMethodsSettingsPage() {
  const { dict } = useAdminLocale()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const [methods, setMethods] = useState<ShippingMethod[]>([])
  const [globalSettings, setGlobalSettings] = useState<GlobalShippingSettings>({
    freeShippingThreshold: 35.0,
    fuelSurchargePercent: 4.5,
    cargoInsurancePercent: 1.2,
    defaultOrigin: 'China Central Warehouse (Yiwu/Ningbo)',
    allowCustomerPickup: true,
    requireSignatureOnDelivery: true,
  })
  const [activeCountriesCount, setActiveCountriesCount] = useState<number>(0)

  useEffect(() => {
    fetchShippingData()
  }, [])

  const fetchShippingData = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/settings/shipping-methods')
      const json = await res.json()
      if (json.success && json.data) {
        setMethods(json.data.methods || [])
        if (json.data.globalSettings) {
          setGlobalSettings(json.data.globalSettings)
        }
        if (json.data.meta?.activeCountriesCount) {
          setActiveCountriesCount(json.data.meta.activeCountriesCount)
        }
      }
    } catch (err) {
      console.error('Failed to load shipping methods:', err)
      setErrorMsg('Failed to load shipping methods configuration')
    } finally {
      setLoading(false)
    }
  }

  const handleMethodChange = (id: string, field: keyof ShippingMethod, val: any) => {
    setMethods((prev) =>
      prev.map((m) => (m.id === id ? { ...m, [field]: val } : m))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/admin/settings/shipping-methods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          methods,
          globalSettings,
        }),
      })

      const data = await res.json()
      if (res.ok && data.success) {
        setSuccessMsg('Shipping methods and logistics rules saved successfully')
        setTimeout(() => setSuccessMsg(''), 4000)
      } else {
        setErrorMsg(data.error || 'Failed to save shipping methods')
      }
    } catch (err) {
      console.error('Save error:', err)
      setErrorMsg('Network error while saving settings')
    } finally {
      setSaving(false)
    }
  }

  const getMethodIcon = (code: string) => {
    switch (code) {
      case 'EXPRESS_AIR':
        return <Plane className="w-6 h-6 text-amber-500" />
      case 'STANDARD_AIR':
        return <Plane className="w-6 h-6 text-sky-500" />
      case 'SEA_FREIGHT':
        return <Ship className="w-6 h-6 text-blue-600" />
      case 'RAIL_EXPRESS':
        return <Train className="w-6 h-6 text-emerald-600" />
      case 'TRUCK_FREIGHT':
      default:
        return <Truck className="w-6 h-6 text-indigo-600" />
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Breadcrumb & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
            <Link href="/admin/settings" className="hover:text-gray-900 transition-colors">
              {dict.nav.settings || 'Settings'}
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">
              {dict.nav.shippingMethods || 'Shipping Methods'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="w-8 h-8 text-indigo-600" />
            {dict.nav.shippingMethods || 'Shipping Methods'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Configure ocean freight, air express, port tariffs, freight forwarding routes, and automated rate formulas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={handleSave}
            disabled={saving || loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center gap-2 px-5"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </Button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg flex items-center gap-2 text-sm">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-indigo-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Available Channels</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">
                {methods.filter((m) => m.enabled).length} / {methods.length} Active
              </h3>
              <p className="text-xs text-gray-500 mt-1">Air, Ocean, Rail, Road Express</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-xl">
              <Layers className="w-6 h-6 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Free Shipping Threshold</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">
                ${Number(globalSettings.freeShippingThreshold || 0).toFixed(2)}
              </h3>
              <p className="text-xs text-gray-500 mt-1">Free delivery on qualifying orders</p>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-600">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase">Destination Countries</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-0.5">
                {activeCountriesCount} Configured
              </h3>
              <Link
                href="/admin/countries"
                className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1 font-medium"
              >
                Manage Country Tariffs <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Globe2 className="w-6 h-6 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Surcharges & Threshold Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-indigo-600" />
            Global Freight Parameters & Logistics Surcharges
          </CardTitle>
          <CardDescription>
            These baseline policies apply across all multi-currency order calculations and RFQ estimates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Free Shipping Threshold ($ USD)
              </label>
              <Input
                type="number"
                step="0.01"
                value={globalSettings.freeShippingThreshold}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    freeShippingThreshold: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Orders equal or exceeding this value ship free via Standard method.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Fuel Surcharge (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={globalSettings.fuelSurchargePercent}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    fuelSurchargePercent: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Percentage added to variable weight rate to reflect bunker/jet fuel indexes.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Cargo Insurance Rate (%)
              </label>
              <Input
                type="number"
                step="0.1"
                value={globalSettings.cargoInsurancePercent}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    cargoInsurancePercent: parseFloat(e.target.value) || 0,
                  })
                }
              />
              <p className="text-xs text-gray-400 mt-1">
                Optional all-risk transit insurance against loss or damage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Default Origin Consolidation Hub
              </label>
              <Input
                value={globalSettings.defaultOrigin}
                onChange={(e) =>
                  setGlobalSettings({
                    ...globalSettings,
                    defaultOrigin: e.target.value,
                  })
                }
              />
            </div>

            <div className="flex items-center gap-6 pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalSettings.allowCustomerPickup}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      allowCustomerPickup: e.target.checked,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-gray-700">Allow China Warehouse Pickup</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={globalSettings.requireSignatureOnDelivery}
                  onChange={(e) =>
                    setGlobalSettings({
                      ...globalSettings,
                      requireSignatureOnDelivery: e.target.checked,
                    })
                  }
                  className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                />
                <span className="text-xs font-medium text-gray-700">Require Signature on Delivery</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shipping Methods List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <Truck className="w-5 h-5 text-indigo-600" />
          Active Shipping Channels & Forwarder Tariffs
        </h2>

        <div className="space-y-4">
          {methods.map((method) => (
            <Card
              key={method.id}
              className={`transition-all ${
                method.enabled ? 'border-gray-200 shadow-sm' : 'border-dashed border-gray-300 opacity-70 bg-gray-50/50'
              }`}
            >
              <CardContent className="p-5">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-start gap-3">
                    <div className="p-3 bg-gray-100 rounded-xl mt-0.5">
                      {getMethodIcon(method.code)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-bold text-gray-900">{method.name}</h3>
                        {method.badge && (
                          <Badge variant="outline" className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border-indigo-200">
                            {method.badge}
                          </Badge>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            method.enabled
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-gray-100 text-gray-600 border-gray-200'
                          }`}
                        >
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 max-w-xl">{method.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                      <input
                        type="checkbox"
                        checked={method.enabled}
                        onChange={(e) => handleMethodChange(method.id, 'enabled', e.target.checked)}
                        className="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                      />
                      <span className="text-xs font-semibold text-gray-700">
                        {method.enabled ? 'Channel Active' : 'Channel Inactive'}
                      </span>
                    </label>
                  </div>
                </div>

                {/* Tariff Inputs */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Transit SLA</label>
                    <Input
                      className="h-8 text-xs"
                      value={method.estimatedDays}
                      onChange={(e) => handleMethodChange(method.id, 'estimatedDays', e.target.value)}
                      placeholder="e.g. 3-5 days"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Base Docket Fee ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 text-xs font-mono"
                      value={method.baseRate}
                      onChange={(e) =>
                        handleMethodChange(method.id, 'baseRate', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Rate per KG ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      className="h-8 text-xs font-mono"
                      value={method.ratePerKg}
                      onChange={(e) =>
                        handleMethodChange(method.id, 'ratePerKg', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Volumetric Divisor</label>
                    <select
                      className="w-full border border-gray-300 rounded-md h-8 px-2 text-xs bg-white"
                      value={method.volumetricDivisor}
                      onChange={(e) =>
                        handleMethodChange(method.id, 'volumetricDivisor', parseInt(e.target.value) || 5000)
                      }
                    >
                      <option value={5000}>5000 (Express standard)</option>
                      <option value={6000}>6000 (Commercial freight)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Min Weight (KG)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs font-mono"
                      value={method.minWeightKg}
                      onChange={(e) =>
                        handleMethodChange(method.id, 'minWeightKg', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-600 mb-1">Max Weight (KG)</label>
                    <Input
                      type="number"
                      className="h-8 text-xs font-mono"
                      value={method.maxWeightKg}
                      onChange={(e) =>
                        handleMethodChange(method.id, 'maxWeightKg', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t">
        <Link href="/admin/settings">
          <Button variant="outline">Back to Settings Hub</Button>
        </Link>
        <Button
          onClick={handleSave}
          disabled={saving || loading}
          className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Changes...' : 'Save All Settings'}</span>
        </Button>
      </div>
    </div>
  )
}
