'use client'

import { useEffect, useState } from 'react'
import {
  Settings, Save, AlertCircle, CheckCircle, RefreshCw, Store, ShoppingBag, Users
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

interface GeneralSettings {
  storeMode: 'WHOLESALE' | 'RETAIL' | 'BOTH'
}

const STORE_MODES = [
  {
    value: 'WHOLESALE',
    label: 'Wholesale Only (B2B)',
    description: 'Business-to-business model with wholesale pricing, MOQ requirements, and company fields',
    icon: Store,
    features: [
      'Wholesale pricing displayed',
      'Minimum order quantity (MOQ) enforced',
      'Company/registration fields at checkout',
      'Tax exemption options available',
      'Guest checkout allowed'
    ]
  },
  {
    value: 'RETAIL',
    label: 'Retail Only (B2C)',
    description: 'Business-to-consumer model with retail pricing and simple checkout',
    icon: ShoppingBag,
    features: [
      'Consumer pricing (MSRP)',
      'No MOQ requirements',
      'Simple checkout with shipping address',
      'Standard tax calculation',
      'Customer account optional'
    ]
  },
  {
    value: 'BOTH',
    label: 'Both (Hybrid)',
    description: 'Support both B2B and B2C with flexible pricing and checkout flows',
    icon: Users,
    features: [
      'Both pricing tiers visible',
      'User can switch between modes',
      'Different checkout flows based on selection',
      'Maximum flexibility for customers',
      'Supports all pricing strategies'
    ]
  }
]

export default function GeneralSettingsPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [settings, setSettings] = useState<GeneralSettings>({
    storeMode: 'WHOLESALE'
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

      if (response.ok) {
        setSettings({
          storeMode: data.storeMode || 'WHOLESALE'
        })
        setError('')
      } else {
        setError(data.error || 'Failed to load settings')
      }
    } catch (err) {
      setError('Network error')
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
        body: JSON.stringify({
          storeMode: settings.storeMode
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Store mode updated successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to update settings')
      }
    } catch (err) {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  // Show loading state while auth is loading
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

  // Redirect handled by AdminAuthContext
  if (!isAdmin) {
    return null
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Loading general settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <Settings size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">General Settings</h2>
            <p className="text-sm text-gray-500">Configure your store mode and general preferences</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            setLoading(true)
            fetchSettings()
          }}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-100">
          <AlertCircle size={20} className="text-red-500" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-100">
          <CheckCircle size={20} className="text-emerald-500" />
          <span className="text-emerald-700">{success}</span>
        </div>
      )}

      {/* Store Mode Selection */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Store Mode</h3>
        <p className="text-sm text-gray-600 mb-6">
          Select how your e-commerce platform should operate. This setting affects pricing display, checkout flow, and minimum order requirements.
        </p>
        
        <div className="space-y-4">
          {STORE_MODES.map((mode) => {
            const Icon = mode.icon
            const isSelected = settings.storeMode === mode.value
            
            return (
              <div
                key={mode.value}
                onClick={() => setSettings({ storeMode: mode.value as 'WHOLESALE' | 'RETAIL' | 'BOTH' })}
                className={`relative p-5 rounded-xl border-2 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 shadow-md'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
              >
                {/* Selection Indicator */}
                {isSelected && (
                  <div className="absolute top-4 right-4">
                    <div className="bg-blue-500 rounded-full p-1">
                      <CheckCircle size={16} className="text-white" />
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg ${
                    isSelected ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    <Icon size={24} className={isSelected ? 'text-blue-600' : 'text-gray-600'} />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-base font-bold text-gray-900 mb-1">{mode.label}</h4>
                    <p className="text-sm text-gray-600 mb-3">{mode.description}</p>
                    
                    {/* Features List */}
                    <div className="space-y-1.5">
                      {mode.features.map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            isSelected ? 'bg-blue-500' : 'bg-gray-400'
                          }`} />
                          <span className="text-xs text-gray-700">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-900 mb-1">Important Note</p>
              <p className="text-sm text-blue-700">
                Changing the store mode will affect how products are displayed and how checkout works. 
                {settings.storeMode === 'WHOLESALE' && ' Currently in Wholesale mode: MOQ requirements are enforced and wholesale pricing is displayed.'}
                {settings.storeMode === 'RETAIL' && ' Currently in Retail mode: No MOQ requirements and retail pricing is displayed.'}
                {settings.storeMode === 'BOTH' && ' Currently in Hybrid mode: Both pricing options are available to customers.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
