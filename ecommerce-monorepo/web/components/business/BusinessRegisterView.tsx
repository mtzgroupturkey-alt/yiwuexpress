'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { useCompanyName } from '@/hooks/useCompanyName'
import type { DynamicPageContent } from '@/lib/contentPages'
import {
  Building2,
  User,
  Mail,
  Phone,
  Lock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ShieldCheck,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react'

const BUSINESS_TYPES = [
  { value: 'wholesaler', label: 'Wholesaler / Importer' },
  { value: 'distributor', label: 'Commercial Distributor' },
  { value: 'retailer', label: 'Retail Chain / Shop Owner' },
  { value: 'manufacturer', label: 'Manufacturer / OEM Assembly' },
  { value: 'other', label: 'Other Enterprise' },
]

export interface BusinessRegisterViewProps {
  initialContent: DynamicPageContent
}

export function BusinessRegisterView({ initialContent }: BusinessRegisterViewProps) {
  const locale = useLocale()
  const router = useRouter()
  const companyName = useCompanyName()
  const t = useTranslations('business')

  // Dynamic content passed from server (falls back gracefully)
  const content = initialContent
  const sections = content.sections || {}

  // Step state (1 = Business Info, 2 = Account & License)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1)

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    taxId: '',
    businessType: 'wholesaler',
    country: '',
    city: '',
    address: '',
    contactName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    notes: '',
  })

  const [licenseFile, setLicenseFile] = useState<File | null>(null)
  const [licenseFileName, setLicenseFileName] = useState<string>('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('File size exceeds 5MB limit. Please upload a smaller document.')
      return
    }

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extension || !['pdf', 'jpg', 'jpeg', 'png'].includes(extension)) {
      setErrorMessage('Invalid file format. Only PDF, JPG, and PNG documents are accepted.')
      return
    }

    setErrorMessage(null)
    setLicenseFile(file)
    setLicenseFileName(file.name)
  }

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validate Step 1
    if (!formData.companyName.trim()) {
      setErrorMessage('Please enter your registered Company Name.')
      return
    }
    if (!formData.taxId.trim()) {
      setErrorMessage('Please enter your Business Registration Number or Tax ID.')
      return
    }
    if (!formData.country.trim()) {
      setErrorMessage('Please specify your registered country.')
      return
    }
    if (!formData.city.trim() || !formData.address.trim()) {
      setErrorMessage('Please enter your registered city and business address.')
      return
    }

    setCurrentStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    // Validate Step 2
    if (!formData.contactName.trim()) {
      setErrorMessage('Please enter the contact person full name.')
      return
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setErrorMessage('Please provide a valid business email address.')
      return
    }
    if (!formData.phone.trim()) {
      setErrorMessage('Please enter a valid phone or WhatsApp number.')
      return
    }
    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }
    if (!licenseFile) {
      setErrorMessage('Please upload your business registration document or trade license (PDF/JPG/PNG).')
      return
    }

    setIsLoading(true)

    try {
      const payload = new FormData()
      payload.append('companyName', formData.companyName.trim())
      payload.append('taxId', formData.taxId.trim())
      payload.append('businessType', formData.businessType)
      payload.append('country', formData.country.trim())
      payload.append('city', formData.city.trim())
      payload.append('address', formData.address.trim())
      payload.append('contactName', formData.contactName.trim())
      payload.append('email', formData.email.trim().toLowerCase())
      payload.append('phone', formData.phone.trim())
      payload.append('password', formData.password)
      payload.append('notes', formData.notes.trim())
      payload.append('licenseFile', licenseFile)

      const res = await fetch('/api/auth/register-b2b', {
        method: 'POST',
        body: payload,
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit B2B application.')
      }

      // Application successfully created!
      router.push(`/${locale}/business/pending`)
    } catch (err: any) {
      console.error('[B2B Register] Error:', err)
      setErrorMessage(err.message || 'An unexpected error occurred during submission.')
    } finally {
      setIsLoading(false)
    }
  }

  const pageTitle = content.metaTitle || `${content.title || 'Apply for B2B Wholesale Account'} | ${companyName}`

  return (
    <SharedLayout pageTitle={pageTitle}>
      <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-100 text-[#00407a] text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
              <Building2 className="w-3.5 h-3.5" />
              <span>{content.badge || 'B2B Commercial Registration'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {content.title || t('register.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-2 max-w-lg mx-auto leading-relaxed">
              {content.subtitle || t('register.subtitle')}
            </p>

            {/* Trust Highlights */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-5 text-[11px] sm:text-xs font-semibold text-slate-600">
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{sections.trustHighlight1 || 'Tier-1 Factory Direct Sourcing'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{sections.trustHighlight2 || 'Strict QC Pre-Shipment Inspection'}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-slate-200/80 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>{sections.trustHighlight3 || 'FCL / LCL Sea & Air Logistics'}</span>
              </div>
            </div>
          </div>

          {/* Stepper Indicator */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 mb-6 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === 1 
                    ? 'bg-[#00407a] text-white shadow-xs' 
                    : 'bg-emerald-500 text-white'
                }`}>
                  {currentStep === 2 ? <CheckCircle2 className="w-4 h-4" /> : '1'}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {sections.step1Title || t('register.step1')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {sections.step1Subtitle || 'Company & Registration'}
                  </div>
                </div>
              </div>

              <div className="flex-1 mx-4 h-0.5 bg-slate-200" />

              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                  currentStep === 2 
                    ? 'bg-[#00407a] text-white shadow-xs' 
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  2
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">
                    {sections.step2Title || t('register.step2')}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {sections.step2Subtitle || 'Contact & License'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-5 h-5 shrink-0 text-red-500 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Optional Rich Body Guidance (if published with HTML content) */}
          {content.content && content.content.trim() && content.content !== '<p></p>' && (
            <div 
              className="mb-6 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs prose prose-sm max-w-none text-slate-700 text-xs"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          )}

          {/* Form Container */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 sm:p-8">
            {currentStep === 1 ? (
              /* =========================================================
                 STEP 1: BUSINESS INFORMATION
                 ========================================================= */
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    {sections.companyNameLabel || t('register.companyName')} *
                  </label>
                  <input
                    type="text"
                    name="companyName"
                    required
                    value={formData.companyName}
                    onChange={handleInputChange}
                    placeholder={sections.companyNamePlaceholder || 'e.g. Acme Global Trading Ltd'}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.taxIdLabel || t('register.taxId')} *
                    </label>
                    <input
                      type="text"
                      name="taxId"
                      required
                      value={formData.taxId}
                      onChange={handleInputChange}
                      placeholder={sections.taxIdPlaceholder || 'e.g. VAT / EIN / Registration #'}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.businessTypeLabel || t('register.businessType')} *
                    </label>
                    <select
                      name="businessType"
                      value={formData.businessType}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    >
                      {BUSINESS_TYPES.map((bt) => (
                        <option key={bt.value} value={bt.value}>
                          {bt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.countryLabel || t('register.country')} *
                    </label>
                    <input
                      type="text"
                      name="country"
                      required
                      value={formData.country}
                      onChange={handleInputChange}
                      placeholder={sections.countryPlaceholder || 'e.g. Germany, Russia, UAE...'}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.cityLabel || t('register.city')} *
                    </label>
                    <input
                      type="text"
                      name="city"
                      required
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder={sections.cityPlaceholder || 'e.g. Hamburg, Moscow, Dubai...'}
                      className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    {sections.addressLabel || t('register.address')} *
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder={sections.addressPlaceholder || 'Registered street address, office suite, postal code'}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <Link
                    href={`/${locale}/business`}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Portal Info</span>
                  </Link>

                  <button
                    type="submit"
                    className="bg-[#00407a] hover:bg-[#003366] text-white font-bold px-6 py-3 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                  >
                    <span>{sections.nextButton || t('register.next')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* =========================================================
                 STEP 2: CONTACT, CREDENTIALS & LICENSE UPLOAD
                 ========================================================= */
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    {sections.contactNameLabel || t('register.contactName')} *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      name="contactName"
                      required
                      value={formData.contactName}
                      onChange={handleInputChange}
                      placeholder={sections.contactNamePlaceholder || 'Authorized Buyer or Procurement Officer'}
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.emailLabel || t('register.email')} *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder={sections.emailPlaceholder || 'buyer@company.com'}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.phoneLabel || t('register.phone')} *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="tel"
                        name="phone"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder={sections.phonePlaceholder || '+1 (555) 000-0000'}
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.passwordLabel || t('register.password')} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        required
                        value={formData.password}
                        onChange={handleInputChange}
                        placeholder="Min 8 characters"
                        className="w-full pl-10 pr-10 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      {sections.confirmPasswordLabel || t('register.confirmPassword')} *
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        required
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Confirm password"
                        className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                      />
                    </div>
                  </div>
                </div>

                {/* License Document Upload */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    {sections.licenseLabel || t('register.license')} *
                  </label>
                  <div className="border-2 border-dashed border-slate-300 hover:border-[#00407a] rounded-2xl p-5 text-center bg-slate-50/70 transition-colors cursor-pointer relative">
                    <input
                      type="file"
                      required
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-7 h-7 text-[#00407a] mx-auto mb-2" />
                    <div className="text-xs font-bold text-slate-800">
                      {licenseFileName ? (
                        <span className="text-emerald-600 flex items-center justify-center gap-1">
                          <CheckCircle2 className="w-4 h-4" />
                          {licenseFileName}
                        </span>
                      ) : (
                        sections.licenseUploadTitle || 'Click to upload Business License or Certificate of Incorporation'
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {sections.licenseUploadHint || 'PDF, JPG, or PNG (Maximum file size: 5 MB)'}
                    </div>
                  </div>
                </div>

                {/* Sourcing Notes */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                    {sections.notesLabel || t('register.notes')}
                  </label>
                  <textarea
                    rows={2}
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder={sections.notesPlaceholder || 'Specify preferred product categories, container volume requirements, target brands...'}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#00407a]"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer py-2"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>{sections.backButton || t('register.back')}</span>
                  </button>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#F5A602] hover:bg-[#E09500] disabled:bg-amber-300 text-slate-950 font-black px-7 py-3 rounded-xl text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-98"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Submitting Application...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
                        <span>{sections.submitButton || t('register.submit')}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer Assistance */}
          <div className="text-center mt-6 text-xs text-slate-500">
            {sections.footerPrompt || 'Already have an active B2B account?'}{' '}
            <Link
              href={`/${locale}/login?redirect=/${locale}/business/dashboard`}
              className="font-bold text-[#00407a] hover:underline"
            >
              {sections.footerLinkText || 'Sign in to Wholesale Portal'}
            </Link>
          </div>
        </div>
      </div>
    </SharedLayout>
  )
}
