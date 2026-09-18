'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
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

  React.useEffect(() => {
    if (user) {
      setGuestInfo((prev) => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        company: prev.company || (user as any).companyName || '',
        phone: prev.phone || user.phone || '',
      }))
    }
  }, [user])
  const [shipping, setShipping] = useState({
    country: 'Belarus',
    city: 'Minsk',
    address: '',
    targetDeliveryDate: '',
    preferredShippingMode: 'STANDARD',
  })
  const [customerNotes, setCustomerNotes] = useState('')

  const handleQuantityChange = (productId: string, newQty: number, moq: number) => {
    const validQty = Math.max(moq || 1, newQty)
    updateQuantity(productId, validQty)
  }

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault()

    if (items.length === 0) {
      toast.error('Your quote cart is empty.')
      return
    }

    if (!guestInfo.name.trim() || !guestInfo.email.trim()) {
      toast.error('Please provide contact name and business email.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          targetPrice: i.targetPrice ? Number(i.targetPrice) : null,
          customerNotes: i.customerNotes || null,
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
        toast.success('Your quote request has been submitted successfully!')
        clearQuoteCart()
        navigate(`/quotes/view/${data.quote.secureToken}`)
      } else {
        toast.error(data.error || 'Failed to submit quote request.')
      }
    } catch (err) {
      toast.error('Network error submitting quote request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SharedLayout>
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
          <div>
            <button
              onClick={() => navigate('/store')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-blue-700 transition mb-2"
            >
              <ArrowLeft size={14} /> Continue Browsing Wholesale Catalog
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-sm">
                <FileText size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-gray-900">B2B Request for Quote (RFQ) Cart</h1>
                <p className="text-xs text-gray-500">
                  Submit your custom bulk requirements. Our commercial sales desk will price your request with volume discounts and optimal freight.
                </p>
              </div>
            </div>
          </div>

          {items.length > 0 && (
            <button
              onClick={clearQuoteCart}
              className="text-xs font-semibold text-rose-600 hover:text-rose-800 transition"
            >
              Clear Quote Cart
            </button>
          )}
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-gray-200 shadow-sm p-8 max-w-lg mx-auto space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
              <FileText size={32} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Your Quote Cart is Empty</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Browse our wholesale catalog and click <strong className="text-gray-800">&quot;Add to Quote&quot;</strong> on any product to build your commercial inquiry.
            </p>
            <button
              onClick={() => navigate('/store')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition"
              style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
            >
              Browse Wholesale Products
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmitQuote} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left 2 Cols: Quote Items List */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Requested Line Items ({quoteCount} products, {totalUnits} units)
                  </span>
                  <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    B2B Commercial Pricing
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <div key={item.productId} className="py-4 flex flex-col sm:flex-row gap-4">
                      {/* Product Thumbnail */}
                      <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden relative flex-shrink-0 border border-gray-200">
                        {item.productImage ? (
                          <Image
                            src={item.productImage}
                            alt={item.productName}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <FileText size={24} />
                          </div>
                        )}
                      </div>

                      {/* Line Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-gray-900 text-sm">{item.productName}</h3>
                            <p className="text-[11px] font-mono text-gray-500">SKU: {item.productSku}</p>
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                              MOQ: {item.minOrderQty} units
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromQuote(item.productId)}
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
                              Quantity
                            </label>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1, item.minOrderQty)}
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                              >
                                <Minus size={13} />
                              </button>
                              <input
                                type="number"
                                min={item.minOrderQty}
                                value={item.quantity}
                                onChange={(e) => handleQuantityChange(item.productId, parseInt(e.target.value) || item.minOrderQty, item.minOrderQty)}
                                className="w-20 px-2 py-1 text-center font-bold font-mono text-xs border border-gray-300 rounded-lg"
                              />
                              <button
                                type="button"
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1, item.minOrderQty)}
                                className="w-8 h-8 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 text-xs font-bold"
                              >
                                <Plus size={13} />
                              </button>
                            </div>
                          </div>

                          {/* Target Unit Price (Optional) */}
                          <div>
                            <label className="block text-[11px] font-semibold text-gray-600 mb-1">
                              Target Price / Unit (Optional)
                            </label>
                            <div className="relative">
                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs">$</span>
                              <input
                                type="number"
                                step="0.01"
                                placeholder="Your target"
                                value={item.targetPrice ?? ''}
                                onChange={(e) => updateItem(item.productId, { targetPrice: parseFloat(e.target.value) || null })}
                                className="w-full pl-6 pr-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-mono"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Line Notes */}
                        <div>
                          <input
                            type="text"
                            placeholder="Special requirements (e.g. customized logo, packaging, delivery deadline)..."
                            value={item.customerNotes || ''}
                            onChange={(e) => updateItem(item.productId, { customerNotes: e.target.value })}
                            className="w-full px-3 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 placeholder-gray-400"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Project Notes */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-3">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Overall Project Requirements & Commercial Notes
                </label>
                <textarea
                  rows={3}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="e.g. Need delivery in Minsk before November 15. Please quote container rail freight and advise if certificates are provided."
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
                  <h3 className="text-sm font-bold text-gray-900">Commercial Contact Dossier</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Company / Organization Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. BelKitchen Trade OOO"
                      value={guestInfo.company}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, company: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Tax ID / VAT / UNP Number</label>
                    <input
                      type="text"
                      placeholder="e.g. UNP 192837465"
                      value={guestInfo.taxId}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, taxId: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Contact Person Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ivan Petrov"
                      value={guestInfo.name}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Business Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. ivan@belkitchen.by"
                      value={guestInfo.email}
                      onChange={(e) => setGuestInfo(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +375 29 123-4567"
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
                  <h3 className="text-sm font-bold text-gray-900">Destination & Logistics</h3>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">Country</label>
                      <input
                        type="text"
                        value={shipping.country}
                        onChange={(e) => setShipping(prev => ({ ...prev, country: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-gray-700 mb-1">City</label>
                      <input
                        type="text"
                        value={shipping.city}
                        onChange={(e) => setShipping(prev => ({ ...prev, city: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Delivery Address / Warehouse</label>
                    <input
                      type="text"
                      placeholder="Street, warehouse number..."
                      value={shipping.address}
                      onChange={(e) => setShipping(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-gray-700 mb-1">Target Delivery Date</label>
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
              <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl p-5 shadow-lg space-y-4">
                <div>
                  <h4 className="font-bold text-sm">Commercial SLA Guarantee</h4>
                  <p className="text-[11px] text-blue-200 mt-1 leading-relaxed">
                    Our sales desk will evaluate warehouse stock at Minsk DC & China hub to issue formal pricing within 4 business hours.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-blue-950 bg-white hover:bg-blue-50 transition shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send size={15} />
                  {submitting ? 'Transmitting RFQ...' : 'Submit Official Quote Request'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </SharedLayout>
  )
}
