'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Building2, User, Phone, Mail, MapPin, Calendar, Clock,
  CheckCircle2, AlertCircle, Save, Send, Truck, Layers, ExternalLink,
  Percent, FileText, Info, ShieldCheck, Box, Eye
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAdminAuth } from '../../contexts/AdminAuthContext'

interface StockInfo {
  warehouseId: string
  quantity: number
  reservedQty: number
  warehouse: {
    id: string
    code: string
    name: string
    country: string
  }
}

interface QuoteItemData {
  id: string
  productId: string
  productName: string
  productSku: string
  productImage: string | null
  quantity: number
  unitPriceRequested: number | null
  unitPriceQuoted: number | null
  lineDiscountPercent: number
  lineTotal: number | null
  sourceWarehouseId: string | null
  isBackorder: boolean
  leadTimeDays: number
  customerNotes: string | null
  adminNotes: string | null
  product?: {
    price: number
    wholesalePrice: number | null
    minOrderQty: number
    warehouseStocks: StockInfo[]
  }
}

interface QuoteDetail {
  id: string
  quoteNumber: string
  status: string
  secureToken: string
  currency: string
  subtotal: number | null
  shippingCost: number | null
  discountAmount: number | null
  totalAmount: number | null
  paymentTerms: string | null
  validUntil: string | null
  customerNotes: string | null
  adminNotes: string | null
  internalNotes: string | null
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
  order?: {
    id: string
    orderNumber: string
    status: string
  } | null
  user?: {
    id: string
    name: string | null
    email: string
    userType: string
    verificationStatus: string
    _count: { orders: number }
  } | null
  items: QuoteItemData[]
  statusHistory: Array<{
    id: string
    fromStatus: string | null
    toStatus: string
    changedByRole: string
    reason: string | null
    createdAt: string
  }>
}

interface Warehouse {
  id: string
  code: string
  name: string
  country: string
  city: string | null
}

