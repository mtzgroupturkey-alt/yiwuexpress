'use client'

import { useEffect, useState } from 'react'
import {
  MapPin, Phone, Mail, Clock, Plus, Pencil, Trash2, Save, X,
  Building2, Building, AlertCircle, CheckCircle, RefreshCw, ArrowUpDown
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'

interface ContactLocation {
  id: string
  type: string
  city: string
  address: string | null
  phone: string | null
  email: string | null
  hours: string | null
  sortOrder: number
  isActive: boolean
  translations?: Array<{ locale: string; city: string; address?: string | null; hours?: string | null }>
}

const emptyForm = {
  type: 'HUB',
  city: '',
  address: '',
  phone: '',
  email: '',
  hours: '',
  sortOrder: 0,
  isActive: true,
}

export default function ContactLocationsPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [locations, setLocations] = useState<ContactLocation[]>([])
  const [editing, setEditing] = useState<ContactLocation | null>(null)
  const [form, setForm] = useState({ ...emptyForm })
  const [translations, setTranslations] = useState<Record<string, { city: string; address: string; hours: string }>>({})
  const [showForm, setShowForm] = useState(false)

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

  if (!isAdmin) return null

  const fetchLocations = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/contact-locations?includeInactive=true', { credentials: 'include' })
      const data = await res.json()
      if (res.ok) {
        setLocations(data.data || [])
        setError('')
      } else {
        setError(data.error || 'Failed to load locations')
      }
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!authLoading && isAdmin) fetchLocations()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAdmin])

  const openCreate = () => {
    setEditing(null)
    setForm({ ...emptyForm, sortOrder: locations.length })
    setTranslations({})
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const openEdit = (loc: ContactLocation) => {
    setEditing(loc)
    setForm({
      type: loc.type,
      city: loc.city,
      address: loc.address || '',
      phone: loc.phone || '',
      email: loc.email || '',
      hours: loc.hours || '',
      sortOrder: loc.sortOrder,
      isActive: loc.isActive,
    })
    const tr: Record<string, { city: string; address: string; hours: string }> = {}
    ;(loc.translations || []).forEach((t: any) => {
      tr[t.locale] = { city: t.city || '', address: t.address || '', hours: t.hours || '' }
    })
    setTranslations(tr)
    setShowForm(true)
    setError('')
    setSuccess('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const isEdit = !!editing
      const res = await fetch(
        isEdit ? `/api/admin/contact-locations/${editing!.id}` : '/api/admin/contact-locations',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            ...form,
            translations: ['ru', 'zh']
              .filter((l) => translations[l]?.city?.trim() || translations[l]?.address?.trim() || translations[l]?.hours?.trim())
              .map((l) => ({
                locale: l,
                city: translations[l].city?.trim() || '',
                address: translations[l].address?.trim() || '',
                hours: translations[l].hours?.trim() || '',
              })),
          }),
        }
      )
      const data = await res.json()
      if (res.ok) {
        setSuccess(isEdit ? 'Location updated successfully!' : 'Location created successfully!')
        setShowForm(false)
        setEditing(null)
        await fetchLocations()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to save location')
      }
    } catch {
      setError('Network error')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this location? This cannot be undone.')) return
    try {
      const res = await fetch(`/api/admin/contact-locations/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (res.ok) {
        setSuccess('Location deleted.')
        await fetchLocations()
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError('Failed to delete location')
      }
    } catch {
      setError('Network error')
    }
  }

  const handleInput = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const updateTranslation = (locale: string, field: 'city' | 'address' | 'hours', value: string) => {
    setTranslations((prev) => ({
      ...prev,
      [locale]: { city: prev[locale]?.city || '', address: prev[locale]?.address || '', hours: prev[locale]?.hours || '', [field]: value },
    }))
  }

  const typeBadge = (type: string) =>
    type === 'HEADQUARTERS'
      ? 'bg-blue-100 text-blue-700'
      : 'bg-amber-100 text-amber-700'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600">
            <MapPin size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Contact Locations</h2>
            <p className="text-sm text-gray-500">Manage headquarters and logistics hubs shown on the contact page</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchLocations}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-xl"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
          >
            <Plus size={16} />
            Add Location
          </button>
        </div>
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

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              {editing ? 'Edit Location' : 'New Location'}
            </h3>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.type}
                onChange={(e) => handleInput('type', e.target.value)}
              >
                <option value="HEADQUARTERS">Headquarters</option>
                <option value="HUB">Logistics Hub</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City / Office Name *</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.city}
                onChange={(e) => handleInput('city', e.target.value)}
                placeholder="e.g. China Headquarters"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
              <textarea
                rows={2}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.address}
                onChange={(e) => handleInput('address', e.target.value)}
                placeholder="Full street address"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.phone}
                onChange={(e) => handleInput('phone', e.target.value)}
                placeholder="+86 579 8555 1234"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.email}
                onChange={(e) => handleInput('email', e.target.value)}
                placeholder="office@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.hours}
                onChange={(e) => handleInput('hours', e.target.value)}
                placeholder="Mon - Sat: 9:00 AM - 6:00 PM"
              />
            </div>

            {/* Translations (RU / ZH) */}
            <div className="md:col-span-2 border border-dashed border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-600">Translations (optional)</p>
                <AutoTranslateButton
                  enFields={{ city: form.city, address: form.address, hours: form.hours }}
                  onTranslated={(result) => {
                    setTranslations((prev) => {
                      const next = { ...prev }
                      for (const locale of Object.keys(result)) {
                        next[locale] = {
                          city: result[locale].city || prev[locale]?.city || '',
                          address: result[locale].address || prev[locale]?.address || '',
                          hours: result[locale].hours || prev[locale]?.hours || '',
                        }
                      }
                      return next
                    })
                  }}
                />
              </div>
              {(['ru', 'zh'] as const).map((locale) => (
                <div key={locale} className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">{locale}</p>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    value={translations[locale]?.city || ''}
                    onChange={(e) => updateTranslation(locale, 'city', e.target.value)}
                    placeholder="City / Office name"
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    value={translations[locale]?.address || ''}
                    onChange={(e) => updateTranslation(locale, 'address', e.target.value)}
                    placeholder="Address"
                  />
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl"
                    value={translations[locale]?.hours || ''}
                    onChange={(e) => updateTranslation(locale, 'hours', e.target.value)}
                    placeholder="Working hours"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Sort Order</label>
              <input
                type="number"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={form.sortOrder}
                onChange={(e) => handleInput('sortOrder', parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.isActive}
                onChange={(e) => handleInput('isActive', e.target.checked)}
                className="w-4 h-4"
              />
              <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active (visible on contact page)</label>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2.5 rounded-xl text-gray-600 border border-gray-300 hover:bg-gray-50 text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white font-medium hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
            >
              <Save size={16} />
              {saving ? 'Saving...' : 'Save Location'}
            </button>
          </div>
        </form>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
        </div>
      ) : locations.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <MapPin size={40} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No contact locations yet. Click &quot;Add Location&quot; to create one.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {locations.map((loc) => (
            <div key={loc.id} className={`bg-white rounded-2xl p-6 shadow-sm border ${loc.isActive ? 'border-gray-100' : 'border-gray-200 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${typeBadge(loc.type)}`}>
                    {loc.type === 'HEADQUARTERS' ? <Building2 size={12} /> : <Building size={12} />}
                    {loc.type === 'HEADQUARTERS' ? 'HQ' : 'Hub'}
                  </span>
                  {!loc.isActive && <span className="text-xs text-gray-400">(hidden)</span>}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(loc)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(loc.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900 mt-3">{loc.city}</h3>

              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {loc.address && (
                  <div className="flex items-start gap-2">
                    <MapPin size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                    <span>{loc.address}</span>
                  </div>
                )}
                {loc.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{loc.phone}</span>
                  </div>
                )}
                {loc.email && (
                  <div className="flex items-center gap-2">
                    <Mail size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{loc.email}</span>
                  </div>
                )}
                {loc.hours && (
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                    <span>{loc.hours}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
