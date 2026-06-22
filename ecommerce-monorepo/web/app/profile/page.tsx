'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Navbar from '@/components/navbar'
import { User, Building, Phone, Mail, Globe, Shield, Edit2, Check, X, Calendar } from 'lucide-react'

const profileSchema = z.object({
  name: z.string().min(2, 'Contact name must be at least 2 characters'),
  companyName: z.string().min(2, 'Company name is required'),
  businessType: z.enum(['IMPORTER', 'EXPORTER', 'MANUFACTURER', 'DISTRIBUTOR', 'OTHER']),
  phone: z.string().min(10, 'Valid phone number is required'),
  taxId: z.string().transform(val => val || null).nullable(),
  country: z.string().transform(val => val || null).nullable(),
})

type ProfileInput = z.infer<typeof profileSchema>

export default function ProfilePage() {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [userData, setUserData] = useState<any>(null)
  const router = useRouter()

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
  })

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    fetchProfile(token)
  }, [])

  const fetchProfile = async (token: string) => {
    try {
      setIsLoading(true)
      setError('')

      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const result = await response.json()

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token')
          router.push('/login')
          return
        }
        throw new Error(result.error || 'Failed to fetch profile')
      }

      setUserData(result.user)
      
      // Populate form values
      setValue('name', result.user.name || '')
      setValue('companyName', result.user.companyName || '')
      setValue('businessType', result.user.businessType || 'OTHER')
      setValue('phone', result.user.phone || '')
      setValue('taxId', result.user.taxId || '')
      setValue('country', result.user.country || '')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmit = async (data: ProfileInput) => {
    try {
      setIsSaving(true)
      setError('')
      setSuccessMsg('')
      const token = localStorage.getItem('token')

      const response = await fetch('/api/auth/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile')
      }

      setUserData(result.user)
      setSuccessMsg('Profile updated successfully!')
      setIsEditing(false)
      
      // Refresh navbar state by updating local storage user cache if it exists
      if (localStorage.getItem('user')) {
        localStorage.setItem('user', JSON.stringify(result.user))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    if (userData) {
      reset({
        name: userData.name || '',
        companyName: userData.companyName || '',
        businessType: userData.businessType || 'OTHER',
        phone: userData.phone || '',
        taxId: userData.taxId || '',
        country: userData.country || '',
      })
    }
    setIsEditing(false)
    setError('')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600 font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header Summary */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 text-2xl font-bold">
                {userData?.companyName?.substring(0, 2).toUpperCase() || 'CP'}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{userData?.companyName}</h1>
                <div className="flex flex-wrap gap-2 mt-1">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                    {userData?.businessType}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">
                    Business Account
                  </span>
                </div>
              </div>
            </div>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span>{userData?.email}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-gray-400" />
              <span>Role: <strong className="text-gray-900">{userData?.role}</strong></span>
            </div>
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>Registered: {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A'}</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMsg}
          </div>
        )}

        {/* Profile Form Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
          <h2 className="text-lg font-bold text-gray-950 mb-6 pb-2 border-b border-gray-100">
            Business Details
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Contact Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Contact Person Name
                </label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('name')}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.name ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                      }`}
                    />
                    {errors.name && (
                      <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900 py-2 font-medium border-b border-transparent">{userData?.name}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Phone Number
                </label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('phone')}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.phone ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-xs text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900 py-2 font-medium border-b border-transparent">{userData?.phone || 'Not provided'}</p>
                )}
              </div>

              {/* Company Name */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Company Name
                </label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('companyName')}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.companyName ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                      }`}
                    />
                    {errors.companyName && (
                      <p className="mt-1 text-xs text-red-600">{errors.companyName.message}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-900 py-2 font-medium border-b border-transparent">{userData?.companyName}</p>
                )}
              </div>

              {/* Business Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Business Type
                </label>
                {isEditing ? (
                  <select
                    {...register('businessType')}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      errors.businessType ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                    }`}
                  >
                    <option value="IMPORTER">Importer</option>
                    <option value="EXPORTER">Exporter</option>
                    <option value="MANUFACTURER">Manufacturer</option>
                    <option value="DISTRIBUTOR">Distributor</option>
                    <option value="OTHER">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 py-2 font-medium border-b border-transparent">{userData?.businessType}</p>
                )}
              </div>

              {/* Tax ID */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Tax ID / Registration Number
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    {...register('taxId')}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                      errors.taxId ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                    }`}
                    placeholder="Optional"
                  />
                ) : (
                  <p className="text-gray-900 py-2 font-medium border-b border-transparent">{userData?.taxId || 'Not provided'}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Country / Region
                </label>
                {isEditing ? (
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      {...register('country')}
                      className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
                        errors.country ? 'border-red-500 focus:ring-red-200' : 'border-gray-300 focus:ring-primary-200'
                      }`}
                      placeholder="e.g. United States, Germany, Nigeria"
                    />
                  </div>
                ) : (
                  <p className="text-gray-900 py-2 font-medium border-b border-transparent">{userData?.country || 'Not provided'}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  )
}
