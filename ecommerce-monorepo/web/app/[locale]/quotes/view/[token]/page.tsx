'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  FileText, CheckCircle2, XCircle, Clock, Send, Printer, ArrowRight,
  Building2, User, MapPin, AlertCircle, AlertTriangle, ShieldCheck, RefreshCw, Calendar, DollarSign
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { SharedLayout } from '@/components/layout/SharedLayout'

interface QuoteItem {
  id: string
  productId: string
  productName: string
  productSku: string
  productImage: string | null
  quantity: number
  unitPriceQuoted: number | null
  lineDiscountPercent: number
  lineTotal: number | null
  isBackorder: boolean
  leadTimeDays: number
  customerNotes: string | null
  adminNotes: string | null
  selectedOptions?: any
}

interface QuoteData {
  id: string
  quoteNumber: string
  status: string
  currency: string
  subtotal: number | null
  shippingCost: number | null
  discountAmount: number | null
  totalAmount: number | null
  paymentTerms: string | null
  validUntil: string | null
  customerNotes: string | null
  adminNotes: string | null
  guestName: string | null
  guestEmail: string | null
  guestCompany: string | null
  guestPhone: string | null
  guestTaxId: string | null
  shippingCountry: string | null
  shippingCity: string | null
  shippingAddress: string | null
  targetDeliveryDate: string | null
  preferredShippingMode: string | null
  createdAt: string
  sentAt: string | null
  acceptedAt: string | null
  items: QuoteItem[]
}

