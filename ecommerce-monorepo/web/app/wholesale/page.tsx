'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SharedLayout } from '@/components/layout/SharedLayout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function WholesalePage() {
  const router = useRouter()
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
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
        },
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
        pageTitle="Inquiry Submitted Successfully!"
        pageDescription="Thank you for your wholesale inquiry"
        breadcrumbs={[
          { name: 'Wholesale', href: '/wholesale' }
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
              <CardTitle className="text-3xl">Inquiry Submitted Successfully!</CardTitle>
              <CardDescription className="text-base mt-2">
                Thank you for your wholesale inquiry. Our team will review your request and contact you within 24-48 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="font-medium text-blue-900 mb-2">📋 What happens next?</p>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <span className="font-bold mr-2">1.</span>
                    <span>Our B2B team will review your inquiry and product requirements</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">2.</span>
                    <span>We'll prepare a detailed quotation with pricing and terms</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">3.</span>
                    <span>You'll receive a personalized quote via email</span>
                  </li>
                  <li className="flex items-start">
                    <span className="font-bold mr-2">4.</span>
                    <span>We can discuss and negotiate terms to meet your needs</span>
                  </li>
                </ul>
              </div>
              <div className="flex gap-4">
                <Button onClick={() => router.push('/')} variant="outline" className="flex-1">
                  Back to Home
                </Button>
                <Button onClick={() => router.push('/dashboard')} className="flex-1">
                  View My Inquiries
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
      pageTitle="Wholesale Inquiry"
      pageDescription="Looking to purchase in bulk? Submit your wholesale inquiry and our B2B team will provide you with competitive pricing"
      breadcrumbs={[
        { name: 'Wholesale', href: '/wholesale' }
      ]}
      backgroundImage="/images/wholesale-bg.jpg"
    >
      <div className="bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4">

        <Card>
          <CardHeader>
            <CardTitle>Company Information</CardTitle>
            <CardDescription>Tell us about your business</CardDescription>
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
                  <Label htmlFor="companyName">Company Name *</Label>
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
                  <Label htmlFor="businessType">Business Type *</Label>
                  <select
                    id="businessType"
                    name="businessType"
                    value={formData.businessType}
                    onChange={handleChange}
                    required
                    disabled={isLoading}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="wholesaler">Wholesaler</option>
                    <option value="retailer">Retailer</option>
                    <option value="distributor">Distributor</option>
                    <option value="manufacturer">Manufacturer</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="country">Country *</Label>
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
                  <Label htmlFor="contactName">Contact Name</Label>
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
                  <Label htmlFor="email">Email Address *</Label>
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
                  <Label htmlFor="phone">Phone Number</Label>
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
                <h3 className="text-lg font-semibold mb-4">Product Requirements</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productInterests">Product Interests *</Label>
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
                      <Label htmlFor="targetQuantity">Target Quantity (units)</Label>
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
                      <Label htmlFor="targetPrice">Target Price (USD per unit)</Label>
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
                <h3 className="text-lg font-semibold mb-4">Shipping & Payment Terms</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">Payment Terms</Label>
                    <select
                      id="paymentTerms"
                      name="paymentTerms"
                      value={formData.paymentTerms}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="T/T">T/T (Bank Transfer)</option>
                      <option value="L/C">L/C (Letter of Credit)</option>
                      <option value="30_70">30% Deposit + 70% Before Shipment</option>
                      <option value="50_50">50% Deposit + 50% Before Shipment</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shippingTerms">Shipping Terms</Label>
                    <select
                      id="shippingTerms"
                      name="shippingTerms"
                      value={formData.shippingTerms}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="FOB">FOB (Free on Board)</option>
                      <option value="CIF">CIF (Cost, Insurance, Freight)</option>
                      <option value="EXW">EXW (Ex Works)</option>
                      <option value="DDP">DDP (Delivered Duty Paid)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="preferredShipping">Preferred Shipping</Label>
                    <select
                      id="preferredShipping"
                      name="preferredShipping"
                      value={formData.preferredShipping}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="sea">Sea Freight</option>
                      <option value="air">Air Freight</option>
                      <option value="express">Express Courier</option>
                    </select>
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <Label htmlFor="requiredDeliveryDate">Required Delivery Date</Label>
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
                <Label htmlFor="additionalNotes">Additional Notes</Label>
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
                <p className="font-medium mb-2">🤝 Why Choose YIWU EXPRESS for Wholesale?</p>
                <ul className="space-y-1 ml-4 list-disc">
                  <li>Direct access to Yiwu manufacturers and suppliers</li>
                  <li>Competitive bulk pricing and flexible MOQ</li>
                  <li>Quality inspection and export documentation</li>
                  <li>Global shipping and customs clearance support</li>
                  <li>Dedicated account manager for B2B customers</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting Inquiry...
                  </>
                ) : (
                  'Submit Wholesale Inquiry'
                )}
              </Button>

              <p className="text-xs text-center text-gray-600">
                By submitting this form, you agree to our Terms of Service and Privacy Policy. Our team will contact you within 24-48 business hours.
              </p>
            </CardContent>
          </form>
        </Card>
      </div>
    </div>
    </SharedLayout>
  )
}
