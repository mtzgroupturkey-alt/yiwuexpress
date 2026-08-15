'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Settings, Bell, Lock, Globe, Mail, User, ArrowLeft, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'

export default function SettingsPage() {
  const t = useTranslations('DashboardPages')
  const ts = useTranslations('DashboardPages.settings')
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, updateUser } = useAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
  })
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    orderUpdates: true,
    promotions: false,
    newsletter: true,
    language: 'en',
    currency: 'USD',
  })

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/settings')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/settings')
    }
  }, [authLoading, isAuthenticated, router])

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    setSuccess(false)
    
    try {
      await api.put('/api/auth/me', profileData)
      updateUser(profileData)
      setSuccess(true)
      toast.success(ts('profileUpdated'))
      setTimeout(() => setSuccess(false), 3000)
    } catch (error) {
      toast.error(ts('profileUpdateFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error(ts('passwordsMismatch'))
      return
    }
    
    if (passwordData.newPassword.length < 8) {
      toast.error(ts('passwordTooShort'))
      return
    }
    
    setIsSaving(true)
    
    try {
      await api.put('/api/auth/password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      })
      toast.success(ts('passwordUpdated'))
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      toast.error(ts('passwordUpdateFailed'))
    } finally {
      setIsSaving(false)
    }
  }

  const handleSavePreferences = () => {
    localStorage.setItem('user_preferences', JSON.stringify(preferences))
    toast.success(ts('preferencesSaved'))
  }

  const tabs = [
    { id: 'general', label: ts('tabGeneral'), icon: Settings },
    { id: 'security', label: ts('tabSecurity'), icon: Lock },
    { id: 'notifications', label: ts('tabNotifications'), icon: Bell },
    { id: 'preferences', label: ts('tabPreferences'), icon: Globe },
  ]

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 rounded-full animate-spin" style={{ borderTopColor: '#1a3a5c' }}></div>
          <p className="text-sm text-gray-500">{t('loadingSettings')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-4 mb-2">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-500 hover:text-[#1a3a5c]">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold text-[#1a3a5c]">{ts('title')}</h1>
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-[#1a3a5c] text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>
        <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              {activeTab === 'general' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{ts('generalTitle')}</h2>
                  <form onSubmit={handleProfileUpdate} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-2" />
                        {ts('fullName')}
                      </label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        {ts('emailAddress')}
                      </label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500 mt-1">{ts('emailCannotChange')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {ts('phoneNumber')}
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-6 py-3 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors disabled:opacity-50"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {ts('saving')}
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          {ts('saved')}
                        </>
                      ) : (
                        ts('saveChanges')
                      )}
                    </button>
                  </form>
                </div>
              )}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{ts('securityTitle')}</h2>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-4">{ts('changePassword')}</h3>
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {ts('currentPassword')}
                          </label>
                          <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {ts('newPassword')}
                          </label>
                          <input
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            required
                            minLength={8}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                          />
                          <p className="text-xs text-gray-500 mt-1">{ts('minChars')}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {ts('confirmNewPassword')}
                          </label>
                          <input
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSaving}
                          className="flex items-center gap-2 px-6 py-3 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors disabled:opacity-50"
                        >
                          {isSaving ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              {ts('updating')}
                            </>
                          ) : (
                            ts('updatePassword')
                          )}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{ts('notificationsTitle')}</h2>
                  <div className="space-y-4">
                    {[
                      { id: 'order_updates', label: ts('orderUpdates'), description: ts('orderUpdatesDesc') },
                      { id: 'promotions', label: ts('promotions'), description: ts('promotionsDesc') },
                      { id: 'newsletter', label: ts('newsletter'), description: ts('newsletterDesc') },
                      { id: 'emailNotifications', label: ts('emailNotifications'), description: ts('emailNotificationsDesc') },
                    ].map((item) => (
                      <div key={item.id} className="flex items-start gap-3 p-4 border border-gray-200 rounded-lg">
                        <input
                          type="checkbox"
                          id={item.id}
                          checked={preferences[item.id as keyof typeof preferences] as boolean}
                          onChange={(e) => setPreferences(prev => ({ ...prev, [item.id]: e.target.checked }))}
                          className="mt-1 w-4 h-4 text-[#1a3a5c] border-gray-300 rounded focus:ring-[#1a3a5c]"
                        />
                        <div className="flex-1">
                          <label htmlFor={item.id} className="font-medium text-gray-900 cursor-pointer">
                            {item.label}
                          </label>
                          <p className="text-sm text-gray-600">{item.description}</p>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={handleSavePreferences}
                      className="px-6 py-3 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors"
                    >
                      {ts('savePreferences')}
                    </button>
                  </div>
                </div>
              )}
              {activeTab === 'preferences' && (
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-6">{ts('preferencesTitle')}</h2>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{ts('language')}</label>
                      <select
                        value={preferences.language}
                        onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                      >
                        <option value="en">English</option>
                        <option value="zh">Chinese</option>
                        <option value="ru">Russian</option>
                        <option value="fr">French</option>
                        <option value="es">Spanish</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{ts('currency')}</label>
                      <select
                        value={preferences.currency}
                        onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1a3a5c] focus:border-transparent"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="CNY">CNY - Chinese Yuan</option>
                        <option value="RUB">RUB - Russian Ruble</option>
                        <option value="GBP">GBP - British Pound</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">{ts('accountInfo')}</label>
                      <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{ts('accountCreated')}</span>{' '}
                          {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">{ts('role')}</span>{' '}
                          <span className="capitalize">{user?.role?.toLowerCase()}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSavePreferences}
                      className="px-6 py-3 bg-[#1a3a5c] text-white rounded-lg hover:bg-[#2a5a8c] transition-colors"
                    >
                      {ts('savePreferences')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
      </div>
    </div>
  )
}