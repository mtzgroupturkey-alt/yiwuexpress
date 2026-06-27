'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Save } from 'lucide-react'

const countrySchema = z.object({
  code: z.string().min(2, 'Country code is required (e.g., US, CN)').max(2, 'Country code must be 2 characters'),
  name: z.string().min(2, 'Country name is required'),
  currency: z.string().min(3, 'Currency code is required (e.g., USD, CNY)').max(3, 'Currency must be 3 characters'),
  currencySymbol: z.string().min(1, 'Currency symbol is required (e.g., $, ¥)').max(3),
  flag: z.string().optional(),
  deliverySLA: z.string().optional(),
  isActive: z.boolean()
})

type CountryForm = z.infer<typeof countrySchema>

export default function NewCountryPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<CountryForm>({
    resolver: zodResolver(countrySchema),
    defaultValues: {
      currency: 'USD',
      currencySymbol: '$',
      isActive: true
    }
  })

  const onSubmit = async (data: CountryForm) => {
    setSubmitting(true)
    try {
      const countryData = {
        code: data.code.toUpperCase(),
        name: data.name,
        currency: data.currency.toUpperCase(),
        currencySymbol: data.currencySymbol,
        flag: data.flag || null,
        deliverySLA: data.deliverySLA || 'Standard: 7-10 days',
        isActive: data.isActive
      }

      const response = await fetch('/api/admin/countries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countryData)
      })

      const result = await response.json()

      if (result.success) {
        alert('Country created successfully!')
        router.push('/admin/countries')
      } else {
        alert(result.error || 'Failed to create country')
      }
    } catch (error) {
      console.error('Error creating country:', error)
      alert('Failed to create country')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/admin/countries')}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Add New Country</h1>
          <p className="text-gray-600">Configure a new shipping destination</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="code">Country Code *</Label>
                    <Input
                      id="code"
                      {...register('code')}
                      placeholder="US, CN, GB, etc."
                      maxLength={2}
                      className="uppercase"
                    />
                    {errors.code && (
                      <p className="text-red-600 text-sm mt-1">{errors.code.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">2-letter ISO code</p>
                  </div>
                  <div>
                    <Label htmlFor="name">Country Name *</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      placeholder="United States, China, United Kingdom, etc."
                    />
                    {errors.name && (
                      <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="currency">Currency Code *</Label>
                    <Input
                      id="currency"
                      {...register('currency')}
                      placeholder="USD, CNY, EUR, etc."
                      maxLength={3}
                      className="uppercase"
                    />
                    {errors.currency && (
                      <p className="text-red-600 text-sm mt-1">{errors.currency.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">3-letter currency code</p>
                  </div>
                  <div>
                    <Label htmlFor="currencySymbol">Currency Symbol *</Label>
                    <Input
                      id="currencySymbol"
                      {...register('currencySymbol')}
                      placeholder="$, ¥, €, etc."
                      maxLength={3}
                    />
                    {errors.currencySymbol && (
                      <p className="text-red-600 text-sm mt-1">{errors.currencySymbol.message}</p>
                    )}
                    <p className="text-sm text-gray-500 mt-1">Currency symbol for display</p>
                  </div>
                </div>

                <div>
                  <Label htmlFor="flag">Flag (Emoji or URL)</Label>
                  <Input
                    id="flag"
                    {...register('flag')}
                    placeholder="🇺🇸 or URL to flag image"
                  />
                  {errors.flag && (
                    <p className="text-red-600 text-sm mt-1">{errors.flag.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">Emoji or image URL</p>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Delivery Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="deliverySLA">Delivery SLA</Label>
                  <Input
                    id="deliverySLA"
                    {...register('deliverySLA')}
                    placeholder="Standard: 7-10 days, Express: 3-5 days"
                  />
                  {errors.deliverySLA && (
                    <p className="text-red-600 text-sm mt-1">{errors.deliverySLA.message}</p>
                  )}
                  <p className="text-sm text-gray-500 mt-1">
                    Expected delivery timeframes for different shipping methods
                  </p>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-sm text-blue-900 mb-2">ℹ️ About Delivery SLA</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Define expected delivery times for each shipping method</li>
                    <li>• Format: "Method: X-Y days, Method2: X-Y days"</li>
                    <li>• Example: "Standard: 7-10 days, Express: 3-5 days, Sea: 30-45 days"</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Additional Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📦 Shipping Methods</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    After creating this country, configure shipping methods (Standard, Express, Sea Freight) with rates and estimated delivery times.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Note: Shipping method configuration available after country creation
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📋 Customs Rules</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Configure duty rates, VAT rates, threshold amounts, and required documentation for customs clearance.
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Note: Customs rules configuration available after country creation
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">💳 Payment Methods</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Select accepted payment methods for this country (Bank Transfer, Crypto, PayPal, Stripe, etc.)
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Note: Payment method configuration available after country creation
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">🚫 Restricted Products</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Define product categories that cannot be shipped to this country (dangerous goods, batteries, liquids, etc.)
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Note: Product restriction configuration available after country creation
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status */}
            <Card>
              <CardHeader>
                <CardTitle>Status</CardTitle>
              </CardHeader>
              <CardContent>
                <label className="flex items-center gap-2">
                  <input type="checkbox" {...register('isActive')} className="w-4 h-4" />
                  <div>
                    <span className="text-sm font-medium">Active</span>
                    <p className="text-xs text-gray-500">
                      Customers can ship to this country
                    </p>
                  </div>
                </label>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <Button type="submit" className="w-full" disabled={submitting}>
                  <Save className="w-4 h-4 mr-2" />
                  {submitting ? 'Creating...' : 'Create Country'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/countries')}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Guide</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p><strong>Required Fields:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Country Code (2 letters)</li>
                  <li>Country Name</li>
                  <li>Currency Code (3 letters)</li>
                  <li>Currency Symbol</li>
                </ul>
                <p className="pt-2"><strong>Next Steps:</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Configure shipping methods</li>
                  <li>Set customs rules</li>
                  <li>Select payment methods</li>
                  <li>Define product restrictions</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
