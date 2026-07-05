'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Check, CreditCard, MapPin, Package, Truck } from 'lucide-react'

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Name is required'),
  customerEmail: z.string().email('Valid email is required'),
  customerPhone: z.string().min(8, 'Valid phone number is required'),
  companyName: z.string().optional(),
  shippingAddress: z.string().min(5, 'Address is required'),
  shippingCity: z.string().min(2, 'City is required'),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().min(3, 'Postal code is required'),
  shippingCountryId: z.string().min(1, 'Country is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  customerNotes: z.string().optional()
})

type CheckoutForm = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [cart, setCart] = useState<any>(null)
  const [countries, setCountries] = useState<any[]>([])
  const [shippingMethod, setShippingMethod] = useState('')
  const [shippingFee, setShippingFee] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [agreeTerms, setAgreeTerms] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    control,
    formState: { errors }
  } = useForm<CheckoutForm>({
    resolver: zodResolver(checkoutSchema)
  })

  const selectedCountryId = watch('shippingCountryId')

  useEffect(() => {
    fetchCart()
    fetchCountries()
  }, [])

  useEffect(() => {
    if (selectedCountryId && cart) {
      calculateShipping()
    }
  }, [selectedCountryId, shippingMethod])

  const fetchCart = async () => {
    try {
      // ✅ MIGRATED TO COOKIE-BASED AUTH - cookies sent automatically
      const response = await fetch('/api/cart', {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()

      if (data.success) {
        if (!data.data.cart || data.data.cart.items.length === 0) {
          alert('Your cart is empty')
          router.push('/cart')
          return
        }
        setCart(data.data)
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      alert('Failed to load cart')
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    try {
      const response = await fetch('/api/countries')
      const data = await response.json()
      if (data.success) {
        setCountries(data.data.filter((c: any) => c.isActive))
      }
    } catch (error) {
      console.error('Error fetching countries:', error)
    }
  }

  const calculateShipping = async () => {
    if (!selectedCountryId || !cart) return

    try {
      const country = countries.find(c => c.id === selectedCountryId)
      if (!country) return

      // Simple calculation based on weight
      const weight = cart.summary.totalWeight
      const shippingMethods = country.shippingMethods

      if (shippingMethod === 'standard' && shippingMethods.standard?.enabled) {
        const fee = shippingMethods.standard.baseRate + (weight * shippingMethods.standard.ratePerKg)
        setShippingFee(fee)
      } else if (shippingMethod === 'express' && shippingMethods.express?.enabled) {
        const fee = shippingMethods.express.baseRate + (weight * shippingMethods.express.ratePerKg)
        setShippingFee(fee)
      } else {
        setShippingFee(0)
      }
    } catch (error) {
      console.error('Error calculating shipping:', error)
    }
  }

  const onSubmit = async (data: CheckoutForm) => {
    if (!agreeTerms) {
      alert('Please agree to the terms and conditions')
      return
    }

    if (!shippingMethod) {
      alert('Please select a shipping method')
      return
    }

    setSubmitting(true)
    try {
      // ✅ MIGRATED TO COOKIE-BASED AUTH - userId extracted from cookie on server
      const orderData = {
        ...data,
        items: cart.cart.items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity
        })),
        shippingFee,
        tax: 0,
        discount: 0
      }

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include', // Send httpOnly cookie
        body: JSON.stringify(orderData)
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login')
          return
        }
        throw new Error('Failed to create order')
      }

      const result = await response.json()

      if (result.success) {
        alert('Order placed successfully!')
        router.push(`/orders/${result.data.id}`)
      } else {
        alert(result.error || 'Failed to create order')
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Failed to create order')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  const steps = [
    { number: 1, title: 'Shipping', icon: MapPin },
    { number: 2, title: 'Delivery', icon: Truck },
    { number: 3, title: 'Payment', icon: CreditCard },
    { number: 4, title: 'Review', icon: Check }
  ]

  const total = cart ? cart.summary.subtotal + shippingFee : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/cart')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Cart
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mt-6">
            {steps.map((s, index) => {
              const Icon = s.icon
              const isActive = step === s.number
              const isCompleted = step > s.number
              
              return (
                <div key={s.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-500 text-white' :
                      isActive ? 'bg-primary text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>
                      {s.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-2 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form */}
            <div className="lg:col-span-2 space-y-6">
              {/* Step 1: Shipping Address */}
              {step === 1 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Address</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerName">Full Name *</Label>
                        <Input id="customerName" {...register('customerName')} />
                        {errors.customerName && (
                          <p className="text-red-600 text-sm mt-1">{errors.customerName.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="companyName">Company Name</Label>
                        <Input id="companyName" {...register('companyName')} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="customerEmail">Email *</Label>
                        <Input id="customerEmail" type="email" {...register('customerEmail')} />
                        {errors.customerEmail && (
                          <p className="text-red-600 text-sm mt-1">{errors.customerEmail.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="customerPhone">Phone *</Label>
                        <Input id="customerPhone" type="tel" {...register('customerPhone')} />
                        {errors.customerPhone && (
                          <p className="text-red-600 text-sm mt-1">{errors.customerPhone.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="shippingAddress">Street Address *</Label>
                      <Input id="shippingAddress" {...register('shippingAddress')} />
                      {errors.shippingAddress && (
                        <p className="text-red-600 text-sm mt-1">{errors.shippingAddress.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="shippingCity">City *</Label>
                        <Input id="shippingCity" {...register('shippingCity')} />
                        {errors.shippingCity && (
                          <p className="text-red-600 text-sm mt-1">{errors.shippingCity.message}</p>
                        )}
                      </div>
                      <div>
                        <Label htmlFor="shippingState">State/Province</Label>
                        <Input id="shippingState" {...register('shippingState')} />
                      </div>
                      <div>
                        <Label htmlFor="shippingPostalCode">Postal Code *</Label>
                        <Input id="shippingPostalCode" {...register('shippingPostalCode')} />
                        {errors.shippingPostalCode && (
                          <p className="text-red-600 text-sm mt-1">{errors.shippingPostalCode.message}</p>
                        )}
                      </div>
                    </div>

                    <div>
                        <Label htmlFor="shippingCountryId">Country *</Label>
                        <Controller
                          name="shippingCountryId"
                          control={control}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select Country" />
                              </SelectTrigger>
                              <SelectContent>
                                {countries.map(country => (
                                  <SelectItem key={country.id} value={country.id}>
                                    {country.flag} {country.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.shippingCountryId && (
                          <p className="text-red-600 text-sm mt-1">{errors.shippingCountryId.message}</p>
                        )}
                      </div>

                    <Button type="button" onClick={() => setStep(2)} className="w-full">
                      Continue to Shipping Method
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Shipping Method */}
              {step === 2 && selectedCountryId && (
                <Card>
                  <CardHeader>
                    <CardTitle>Shipping Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {countries.find(c => c.id === selectedCountryId)?.shippingMethods?.standard?.enabled && (
                      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <input
                          type="radio"
                          name="shipping"
                          value="standard"
                          checked={shippingMethod === 'standard'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">Standard Shipping</p>
                          <p className="text-sm text-gray-600">
                            {countries.find(c => c.id === selectedCountryId)?.shippingMethods?.standard?.estimatedDays}
                          </p>
                        </div>
                        <span className="font-bold">${shippingMethod === 'standard' ? shippingFee.toFixed(2) : '---'}</span>
                      </label>
                    )}

                    {countries.find(c => c.id === selectedCountryId)?.shippingMethods?.express?.enabled && (
                      <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer hover:border-primary">
                        <input
                          type="radio"
                          name="shipping"
                          value="express"
                          checked={shippingMethod === 'express'}
                          onChange={(e) => setShippingMethod(e.target.value)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="font-semibold">Express Shipping</p>
                          <p className="text-sm text-gray-600">
                            {countries.find(c => c.id === selectedCountryId)?.shippingMethods?.express?.estimatedDays}
                          </p>
                        </div>
                        <span className="font-bold">${shippingMethod === 'express' ? shippingFee.toFixed(2) : '---'}</span>
                      </label>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        Back
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setStep(3)} 
                        disabled={!shippingMethod}
                        className="flex-1"
                      >
                        Continue to Payment
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Payment Method */}
              {step === 3 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Payment Method</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        value="BANK_TRANSFER"
                        {...register('paymentMethod')}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-semibold">Bank Transfer</p>
                        <p className="text-sm text-gray-600">Pay via bank transfer</p>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-4 border rounded-lg cursor-pointer">
                      <input
                        type="radio"
                        value="PAYPAL"
                        {...register('paymentMethod')}
                        className="w-4 h-4"
                      />
                      <div>
                        <p className="font-semibold">PayPal</p>
                        <p className="text-sm text-gray-600">Pay securely with PayPal</p>
                      </div>
                    </label>

                    {errors.paymentMethod && (
                      <p className="text-red-600 text-sm">{errors.paymentMethod.message}</p>
                    )}

                    <div>
                      <Label htmlFor="customerNotes">Order Notes (Optional)</Label>
                      <textarea
                        id="customerNotes"
                        {...register('customerNotes')}
                        className="w-full border border-gray-300 rounded-md p-2 text-sm"
                        rows={3}
                        placeholder="Any special instructions for your order..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(2)}>
                        Back
                      </Button>
                      <Button type="button" onClick={() => setStep(4)} className="flex-1">
                        Review Order
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Review Your Order</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="terms"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="terms" className="cursor-pointer">
                        I agree to the terms and conditions
                      </Label>
                    </div>

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(3)}>
                        Back
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={!agreeTerms || submitting}
                        className="flex-1"
                      >
                        {submitting ? 'Placing Order...' : 'Place Order'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Order Summary */}
            <div>
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart && cart.cart.items.map((item: any) => (
                    <div key={item.id} className="flex gap-3">
                      <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0 relative">
                        {item.product.thumbnail && (
                          <Image 
                            src={item.product.thumbnail} 
                            alt={item.product.name} 
                            fill
                            sizes="64px"
                            className="object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-medium">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>${cart?.summary.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Shipping</span>
                      <span>{shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : 'TBD'}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>Total</span>
                      <span className="text-primary">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
