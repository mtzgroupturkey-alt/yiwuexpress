'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Trash2, Truck } from 'lucide-react'

const countrySchema = z.object({
  code: z.string().min(2, 'Country code is required').max(2, 'Country code must be 2 characters'),
  name: z.string().min(2, 'Country name is required'),
  currency: z.string().min(3, 'Currency code is required').max(3, 'Currency must be 3 characters'),
  currencySymbol: z.string().min(1, 'Currency symbol is required').max(3),
  flag: z.string().optional(),
  deliverySLA: z.string().optional(),
  isActive: z.boolean().default(true)
})

type CountryForm = z.infer<typeof countrySchema>

interface ShippingRate {
  id: string
  carrier: string
  serviceType: string
  baseRate: number
  ratePerKg: number
  estimatedDays: string
}

export default function EditCountryPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CountryForm>({
    resolver: zodResolver(countrySchema)
  })

  useEffect(() => {
    fetchCountry()
  }, [params.id])

  const fetchCountry = async () => {
    try {
      const response = await fetch(`/api/admin/countries/${params.id}`)
      const data = await response.json()

      if (data.success && data.data) {
        const country = data.data
        reset({
          code: country.code,
          name: country.name,
          currency: country.currency,
          currencySymbol: country.currencySymbol,
          flag: country.flag || '',
          deliverySLA: country.deliverySLA || '',
          isActive: country.isActive
        })
        setShippingRates(country.shippingRates || [])
      } else {
        alert('Country not found')
        router.push('/admin/countries')
      }
    } catch (error) {
      console.error('Error fetching country:', error)
      alert('Failed to load country')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: CountryForm) => {
    setSubmitting(true)
    try {
      const countryData = {
        code: data.code.toUpperCase(),
        name: data.name,
        currency: data.currency.toUpperCase(),
        currencySymbol: data.currencySymbol,
        flag: data.flag || null,
        deliverySLA: data.deliverySLA || null,
        isActive: data.isActive
      }

      const response = await fetch(`/api/admin/countries/${params.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(countryData)
      })

      const result = await response.json()

      if (result.success) {
        alert('Country updated successfully!')
        router.push('/admin/countries')
      } else {
        alert(result.error || 'Failed to update country')
      }
    } catch (error) {
      console.error('Error updating country:', error)
      alert('Failed to update country')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this country? This action cannot be undone.')) {
      return
    }

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/countries/${params.id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.success) {
        alert('Country deleted successfully!')
        router.push('/admin/countries')
      } else {
        alert(result.error || 'Failed to delete country')
      }
    } catch (error) {
      console.error('Error deleting country:', error)
      alert('Failed to delete country')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading country...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <h1 className="text-3xl font-bold text-gray-900">Edit Country</h1>
            <p className="text-gray-600">Update country configuration</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="text-red-600 border-red-600 hover:bg-red-50"
          onClick={handleDelete}
          disabled={deleting}
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {deleting ? 'Deleting...' : 'Delete Country'}
        </Button>
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
              </CardContent>
            </Card>

            {/* Shipping Rates */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Shipping Rates ({shippingRates.length})
                  </CardTitle>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled
                  >
                    Add Rate (Coming Soon)
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {shippingRates.length > 0 ? (
                  <div className="space-y-3">
                    {shippingRates.map((rate) => (
                      <div key={rate.id} className="p-4 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-semibold">{rate.carrier} - {rate.serviceType}</p>
                            <p className="text-sm text-gray-500">
                              Estimated: {rate.estimatedDays || 'N/A'}
                            </p>
                          </div>
                          <Badge variant="secondary">Active</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-gray-600">Base Rate</p>
                            <p className="font-semibold">${rate.baseRate.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Per KG Rate</p>
                            <p className="font-semibold">${rate.ratePerKg.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Truck className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p>No shipping rates configured yet</p>
                    <p className="text-sm mt-1">Add rates to enable shipping to this country</p>
                  </div>
                )}
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
                    Configure shipping methods (Standard, Express, Sea Freight) from the Shipping Rates section
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    ShippingMethods JSON structure with rates and estimated delivery times
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">📋 Customs Rules</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Configure duty rates, VAT rates, threshold amounts, and required documents
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Coming soon: Customs rules configuration interface
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">💳 Payment Methods</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Select accepted payment methods: Bank Transfer, Crypto, PayPal, Stripe
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Coming soon: Payment method selection interface
                  </p>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-2">🚫 Restricted Products</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Define product categories that cannot be shipped to this country
                  </p>
                  <p className="text-sm text-gray-500 italic">
                    Coming soon: Dangerous goods, batteries, liquids, food items restrictions
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
                  {submitting ? 'Updating...' : 'Update Country'}
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

            {/* Statistics */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping Rates:</span>
                  <span className="font-semibold">{shippingRates.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Orders (Total):</span>
                  <span className="font-semibold">Coming Soon</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Revenue (Total):</span>
                  <span className="font-semibold">Coming Soon</span>
                </div>
              </CardContent>
            </Card>

            {/* Help */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Tips</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600 space-y-2">
                <p>💡 <strong>Currency Symbol:</strong> Used for displaying prices</p>
                <p>📦 <strong>Delivery SLA:</strong> Expected delivery times for shipping methods</p>
                <p>🚚 <strong>Shipping Rates:</strong> Configure from the dedicated ShippingRate model</p>
                <p>⚠️ <strong>Inactive Countries:</strong> Hidden from checkout but data is preserved</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  )
}