export default function PublicQuoteViewPage({ params }: { params: { token: string; locale?: string } }) {
  const resolvedParams = params
  const router = useRouter()

  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<{ id: string; orderNumber: string } | null>(null)

  // Revision Modal State
  const [revisionModalOpen, setRevisionModalOpen] = useState(false)
  const [revisionNotes, setRevisionNotes] = useState('')

  // Reject Modal State
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchQuote()
  }, [resolvedParams.token])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/b2b/quotes/view/${resolvedParams.token}`)
      const data = await res.json()

      if (res.ok && data.success && data.quote) {
        setQuote(data.quote)
      } else {
        toast.error(data.error || 'Failed to retrieve quotation.')
      }
    } catch (err) {
      toast.error('Network error loading quotation.')
    } finally {
      setLoading(false)
    }
  }

  // Stock Shortage State
  const [stockShortages, setStockShortages] = useState<Array<{
    productId: string
    productName: string
    requested: number
    available: number
  }> | null>(null)

  const handleAccept = async (adjustments?: Array<{ itemId: string; quantity?: number; isBackorder?: boolean }>) => {
    if (!adjustments && !confirm('Accept this quotation and generate an official purchase order? Warehouse stock will be reserved.')) {
      return
    }

    try {
      setActing(true)
      const res = await fetch(`/api/b2b/quotes/view/${resolvedParams.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ACCEPT', itemAdjustments: adjustments }),
      })
      const data = await res.json()

      if (res.status === 409 && data.error === 'INSUFFICIENT_STOCK') {
        toast.error('Insufficient warehouse stock to fulfill requested quantities immediately.')
        setStockShortages(data.items || [])
        return
      }

      if (res.ok && data.success) {
        toast.success(data.message || 'Quotation accepted!')
        setCreatedOrder({ id: data.orderId, orderNumber: data.orderNumber })
        setStockShortages(null)
        fetchQuote()
      } else {
        toast.error(data.error || 'Failed to accept quote.')
      }
    } catch (err) {
      toast.error('Network error accepting quote.')
    } finally {
      setActing(false)
    }
  }

  const handleReduceQuantities = async () => {
    if (!stockShortages || !quote) return
    const adjustments = stockShortages
      .map((s) => {
        const item = quote.items.find((i) => i.productId === s.productId)
        return {
          itemId: item?.id || '',
          quantity: Math.max(1, s.available),
        }
      })
      .filter((a) => a.itemId)

    await handleAccept(adjustments)
  }

  const handleConvertBackorders = async () => {
    if (!stockShortages || !quote) return
    const adjustments = stockShortages
      .map((s) => {
        const item = quote.items.find((i) => i.productId === s.productId)
        return {
          itemId: item?.id || '',
          isBackorder: true,
        }
      })
      .filter((a) => a.itemId)

    await handleAccept(adjustments)
  }

  const handleRequestRevisionFromShortage = () => {
    if (!stockShortages) return
    const shortageList = stockShortages
      .map((s) => `• ${s.productName}: requested ${s.requested} pcs, only ${s.available} available in local warehouse`)
      .join('\n')
    setRevisionNotes(`Warehouse Stock Adjustment Request:\n${shortageList}\n\nPlease revise quotation or advise replenishment schedule.`)
    setStockShortages(null)
    setRevisionModalOpen(true)
  }

  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!revisionNotes.trim()) {
      toast.error('Please specify your revision requirements.')
      return
    }

    try {
      setActing(true)
      const res = await fetch(`/api/b2b/quotes/view/${resolvedParams.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REVISE', revisionNotes }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(data.message || 'Revision request transmitted!')
        setRevisionModalOpen(false)
        fetchQuote()
      } else {
        toast.error(data.error || 'Failed to request revision.')
      }
    } catch (err) {
      toast.error('Network error requesting revision.')
    } finally {
      setActing(false)
    }
  }

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setActing(true)
      const res = await fetch(`/api/b2b/quotes/view/${resolvedParams.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'REJECT', reason: rejectReason }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(data.message || 'Quotation marked as declined.')
        setRejectModalOpen(false)
        fetchQuote()
      } else {
        toast.error(data.error || 'Failed to decline quote.')
      }
    } catch (err) {
      toast.error('Network error declining quote.')
    } finally {
      setActing(false)
    }
  }

  if (loading) {
    return (
      <SharedLayout>
        <div className="flex items-center justify-center h-96">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw size={28} className="animate-spin text-blue-600" />
            <p className="text-xs font-semibold text-gray-500">Loading commercial quotation document...</p>
          </div>
        </div>
      </SharedLayout>
    )
  }

  if (!quote) {
    return (
      <SharedLayout>
        <div className="max-w-md mx-auto text-center py-20 px-4 space-y-4">
          <AlertCircle size={40} className="mx-auto text-rose-500" />
          <h2 className="text-lg font-bold text-gray-900">Quotation Not Available</h2>
          <p className="text-xs text-gray-500">This quotation link may have expired or is invalid.</p>
          <Link href="/store" className="inline-block px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600">
            Return to Storefront
          </Link>
        </div>
      </SharedLayout>
    )
  }

  const isSent = quote.status === 'SENT'
  const isAccepted = quote.status === 'ACCEPTED'
  const isExpired = quote.status === 'EXPIRED'
  const isUnderReview = quote.status === 'UNDER_REVIEW'
  const isPending = quote.status === 'PENDING' || quote.status === 'PRICED'

  return (
    <SharedLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Top Status Alert */}
        {isAccepted && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-emerald-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Quotation Accepted & Order Created!</h3>
                <p className="text-xs text-emerald-700">
                  Physical inventory has been reserved. Our logistics desk has initiated order processing.
                </p>
              </div>
            </div>
            {createdOrder && (
              <span className="font-mono text-xs font-bold text-emerald-900 bg-emerald-100 px-3 py-1.5 rounded-xl">
                Order #{createdOrder.orderNumber}
              </span>
            )}
          </div>
        )}

        {isPending && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center gap-3">
            <Clock size={20} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800">
              <strong>Pending Sales Desk Pricing:</strong> Our commercial team is currently assessing warehouse inventory and logistics to finalize your pricing. You will receive an email as soon as this quotation is ready for review.
            </p>
          </div>
        )}

        {isUnderReview && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center gap-3">
            <RefreshCw size={20} className="text-blue-600 flex-shrink-0 animate-spin" />
            <p className="text-xs text-blue-800">
              <strong>Revision Under Review:</strong> Your renegotiation notes have been received by the sales team. An updated quotation will be issued shortly.
            </p>
          </div>
        )}

        {isExpired && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center gap-3">
            <XCircle size={20} className="text-rose-600 flex-shrink-0" />
            <p className="text-xs text-rose-800">
              <strong>Quotation Expired:</strong> The validity deadline for this quotation has lapsed. Prices and stock allocation are no longer guaranteed. Please submit a new quote request.
            </p>
          </div>
        )}

        {/* Printable Quotation Document Container */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-md p-6 sm:p-10 space-y-8 print:shadow-none print:border-none">
          {/* Document Header */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6 border-b border-gray-200 pb-6">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                Official Commercial Quotation
              </span>
              <h1 className="text-2xl sm:text-3xl font-black font-mono text-gray-900 mt-2">
                {quote.quoteNumber}
              </h1>
              <p className="text-xs text-gray-500 mt-1">
                Issued on {new Date(quote.createdAt).toLocaleDateString()} • Global Trade Wholesale Division
              </p>
            </div>

            <div className="text-right space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 block">Offer Validity</span>
              {quote.validUntil ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-purple-50 text-purple-800 border border-purple-200 font-mono">
                  <Calendar size={13} /> Valid Until {new Date(quote.validUntil).toLocaleDateString()}
                </div>
              ) : (
                <span className="text-xs text-gray-400">TBD by Sales Desk</span>
              )}
            </div>
          </div>

          {/* Parties & Logistics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs text-gray-700 bg-gray-50/60 p-5 rounded-2xl border border-gray-100">
            {/* Customer Information */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Prepared For:</span>
              <p className="font-bold text-gray-900 text-sm">{quote.guestCompany || quote.guestName || 'B2B Client'}</p>
              <p className="text-gray-600">Contact: {quote.guestName}</p>
              <p className="text-gray-600">Email: {quote.guestEmail}</p>
              {quote.guestPhone && <p className="text-gray-600">Phone: {quote.guestPhone}</p>}
              {quote.guestTaxId && <p className="font-mono text-blue-700">UNP / Tax ID: {quote.guestTaxId}</p>}
            </div>

            {/* Destination & Logistics */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Delivery & Terms:</span>
              <p className="font-semibold text-gray-900">
                Destination: {quote.shippingAddress || 'Freight Address'}, {quote.shippingCity}, {quote.shippingCountry}
              </p>
              <p className="text-gray-600">Preferred Freight: {quote.preferredShippingMode || 'Standard Road/Rail'}</p>
              <p className="text-gray-600">Payment Terms: <strong>{quote.paymentTerms || '100% Prepayment'}</strong></p>
              {quote.targetDeliveryDate && (
                <p className="text-gray-600">Target Delivery Date: {new Date(quote.targetDeliveryDate).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Admin Commercial Notes */}
          {quote.adminNotes && (
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 text-xs text-blue-900 space-y-1">
              <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 block">Sales Desk Commercial Message:</span>
              <p className="leading-relaxed whitespace-pre-wrap">{quote.adminNotes}</p>
            </div>
          )}

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3 px-2">#</th>
                  <th className="py-3 px-3">Product Description / SKU</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-3 text-right">Quoted Unit</th>
                  <th className="py-3 px-3 text-right">Discount</th>
                  <th className="py-3 px-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
                {quote.items.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-gray-50/50 transition">
                    <td className="py-3.5 px-2 text-gray-400 font-mono">{idx + 1}</td>
                    <td className="py-3.5 px-3">
                      <p className="font-bold text-gray-900">{item.productName}</p>
                      <p className="font-mono text-[10px] text-gray-500">SKU: {item.productSku}</p>
                      {(() => {
                        let opts = item.selectedOptions
                        if (typeof opts === 'string') {
                          try { opts = JSON.parse(opts) } catch { opts = null }
                        }
                        if (!opts || typeof opts !== 'object' || Object.keys(opts).length === 0) return null
                        return (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {Object.entries(opts).map(([key, val]) => {
                              const isHex = typeof val === 'string' && val.startsWith('#')
                              const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ')
                              return (
                                <span
                                  key={key}
                                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-50 text-blue-800 text-[10px] font-medium border border-blue-200"
                                >
                                  <span className="text-blue-500">{label}:</span>
                                  {isHex && (
                                    <span
                                      className="w-2 h-2 rounded-full border border-blue-300 inline-block shrink-0"
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
                      {item.adminNotes && (
                        <p className="text-[11px] text-blue-700 mt-0.5">Note: {item.adminNotes}</p>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold">{item.quantity}</td>
                    <td className="py-3.5 px-3 text-right font-mono">
                      {item.unitPriceQuoted ? `$${item.unitPriceQuoted.toFixed(2)}` : <span className="text-gray-400 italic">Pending</span>}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono text-rose-700">
                      {item.lineDiscountPercent > 0 ? `-${item.lineDiscountPercent}%` : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right font-mono font-bold text-gray-900">
                      {item.lineTotal ? `$${item.lineTotal.toFixed(2)}` : <span className="text-gray-400 italic">Pending</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Financial Breakdown Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 max-w-sm space-y-1">
              <p className="font-semibold text-gray-700">Commercial Contract Terms:</p>
              <p>1. Accepting this quotation binds the agreed volume pricing and reserves inventory for 24 hours.</p>
              <p>2. Proforma invoice is automatically generated upon acceptance.</p>
            </div>

            <div className="w-full sm:w-72 bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5 font-mono text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Items Subtotal:</span>
                <span className="font-bold text-gray-900">${(quote.subtotal || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Quoted Freight:</span>
                <span className="font-bold text-gray-900">${(quote.shippingCost || 0).toFixed(2)}</span>
              </div>
              {(quote.discountAmount || 0) > 0 && (
                <div className="flex justify-between text-rose-700">
                  <span>Special Discount:</span>
                  <span className="font-bold">-${(quote.discountAmount || 0).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                <span className="font-sans font-bold text-gray-900">Total Quoted:</span>
                <span className="text-base font-black text-emerald-800">
                  ${(quote.totalAmount || (quote.subtotal || 0) + (quote.shippingCost || 0) - (quote.discountAmount || 0)).toFixed(2)} {quote.currency}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Bar (Only visible when status is SENT) */}
        {isSent && (
          <div className="sticky bottom-4 z-10 p-4 rounded-2xl bg-white/95 backdrop-blur shadow-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <ShieldCheck size={18} className="text-emerald-600" />
              <span>Review complete. You may accept the commercial offer, request revisions, or decline.</span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition"
              >
                <Printer size={14} /> Print PDF
              </button>

              <button
                type="button"
                onClick={() => setRevisionModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition"
              >
                <RefreshCw size={14} /> Request Revision
              </button>

              <button
                type="button"
                onClick={() => setRejectModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 transition"
              >
                <XCircle size={14} /> Decline
              </button>

              <button
                type="button"
                onClick={() => handleAccept()}
                disabled={acting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
              >
                <CheckCircle2 size={16} />
                {acting ? 'Processing Order...' : 'Accept & Place Order'}
              </button>
            </div>
          </div>
        )}

        {/* Stock Shortage Modal */}
        {stockShortages && stockShortages.length > 0 && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-amber-100 pb-3">
                <AlertTriangle size={20} className="text-amber-500" />
                <h3 className="text-sm font-bold text-gray-900">Warehouse Stock Shortage Detected</h3>
              </div>
              <p className="text-xs text-gray-600">
                The local fulfillment warehouse currently has insufficient physical stock to immediately allocate your full requested quantities. Please select how you would like to proceed:
              </p>
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2">Affected Items:</div>
                <div className="space-y-1.5">
                  {stockShortages.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-amber-100">
                      <span className="font-semibold text-gray-800">{item.productName}</span>
                      <div className="text-right text-[11px]">
                        <span className="text-rose-600 font-medium">Requested: {item.requested}</span>
                        <span className="mx-1.5 text-gray-300">|</span>
                        <span className="text-emerald-700 font-bold">Available: {item.available}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  type="button"
                  disabled={acting}
                  onClick={handleReduceQuantities}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors shadow flex items-center justify-center gap-2"
                >
                  <span>1. Reduce Quantities to Available Stock & Accept</span>
                </button>

                <button
                  type="button"
                  disabled={acting}
                  onClick={handleConvertBackorders}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow flex items-center justify-center gap-2"
                >
                  <span>2. Convert Shortages to China Backorder (Lead time 14-21 days)</span>
                </button>

                <button
                  type="button"
                  disabled={acting}
                  onClick={handleRequestRevisionFromShortage}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} />
                  <span>3. Request Sales Desk Revision (Negotiate Alternatives)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStockShortages(null)}
                  className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-700 text-center"
                >
                  Close & Review Quote
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Revision Modal */}
        {revisionModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={handleRevisionSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <RefreshCw size={18} className="text-blue-600" />
                <h3 className="text-sm font-bold text-gray-900">Request Quotation Revision</h3>
              </div>
              <p className="text-xs text-gray-500">
                Specify what changes you require (e.g. higher quantities for additional volume discount, alternative freight speed, or delivery date adjust).
              </p>
              <textarea
                required
                rows={4}
                value={revisionNotes}
                onChange={(e) => setRevisionNotes(e.target.value)}
                placeholder="e.g. If unit price for Item 1 is $12.50, we can increase our order to 100 units..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRevisionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow"
                >
                  {acting ? 'Submitting...' : 'Submit Revision Request'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <form onSubmit={handleRejectSubmit} className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                <XCircle size={18} className="text-rose-600" />
                <h3 className="text-sm font-bold text-gray-900">Decline Quotation</h3>
              </div>
              <p className="text-xs text-gray-500">
                Please tell us why you are declining this quotation so we can improve our commercial proposals in the future.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Budget exceeded, sourced from alternate supplier, project delayed..."
                className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={acting}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow"
                >
                  {acting ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </SharedLayout>
  )
}
