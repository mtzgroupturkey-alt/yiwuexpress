'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { ProductImage } from '@/components/ui/ProductImage'
import {
  FileText, ArrowLeft, Trash2, Building2, User, Mail, Phone,
  MapPin, Calendar, Clock, Send, ShieldCheck, CheckCircle2, AlertCircle,
  Truck, HelpCircle, Plus, Minus
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useQuoteCart } from '@/components/QuoteCartContext'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { useLocaleNav } from '@/hooks/useLocaleNav'
import { useAuth } from '@/hooks/useAuth'

export default function QuoteCartPage() {
  const router = useRouter()
  const navigate = useLocaleNav()
  const t = useTranslations('QuoteCart')
  const { user } = useAuth()
  const { items, quoteCount, totalUnits, updateQuantity, updateItem, removeFromQuote, clearQuoteCart } = useQuoteCart()

  const [submitting, setSubmitting] = useState(false)
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    taxId: '',
  })

  const [shipping, setShipping] = useState({
    country: '',
    city: '',
    address: '',
    targetDeliveryDate: '',
    preferredShippingMode: 'STANDARD',
  })
  const [customerNotes, setCustomerNotes] = useState('')

  React.useEffect(() => {
    if (user) {
      setGuestInfo((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        company: prev.company || (user as any).companyName || '',
        phone: prev.phone || user.phone || '',
      }))
      setShipping((prev) => ({
        ...prev,
        country: prev.country || user.country || '',
      }))
    }
  }, [user])

  const handleQuantityChange = (productId: string, newQty: number, moq: number, selectedOptions?: Record<string, string> | null) => {
    const validQty = Math.max(moq || 1, newQty)
    updateQuantity(productId, validQty, selectedOptions)
  }

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error(t('emptyTitle'))
      return
    }

    if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
      toast.error(t('contactInfo'))
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          productName: i.productName,
          productSku: i.productSku,
          productImage: i.productImage,
          quantity: i.quantity,
          targetPrice: i.targetPrice ? Number(i.targetPrice) : null,
          customerNotes: i.customerNotes || null,
          selectedOptions: i.selectedOptions || null,
          variantId: i.variantId || null,
        })),
        guestInfo,
        shipping,
        customerNotes,
      }

      const res = await fetch('/api/b2b/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (res.ok && data.success && data.quote) {
        toast.success(t('quoteSubmittedSuccess'))
        clearQuoteCart()
        navigate(`/quotes/view/${data.quote.secureToken}`)
      } else {
        toast.error(data.error || t('quoteSubmitError'))
      }
    } catch (err) {
      toast.error(t('quoteSubmitError'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SharedLayout
      pageTitle={t('pageTitle')}
      pageDescription={t('pageDescription')}
      breadcrumbs={[
        { name: t('breadcrumb'), href: '/quote-cart' }
      ]}
    >
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <button
              onClick={() => navigate('/store')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 transition mb-2"
            >
              <ArrowLeft size={14} /> {t('browseCatalog')}
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-sm">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">{t('pageTitle')}</h1>
                <p className="text-xs text-gray-500">
                  {t('pageDescription')}
                </p>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearQuoteCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              {t('clearCart')}
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">{t('emptyTitle')}</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              {t('emptySubtitle')}
            </p>
            <button
              onClick={() => navigate('/store')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition"
              style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
            >
              {t('browseCatalog')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitQuote} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Quote Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    {t('productsInQuote')} ({quoteCount} {t('itemsCount')}, {totalUnits} {t('totalUnits')})
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    ✦ B2B Wholesale
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((item, idx) => {
                    const itemKey = item.variantId
                      ? `${item.productId}-${item.variantId}`
                      : `${item.productId}-${JSON.stringify(item.selectedOptions || {})}-${idx}`

                    return (
                      <div key={itemKey} className="py-4 flex flex-col sm:flex-row gap-4">
                        {/* Product Thumbnail */}
                        <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0 border border-gray-200">
                          <ProductImage
                            src={item.productImage}
                            alt={item.productName || 'Product image'}
                            fill
                            sizes="80px"
                            className="object-cover"
                          />
                        </div>

                        {/* Line Details */}
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="font-bold text-gray-900 text-sm">{item.productName}</h3>
                              <p className="text-[11px] font-mono text-gray-500">SKU: {item.productSku}</p>
                              {(() => {
                                let opts = item.selectedOptions
                                if (typeof opts === 'string') {
                                  try { opts = JSON.parse(opts) } catch { opts = null }
                                }
                                if (!opts || typeof opts !== 'object' || Object.keys(opts).length === 0) return null
                                return (
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {Object.entries(opts).map(([key, val]) => {
                                      const isHex = typeof val === 'string' && val.startsWith('#')
                                      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
                                      return (
                                        <span
                                          key={key}
                                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-medium border border-blue-200"
                                        >
                                          <span className="text-blue-500 font-semibold">{label}:</span>
                                          {isHex && (
                                            <span
                                              className="w-2.5 h-2.5 rounded-full border border-blue-300 inline-block shrink-0"
                                              style={{ backgroundColor: String(val) }}
                                            />
                                          )}
                                          <span>{String(val)}</span>
                                        </span>
                                      )
                                    })}
                                  </div>
                                )
                              })()}
                              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1.5 inline-block">
                                {t('moq')}: {item.minOrderQty}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => removeFromQuote(item.productId, item.selectedOptions)}
                              className="text-gray-400 hover:text-rose-600 transition p-1"
                              title="Remove item"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>

                          {/* Controls Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Quantity Stepper */}
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                {t('quantity')}
                              </label>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.minOrderQty, item.selectedOptions)}
                                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                                >
                                  <Minus size={13} />
                                </button>
                                <input
                                  type="number"
                                  min={item.minOrderQty}
                                  value={item.quantity}
                                  onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || item.minOrderQty, item.minOrderQty, item.selectedOptions)}
                                  className="w-20 px-2 py-1 text-center font-bold font-mono text-xs border border-gray-300 rounded-lg"
                                />
                                <button
                                  type="button"
                                  onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.minOrderQty, item.selectedOptions)}
                                  className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                                >
                                  <Plus size={13} />
                                </button>
                              </div>
                            </div>

                            {/* Target Unit Price (Optional) */}
                            <div>
                              <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                                {t('targetUnitPrice')}
                              </label>
                              <div className="relative">
                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={item.targetPrice ?? ''}
                                  onChange={(e) => updateItem(item.productId, { targetPrice: parseFloat(e.target.value) || null }, item.selectedOptions)}
                                  className="w-full pl-6 pr-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Line Notes */}
                          <div>
                            <input
                              type="text"
                              placeholder={t('notesItemPlaceholder')}
                              value={item.customerNotes || ''}
                              onChange={(e) => updateItem(item.productId, { customerNotes: e.target.value }, item.selectedOptions)}
                              className="w-full px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400"
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* General Project Notes */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  {t('additionalNotes')}
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder={t('notesPlaceholder')}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Right Col: Contact & Logistics Sidebar */}
            <div className="space-y-4">
              {/* B2B Contact Info */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Building2 size={18} className="text-blue-600" />
                  <h3 className="text-sm font-bold text-gray-900">{t('contactInfo')}</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{t('companyName')}</label>
                    <input
                      type="text"
                      required
                      placeholder="Company Name"
                      value={guestInfo.company}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{t('taxId')}</label>
                    <input
                      type="text"
                      placeholder="Tax / VAT ID"
                      value={guestInfo.taxId}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, taxId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{t('fullName')} *</label>
                    <input
                      type="text"
                      required
                      placeholder="Contact Person"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{t('businessEmail')} *</label>
                    <input
                      type="email"
                      required
                      placeholder="email@company.com"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{t('phone')}</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={guestInfo.phone}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Destination & Logistics */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                  <Truck size={18} className="text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-900">{t('shippingDestination')}</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">{t('country')}</label>
                      <input
                        type="text"
                        placeholder="Country"
                        value={shipping.country}
                        onChange={(e) => setShipping(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">{t('city')}</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={shipping.city}
                        onChange={(e) => setShipping(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{t('deliveryAddress')}</label>
                    <input
                      type="text"
                      placeholder="Street, building, suite..."
                      value={shipping.address}
                      onChange={(e) => setShipping(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">{t('targetDeliveryDate')}</label>
                    <input
                      type="date"
                      value={shipping.targetDeliveryDate}
                      onChange={(e) => setShipping(prev => ({ ...prev, targetDeliveryDate: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-gray-800"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Card */}
              <div className="bg-gradient-to-br from-[#1a3a5c] to-[#0f243a] text-white rounded-2xl p-5 shadow-lg space-y-4">
                <div>
                  <h4 className="font-bold text-sm">Commercial SLA Guarantee</h4>
                  <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                    Our sales desk will evaluate warehouse stock and logistics routes to issue official tiered commercial pricing.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[#1a3a5c] bg-white hover:bg-white/95 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={15} />
                  {submitting ? t('submittingQuote') : t('submitQuote')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </SharedLayout>
  )
}
