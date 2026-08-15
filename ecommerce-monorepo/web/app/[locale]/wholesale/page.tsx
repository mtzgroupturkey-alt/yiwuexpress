'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLocaleNav } from '@/hooks/useLocaleNav'

export default function WholesalePage() {
  const t = useTranslations('Wholesale')
  const router = useRouter()
  const navigate = useLocaleNav()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    companyName: '',
    businessType: 'wholesaler',
    country: '',
    contactName: '',
    email: '',
    phone: '',
    productInterests: '',
    targetQuantity: '',
    targetPrice: '',
    paymentTerms: 'T/T',
    shippingTerms: 'FOB',
    preferredShipping: 'sea',
    requiredDeliveryDate: '',
    additionalNotes: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/wholesale', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          companyName: formData.companyName,
          businessType: formData.businessType,
          country: formData.country,
          products: [{ 
            productName: formData.productInterests,
            quantity: parseInt(formData.targetQuantity) || 0,
            targetPrice: parseFloat(formData.targetPrice) || 0,
          }],
          paymentTerms: formData.paymentTerms,
          shippingTerms: formData.shippingTerms,
          preferredShipping: formData.preferredShipping,
          requiredDeliveryDate: formData.requiredDeliveryDate ? new Date(formData.requiredDeliveryDate) : null,
          targetPrice: parseFloat(formData.targetPrice) || null,
          estimatedOrderValue: parseFloat(formData.targetPrice) * parseInt(formData.targetQuantity) || null,
          customerNotes: formData.additionalNotes,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit inquiry')
      }

      setSuccess(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <SharedLayout 
        pageTitle={t('success.pageTitle')}
        pageDescription={t('success.pageDescription')}
        breadcrumbs={[
          { name: t('breadcrumb'), href: '/wholesale' }
        ]}
      >
        <div className="bg-gray-50 py-12">
          <div className="max-w-3xl mx-auto px-4">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <CardTitle className="text-3xl">{t('success.title')}</CardTitle>
              <CardDescription className="text-base mt-2">
                {t('success.description')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-2">{t('success.whatNext')}</p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>{t('success.step1')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>{t('success.step2')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>{t('success.step3')}</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">4.</span>
                    <span>{t('success.step4')}</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/')} variant="outline" className="flex-1">
                  {t('success.backHome')}
                </Button>
                <Button onClick={() => navigate('/dashboard')} className="flex-1">
                  {t('success.viewInquiries')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SharedLayout>
    )
  }

  return (
    <SharedLayout 
      pageTitle={t('pageTitle')}
      pageDescription={t('pageDescription')}
      breadcrumbs={[
        { name: t('breadcrumb'), href: '/wholesale' }
      ]}
      backgroundImage="/images/wholesale-bg.jpg"
    >
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">

        <Card>
          <CardHeader>
            <CardTitle>{t('companyInfo.title')}</CardTitle>
            <CardDescription>{t('companyInfo.description')}</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800">
                  {error}
                </div>
              )}

              {/* Company Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">{t('form.companyName')}</Label>
                  <Input
                    id="companyName"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="businessType">{t('form.businessType')}</Label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="wholesaler">{t('businessType.wholesaler')}</option>
                    <option value="retailer">{t('businessType.retailer')}</option>
                    <option value="distributor">{t('businessType.distributor')}</option>
                    <option value="manufacturer">{t('businessType.manufacturer')}</option>
                    <option value="other">{t('businessType.other')}</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">{t('form.country')}</Label>
                  <Input
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="e.g., United States"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">{t('form.contactName')}</Label>
                  <Input
                    id="contactName"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('form.email')}</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{t('form.phone')}</Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">{t('form.productRequirements')}</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productInterests">{t('form.productInterests')}</Label>
                    <textarea
                      id="productInterests"
                      name="productInterests"
                      value={formData.productInterests}
                      onChange={handleChange}
                      rows={3}
                      required
                      disabled={isLoading}
                      placeholder="Describe the products you're interested in purchasing..."
                      className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="targetQuantity">{t('form.targetQuantity')}</Label>
                      <Input
                        id="targetQuantity"
                        name="targetQuantity"
                        type="number"
                        value={formData.targetQuantity}
                        onChange={handleChange}
                        placeholder="e.g., 1000"
                        disabled={isLoading}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="targetPrice">{t('form.targetPrice')}</Label>
                      <Input
                        id="targetPrice"
                        name="targetPrice"
                        type="number"
                        step="0.01"
                        value={formData.targetPrice}
                        onChange={handleChange}
                        placeholder="e.g., 25.00"
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">{t('form.shippingPaymentTerms')}</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="paymentTerms">{t('form.paymentTerms')}</Label>
                  <select
                    id="paymentTerms"
                    name="paymentTerms"
                    value={formData.paymentTerms}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="T/T">{t('paymentTerms.tt')}</option>
                    <option value="L/C">{t('paymentTerms.lc')}</option>
                    <option value="30_70">{t('paymentTerms.30_70')}</option>
                    <option value="50_50">{t('paymentTerms.50_50')}</option>
                  </select>
                  </div>

                  <div className="space-y-2">
                  <Label htmlFor="shippingTerms">{t('form.shippingTerms')}</Label>
                  <select
                    id="shippingTerms"
                    name="shippingTerms"
                    value={formData.shippingTerms}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="FOB">{t('shippingTerms.fob')}</option>
                    <option value="CIF">{t('shippingTerms.cif')}</option>
                    <option value="EXW">{t('shippingTerms.exw')}</option>
                    <option value="DDP">{t('shippingTerms.ddp')}</option>
                  </select>
                  </div>

                  <div className="space-y-2">
                  <Label htmlFor="preferredShipping">{t('form.preferredShipping')}</Label>
                  <select
                    id="preferredShipping"
                    name="preferredShipping"
                    value={formData.preferredShipping}
                    onChange={handleChange}
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="sea">{t('preferredShipping.sea')}</option>
                    <option value="air">{t('preferredShipping.air')}</option>
                    <option value="express">{t('preferredShipping.express')}</option>
                  </select>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="requiredDeliveryDate">{t('form.requiredDeliveryDate')}</Label>
                  <Input
                    id="requiredDeliveryDate"
                    name="requiredDeliveryDate"
                    type="date"
                    value={formData.requiredDeliveryDate}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="additionalNotes">{t('form.additionalNotes')}</Label>
                <textarea
                  id="additionalNotes"
                  name="additionalNotes"
                  value={formData.additionalNotes}
                  onChange={handleChange}
                  rows={4}
                  disabled={isLoading}
                  placeholder="Any additional information, special requirements, or questions..."
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-sm text-gray-700">
                <p className="font-medium mb-2">{t('whyChoose.title')}</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>{t('whyChoose.point1')}</li>
                  <li>{t('whyChoose.point2')}</li>
                  <li>{t('whyChoose.point3')}</li>
                  <li>{t('whyChoose.point4')}</li>
                  <li>{t('whyChoose.point5')}</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      {t('submitting')}
                    </>
                  ) : (
                    t('submit')
                  )}
                </Button>

                <p className="text-xs text-center text-gray-600">
                  {t('footerNote')}
                </p>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
    </SharedLayout>
  )
}
