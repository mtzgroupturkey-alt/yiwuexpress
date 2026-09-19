'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MapPin, Plus, Edit, Trash2, X, Check, Loader2 } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/design-system/Container'

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
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#00407a' }}></div>
          <p className="text-xs text-slate-500 font-medium">{t('loadingAddresses')}</p>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-6 sm:py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <MapPin className="w-5 h-5 text-[#00407a]" />
            {ta('title')}
            {addresses.length > 0 && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#00407a] border border-blue-200">
                {addresses.length}
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage your verified shipping destinations and customs delivery addresses
          </p>
        </div>

        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#00407a] hover:bg-[#003366] text-white rounded-xl font-bold text-xs shadow-2xs transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            {ta('addAddress')}
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div>
        {/* Add/Edit Form */}
        {isAdding && (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-5 sm:p-6 mb-6">
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
              <h2 className="text-base font-black text-slate-900 tracking-tight">
                {editingId ? ta('editAddress') : ta('addNewAddress')}
              </h2>
              <button
                onClick={resetForm}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('fullName')}</label>
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData((p) => ({ ...p, fullName: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('phone')}</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData((p) => ({ ...p, phone: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('addressLine1')}</label>
                <input
                  type="text"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData((p) => ({ ...p, addressLine1: e.target.value }))}
                  required
                  placeholder={ta('addressLine1Placeholder')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('addressLine2')}</label>
                <input
                  type="text"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData((p) => ({ ...p, addressLine2: e.target.value }))}
                  placeholder={ta('addressLine2Placeholder')}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('city')}</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData((p) => ({ ...p, city: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('state')}</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData((p) => ({ ...p, state: e.target.value }))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('postalCode')}</label>
                  <input
                    type="text"
                    value={formData.postalCode}
                    onChange={(e) => setFormData((p) => ({ ...p, postalCode: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">{ta('country')}</label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData((p) => ({ ...p, country: e.target.value }))}
                    required
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all bg-white"
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

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData((p) => ({ ...p, isDefault: e.target.checked }))}
                  className="w-4 h-4 text-[#00407a] border-slate-300 rounded focus:ring-[#00407a] cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-xs font-bold text-slate-700 cursor-pointer">
                  {ta('setAsDefault')}
                </label>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00407a] text-white rounded-xl font-bold text-xs hover:bg-[#003366] transition-colors disabled:opacity-60 shadow-2xs cursor-pointer"
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
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  {ta('cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Address Cards List */}
        {listLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="animate-pulse bg-white rounded-2xl p-6 border border-slate-200/80 shadow-2xs space-y-3">
                <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
              <MapPin className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">{ta('noAddresses')}</h3>
            <p className="text-xs text-slate-500 mb-5 max-w-sm">{ta('noAddressesDesc')}</p>
            <button
              onClick={() => setIsAdding(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#00407a] text-white font-bold text-xs rounded-xl hover:bg-[#003366] transition-colors shadow-2xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {ta('addFirstAddress')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {addresses.map((address) => (
              <div
                key={address.id}
                className={`bg-white rounded-2xl shadow-2xs border p-5 sm:p-6 transition-all duration-200 ${
                  address.isDefault
                    ? 'border-[#00407a] ring-1 ring-[#00407a]/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#00407a] flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-sm text-slate-900">{address.fullName}</span>
                      {address.label && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                          {address.label}
                        </span>
                      )}
                    </div>
                  </div>
                  {address.isDefault && (
                    <span className="px-2.5 py-0.5 bg-[#00407a] text-white text-[10px] font-extrabold rounded-full uppercase tracking-wider shadow-2xs">
                      {ta('default')}
                    </span>
                  )}
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-4 pl-10">
                  <p className="font-medium text-slate-800">{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  <p>
                    {address.city}
                    {address.state ? `, ${address.state}` : ''} {address.postalCode}
                  </p>
                  <p className="font-semibold text-slate-700">{countryName(address.country)}</p>
                  <p className="text-slate-400 font-mono text-[11px] pt-0.5">{address.phone}</p>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-slate-100 pl-10">
                  <button
                    onClick={() => handleEdit(address)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-[#00407a] hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    {ta('edit')}
                  </button>

                  {!address.isDefault && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      disabled={settingDefault === address.id}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {settingDefault === address.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                      {ta('setDefault')}
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(address.id)}
                    disabled={deleting === address.id}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 ml-auto cursor-pointer"
                  >
                    {deleting === address.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    {ta('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}
