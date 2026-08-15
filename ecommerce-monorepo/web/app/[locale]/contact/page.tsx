'use client'

import { useState, useEffect } from 'react'
import { useTranslations, useLocale } from 'next-intl'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { MapPin, Phone, Mail, Clock, Send, CheckCircle } from 'lucide-react'

interface OfficeLocation {
  id: string
  type: string
  city: string
  address: string | null
  phone: string | null
  email: string | null
  hours: string | null
}

const fallbackOffices: OfficeLocation[] = [
  {
    id: 'fb-1',
    type: 'HEADQUARTERS',
    city: 'China Headquarters',
    address: 'Room 501, China International Trade Tower, Chouzhou Road, China, Zhejiang, China',
    phone: '+86 579 8555 1234',
    email: 'yw-support@yiwuexpress.com',
    hours: 'Mon - Sat: 9:00 AM - 6:00 PM (CST)',
  },
  {
    id: 'fb-2',
    type: 'HUB',
    city: 'Ningbo Logistics Hub',
    address: 'No. 88 Baiguan Road, Beilun Port District, Ningbo, Zhejiang, China',
    phone: '+86 574 8688 5678',
    email: 'nb-ops@yiwuexpress.com',
    hours: 'Mon - Fri: 9:00 AM - 5:30 PM (CST)',
  },
]

export default function ContactPage() {
  const t = useTranslations('Contact')
  const locale = useLocale()
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
  })
  const [offices, setOffices] = useState<OfficeLocation[]>(fallbackOffices)
  const [loadingLocations, setLoadingLocations] = useState(true)

  useEffect(() => {
    fetch(`/api/contact-locations?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.data && data.data.length > 0) {
          setOffices(data.data)
        }
      })
      .catch(() => {
        // keep fallback offices on error
      })
      .finally(() => setLoadingLocations(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    // Simulate API request delay
    setTimeout(() => {
      setLoading(false)
      setSuccess(true)
      setForm({
        name: '',
        email: '',
        company: '',
        subject: '',
        message: '',
      })
    }, 1000)
  }

  return (
    <SharedLayout 
      pageTitle={t('pageTitle')}
      pageDescription={t('pageDescription')}
      breadcrumbs={[
        { name: t('breadcrumb'), href: '/contact' }
      ]}
      backgroundImage="/images/contact-bg.jpg"
    >
      <div className="bg-gray-50">
        {/* Main Grid */}
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Contact Info Cards */}
            <div className="lg:col-span-1 space-y-6">
              <h2 className="text-2xl font-bold text-gray-950">{t('officeLocations')}</h2>
              
              {offices.map((office) => (
                <div key={office.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-2">
                    <h3 className="text-lg font-bold text-primary-600">{office.city}</h3>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${office.type === 'HEADQUARTERS' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
                      {office.type === 'HEADQUARTERS' ? t('headquarters') : t('logisticsHub')}
                    </span>
                  </div>

                  <div className="space-y-3 text-sm text-gray-600">
                    {office.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span>{office.address}</span>
                      </div>
                    )}
                    {office.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${office.phone.replace(/\s+/g, '')}`} className="hover:text-primary-600 font-medium">{office.phone}</a>
                      </div>
                    )}
                    {office.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${office.email}`} className="hover:text-primary-600 font-medium">{office.email}</a>
                      </div>
                    )}
                    {office.hours && (
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span>{office.hours}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Inquiry Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 h-full flex flex-col justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-950 mb-2">{t('sendInquiry')}</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    {t('inquiryHelp')}
                  </p>

                  {success && (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center gap-3">
                      <CheckCircle className="w-6 h-6 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold">{t('successTitle')}</h4>
                        <p className="text-sm">{t('successBody')}</p>
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1">{t('labelName')} *</label>
                        <input
                          id="name"
                          type="text"
                          required
                          value={form.name}
                          onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
                          placeholder={t('phName')}
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">{t('labelEmail')} *</label>
                        <input
                          id="email"
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
                          placeholder={t('phEmail')}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="company" className="block text-sm font-semibold text-gray-700 mb-1">{t('labelCompany')}</label>
                        <input
                          id="company"
                          type="text"
                          value={form.company}
                          onChange={(e) => setForm(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
                          placeholder={t('phCompany')}
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className="block text-sm font-semibold text-gray-700 mb-1">{t('labelSubject')} *</label>
                        <input
                          id="subject"
                          type="text"
                          required
                          value={form.subject}
                          onChange={(e) => setForm(prev => ({ ...prev, subject: e.target.value }))}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
                          placeholder={t('phSubject')}
                        />
                      </div>
                    </div>

                    <div>
                        <label htmlFor="message" className="block text-sm font-semibold text-gray-700 mb-1">{t('labelMessage')} *</label>
                      <textarea
                        id="message"
                        rows={6}
                        required
                        value={form.message}
                        onChange={(e) => setForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-200 text-sm"
                          placeholder={t('phMessage')}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-md disabled:opacity-50 mt-2"
                    >
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          {t('sending')}
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          {t('sendMessage')}
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </SharedLayout>
  )
}
