'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { api } from '@/lib/api'
import { Settings, Bell, Lock, Globe, Mail, User, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import toast from 'react-hot-toast'
import { useTranslations } from 'next-intl'
import { Container } from '@/components/design-system/Container'

export default function SettingsPage() {
  const t = useTranslations('DashboardPages')
  const ts = useTranslations('DashboardPages.settings')
  const router = useRouter()
  const { user, isAuthenticated, isLoading: authLoading, isInitialized, updateUser } = useAuth()
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
    if (isInitialized && !authLoading && !isAuthenticated) {
      router.push('/login?redirect=/dashboard/settings')
    }
  }, [isInitialized, authLoading, isAuthenticated, router])

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
      <div className="min-h-[420px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-slate-200 rounded-full animate-spin" style={{ borderTopColor: '#00407a' }}></div>
          <p className="text-xs text-slate-500 font-medium">{t('loadingSettings')}</p>
        </div>
      </div>
    )
  }

  return (
    <Container className="py-6 sm:py-8 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Page Header */}
        <div className="lg:col-span-12">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Settings className="w-5 h-5 text-[#00407a]" />
              {ts('title')}
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Manage your credentials, notifications, and platform preferences
            </p>
          </div>
        </div>

        {/* Side Nav Tabs */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-3">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#00407a] text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Main Settings Panel */}
        <div className="lg:col-span-9">
          <div className="bg-white rounded-2xl shadow-2xs border border-slate-200/80 p-6 sm:p-8">
            {activeTab === 'general' && (
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-5">
                  {ts('generalTitle')}
                </h2>
                <form onSubmit={handleProfileUpdate} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <User className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                      {ts('fullName')}
                    </label>
                    <input
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      <Mail className="w-3.5 h-3.5 inline mr-1.5 text-slate-400" />
                      {ts('emailAddress')}
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm bg-slate-50 text-slate-400 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">{ts('emailCannotChange')}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      {ts('phoneNumber')}
                    </label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                    />
                  </div>
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#00407a] text-white rounded-xl font-bold text-xs hover:bg-[#003366] transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          {ts('saving')}
                        </>
                      ) : success ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          {ts('saved')}
                        </>
                      ) : (
                        ts('saveChanges')
                      )}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-5">
                  {ts('securityTitle')}
                </h2>
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {ts('currentPassword')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.currentPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                        required
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {ts('newPassword')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        minLength={8}
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">{ts('minChars')}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        {ts('confirmNewPassword')}
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all"
                      />
                    </div>
                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#00407a] text-white rounded-xl font-bold text-xs hover:bg-[#003366] transition-colors disabled:opacity-50 shadow-2xs cursor-pointer"
                      >
                        {isSaving ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-5">
                  {ts('notificationsTitle')}
                </h2>
                <div className="space-y-3">
                  {[
                    { id: 'order_updates', label: ts('orderUpdates'), description: ts('orderUpdatesDesc') },
                    { id: 'promotions', label: ts('promotions'), description: ts('promotionsDesc') },
                    { id: 'newsletter', label: ts('newsletter'), description: ts('newsletterDesc') },
                    { id: 'emailNotifications', label: ts('emailNotifications'), description: ts('emailNotificationsDesc') },
                  ].map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-4 border border-slate-200 rounded-xl bg-slate-50/50 hover:bg-white transition-colors">
                      <input
                        type="checkbox"
                        id={item.id}
                        checked={preferences[item.id as keyof typeof preferences] as boolean}
                        onChange={(e) => setPreferences(prev => ({ ...prev, [item.id]: e.target.checked }))}
                        className="mt-0.5 w-4 h-4 text-[#00407a] border-slate-300 rounded focus:ring-[#00407a] cursor-pointer"
                      />
                      <div className="flex-1">
                        <label htmlFor={item.id} className="text-xs font-bold text-slate-900 cursor-pointer">
                          {item.label}
                        </label>
                        <p className="text-xs text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
                  <div className="pt-2">
                    <button
                      onClick={handleSavePreferences}
                      className="px-5 py-2.5 bg-[#00407a] text-white rounded-xl font-bold text-xs hover:bg-[#003366] transition-colors shadow-2xs cursor-pointer"
                    >
                      {ts('savePreferences')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight mb-5">
                  {ts('preferencesTitle')}
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{ts('language')}</label>
                    <select
                      value={preferences.language}
                      onChange={(e) => setPreferences(prev => ({ ...prev, language: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all bg-white"
                    >
                      <option value="en">English</option>
                      <option value="zh">Chinese</option>
                      <option value="ru">Russian</option>
                      <option value="fr">French</option>
                      <option value="es">Spanish</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{ts('currency')}</label>
                    <select
                      value={preferences.currency}
                      onChange={(e) => setPreferences(prev => ({ ...prev, currency: e.target.value }))}
                      className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00407a]/20 focus:border-[#00407a] transition-all bg-white"
                    >
                      <option value="USD">USD - US Dollar ($)</option>
                      <option value="EUR">EUR - Euro (€)</option>
                      <option value="CNY">CNY - Chinese Yuan (¥)</option>
                      <option value="RUB">RUB - Russian Ruble (₽)</option>
                      <option value="GBP">GBP - British Pound (£)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">{ts('accountInfo')}</label>
                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1.5 text-xs">
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-700">{ts('accountCreated')}:</span>{' '}
                        {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-slate-600">
                        <span className="font-bold text-slate-700">{ts('role')}:</span>{' '}
                        <span className="capitalize font-semibold text-[#00407a]">{user?.role?.toLowerCase()}</span>
                      </p>
                    </div>
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handleSavePreferences}
                      className="px-5 py-2.5 bg-[#00407a] text-white rounded-xl font-bold text-xs hover:bg-[#003366] transition-colors shadow-2xs cursor-pointer"
                    >
                      {ts('savePreferences')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Container>
  )
}