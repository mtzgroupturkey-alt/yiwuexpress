'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, MessageSquare, DollarSign, Package, CheckCircle } from 'lucide-react'
import { useAdminLocale } from '../../contexts/AdminLocaleContext'

interface WholesaleInquiry {
  id: string
  companyName: string
  contactName: string
  email: string
  phone?: string
  status: string
  quantity?: number
  products?: Array<{ quantity?: number; name?: string; targetPrice?: number }>
  targetPrice?: number
  message?: string
  deliveryAddress?: any
  adminNotes?: string
  internalNotes?: string
  priority?: string
  createdAt: string
  user?: {
    name?: string
    firstName?: string
    lastName?: string
    email: string
    phone?: string
  }
  quotedPrice?: number
  quotedBy?: string
  quotedAt?: string
  quoteValidUntil?: string
  quoteNotes?: string
  quotes?: Array<{ id: string; status: string; unitPrice: number; quantity?: number; totalPrice: number; validUntil: string; createdAt: string; notes?: string }>
}

export default function AdminWholesaleDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { dict, locale, t } = useAdminLocale()
  const [inquiry, setInquiry] = useState<WholesaleInquiry | null>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)

  // Status update
  const [newStatus, setNewStatus] = useState('')

  // Quote form
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [quoteData, setQuoteData] = useState({
    unitPrice: '',
    quantity: '',
    validUntil: '',
    notes: ''
  })

  useEffect(() => {
    fetchInquiry()
  }, [params.id])

  const fetchInquiry = async () => {
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        setInquiry(data.data)
        setNewStatus(data.data.status)
        setQuoteData(prev => ({
          ...prev,
          quantity: data.data.quantity?.toString() || (Array.isArray(data.data.products) ? data.data.products.reduce((s: number, p: any) => s + (p?.quantity || 0), 0).toString() : '')
        }))
      } else {
        alert(dict.wholesale.inquiryNotFound)
        router.push('/admin/wholesale')
      }
    } catch (error) {
      console.error('Error fetching inquiry:', error)
      alert(dict.common.errorOccurred)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!newStatus) {
      alert(dict.wholesale.newStatus)
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })

      const result = await response.json()

      if (result.success) {
        alert(dict.wholesale.statusUpdatedSuccess)
        fetchInquiry()
      } else {
        alert(result.error || dict.common.errorOccurred)
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert(dict.common.errorOccurred)
    } finally {
      setUpdating(false)
    }
  }

  const handleCreateQuote = async () => {
    if (!quoteData.unitPrice || !quoteData.quantity) {
      alert(dict.currencies.fillRequired)
      return
    }

    const unitPrice = parseFloat(quoteData.unitPrice)
    const quantity = parseInt(quoteData.quantity)
    const totalPrice = unitPrice * quantity

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitPrice,
          quantity,
          totalPrice,
          validUntil: quoteData.validUntil,
          notes: quoteData.notes
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(dict.wholesale.quoteCreatedSuccess)
        setShowQuoteForm(false)
        setQuoteData({
          unitPrice: '',
          quantity: inquiry?.quantity?.toString() || (Array.isArray(inquiry?.products) ? inquiry.products.reduce((s: number, p: any) => s + (p?.quantity || 0), 0).toString() : ''),
          validUntil: '',
          notes: ''
        })
        fetchInquiry()
      } else {
        alert(result.error || dict.common.errorOccurred)
      }
    } catch (error) {
      console.error('Error creating quote:', error)
      alert(dict.common.errorOccurred)
    } finally {
      setUpdating(false)
    }
  }

  const handleConvertToOrder = async () => {
    if (!confirm(`${dict.wholesale.convertToOrder}?`)) {
      return
    }

    setUpdating(true)
    try {
      const response = await fetch(`/api/admin/wholesale/${params.id}/convert`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod: 'bank_transfer',
          shippingAddress: inquiry?.deliveryAddress,
          billingAddress: inquiry?.deliveryAddress
        })
      })

      const result = await response.json()

      if (result.success) {
        alert(dict.wholesale.convertedOrderSuccess)
        router.push(`/admin/orders/${result.data.id}`)
      } else {
        alert(result.error || dict.common.errorOccurred)
      }
    } catch (error) {
      console.error('Error converting to order:', error)
      alert(dict.common.errorOccurred)
    } finally {
      setUpdating(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      new: 'bg-blue-100 text-blue-800',
      reviewing: 'bg-yellow-100 text-yellow-800',
      quoted: 'bg-purple-100 text-purple-800',
      negotiating: 'bg-orange-100 text-orange-800',
      accepted: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      converted: 'bg-teal-100 text-teal-800',
      expired: 'bg-gray-100 text-gray-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">{dict.wholesale.loadingInquiry}</p>
        </div>
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">{dict.wholesale.inquiryNotFound}</p>
        </div>
      </div>
    )
  }

  const hasAcceptedQuote = inquiry.quotes?.some(q => q.status === 'accepted')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin/wholesale')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {dict.wholesale.backToInquiries}
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{inquiry.companyName}</h1>
            <p className="text-gray-600">
              {dict.wholesale.submittedOn} {new Date(inquiry.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
            </p>
          </div>
        </div>
        <Badge className={getStatusColor(inquiry.status)}>
          {t(inquiry.status.toUpperCase(), inquiry.status.toUpperCase())}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Inquiry Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                {dict.wholesale.inquiryDetails}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">{dict.wholesale.quantityRequested}</p>
                  <p className="text-lg font-semibold">
                    {typeof inquiry.quantity === 'number'
                      ? `${inquiry.quantity.toLocaleString()} ${dict.purchaseOrders.itemsCount}`
                      : Array.isArray(inquiry.products) && inquiry.products.length > 0
                      ? `${inquiry.products.reduce((s: number, p: any) => s + (p?.quantity || 0), 0).toLocaleString()} ${dict.purchaseOrders.itemsCount}`
                      : dict.common.noData}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">{dict.wholesale.targetPrice}</p>
                  <p className="text-lg font-semibold">
                    {inquiry.targetPrice ? `$${inquiry.targetPrice.toFixed(2)}` : dict.common.noData}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-2">{dict.wholesale.message}</p>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm whitespace-pre-wrap">{inquiry.message || dict.common.noData}</p>
                </div>
              </div>

              {inquiry.deliveryAddress && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">{dict.wholesale.deliveryAddress}</p>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(inquiry.deliveryAddress, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quotes */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  {dict.wholesale.quotesCount.replace('{count}', (inquiry.quotes?.length || 0).toString())}
                </CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowQuoteForm(!showQuoteForm)}
                >
                  {showQuoteForm ? dict.common.cancel : dict.wholesale.createQuote}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showQuoteForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
                  <h3 className="font-semibold">{dict.wholesale.newQuote}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="unitPrice">{dict.wholesale.unitPrice} ($) *</Label>
                      <Input
                        id="unitPrice"
                        type="number"
                        step="0.01"
                        value={quoteData.unitPrice}
                        onChange={(e) => setQuoteData({ ...quoteData, unitPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="quantity">{dict.wholesale.quantity} *</Label>
                      <Input
                        id="quantity"
                        type="number"
                        value={quoteData.quantity}
                        onChange={(e) => setQuoteData({ ...quoteData, quantity: e.target.value })}
                      />
                    </div>
                  </div>
                  {quoteData.unitPrice && quoteData.quantity && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-semibold">
                        {dict.orders.totalAmount}: ${(parseFloat(quoteData.unitPrice) * parseInt(quoteData.quantity)).toFixed(2)}
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="validUntil">{dict.wholesale.validUntil}</Label>
                    <Input
                      id="validUntil"
                      type="date"
                      value={quoteData.validUntil}
                      onChange={(e) => setQuoteData({ ...quoteData, validUntil: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quoteNotes">{dict.wholesale.notes}</Label>
                    <textarea
                      id="quoteNotes"
                      value={quoteData.notes}
                      onChange={(e) => setQuoteData({ ...quoteData, notes: e.target.value })}
                      rows={3}
                      className="w-full border border-gray-300 rounded-md p-2 text-sm"
                    />
                  </div>
                  <Button onClick={handleCreateQuote} disabled={updating}>
                    {updating ? dict.wholesale.creating : dict.wholesale.createQuote}
                  </Button>
                </div>
              )}

              {inquiry.quotes && inquiry.quotes.length > 0 ? (
                <div className="space-y-4">
                  {inquiry.quotes.map((quote) => (
                    <div key={quote.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-sm text-gray-600">{dict.wholesale.unitPrice}</p>
                          <p className="text-xl font-bold">${quote.unitPrice.toFixed(2)}</p>
                        </div>
                        <Badge className={getStatusColor(quote.status)}>
                          {t(quote.status.toUpperCase(), quote.status.toUpperCase())}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-gray-600">{dict.wholesale.quantity}</p>
                          <p className="font-semibold">
                            {typeof quote.quantity === 'number'
                              ? `${quote.quantity.toLocaleString()} ${dict.purchaseOrders.itemsCount}`
                              : dict.common.noData}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">{dict.orders.totalAmount}</p>
                          <p className="font-semibold">${quote.totalPrice.toFixed(2)}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">{dict.wholesale.validUntil}</p>
                          <p className="font-semibold">
                            {new Date(quote.validUntil).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600">{dict.common.createdAt}</p>
                          <p className="font-semibold">
                            {new Date(quote.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                          </p>
                        </div>
                      </div>
                      {quote.notes && (
                        <div className="mt-3 p-2 bg-gray-50 rounded">
                          <p className="text-sm text-gray-700">{quote.notes}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">{dict.wholesale.noQuotesYet}</p>
              )}
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle>{dict.wholesale.contactInfo}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">{dict.wholesale.contactName}</p>
                <p className="font-medium">{inquiry.contactName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">{dict.users.email}</p>
                <p className="font-medium">{inquiry.email}</p>
              </div>
              {inquiry.phone && (
                <div>
                  <p className="text-sm text-gray-600">{dict.users.phone}</p>
                  <p className="font-medium">{inquiry.phone}</p>
                </div>
              )}
              {inquiry.user && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-gray-600 mb-2">{dict.wholesale.customerAccount}</p>
                  <p className="font-medium">
                    {inquiry.user.firstName} {inquiry.user.lastName}
                  </p>
                  <p className="text-sm text-gray-600">{inquiry.user.email}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status Management */}
          <Card>
            <CardHeader>
              <CardTitle>{dict.wholesale.updateStatus}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="status">{dict.wholesale.newStatus}</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value) => setNewStatus(value)}
                >
                  <option value="new">{dict.status.NEW}</option>
                  <option value="reviewing">{dict.status.PENDING}</option>
                  <option value="quoted">{dict.status.APPROVED}</option>
                  <option value="negotiating">{dict.status.PROCESSING}</option>
                  <option value="accepted">{dict.status.COMPLETED}</option>
                  <option value="rejected">{dict.status.REJECTED}</option>
                  <option value="converted">{dict.status.RESOLVED}</option>
                  <option value="expired">{dict.status.CANCELLED}</option>
                </Select>
              </div>

              <Button
                onClick={handleStatusUpdate}
                disabled={updating || newStatus === inquiry.status}
                className="w-full"
              >
                {updating ? dict.wholesale.updating : dict.wholesale.updateStatus}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{dict.wholesale.quickActions}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setShowQuoteForm(true)}
              >
                <DollarSign className="w-4 h-4 mr-2" />
                {dict.wholesale.createQuote}
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleConvertToOrder}
                disabled={!hasAcceptedQuote || inquiry.status === 'converted'}
              >
                <Package className="w-4 h-4 mr-2" />
                {dict.wholesale.convertToOrder}
              </Button>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>{dict.wholesale.activityTimeline}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-2 h-2 mt-2 bg-blue-600 rounded-full"></div>
                  <div>
                    <p className="text-sm font-medium">{dict.wholesale.inquirySubmitted}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(inquiry.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                    </p>
                  </div>
                </div>
                {inquiry.quotes && inquiry.quotes.map((quote) => (
                  <div key={quote.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-2 h-2 mt-2 bg-purple-600 rounded-full"></div>
                    <div>
                      <p className="text-sm font-medium">{dict.wholesale.quoteCreated}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(quote.createdAt).toLocaleString(locale === 'zh' ? 'zh-CN' : locale === 'ru' ? 'ru-RU' : 'en-US')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