export default function AdminQuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { isAdmin, loading: authLoading } = useAdminAuth()

  const [quote, setQuote] = useState<QuoteDetail | null>(null)
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [validDays, setValidDays] = useState(7)

  // Pricing Form State
  const [lineItems, setLineItems] = useState<QuoteItemData[]>([])
  const [shippingCost, setShippingCost] = useState<number>(0)
  const [discountAmount, setDiscountAmount] = useState<number>(0)
  const [paymentTerms, setPaymentTerms] = useState('PREPAYMENT')
  const [adminNotes, setAdminNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchQuote()
    }
  }, [authLoading, isAdmin, resolvedParams.id])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/b2b/quotes/${resolvedParams.id}`, {
        credentials: 'include',
      })
      const data = await res.json()

      if (res.ok && data.success && data.quote) {
        const q: QuoteDetail = data.quote
        setQuote(q)
        setWarehouses(data.warehouses || [])
        setLineItems(q.items || [])
        setShippingCost(q.shippingCost || 0)
        setDiscountAmount(q.discountAmount || 0)
        setPaymentTerms(q.paymentTerms || 'PREPAYMENT')
        setAdminNotes(q.adminNotes || '')
        setInternalNotes(q.internalNotes || '')
        if (data.settings?.rfqDefaultExpiryDays) {
          setValidDays(data.settings.rfqDefaultExpiryDays)
        }
      } else {
        toast.error(data.error || 'Failed to load quote details.')
      }
    } catch (err) {
      toast.error('Network error loading quote.')
    } finally {
      setLoading(false)
    }
  }

  // Pre-fill prices using catalog wholesale price or baseline discount
  const applySuggestedPricing = () => {
    setLineItems((prev) =>
      prev.map((item) => {
        let price = item.unitPriceQuoted
        if (!price || price === 0) {
          if (item.product?.wholesalePrice && item.product.wholesalePrice > 0) {
            price = item.product.wholesalePrice
          } else if (item.product?.price && item.product.price > 0) {
            price = +(item.product.price * 0.85).toFixed(2) // 15% discount
          }
        }
        return {
          ...item,
          unitPriceQuoted: price,
          lineTotal: +(item.quantity * (price || 0) * (1 - (item.lineDiscountPercent || 0) / 100)).toFixed(2),
        }
      })
    )
    toast.success('Applied suggested catalog pricing to empty lines.')
  }

  const handleLineChange = (index: number, field: keyof QuoteItemData, value: any) => {
    setLineItems((prev) => {
      const updated = [...prev]
      const current = { ...updated[index], [field]: value }

      // Recalculate line total if price or discount changed
      if (field === 'unitPriceQuoted' || field === 'lineDiscountPercent' || field === 'quantity') {
        const qty = Number(current.quantity) || 1
        const price = Number(current.unitPriceQuoted) || 0
        const disc = Math.max(0, Math.min(100, Number(current.lineDiscountPercent) || 0))
        current.lineTotal = +(qty * price * (1 - disc / 100)).toFixed(2)
      }

      updated[index] = current
      return updated
    })
  }

  // Calculate Subtotal & Total
  const subtotal = lineItems.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
  const finalTotal = Math.max(0, subtotal + Number(shippingCost || 0) - Number(discountAmount || 0))

  const handleSaveDraft = async () => {
    try {
      setSaving(true)
      const res = await fetch(`/api/admin/b2b/quotes/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: lineItems,
          shippingCost,
          discountAmount,
          paymentTerms,
          adminNotes,
          internalNotes,
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success('Pricing draft saved successfully.')
        fetchQuote()
      } else {
        toast.error(data.error || 'Failed to save draft.')
      }
    } catch (err) {
      toast.error('Network error saving draft.')
    } finally {
      setSaving(false)
    }
  }

  const handleSendQuote = async () => {
    try {
      setSending(true)
      // Save draft first
      await fetch(`/api/admin/b2b/quotes/${resolvedParams.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          items: lineItems,
          shippingCost,
          discountAmount,
          paymentTerms,
          adminNotes,
          internalNotes,
        }),
      })

      // Send action
      const res = await fetch(`/api/admin/b2b/quotes/${resolvedParams.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          validDays,
          adminNotes,
        }),
      })
      const data = await res.json()

      if (res.ok && data.success) {
        toast.success(data.message || 'Quotation transmitted to customer!')
        setSendModalOpen(false)
        fetchQuote()
      } else {
        toast.error(data.error || 'Failed to send quote.')
      }
    } catch (err) {
      toast.error('Network error sending quote.')
    } finally {
      setSending(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-semibold text-gray-500">Loading quotation workspace...</p>
        </div>
      </div>
    )
  }

  if (!quote) return null

  const isFinalized = ['ACCEPTED', 'REJECTED'].includes(quote.status)
  const isAccepted = quote.status === 'ACCEPTED'

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24">
      {/* Back Navigation & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-4">
        <div>
          <Link
            href="/admin/quotes"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition mb-2"
          >
            <ArrowLeft size={14} /> Back to Quotations Desk
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black font-mono text-gray-900">{quote.quoteNumber}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
              {quote.status}
            </span>
            {isAccepted && quote.order && (
              <Link
                href={`/admin/orders/${quote.order.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg hover:underline"
              >
                Order #{quote.order.orderNumber} <ExternalLink size={12} />
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/quotes/view/${quote.secureToken}`}
            target="_blank"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 transition shadow-sm"
          >
            <Eye size={14} /> Customer Link <ExternalLink size={12} className="text-gray-400" />
          </Link>

          {!isFinalized && (
            <>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
              >
                <Save size={14} /> {saving ? 'Saving...' : 'Save Draft'}
              </button>

              <button
                onClick={() => setSendModalOpen(true)}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md transition hover:opacity-95"
                style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
              >
                <Send size={14} /> Preview & Send Quote
              </button>
            </>
          )}
        </div>
      </div>

      {/* Top Customer & Logistics Intelligence Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Customer Profile */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer Dossier</span>
            {quote.user?.verificationStatus === 'APPROVED' ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                <ShieldCheck size={12} /> Verified B2B
              </span>
            ) : (
              <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                Unverified / Guest
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <p className="font-bold text-gray-900 text-sm">{quote.guestCompany || quote.user?.name || 'Individual Buyer'}</p>
            <p className="text-gray-600 flex items-center gap-1.5">
              <User size={13} className="text-gray-400" /> {quote.guestName || quote.user?.name || 'N/A'}
            </p>
            <p className="text-gray-600 flex items-center gap-1.5">
              <Mail size={13} className="text-gray-400" /> {quote.guestEmail || quote.user?.email || 'N/A'}
            </p>
            {quote.guestPhone && (
              <p className="text-gray-600 flex items-center gap-1.5">
                <Phone size={13} className="text-gray-400" /> {quote.guestPhone}
              </p>
            )}
            {quote.guestTaxId && (
              <p className="text-blue-700 font-mono text-[11px] pt-1">
                Tax ID / UNP: <span className="font-bold">{quote.guestTaxId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Delivery & Routing Info */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Destination & Logistics</span>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
              {quote.preferredShippingMode || 'STANDARD'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-gray-600">
            <p className="flex items-start gap-1.5 text-gray-900 font-semibold">
              <MapPin size={13} className="text-red-500 mt-0.5 flex-shrink-0" />
              <span>{quote.shippingAddress || 'Address on file'}, {quote.shippingCity || 'Minsk'}, {quote.shippingCountry}</span>
            </p>
            {quote.targetDeliveryDate && (
              <p className="flex items-center gap-1.5 text-gray-600">
                <Calendar size={13} className="text-gray-400" />
                Target Delivery: <span className="font-bold text-gray-800">{new Date(quote.targetDeliveryDate).toLocaleDateString()}</span>
              </p>
            )}
            <p className="text-[11px] text-gray-500 pt-1">
              Submitted on {new Date(quote.createdAt).toLocaleDateString()} at {new Date(quote.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Customer Notes */}
        <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Customer Requirements</span>
          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed max-h-28 overflow-y-auto">
            {quote.customerNotes || 'No special requirements or target instructions provided by customer.'}
          </div>
        </div>
      </div>

      {/* Pricing Grid & Stock Allocation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Line Items & Multi-Warehouse Stock Allocation</h3>
            <p className="text-xs text-gray-500">Inspect live inventory availability and quote unit pricing for each line.</p>
          </div>

          {!isFinalized && (
            <button
              onClick={applySuggestedPricing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition"
            >
              <Percent size={13} /> Auto-Fill Suggested Catalog Prices
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/90 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-200">
                <th className="py-3 px-3">Product / SKU</th>
                <th className="py-3 px-3">Multi-Warehouse Stock</th>
                <th className="py-3 px-3">Qty</th>
                <th className="py-3 px-3">Catalog Price</th>
                <th className="py-3 px-3 w-32">Quoted Unit ($)</th>
                <th className="py-3 px-3 w-24">Disc %</th>
                <th className="py-3 px-3">Line Total</th>
                <th className="py-3 px-3">Fulfillment Hub</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs text-gray-800">
              {lineItems.map((item, index) => {
                const belarusStock = item.product?.warehouseStocks?.find(
                  (ws) => ws.warehouse.code === 'BY-MS' || ws.warehouse.country === 'Belarus'
                )
                const chinaStock = item.product?.warehouseStocks?.find(
                  (ws) => ws.warehouse.code === 'CN-YW' || ws.warehouse.country === 'China'
                )

                const byAvail = Math.max(0, (belarusStock?.quantity || 0) - (belarusStock?.reservedQty || 0))
                const cnAvail = Math.max(0, (chinaStock?.quantity || 0) - (chinaStock?.reservedQty || 0))

                return (
                  <tr key={item.id} className="hover:bg-blue-50/20 transition">
                    {/* Product Name & SKU */}
                    <td className="py-3 px-3">
                      <p className="font-bold text-gray-900">{item.productName}</p>
                      <span className="font-mono text-[10px] text-gray-500">{item.productSku}</span>
                      {item.customerNotes && (
                        <p className="text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded mt-1">
                          Note: {item.customerNotes}
                        </p>
                      )}
                    </td>

                    {/* Stock Telemetry */}
                    <td className="py-3 px-3">
                      <div className="space-y-1 font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="w-12 text-gray-500">🇧🇾 BY-MS:</span>
                          <span className={`font-bold ${byAvail >= item.quantity ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {byAvail} avail
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="w-12 text-gray-500">🇨🇳 CN-YW:</span>
                          <span className="font-bold text-gray-700">{cnAvail} avail</span>
                        </div>
                      </div>
                    </td>

                    {/* Quantity */}
                    <td className="py-3 px-3 font-bold font-mono">
                      {item.quantity}
                    </td>

                    {/* Catalog Reference */}
                    <td className="py-3 px-3">
                      <p className="text-gray-500 text-[11px]">MSRP: ${item.product?.price?.toFixed(2) || '0.00'}</p>
                      {item.product?.wholesalePrice && (
                        <p className="text-blue-700 font-semibold text-[11px]">
                          Wholesale: ${item.product.wholesalePrice.toFixed(2)}
                        </p>
                      )}
                    </td>

                    {/* Quoted Unit Price Input */}
                    <td className="py-3 px-3">
                      {isFinalized ? (
                        <span className="font-mono font-bold">${item.unitPriceQuoted?.toFixed(2) || '0.00'}</span>
                      ) : (
                        <div className="relative">
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.unitPriceQuoted ?? ''}
                            onChange={(e) => handleLineChange(index, 'unitPriceQuoted', parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 focus:ring-2 focus:ring-blue-500"
                            placeholder="0.00"
                          />
                        </div>
                      )}
                    </td>

                    {/* Line Discount Input */}
                    <td className="py-3 px-3">
                      {isFinalized ? (
                        <span className="font-mono">{item.lineDiscountPercent}%</span>
                      ) : (
                        <div className="relative">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="100"
                            value={item.lineDiscountPercent || 0}
                            onChange={(e) => handleLineChange(index, 'lineDiscountPercent', parseFloat(e.target.value) || 0)}
                            className="w-full pr-5 pl-2 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-mono text-center text-gray-900 focus:ring-2 focus:ring-blue-500"
                          />
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">%</span>
                        </div>
                      )}
                    </td>

                    {/* Line Total */}
                    <td className="py-3 px-3 font-mono font-bold text-emerald-800">
                      ${(item.lineTotal || 0).toFixed(2)}
                    </td>

                    {/* Dispatch Warehouse */}
                    <td className="py-3 px-3">
                      {isFinalized ? (
                        <span className="text-[11px] text-gray-600">
                          {warehouses.find(w => w.id === item.sourceWarehouseId)?.name || 'Default Hub'}
                        </span>
                      ) : (
                        <select
                          value={item.sourceWarehouseId || ''}
                          onChange={(e) => handleLineChange(index, 'sourceWarehouseId', e.target.value)}
                          className="px-2 py-1 bg-white border border-gray-300 rounded-lg text-[11px] text-gray-800"
                        >
                          <option value="">Default Sales Hub</option>
                          {warehouses.map((wh) => (
                            <option key={wh.id} value={wh.id}>
                              {wh.code} ({wh.country})
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Commercial Financial Totals Panel */}
        <div className="border-t border-gray-100 pt-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Commercial Payment Terms
              </label>
              <select
                disabled={isFinalized}
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 font-semibold"
              >
                <option value="PREPAYMENT">100% Prepayment (Bank Wire / Invoice)</option>
                <option value="NET_30">Net 30 Days (Commercial Credit)</option>
                <option value="TT_DEPOSIT">30% Deposit, 70% Before Dispatch</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1">
                Quotation Message to Customer (Included in Email & Portal)
              </label>
              <textarea
                disabled={isFinalized}
                rows={3}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="e.g. Special bulk pricing applied. Inventory will dispatch within 24 hours of wire receipt."
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-200 space-y-3 font-mono">
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Lines Subtotal:</span>
              <span className="font-bold text-gray-900">${subtotal.toFixed(2)} {quote.currency}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Quoted Freight & Handling:</span>
              {isFinalized ? (
                <span className="font-bold text-gray-900">${(quote.shippingCost || 0).toFixed(2)}</span>
              ) : (
                <div className="flex items-center gap-1">
                  <span>$</span>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-right"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-xs text-gray-600">
              <span>Commercial Order Discount:</span>
              {isFinalized ? (
                <span className="font-bold text-rose-700">-${(quote.discountAmount || 0).toFixed(2)}</span>
              ) : (
                <div className="flex items-center gap-1">
                  <span>-$</span>
                  <input
                    type="number"
                    step="5"
                    min="0"
                    value={discountAmount}
                    onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                    className="w-24 px-2 py-1 bg-white border border-gray-300 rounded-lg text-xs font-bold text-right text-rose-700"
                  />
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-3 flex items-center justify-between text-sm">
              <span className="font-sans font-bold text-gray-900">Total Quoted Amount:</span>
              <span className="text-lg font-black text-emerald-800">
                ${finalTotal.toFixed(2)} {quote.currency}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Audit History Timeline */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Quotation Audit Timeline</h4>
        <div className="divide-y divide-gray-100 text-xs">
          {quote.statusHistory.map((hist) => (
            <div key={hist.id} className="py-2.5 flex items-start justify-between">
              <div>
                <span className="font-bold text-gray-900">
                  {hist.fromStatus ? `${hist.fromStatus} → ` : ''}{hist.toStatus}
                </span>
                <span className="ml-2 text-[11px] text-gray-500 font-mono">by {hist.changedByRole}</span>
                {hist.reason && <p className="text-gray-600 mt-0.5">{hist.reason}</p>}
              </div>
              <span className="text-[11px] text-gray-400 whitespace-nowrap">
                {new Date(hist.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Send Confirmation Modal */}
      {sendModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700">
                <Send size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Confirm & Transmit Quotation</h3>
                <p className="text-xs text-gray-500">Quote #{quote.quoteNumber}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-gray-700 bg-gray-50 p-4 rounded-xl">
              <p>Recipient: <strong className="text-gray-900">{quote.guestEmail || quote.user?.email}</strong></p>
              <p>Total Value: <strong className="text-emerald-700">${finalTotal.toFixed(2)} {quote.currency}</strong></p>
              <div>
                <label className="block text-xs font-bold text-gray-800 mb-1">
                  Validity Period (Days from Today)
                </label>
                <input
                  type="number"
                  min="1"
                  max="90"
                  value={validDays}
                  onChange={(e) => setValidDays(parseInt(e.target.value) || 7)}
                  className="w-full px-3 py-1.5 bg-white border border-gray-300 rounded-lg font-bold text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setSendModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handleSendQuote}
                disabled={sending}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white shadow transition disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #1e40af, #2563eb)' }}
              >
                {sending ? 'Transmitting...' : 'Send Official Quotation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
