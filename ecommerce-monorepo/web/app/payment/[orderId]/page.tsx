'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, CreditCard, Building2, Wallet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  status: string
  paymentStatus: string
  paymentMethod: string
  total: number
  subtotal: number
  shippingFee: number
  customerName: string
  customerEmail: string
}

type PaymentStage = 'idle' | 'processing' | 'success' | 'error'

export default function PaymentPage() {
  const params = useParams()
  const router = useRouter()
  const orderId = params.orderId as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stage, setStage] = useState<PaymentStage>('idle')
  const [stageMessage, setStageMessage] = useState('')

  useEffect(() => {
    if (orderId) fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        credentials: 'include',
      })
      const data = await response.json()
      if (data.success) {
        if (data.data.paymentStatus === 'PAID') {
          setStage('success')
          setStageMessage('This order has already been paid.')
        }
        setOrder(data.data)
      } else {
        setError(data.error || 'Order not found')
      }
    } catch {
      setError('Failed to load order')
    } finally {
      setLoading(false)
    }
  }

  const handleStripePayment = async () => {
    setStage('processing')
    setStageMessage('Creating payment...')
    try {
      const res = await fetch('/api/payments/stripe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to create payment')

      const stripeLib = await import('@stripe/stripe-js')
      const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
      const stripe = await stripeLib.loadStripe(publishableKey)
      if (!stripe) throw new Error('Failed to load Stripe')

      const { error: stripeError } = await stripe.confirmCardPayment(data.clientSecret)
      if (stripeError) throw new Error(stripeError.message || 'Payment failed')

      setStage('success')
      setStageMessage('Payment successful! Redirecting...')
      setTimeout(() => router.push(`/orders/${orderId}`), 2000)
    } catch (err: any) {
      setStage('error')
      setStageMessage(err.message || 'Payment failed. Please try again.')
    }
  }

  const handlePayPalPayment = async () => {
    setStage('processing')
    setStageMessage('Redirecting to PayPal...')
    try {
      const res = await fetch('/api/payments/paypal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ orderId }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed to create PayPal order')
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl
      } else {
        throw new Error('No PayPal approval URL returned')
      }
    } catch (err: any) {
      setStage('error')
      setStageMessage(err.message || 'Failed to initiate PayPal payment.')
    }
  }

  const handleBankTransfer = () => {
    setStage('success')
    setStageMessage('Order placed! Please complete the bank transfer using the instructions below.')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-800 text-lg mb-4">{error || 'Order not found'}</p>
            <Button onClick={() => router.push('/orders')}>
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (stage === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Payment {order.paymentStatus === 'PAID' ? 'Received' : 'Initiated'}</h2>
            <p className="text-gray-600 mb-6">{stageMessage}</p>
            <Button onClick={() => router.push(`/orders/${orderId}`)}>
              View Order Details
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderPaymentForm = () => {
    const method = order.paymentMethod

    if (method === 'CREDIT_CARD' || method === 'stripe') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">Secure Payment via Stripe</p>
            <p>Your payment is processed securely through Stripe. We do not store your card details.</p>
          </div>
          <Button
            onClick={handleStripePayment}
            disabled={stage === 'processing'}
            className="w-full"
            size="lg"
          >
            {stage === 'processing' ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...</>
            ) : (
              <><CreditCard className="w-5 h-5 mr-2" /> Pay ${order.total.toFixed(2)}</>
            )}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            You will be prompted to enter your card details via Stripe's secure payment form.
          </p>
        </div>
      )
    }

    if (method === 'PAYPAL' || method === 'paypal') {
      return (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">PayPal Checkout</p>
            <p>You will be redirected to PayPal to complete your payment securely.</p>
          </div>
          <Button
            onClick={handlePayPalPayment}
            disabled={stage === 'processing'}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {stage === 'processing' ? (
              <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Redirecting...</>
            ) : (
              <><Wallet className="w-5 h-5 mr-2" /> Pay with PayPal</>
            )}
          </Button>
        </div>
      )
    }

    if (method === 'BANK_TRANSFER' || method === 'bank_transfer') {
      return (
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm">
            <p className="font-semibold text-yellow-800 mb-2">Bank Transfer Instructions</p>
            <div className="space-y-1 text-yellow-700">
              <p><strong>Bank:</strong> Bank of China, Yiwu Branch</p>
              <p><strong>Account Name:</strong> YIWU EXPRESS TRADING CO., LTD</p>
              <p><strong>Account Number:</strong> 1234 5678 9012 3456</p>
              <p><strong>SWIFT/BIC:</strong> BKCHCNBJ</p>
              <p className="mt-2"><strong>Amount:</strong> ${order.total.toFixed(2)} USD</p>
              <p><strong>Reference:</strong> {order.orderNumber}</p>
            </div>
          </div>
          <div className="bg-gray-50 border rounded-lg p-4 text-sm text-gray-600">
            <p>Please include your order number <strong>#{order.orderNumber}</strong> as the payment reference. Your order will be processed once the payment is confirmed.</p>
          </div>
          <Button
            onClick={handleBankTransfer}
            className="w-full"
            size="lg"
            variant="outline"
          >
            <Building2 className="w-5 h-5 mr-2" /> I Will Pay via Bank Transfer
          </Button>
        </div>
      )
    }

    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unknown payment method: {method}</p>
        <Button onClick={() => router.push(`/orders/${orderId}`)} className="mt-4">
          Back to Order
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Button variant="ghost" size="sm" onClick={() => router.push(`/orders/${orderId}`)}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Order
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Complete Payment</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-lg">
        {stage === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-semibold text-red-800">Payment Failed</p>
              <p className="text-red-700 text-sm">{stageMessage}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => setStage('idle')}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Order #{order.orderNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Shipping</span>
                <span>${order.shippingFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span className="text-primary">${order.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <span className="font-semibold text-gray-700">Payment Method</span>
                <Badge variant="secondary">{order.paymentMethod.replace('_', ' ')}</Badge>
              </div>
              {renderPaymentForm()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
