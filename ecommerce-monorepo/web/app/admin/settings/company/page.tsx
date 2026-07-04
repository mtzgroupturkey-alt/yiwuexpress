'use client'

import { useEffect, useState } from 'react'
import {
  Building2, Mail, Phone, Globe, FileText, Save,
  MapPin, Hash, Palette, AlertCircle, CheckCircle, Upload, RefreshCw
} from 'lucide-react'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

interface CompanySettings {
  id?: string
  companyName: string
  companyAddress: string
  companyPhone: string
  companyEmail: string
  companyWebsite: string
  businessLicense: string
  taxRegistrationNumber: string
  companyDescription: string
  companyLogo: string
  companyLogoHeight: number
  companyFavicon: string
  primaryColor: string
  accentColor: string
  currency: string
  timezone: string
  language: string
}

export default function CompanyInfoPage() {
  const { isAdmin, loading: authLoading } = useAdminAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const [settings, setSettings] = useState<CompanySettings>({
    companyName: 'YIWU EXPRESS',
    companyAddress: '',
    companyPhone: '',
    companyEmail: '',
    companyWebsite: '',
    businessLicense: '',
    taxRegistrationNumber: '',
    companyDescription: '',
    companyLogo: '',
    companyLogoHeight: 40,
    companyFavicon: '',
    primaryColor: '#1a3a5c',
    accentColor: '#c9a84c',
    currency: 'USD',
    timezone: 'Asia/Shanghai',
    language: 'en',
  })

  // Helper function to safely convert null to empty string
  const safeString = (value: string | null | undefined): string => {
    return value || ''
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

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchSettings()
    }
  }, [authLoading, isAdmin])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/settings/company', {
        credentials: 'include',
      })

      const data = await response.json()

      if (response.ok) {
        if (data.settings) {
          // Ensure all string fields are never null
          setSettings({
            ...data.settings,
            companyName: safeString(data.settings.companyName) || 'YIWU EXPRESS',
            companyAddress: safeString(data.settings.companyAddress),
            companyPhone: safeString(data.settings.companyPhone),
            companyEmail: safeString(data.settings.companyEmail),
            companyWebsite: safeString(data.settings.companyWebsite),
            businessLicense: safeString(data.settings.businessLicense),
            taxRegistrationNumber: safeString(data.settings.taxRegistrationNumber),
            companyDescription: safeString(data.settings.companyDescription),
            companyLogo: safeString(data.settings.companyLogo),
            companyFavicon: safeString(data.settings.companyFavicon),
            primaryColor: safeString(data.settings.primaryColor) || '#1a3a5c',
            accentColor: safeString(data.settings.accentColor) || '#c9a84c',
            currency: safeString(data.settings.currency) || 'USD',
            timezone: safeString(data.settings.timezone) || 'Asia/Shanghai',
            language: safeString(data.settings.language) || 'en',
          })
        }
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      const response = await fetch('/api/admin/settings/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess('Company information updated successfully!')
        // Force reload settings from server to ensure consistency
        await fetchSettings()
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

  const handleInputChange = (field: keyof CompanySettings, value: string | number) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        handleInputChange('companyLogo', data.url)
        setSuccess('Logo uploaded successfully!')
        setTimeout(() => setSuccess(''), 3000)
      } else {
        setError(data.error || 'Failed to upload logo')
      }
    } catch (err) {
      setError('Logo upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type for favicon
    const validTypes = ['image/x-icon', 'image/vnd.microsoft.icon', 'image/png', 'image/svg+xml']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid favicon file (.ico, .png, or .svg)')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'favicon')

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        // Update the favicon field in the form
        handleInputChange('companyFavicon', data.url)
        setSuccess('Favicon uploaded successfully! Don\'t forget to save changes.')
        setTimeout(() => setSuccess(''), 5000)
      } else {
        setError(data.error || 'Failed to upload favicon')
      }
    } catch (err) {
      setError('Favicon upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">Loading company settings...</p>
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
            <Building2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Company Information</h2>
            <p className="text-sm text-gray-500">Manage your business details and branding</p>
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={18} className="text-gray-600" />
            Basic Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Name</label>
              <input
                type="text"
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
              <div className="relative">
                <Globe size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="url"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  placeholder="https://yiwuexpress.com"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-3 top-3 text-gray-400" />
                <textarea
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.companyAddress}
                  onChange={(e) => handleInputChange('companyAddress', e.target.value)}
                  placeholder="Enter complete company address"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="tel"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.companyPhone}
                  onChange={(e) => handleInputChange('companyPhone', e.target.value)}
                  placeholder="+86 579 8555 1234"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="email"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.companyEmail}
                  onChange={(e) => handleInputChange('companyEmail', e.target.value)}
                  placeholder="info@yiwuexpress.com"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Description</label>
              <textarea
                rows={4}
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.companyDescription}
                onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                placeholder="Brief description of your company and services..."
              />
            </div>
          </div>
        </div>

        {/* Legal Information */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText size={18} className="text-gray-600" />
            Legal Information
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Business License Number</label>
              <div className="relative">
                <Hash size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.businessLicense}
                  onChange={(e) => handleInputChange('businessLicense', e.target.value)}
                  placeholder="Enter business license number"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tax Registration Number</label>
              <div className="relative">
                <Hash size={18} className="absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.taxRegistrationNumber}
                  onChange={(e) => handleInputChange('taxRegistrationNumber', e.target.value)}
                  placeholder="Enter tax registration number"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Branding & Preferences */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Palette size={18} className="text-gray-600" />
            Branding & Preferences
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                  value={settings.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Accent Color</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  className="w-12 h-10 border border-gray-200 rounded-lg cursor-pointer"
                  value={settings.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                />
                <input
                  type="text"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={settings.accentColor}
                  onChange={(e) => handleInputChange('accentColor', e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Currency</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="CNY">CNY - Chinese Yuan</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.timezone}
                onChange={(e) => handleInputChange('timezone', e.target.value)}
              >
                <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
                <option value="UTC">UTC (GMT+0)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
                <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="zh">Chinese (Simplified)</option>
                <option value="zh-tw">Chinese (Traditional)</option>
                <option value="ru">Russian</option>
                <option value="ar">Arabic</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Company Logo</label>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {settings.companyLogo && (
                  <div className="relative w-20 h-20 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                    <img
                      src={settings.companyLogo}
                      alt="Company Logo Preview"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl cursor-pointer shadow-sm transition-colors">
                      <Upload size={16} />
                      {uploading ? 'Uploading...' : 'Upload Logo'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {settings.companyLogo && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('companyLogo', '')}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Supports PNG, JPG, JPEG or SVG. Max 2MB.</p>
                  
                  <div className="pt-2">
                    <span className="text-xs text-gray-400 block mb-1">Or enter Logo URL manually:</span>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={settings.companyLogo}
                      onChange={(e) => handleInputChange('companyLogo', e.target.value)}
                      placeholder="https://example.com/logo.png"
                    />
                  </div>
                </div>
              </div>
              
              {/* Logo Height Setting */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo Height (pixels)
                </label>
                <input
                  type="number"
                  min="20"
                  max="100"
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  value={settings.companyLogoHeight}
                  onChange={(e) => handleInputChange('companyLogoHeight', parseInt(e.target.value) || 40)}
                  placeholder="40"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 30-50px. Current: {settings.companyLogoHeight}px
                </p>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">Website Favicon</label>
              <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                {settings.companyFavicon && (
                  <div className="flex flex-col items-center gap-2">
                    <div className="relative w-16 h-16 border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex items-center justify-center p-2">
                      <img
                        src={settings.companyFavicon}
                        alt="Favicon Preview"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <div className="w-4 h-4 border border-gray-200 rounded overflow-hidden bg-white flex items-center justify-center">
                        <img
                          src={settings.companyFavicon}
                          alt="Small Favicon Preview"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span>16x16 preview</span>
                    </div>
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium rounded-xl cursor-pointer shadow-sm transition-colors">
                      <Upload size={16} />
                      {uploading ? 'Uploading...' : 'Upload Favicon'}
                      <input
                        type="file"
                        accept=".ico,.png,.svg,image/x-icon,image/vnd.microsoft.icon,image/png,image/svg+xml"
                        onChange={handleFaviconUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                    {settings.companyFavicon && (
                      <button
                        type="button"
                        onClick={() => handleInputChange('companyFavicon', '')}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-700 font-medium"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">Supports ICO, PNG, or SVG. Recommended size: 32x32px or 16x16px. Max 1MB.</p>
                  
                  <div className="pt-2">
                    <span className="text-xs text-gray-400 block mb-1">Or enter Favicon URL manually:</span>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      value={settings.companyFavicon}
                      onChange={(e) => handleInputChange('companyFavicon', e.target.value)}
                      placeholder="https://example.com/favicon.ico"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
          >
            <Save size={18} />
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}