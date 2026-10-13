'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { useAuth } from '@/hooks/useAuth'
import { useAuthContext } from '@/components/providers/AuthProvider'
import {
  User,
  Building2,
  Phone,
  Mail,
  Globe,
  ShieldCheck,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Camera,
  Trash2,
  Lock,
  MapPin,
  Package,
  Heart,
  FileText,
  ExternalLink,
  KeyRound,
  Calendar,
  Sparkles,
  Briefcase,
  ChevronRight,
  Shield,
  Loader2,
  Check,
  X,
  Truck,
  Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import { getCountryName } from '@/lib/countries'

interface SavedAddress {
  id: string
  fullName: string
  phone: string
  addressLine1?: string
  addressLine2?: string | null
  addressLine?: string
  city: string
  state?: string | null
  postalCode: string
  country: string
  isDefault: boolean
  label?: string | null
  company?: string | null
}

const BUSINESS_TYPES = [
  { value: 'IMPORTER', label: 'Importer' },
  { value: 'EXPORTER', label: 'Exporter' },
  { value: 'MANUFACTURER', label: 'Manufacturer' },
  { value: 'DISTRIBUTOR', label: 'Distributor' },
  { value: 'WHOLESALER', label: 'Wholesaler' },
  { value: 'RETAILER', label: 'Retailer' },
  { value: 'OTHER', label: 'Other' },
]

export default function ProfilePage() {
  const locale = useLocale()
  const router = useRouter()
  const authCtx = useAuthContext()
  const storeAuth = useAuth()

  const isAuthenticated = authCtx.isAuthenticated || storeAuth.isAuthenticated
  const isInitialized = storeAuth.isInitialized || !authCtx.isLoading
  const authUser = authCtx.user || storeAuth.user
  const { updateUser, checkAuth } = storeAuth

  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'security' | 'portals'>('profile')
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // User Profile State
  const [userData, setUserData] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    companyName: '',
    businessType: 'OTHER',
    taxId: '',
    country: '',
    profilePhoto: '',
  })

  // Addresses State
  const [addresses, setAddresses] = useState<SavedAddress[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(false)

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  // Initial Auth Check
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      router.push(`/${locale}/login?redirect=/${locale}/profile`)
    } else if (isAuthenticated) {
      fetchUserProfile()
      fetchUserAddresses()
    }
  }, [isInitialized, isAuthenticated, locale, router])

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
      })
      if (!res.ok) {
        if (res.status === 401) {
          router.push(`/${locale}/login?redirect=/${locale}/profile`)
          return
        }
        throw new Error('Failed to load profile')
      }
      const json = await res.json()
      const user = json.user || json.data
      const validPhone = user?.phone && !user.phone.includes('@') ? user.phone : ''
      setUserData({
        ...user,
        phone: validPhone,
      })
      setFormData({
        name: user?.name || '',
        phone: validPhone,
        companyName: user?.companyName || '',
        businessType: user?.businessType || 'OTHER',
        taxId: user?.taxId || '',
        country: user?.country || '',
        profilePhoto: user?.profilePhoto || '',
      })
      setPhotoPreview(user?.profilePhoto || null)
    } catch (err: any) {
      console.error('Error fetching profile:', err)
      toast.error('Could not load user profile details')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUserAddresses = async () => {
    try {
      setLoadingAddresses(true)
      const res = await fetch('/api/addresses', {
        credentials: 'include',
      })
      if (res.ok) {
        const json = await res.json()
        setAddresses(json.data || [])
      }
    } catch (err) {
      console.error('Error fetching addresses:', err)
    } finally {
      setLoadingAddresses(false)
    }
  }

  const handleSetDefaultAddress = async (id: string) => {
    try {
      const addr = addresses.find((a) => a.id === id)
      if (!addr) return
      const res = await fetch('/api/addresses', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id,
          fullName: addr.fullName,
          phone: addr.phone,
          addressLine1: addr.addressLine1 || addr.addressLine,
          addressLine2: addr.addressLine2,
          city: addr.city,
          state: addr.state,
          postalCode: addr.postalCode,
          country: addr.country,
          isDefault: true,
        }),
      })
      if (!res.ok) throw new Error('Failed to update default address')
      toast.success('Default delivery address updated')
      await fetchUserAddresses()
      window.dispatchEvent(new CustomEvent('addresses-updated'))
    } catch (err: any) {
      toast.error(err.message || 'Error updating default address')
    }
  }

  // Handle Photo Upload
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, or WEBP)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image file must be under 5MB')
      return
    }

    setUploadingPhoto(true)
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      setPhotoPreview(base64)
      setFormData((prev) => ({ ...prev, profilePhoto: base64 }))

      // Auto-save photo
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name || userData?.name,
          profilePhoto: base64,
        }),
      })

      if (!res.ok) throw new Error('Failed to update avatar')
      const json = await res.json()
      const updated = json.user || json.data
      setUserData(updated)
      updateUser(updated)
      toast.success('Profile photo updated successfully!')
    } catch (err) {
      console.error('Error uploading photo:', err)
      toast.error('Failed to update profile photo')
      setPhotoPreview(userData?.profilePhoto || null)
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = async () => {
    try {
      setUploadingPhoto(true)
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.name || userData?.name,
          profilePhoto: null,
        }),
      })
      if (!res.ok) throw new Error('Failed to remove photo')
      const json = await res.json()
      const updated = json.user || json.data
      setUserData(updated)
      setPhotoPreview(null)
      setFormData((prev) => ({ ...prev, profilePhoto: '' }))
      updateUser(updated)
      toast.success('Profile photo removed')
    } catch (err) {
      toast.error('Failed to remove profile photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  // Handle Form Submit
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.phone && formData.phone.includes('@')) {
      toast.error('Please enter a valid phone number (not an email address)')
      return
    }
    setIsSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || 'Failed to update profile')
      }

      const json = await res.json()
      const updated = json.user || json.data
      setUserData(updated)
      updateUser(updated)
      setIsEditing(false)
      toast.success('Profile details saved successfully!')
    } catch (err: any) {
      console.error('Save error:', err)
      toast.error(err.message || 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle Password Submit
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordData.currentPassword || !passwordData.newPassword) {
      toast.error('Please fill in both current and new passwords')
      return
    }
    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters')
      return
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New password and confirmation do not match')
      return
    }

    setIsSavingPassword(true)
    try {
      const res = await fetch('/api/auth/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      const json = await res.json()
      if (!res.ok) {
        throw new Error(json.error || 'Failed to update password')
      }

      toast.success('Password updated successfully!')
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (err: any) {
      console.error('Password change error:', err)
      toast.error(err.message || 'Failed to change password')
    } finally {
      setIsSavingPassword(false)
    }
  }

  const isWholesale = userData?.userType === 'WHOLESALE' || userData?.userType === 'BOTH'
  const isApproved = userData?.verificationStatus === 'APPROVED'
  const defaultAddress = addresses.find((a) => a.isDefault) || addresses[0]

  return (
    <SharedLayout
      pageTitle="My Profile"
      pageDescription="Manage your personal information, business account profile, saved addresses, and security settings."
      breadcrumbs={[
        { name: 'Home', href: `/${locale}` },
        { name: 'My Profile', href: `/${locale}/profile` },
      ]}
    >
      <div className="w-full bg-[#F8FAFC] min-h-[calc(100vh-250px)] py-8 md:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          
          {/* TOP PROFILE HERO BANNER */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs relative overflow-hidden transition-all">
            {/* Top Brand Accent Bar */}
            <div className="h-2.5 w-full bg-gradient-to-r from-[#00407a] via-[#005599] to-[#F5A602]" />

            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* User Info Left */}
                <div className="flex flex-col sm:flex-row items-center sm:items-start md:items-center gap-5 text-center sm:text-left">
                  {/* Avatar with Camera Trigger */}
                  <div className="relative group shrink-0">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt={userData?.name || 'User Avatar'}
                        className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-cover border-2 border-white shadow-md ring-1 ring-slate-200"
                      />
                    ) : (
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br from-[#00407a] to-[#00284d] text-white flex items-center justify-center font-black text-2xl md:text-3xl shadow-md border-2 border-white ring-1 ring-slate-200">
                        {userData?.name
                          ? userData.name
                              .split(' ')
                              .map((n: string) => n[0])
                              .join('')
                              .toUpperCase()
                              .slice(0, 2)
                          : 'U'}
                      </div>
                    )}

                    {/* Camera Upload Overlay */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto}
                      title="Update profile photo"
                      className="absolute -bottom-1.5 -right-1.5 p-2 rounded-xl bg-[#00407a] hover:bg-[#003366] text-white shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoUpload}
                    />
                  </div>

                  {/* Title & Badges */}
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                      <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
                        {userData?.name || 'Customer Profile'}
                      </h1>

                      {/* Role & Verification Badges */}
                      {userData?.role === 'ADMIN' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <Shield className="w-3 h-3" />
                          Administrator
                        </span>
                      )}

                      {isWholesale ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-[#00407a] border border-blue-200">
                          <Building2 className="w-3 h-3" />
                          Wholesale B2B Account
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <User className="w-3 h-3" />
                          Retail Customer
                        </span>
                      )}

                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Verified
                        </span>
                      ) : isWholesale ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          <Sparkles className="w-3 h-3" />
                          Pending Review
                        </span>
                      ) : null}
                    </div>

                    {userData?.companyName && (
                      <p className="text-sm font-semibold text-slate-600 flex items-center justify-center sm:justify-start gap-1.5">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        {userData.companyName}
                      </p>
                    )}

                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-slate-500 pt-1.5">
                      {userData?.email && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 font-medium text-slate-700">
                          <Mail className="w-3.5 h-3.5 text-[#00407a]" />
                          <span>{userData.email}</span>
                        </span>
                      )}
                      {userData?.phone && !userData.phone.includes('@') && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 font-medium text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-[#00407a]" />
                          <span>{userData.phone}</span>
                        </span>
                      )}
                      {userData?.createdAt && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/70 text-slate-600">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>Member since {new Date(userData.createdAt).toLocaleDateString()}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex items-center justify-center sm:justify-end gap-3 shrink-0">
                  {photoPreview && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      title="Remove avatar photo"
                      className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors cursor-pointer text-xs font-semibold flex items-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Remove Photo</span>
                    </button>
                  )}

                  {!isEditing ? (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('profile')
                        setIsEditing(true)
                      }}
                      className="px-4 py-2.5 rounded-xl bg-[#00407a] hover:bg-[#003366] active:scale-[0.99] text-white text-xs md:text-sm font-bold shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs md:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  )}
                </div>

              </div>

              {/* Quick Summary Highlights Strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mt-6 pt-6 border-t border-slate-100 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#00407a] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Orders</span>
                    <Link
                      href={`/${locale}/orders`}
                      className="font-bold text-[#00407a] hover:underline"
                    >
                      View Order History
                    </Link>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-100 text-[#F5A602] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-slate-500 block">Primary Destination</span>
                    <span className="font-bold text-slate-800 truncate block">
                      {defaultAddress ? `${defaultAddress.city}, ${defaultAddress.country}` : 'Not set'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Verification</span>
                    <span className="font-bold text-slate-800">
                      {isApproved ? 'Verified Buyer' : 'Standard'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block">Favorites</span>
                    <Link
                      href={`/${locale}/wishlist`}
                      className="font-bold text-[#00407a] hover:underline"
                    >
                      View Wishlist
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MAIN TABS BAR */}
          <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-2 md:gap-4">
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'profile'
                  ? 'border-[#00407a] text-[#00407a]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Personal & Business Info</span>
            </button>

            <button
              onClick={() => setActiveTab('addresses')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'addresses'
                  ? 'border-[#00407a] text-[#00407a]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses ({addresses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('security')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'security'
                  ? 'border-[#00407a] text-[#00407a]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Lock className="w-4 h-4" />
              <span>Security & Password</span>
            </button>

            <button
              onClick={() => setActiveTab('portals')}
              className={`py-3 px-4 font-bold text-sm border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === 'portals'
                  ? 'border-[#00407a] text-[#00407a]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Account Hub & Portals</span>
            </button>
          </div>

          {/* TAB 1: PERSONAL & BUSINESS DETAILS */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Account & Company Information
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Update your contact person, phone number, and business registration details.
                  </p>
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="text-xs font-bold text-[#00407a] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Details
                  </button>
                )}
              </div>

              {isLoading ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00407a] mb-2" />
                  <p className="text-xs font-semibold">Loading profile information...</p>
                </div>
              ) : (
                <form onSubmit={handleSaveProfile} className="space-y-6">
                  {/* Grid 1: Personal Contact */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Contact Person Name *
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Your full name"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                          />
                        </div>
                      ) : (
                        <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-900 flex items-center gap-2.5">
                          <User className="w-4 h-4 text-[#00407a]" />
                          <span>{userData?.name || 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    {/* Email (Readonly) */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Email Address
                        </label>
                        <span className="text-[11px] text-slate-400">Primary ID</span>
                      </div>
                      <div className="py-2.5 px-3.5 bg-slate-100/70 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 flex items-center justify-between">
                        <div className="flex items-center gap-2.5 truncate">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="truncate">{userData?.email}</span>
                        </div>
                        <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-md shrink-0">
                          Verified
                        </span>
                      </div>
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Phone Number
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="tel"
                            autoComplete="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 234 567 8900"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                          />
                        </div>
                      ) : (
                        <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-900 flex items-center gap-2.5">
                          <Phone className="w-4 h-4 text-[#00407a]" />
                          <span>{userData?.phone && !userData.phone.includes('@') ? userData.phone : 'Not provided'}</span>
                        </div>
                      )}
                    </div>

                    {/* Country / Region */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                        Country / Territory
                      </label>
                      {isEditing ? (
                        <div className="relative">
                          <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={formData.country}
                            onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                            placeholder="e.g. United States, Germany, China"
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                          />
                        </div>
                      ) : (
                        <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-900 flex items-center gap-2.5">
                          <Globe className="w-4 h-4 text-[#00407a]" />
                          <span>{userData?.country || 'Not provided'}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Business & Wholesale Details */}
                  <div className="pt-6 border-t border-slate-100">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#00407a]" />
                      <span>Company & Trade Details</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      {/* Company Name */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Company Name
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.companyName}
                            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                            placeholder="Registered enterprise name"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                          />
                        ) : (
                          <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-900">
                            {userData?.companyName || 'Not specified'}
                          </div>
                        )}
                      </div>

                      {/* Business Type */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Business Type
                        </label>
                        {isEditing ? (
                          <select
                            value={formData.businessType}
                            onChange={(e) => setFormData({ ...formData, businessType: e.target.value })}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                          >
                            {BUSINESS_TYPES.map((bt) => (
                              <option key={bt.value} value={bt.value}>
                                {bt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-900">
                            {BUSINESS_TYPES.find((b) => b.value === userData?.businessType)?.label || userData?.businessType || 'Other'}
                          </div>
                        )}
                      </div>

                      {/* Tax ID */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Tax ID / VAT Registration
                        </label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.taxId}
                            onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
                            placeholder="Tax / Customs identifier"
                            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                          />
                        ) : (
                          <div className="py-2.5 px-3.5 bg-slate-50 rounded-xl border border-slate-100 text-sm font-bold text-slate-900">
                            {userData?.taxId || 'Not provided'}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Submit / Cancel Footer when editing */}
                  {isEditing && (
                    <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-6 py-2.5 rounded-xl bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-60"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Saving Changes...</span>
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Save Profile</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* TAB 2: SAVED ADDRESSES */}
          {activeTab === 'addresses' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 md:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-lg font-black text-slate-900 tracking-tight">
                    Saved Delivery Addresses
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Manage destination addresses used for direct checkout and wholesale freight routing.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href="/dashboard/addresses"
                    className="px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Manage All</span>
                  </Link>
                  <Link
                    href={`/${locale}/checkout`}
                    className="px-4 py-2 bg-[#00407a] hover:bg-[#003366] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add in Checkout</span>
                  </Link>
                </div>
              </div>

              {loadingAddresses ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin text-[#00407a] mb-2" />
                  <p className="text-xs font-semibold">Loading saved addresses...</p>
                </div>
              ) : addresses.length === 0 ? (
                <div className="py-12 text-center max-w-sm mx-auto space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <MapPin className="w-7 h-7" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">No saved addresses yet</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Addresses added during retail checkout or wholesale order placement will be saved here automatically.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {addresses.map((addr) => (
                    <div
                      key={addr.id}
                      className={`p-5 rounded-2xl border transition-all ${
                        addr.isDefault
                          ? 'border-[#00407a] bg-blue-50/30 shadow-xs'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold text-slate-900 truncate">
                          {addr.fullName}
                        </span>
                        {addr.isDefault ? (
                          <span className="text-[10px] font-black bg-[#00407a] text-white px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                            <Check className="w-3 h-3" />
                            Default
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-[11px] font-bold text-[#00407a] hover:text-[#00274d] hover:underline cursor-pointer transition-colors"
                          >
                            Set as Default
                          </button>
                        )}
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 leading-relaxed">
                        {addr.company && (
                          <p className="font-semibold text-slate-800">{addr.company}</p>
                        )}
                        <p>{addr.addressLine1 || addr.addressLine}</p>
                        <p>
                          {addr.city}
                          {addr.state ? `, ${addr.state}` : ''} {addr.postalCode}
                        </p>
                        <p className="font-semibold text-slate-700">{getCountryName(addr.country) || addr.country}</p>
                        {addr.phone && (
                          <p className="pt-2 text-[11px] text-slate-500 flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {addr.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SECURITY & PASSWORD */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 md:p-8 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Security & Access Credentials
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Update your account password and review protection standards.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Password Form */}
                <form onSubmit={handleSavePassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Current Password *
                    </label>
                    <div className="relative">
                      <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        placeholder="Minimum 8 characters"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                      Confirm New Password *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="password"
                        required
                        minLength={8}
                        value={passwordData.confirmPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                        }
                        placeholder="Repeat new password"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold text-slate-900 focus:outline-none focus:border-[#00407a] focus:ring-2 focus:ring-[#00407a]/15 transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSavingPassword}
                      className="w-full md:w-auto px-6 py-2.5 rounded-xl bg-[#00407a] hover:bg-[#003366] text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      {isSavingPassword ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Updating Password...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Update Password</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                {/* Security Advice Panel */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 space-y-3.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Account Protection Guidelines</span>
                  </h4>
                  <ul className="text-xs text-slate-600 space-y-2.5 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Use a strong password with at least 8 characters including letters and symbols.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>Authorized wholesale accounts have privileged access to negotiated contract prices.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>All session cookies are strictly HTTP-only and protected against unauthorized script access.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: QUICK PORTALS & SHORTCUTS */}
          {activeTab === 'portals' && (
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xs p-6 md:p-8 space-y-6">
              <div className="pb-4 border-b border-slate-100">
                <h2 className="text-lg font-black text-slate-900 tracking-tight">
                  Account Activity & Shortcuts
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Direct navigation to your orders, RFQ quotes, wholesale portal, and tracking hub.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* Card 1: My Orders */}
                <Link
                  href={`/${locale}/orders`}
                  className="group p-5 rounded-2xl border border-slate-200 hover:border-[#00407a] hover:shadow-md transition-all bg-white flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#00407a] flex items-center justify-center group-hover:bg-[#00407a] group-hover:text-white transition-colors">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Order Management</h4>
                      <p className="text-xs text-slate-500">Track shipments and order states</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00407a] flex items-center gap-1 group-hover:underline mt-2">
                    Open Orders <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                {/* Card 2: Wholesale B2B Portal */}
                <Link
                  href={`/${locale}/business/dashboard`}
                  className="group p-5 rounded-2xl border border-slate-200 hover:border-[#00407a] hover:shadow-md transition-all bg-white flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-[#F5A602] flex items-center justify-center group-hover:bg-[#F5A602] group-hover:text-slate-950 transition-colors">
                      <Briefcase className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Wholesale Dashboard</h4>
                      <p className="text-xs text-slate-500">B2B catalog & bulk ordering</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00407a] flex items-center gap-1 group-hover:underline mt-2">
                    Enter Portal <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                {/* Card 3: Saved Favorites */}
                <Link
                  href={`/${locale}/wishlist`}
                  className="group p-5 rounded-2xl border border-slate-200 hover:border-[#00407a] hover:shadow-md transition-all bg-white flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                      <Heart className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Wishlist & Favorites</h4>
                      <p className="text-xs text-slate-500">Saved items and bookmark list</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00407a] flex items-center gap-1 group-hover:underline mt-2">
                    View Wishlist <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                {/* Card 4: RFQ Quote Cart */}
                <Link
                  href={`/${locale}/quote-cart`}
                  className="group p-5 rounded-2xl border border-slate-200 hover:border-[#00407a] hover:shadow-md transition-all bg-white flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Quote Inquiries (RFQ)</h4>
                      <p className="text-xs text-slate-500">Inquire container & custom freight</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00407a] flex items-center gap-1 group-hover:underline mt-2">
                    View Quotes <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>

                {/* Card 5: Logistics & Shipment Tracking */}
                <Link
                  href={`/${locale}/track`}
                  className="group p-5 rounded-2xl border border-slate-200 hover:border-[#00407a] hover:shadow-md transition-all bg-white flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3.5 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center group-hover:bg-slate-800 group-hover:text-white transition-colors">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">Live Package Tracking</h4>
                      <p className="text-xs text-slate-500">Enter tracking ID for milestone ETA</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#00407a] flex items-center gap-1 group-hover:underline mt-2">
                    Track Item <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </SharedLayout>
  )
}
