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
import { TrustBadgesMini } from '@/components/TrustBadgesMini'
import { useStoreMode } from '@/contexts/StoreModeContext'
import { useLocaleNav } from '@/hooks/useLocaleNav'
import { useLocale, useTranslations } from 'next-intl'

const buildCheckoutSchema = (t: (key: string, values?: any) => string) => z.object({
  customerName: z.string().min(2, t('errName')),
  customerEmail: z.string().email(t('errEmail')),
  customerPhone: z.string().min(8, t('errPhone')),
  companyName: z.string().optional(),
  shippingAddress: z.string().min(5, t('errAddress')),
  shippingCity: z.string().min(2, t('errCity')),
  shippingState: z.string().optional(),
  shippingPostalCode: z.string().min(3, t('errPostal')),
  shippingCountryId: z.string().min(1, t('errCountry')),
  paymentMethod: z.string().min(1, t('errPayment')),
  customerNotes: z.string().optional()
})

type CheckoutForm = z.infer<ReturnType<typeof buildCheckoutSchema>>

export default function CheckoutPage() {
  const router = useRouter()
  const navigate = useLocaleNav()
  const { storeMode, isWholesale, isRetail } = useStoreMode()
  const locale = useLocale()
  const t = useTranslations('Checkout') as unknown as (key: string, values?: any) => string
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
    resolver: zodResolver(buildCheckoutSchema(t))
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
      // âœ… MIGRATED TO COOKIE-BASED AUTH - cookies sent automatically
      const response = await fetch('/api/cart', {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login')
          return
        }
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()

      if (data.success) {
        if (!data.data.cart || data.data.cart.items.length === 0) {
          alert(t('cartEmpty'))
          navigate('/cart')
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
      const response = await fetch(`/api/countries?locale=${encodeURIComponent(locale || 'en')}`)
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
      alert(t('agreeTermsAlert'))
      return
    }

    if (!shippingMethod) {
      alert(t('selectShippingMethod'))
      return
    }

    setSubmitting(true)
    try {
      // âœ… MIGRATED TO COOKIE-BASED AUTH - userId extracted from cookie on server
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
          navigate('/login')
          return
        }
        throw new Error('Failed to create order')
      }

      const result = await response.json()

      if (result.success) {
        alert(t('orderPlaced'))
        navigate(`/orders/${result.data.id}`)
      } else {
        alert(result.error || t('failedCreateOrder'))
      }
    } catch (error) {
      console.error('Error creating order:', error)
      alert(t('failedCreateOrder'))
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
    { number: 1, title: t('stepShipping'), icon: MapPin },
    { number: 2, title: t('stepDelivery'), icon: Truck },
    { number: 3, title: t('stepPayment'), icon: CreditCard },
    { number: 4, title: t('stepReview'), icon: Check }
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
              onClick={() => navigate('/cart')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('backToCart')}
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
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
                      <CardTitle>{t('shippingAddress')}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerName">{t('fullName')} *</Label>
                          <Input id="customerName" {...register('customerName')} />
                          {errors.customerName && (
                            <p className="text-red-600 text-sm mt-1">{errors.customerName.message}</p>
                          )}
                        </div>
                        {isWholesale && (
                          <div>
                            <Label htmlFor="companyName">
                              {t('companyName')} {storeMode === 'WHOLESALE' ? '*' : ''}
                            </Label>
                            <Input 
                              id="companyName" 
                              {...register('companyName')} 
                              placeholder={isWholesale ? t('enterCompany') : t('optional')} 
                            />
                            {storeMode === 'WHOLESALE' && (
                              <p className="text-xs text-gray-600 mt-1">{t('requiredWholesale')}</p>
                            )}
                          </div>
                        )}
                        {!isWholesale && (
                          <div>
                            <Label htmlFor="companyName">{t('companyNameOptional')}</Label>
                            <Input id="companyName" {...register('companyName')} />
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="customerEmail">{t('email')} *</Label>
                          <Input id="customerEmail" type="email" {...register('customerEmail')} />
                          {errors.customerEmail && (
                            <p className="text-red-600 text-sm mt-1">{errors.customerEmail.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="customerPhone">{t('phone')} *</Label>
                          <Input id="customerPhone" type="tel" {...register('customerPhone')} />
                          {errors.customerPhone && (
                            <p className="text-red-600 text-sm mt-1">{errors.customerPhone.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="shippingAddress">{t('streetAddress')} *</Label>
                        <Input id="shippingAddress" {...register('shippingAddress')} />
                        {errors.shippingAddress && (
                          <p className="text-red-600 text-sm mt-1">{errors.shippingAddress.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="shippingCity">{t('city')} *</Label>
                          <Input id="shippingCity" {...register('shippingCity')} />
                          {errors.shippingCity && (
                            <p className="text-red-600 text-sm mt-1">{errors.shippingCity.message}</p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="shippingState">{t('stateProvince')}</Label>
                          <Input id="shippingState" {...register('shippingState')} />
                        </div>
                        <div>
                          <Label htmlFor="shippingPostalCode">{t('postalCode')} *</Label>
                          <Input id="shippingPostalCode" {...register('shippingPostalCode')} />
                          {errors.shippingPostalCode && (
                            <p className="text-red-600 text-sm mt-1">{errors.shippingPostalCode.message}</p>
                          )}
                        </div>
                      </div>

                      <div>
                          <Label htmlFor="shippingCountryId">{t('country')} *</Label>
                          <Controller
                            name="shippingCountryId"
                            control={control}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder={t('selectCountry')} />
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

                    {/* Wholesale-Specific Fields */}
                    {isWholesale && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                          <Package className="w-5 h-5 text-blue-600" />
                          {t('businessInfo')}
                          {storeMode === 'WHOLESALE' && (
                            <span className="text-xs font-normal text-gray-600">({t('requiredWholesale')})</span>
                          )}
                        </h3>
                        
                        <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
                          <div>
                            <Label htmlFor="businessLicense">{t('businessLicense')}</Label>
                            <Input 
                              id="businessLicense" 
                              placeholder={t('enterBusinessLicense')}
                              className="bg-white"
                            />
                            <p className="text-xs text-gray-600 mt-1">{t('optionalRecommended')}</p>
                          </div>

                          <div>
                            <Label htmlFor="taxId">{t('taxId')}</Label>
                            <Input 
                              id="taxId" 
                              placeholder={t('enterTaxId')}
                              className="bg-white"
                            />
                            <p className="text-xs text-gray-600 mt-1">{t('requiredForTaxExempt')}</p>
                          </div>

                          {storeMode === 'WHOLESALE' && (
                            <div className="pt-3 border-t border-blue-200">
                              <label className="flex items-start gap-3 cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                                <div>
                                  <span className="font-medium text-gray-900">{t('taxExemptCert')}</span>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {t('taxExemptDesc')}
                                  </p>
                                </div>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    <Button type="button" onClick={() => setStep(2)} className="w-full mt-6">
                      {t('continueShippingMethod')}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Step 2: Shipping Method */}
              {step === 2 && selectedCountryId && (
                <Card>
                    <CardHeader>
                      <CardTitle>{t('shippingMethod')}</CardTitle>
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
                            <p className="font-semibold">{t('standardShipping')}</p>
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
                            <p className="font-semibold">{t('expressShipping')}</p>
                          <p className="text-sm text-gray-600">
                            {countries.find(c => c.id === selectedCountryId)?.shippingMethods?.express?.estimatedDays}
                          </p>
                        </div>
                        <span className="font-bold">${shippingMethod === 'express' ? shippingFee.toFixed(2) : '---'}</span>
                      </label>
                    )}

                    <div className="flex gap-2">
                      <Button type="button" variant="outline" onClick={() => setStep(1)}>
                        {t('back')}
                      </Button>
                      <Button 
                        type="button" 
                        onClick={() => setStep(3)} 
                        disabled={!shippingMethod}
                        className="flex-1"
                      >
                        {t('continuePayment')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 3: Payment Method */}
              {step === 3 && (
                <Card>
                    <CardHeader>
                      <CardTitle>{t('paymentMethod')}</CardTitle>
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
                          <p className="font-semibold">{t('bankTransfer')}</p>
                          <p className="text-sm text-gray-600">{t('payViaBank')}</p>
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
                          <p className="font-semibold">{t('paypal')}</p>
                          <p className="text-sm text-gray-600">{t('paySecurelyPaypal')}</p>
                        </div>
                      </label>

                    {errors.paymentMethod && (
                      <p className="text-red-600 text-sm">{errors.paymentMethod.message}</p>
                    )}

                    <div className="py-2">
                      <TrustBadgesMini layout="row" className="bg-gray-50 p-3 rounded-lg justify-center" />
                    </div>

                      <div>
                        <Label htmlFor="customerNotes">{t('orderNotes')}</Label>
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
                          {t('back')}
                        </Button>
                        <Button type="button" onClick={() => setStep(4)} className="flex-1">
                          {t('reviewOrder')}
                        </Button>
                      </div>
                  </CardContent>
                </Card>
              )}

              {/* Step 4: Review */}
              {step === 4 && (
                <Card>
                    <CardHeader>
                      <CardTitle>{t('reviewYourOrder')}</CardTitle>
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
                          {t('agreeTerms')}
                        </Label>
                      </div>

                      <div className="flex gap-2">
                        <Button type="button" variant="outline" onClick={() => setStep(3)}>
                          {t('back')}
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={!agreeTerms || submitting}
                          className="flex-1"
                        >
                          {submitting ? t('placingOrder') : t('placeOrder')}
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
                        <CardTitle>{t('orderSummary')}</CardTitle>
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
                        <p className="text-xs text-gray-500">{t('qty', { n: item.quantity })}</p>
                      </div>
                      <p className="text-sm font-medium">
                        ${(item.product.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{t('subtotal')}</span>
                        <span>${cart?.summary.subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>{t('shipping')}</span>
                        <span>{shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : t('tbd')}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold border-t pt-2">
                        <span>{t('total')}</span>
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
