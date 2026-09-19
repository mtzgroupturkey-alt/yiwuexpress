'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MapPin, Plus, Edit, Trash2, ArrowLeft, X, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

interface Address {
  id: string
  fullName: string
  phone: string
  label?: string | null
  company?: string | null
  addressLine1: string
  addressLine2?: string | null
  city: string
  state?: string | null
  postalCode: string
  country: string
  isDefault: boolean
}

interface AddressFormData {
  fullName: string
  phone: string
  label: string
  company: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

const INITIAL_FORM: AddressFormData = {
  fullName: '',
  phone: '',
  label: '',
  company: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  isDefault: false,
}

const COUNTRIES = [
  { code: 'AF', name: 'Afghanistan' },
  { code: 'AL', name: 'Albania' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'AR', name: 'Argentina' },
  { code: 'AU', name: 'Australia' },
  { code: 'AT', name: 'Austria' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'BY', name: 'Belarus' },
  { code: 'BE', name: 'Belgium' },
  { code: 'BR', name: 'Brazil' },
  { code: 'BG', name: 'Bulgaria' },
  { code: 'CA', name: 'Canada' },
  { code: 'CL', name: 'Chile' },
  { code: 'CN', name: 'China' },
  { code: 'CO', name: 'Colombia' },
  { code: 'HR', name: 'Croatia' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'DK', name: 'Denmark' },
  { code: 'EG', name: 'Egypt' },
  { code: 'EE', name: 'Estonia' },
  { code: 'FI', name: 'Finland' },
  { code: 'FR', name: 'France' },
  { code: 'GE', name: 'Georgia' },
  { code: 'DE', name: 'Germany' },
  { code: 'GR', name: 'Greece' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'HU', name: 'Hungary' },
  { code: 'IN', name: 'India' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'IE', name: 'Ireland' },
  { code: 'IL', name: 'Israel' },
  { code: 'IT', name: 'Italy' },
  { code: 'JP', name: 'Japan' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'KE', name: 'Kenya' },
  { code: 'KR', name: 'South Korea' },
  { code: 'KW', name: 'Kuwait' },
  { code: 'LV', name: 'Latvia' },
  { code: 'LT', name: 'Lithuania' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'MX', name: 'Mexico' },
  { code: 'MA', name: 'Morocco' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'NO', name: 'Norway' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'PH', name: 'Philippines' },
  { code: 'PL', name: 'Poland' },
  { code: 'PT', name: 'Portugal' },
  { code: 'QA', name: 'Qatar' },
  { code: 'RO', name: 'Romania' },
  { code: 'RU', name: 'Russia' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'RS', name: 'Serbia' },
  { code: 'SG', name: 'Singapore' },
  { code: 'SK', name: 'Slovakia' },
  { code: 'SI', name: 'Slovenia' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'ES', name: 'Spain' },
  { code: 'SE', name: 'Sweden' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'TW', name: 'Taiwan' },
  { code: 'TJ', name: 'Tajikistan' },
  { code: 'TH', name: 'Thailand' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'TR', name: 'Turkey' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'UA', name: 'Ukraine' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'US', name: 'United States' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'VN', name: 'Vietnam' },
]

function countryName(code: string) {
  return COUNTRIES.find((c) => c.code === code)?.name || code
}

export default function AddressesPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading: authLoading, isInitialized } = useAuth()
  const t = useTranslations('DashboardPages')
  const ta = useTranslations('DashboardPages.addresses')

  const [addresses, setAddresses] = useState<Address[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [settingDefault, setSettingDefault] = useState<string | null>(null)

  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<AddressFormData>(INITIAL_FORM)

  // Auth guard
  useEffect(() => {
    if (isInitialized && !authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/addresses')
    }
  }, [isInitialized, authLoading, isAuthenticated, router])

  // Load addresses from API
  const loadAddresses = useCallback(async () => {
    try {
      setListLoading(true)
      const res = await fetch('/api/addresses', { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      setAddresses(data.data || [])
    } catch (err) {
      console.error('Error loading addresses:', err)
    } finally {
      setListLoading(false)
    }
  }, [])

  useEffect(() => {
    if (isInitialized && isAuthenticated) {
      loadAddresses()
    }
  }, [isInitialized, isAuthenticated, loadAddresses])

  const resetForm = () => {
    setFormData(INITIAL_FORM)
    setIsAdding(false)
    setEditingId(null)
  }

  const handleEdit = (address: Address) => {
    setFormData({
      fullName: address.fullName,
      phone: address.phone,
      label: address.label || '',
      company: address.company || '',
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })
    setEditingId(address.id)
    setIsAdding(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...formData,
        ...(editingId ? { id: editingId } : {}),
      }
      const res = await fetch('/api/addresses', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        toast.error(err.error || 'Failed to save address')
        return
      }
      toast.success(editingId ? ta('toastUpdated') : ta('toastAdded'))
      resetForm()
      await loadAddresses()
      // Notify header to refresh delivery address list
      window.dispatchEvent(new CustomEvent('addresses-updated'))
    } catch (err) {
      console.error('Error saving address:', err)
      toast.error('Failed to save address')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm(ta('deleteConfirm'))) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/addresses?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!res.ok) {
        toast.error('Failed to delete address')
        return
      }
      toast.success(ta('toastDeleted'))
      await loadAddresses()
      window.dispatchEvent(new CustomEvent('addresses-updated'))
    } catch (err) {
      console.error('Error deleting address:', err)
      toast.error('Failed to delete address')
    } finally {
      setDeleting(null)
    }
  }

  const handleSetDefault = async (id: string) => {
    const addr = addresses.find((a) => a.id === id)
    if (!addr) return
    setSettingDefault(id)
    try {
      const res = await fetch('/api/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id,
          fullName: addr.fullName,
          phone: addr.phone,
          addressLine1: addr.addressLine1,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          isDefault: true,
        }),
      })
      if (!res.ok) {
        toast.error('Failed to update default address')
        return
      }
      toast.success(ta('toastDefaultUpdated'))
      await loadAddresses()
      window.dispatchEvent(new CustomEvent('addresses-updated'))
    } catch (err) {
      console.error('Error setting default:', err)
      toast.error('Failed to update default address')
    } finally {
      setSettingDefault(null)
    }
  }

  if (!isInitialized || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">{t('loadingAddresses')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-[#1a3a5c]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a3a5c]">{ta('title')}</h1>
          </div>
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="flex items-center gap-2 px-4 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors"
            >
              <Plus className="w-4 h-4" />
              {ta('addAddress')}
            </button>
          )}
        </div>
      </div>

      <div>
        {/* Add/Edit Form */}
        {isAdding && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editingId ? ta('editAddress') : ta('addNewAddress')}
              </h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ta('fullName')}</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ta('phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ta('addressLine1')}</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData((p) => ({ ...p, addressLine1: e.target.value }))}
                  required
                  placeholder={ta('addressLine1Placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{ta('addressLine2')}</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData((p) => ({ ...p, addressLine2: e.target.value }))}
                  placeholder={ta('addressLine2Placeholder')}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ta('city')}</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ta('state')}</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ta('postalCode')}</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData((p) => ({ ...p, postalCode: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{ta('country')}</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a3a5c]"
                  >
                    <option value="">{ta('selectCountry')}</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-[#1a3a5c] border-gray-300 rounded focus:ring-[#1a3a5c]"
                />
                <label htmlFor="isDefault" className="text-sm text-gray-700">
                  {ta('setAsDefault')}
                </label>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  {editingId ? ta('updateAddress') : ta('saveAddress')}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {ta('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Addresses List */}
        {listLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                <div className="space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{ta('noAddresses')}</h3>
            <p className="text-gray-500 mb-6">{ta('noAddressesDesc')}</p>
            <button
              onClick={() => setIsAdding(true)}
              className="px-6 py-2 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors"
            >
              {ta('addFirstAddress')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-xl shadow-sm border p-6 ${
                  address.isDefault ? 'border-[#1a3a5c]' : 'border-gray-100'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#1a3a5c]" />
                    <span className="font-medium text-gray-900">{address.fullName}</span>
                    {address.label && (
                      <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                        {address.label}
                      </span>
                    )}
                  </div>
                  {address.isDefault && (
                    <span className="px-2 py-1 bg-[#1a3a5c] text-white text-xs rounded-full">
                      {ta('default')}
                    </span>
                  )}
                </div>

                <div className="text-sm text-gray-600 space-y-1 mb-4">
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {address.city}
                    {address.state ? `, ${address.state}` : ''} {address.postalCode}
                  </p>
                  <p>{countryName(address.country)}</p>
                  <p className="text-gray-500">{address.phone}</p>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-[#1a3a5c] hover:bg-gray-50 rounded transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    {ta('edit')}
                  </button>

                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={settingDefault === address.id}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-600 hover:bg-green-50 rounded transition-colors disabled:opacity-50"
                    >
                      {settingDefault === address.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      {ta('setDefault')}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={deleting === address.id}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                  >
                    {deleting === address.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {ta('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
