'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { User, Mail, Phone, Globe, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useTranslations, useLocale } from 'next-intl'
import { Container } from '@/components/design-system/Container'

const COUNTRY_CODES = ['AF', 'AL', 'DZ', 'AR', 'AU', 'AT', 'AZ', 'BD', 'BY', 'BE', 'BR', 'BG', 'CA', 'CL', 'CN', 'CO', 'HR', 'CZ', 'DK', 'EG', 'EE', 'FI', 'FR', 'GE', 'DE', 'GR', 'HK', 'HU', 'IN', 'ID', 'IR', 'IQ', 'IE', 'IL', 'IT', 'JP', 'KZ', 'KE', 'KR', 'KW', 'LV', 'LT', 'MY', 'MX', 'MA', 'NL', 'NZ', 'NG', 'NO', 'PK', 'PH', 'PL', 'PT', 'QA', 'RO', 'RU', 'SA', 'RS', 'SG', 'SK', 'SI', 'ZA', 'ES', 'SE', 'CH', 'TW', 'TJ', 'TH', 'TN', 'TR', 'TM', 'UA', 'AE', 'GB', 'US', 'UZ', 'VN']

export default function ProfilePage() {
  const t = useTranslations('DashboardPages')
  const tp = useTranslations('DashboardPages.profile')
  const locale = useLocale()
  const regionNames = new Intl.DisplayNames([locale === 'zh' ? 'zh-CN' : locale], { type: 'region' })
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, isInitialized, updateUser } = useAuth()
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    country: '',
    profilePhoto: '',
  })

  useEffect(() => {
    if (isInitialized && !authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/profile')
    }
  }, [isInitialized, authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        country: user.country || '',
        profilePhoto: (user as any).profilePhoto || '',
      })
      setPhotoPreview((user as any).profilePhoto || null)
    }
  }, [user])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(tp('photoNotImage'))
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(tp('photoTooLarge'))
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload photo
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      // You can implement actual file upload to your server/storage here
      // For now, we'll use the base64 preview
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })

      setFormData(prev => ({ ...prev, profilePhoto: base64 }))
      toast.success(tp('photoUploaded'))
    } catch (error) {
      toast.error(tp('photoUploadFailed'))
      setPhotoPreview((user as any).profilePhoto || null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview(null)
    setFormData(prev => ({ ...prev, profilePhoto: '' }))
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    
    try {
      const response = await api.put('/api/auth/me', formData)
      if (response.user) {
        updateUser(response.user)
      }
      setSuccess(true)
      toast.success(tp('profileUpdated'))
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      toast.error(tp('profileUpdateFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#00407a' }}></div>
          <p className="text-xs text-slate-500 font-medium">{t('loadingProfile')}</p>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-6 sm:py-8 space-y-6">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <User className="w-5 h-5 text-[#00407a]" />
            {tp('title')}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {tp('description')}
          </p>
        </div>

        <div>
          {/* Profile Card */}
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6 sm:p-8 mb-6">
            {/* Avatar Section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8 pb-6 border-b border-slate-100">
              {/* Avatar Display */}
              <div className="relative group shrink-0">
                {photoPreview ? (
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-white ring-2 ring-[#00407a]/20 shadow-xs">
                    <img 
                      src={photoPreview} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                    {uploadingPhoto && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#00407a] to-[#003366] flex items-center justify-center border-2 border-white ring-2 ring-[#00407a]/20 shadow-xs text-white">
                    <span className="text-3xl font-black">{user?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  </div>
                )}
                
                {/* Upload Button Overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="absolute inset-0 rounded-2xl bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                >
                  <div className="text-white text-center">
                    <svg className="w-6 h-6 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-[11px] font-bold">
                      {uploadingPhoto ? tp('uploading') : tp('change')}
                    </span>
                  </div>
                </button>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              
              {/* User Info and Photo Actions */}
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">{user?.name}</h2>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full uppercase tracking-wider">
                    {user?.role === 'USER' ? tp('verifiedBuyer') : user?.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{user?.email}</p>
                
                {/* Photo Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3.5 py-2 text-xs font-bold text-[#00407a] bg-blue-50 hover:bg-blue-100/80 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                  >
                     {uploadingPhoto ? (
                       <span className="flex items-center gap-1.5">
                         <Loader2 className="w-3.5 h-3.5 animate-spin" />
                         {tp('uploading')}
                       </span>
                     ) : (
                       tp('uploadPhoto')
                     )}
                  </button>
                  
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      disabled={uploadingPhoto}
                      className="px-3.5 py-2 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                       {tp('remove')}
                     </button>
                  )}
                </div>
                
                <p className="text-[11px] text-slate-400 mt-2">
                  {tp('photoHint')}
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <User className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                  {tp('fullName')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <Mail className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                  {tp('emailAddress')}
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">{tp('emailCannotChange')}</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <Phone className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                  {tp('phoneNumber')}
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  <Globe className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                  {tp('country')}
                </label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
                  className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all bg-white"
                >
                  <option value="">{tp('selectCountry')}</option>
                  {COUNTRY_CODES.map(code => (
                    <option key={code} value={code}>{regionNames.of(code)}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#00407a] text-white rounded-xl font-bold text-xs hover:bg-[#003366] transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {tp('saving')}
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle className="w-3.5 h-3.5" />
                      {tp('saved')}
                    </>
                  ) : (
                    tp('saveChanges')
                  )}
                </button>
                <Link
                  href="/dashboard/settings"
                  className="px-5 py-2.5 border border-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors"
                >
                  {tp('changePassword')}
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Container>
  )
}
