'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useLocale } from 'next-intl'
import { MobileHeader } from '../MobileHeader'
import { MobileCheckoutSteps } from './MobileCheckoutSteps'
import { MobileOrderSummaryCard, CheckoutSummaryItem } from './MobileOrderSummaryCard'
import { MobileAddressStep, AddressFormData } from './MobileAddressStep'
import { MobileShippingStep, ShippingMethodOption } from './MobileShippingStep'
import { MobilePaymentStep } from './MobilePaymentStep'
import { MobileCheckoutStickyBar } from './MobileCheckoutStickyBar'

export interface CheckoutSubmitPayload {
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName?: string
  shippingAddress: string
  shippingCity: string
  shippingState?: string
  shippingPostalCode: string
  shippingCountryId: string
  shippingMethod: string
  paymentMethod: string
  customerNotes?: string
  agreeTerms: boolean
}

interface MobileCheckoutPageProps {
  items: CheckoutSummaryItem[]
  subtotal: number
  shippingFee: number
  totalWeight?: number
  countries: Array<{ id: string; name: string; code?: string }>
  shippingMethods?: ShippingMethodOption[]
  initialFormData?: Partial<AddressFormData>
  onSubmitOrder: (payload: CheckoutSubmitPayload) => Promise<void> | void
  isSubmitting?: boolean
  onBackToCart?: () => void
  className?: string
}

export function MobileCheckoutPage({
  items,
  subtotal,
  shippingFee,
  totalWeight = 0,
  countries,
  shippingMethods,
  initialFormData,
  onSubmitOrder,
  isSubmitting = false,
  onBackToCart,
  className = '',
}: MobileCheckoutPageProps) {
  const router = useRouter()
  const locale = useLocale()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<AddressFormData>({
    customerName: initialFormData?.customerName || '',
    customerEmail: initialFormData?.customerEmail || '',
    customerPhone: initialFormData?.customerPhone || '',
    companyName: initialFormData?.companyName || '',
    shippingAddress: initialFormData?.shippingAddress || '',
    shippingCity: initialFormData?.shippingCity || '',
    shippingState: initialFormData?.shippingState || '',
    shippingPostalCode: initialFormData?.shippingPostalCode || '',
    shippingCountryId: initialFormData?.shippingCountryId || '',
    customerNotes: initialFormData?.customerNotes || '',
  })

  const [shippingMethod, setShippingMethod] = useState('standard')
  const [paymentMethod, setPaymentMethod] = useState('card')
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const total = subtotal + shippingFee

  const validateAddress = () => {
    const errs: Record<string, string> = {}
    if (!formData.customerName.trim()) errs.customerName = 'Name is required'
    if (!formData.customerEmail.trim()) errs.customerEmail = 'Email is required'
    if (!formData.customerPhone.trim()) errs.customerPhone = 'Phone is required'
    if (!formData.shippingCountryId) errs.shippingCountryId = 'Select a country'
    if (!formData.shippingAddress.trim()) errs.shippingAddress = 'Address is required'
    if (!formData.shippingCity.trim()) errs.shippingCity = 'City is required'
    if (!formData.shippingPostalCode.trim()) errs.shippingPostalCode = 'Postal code is required'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleNext = () => {
    if (step === 1) {
      if (validateAddress()) {
        setStep(2)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    } else if (step === 2) {
      if (!shippingMethod) {
        setErrors({ shippingMethod: 'Please select a delivery method' })
        return
      }
      setStep(3)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (step === 3) {
      if (!paymentMethod) {
        setErrors({ paymentMethod: 'Please select a payment method' })
        return
      }
      if (!agreeTerms) {
        setErrors({ paymentMethod: 'You must accept the terms to proceed' })
        return
      }

      onSubmitOrder({
        ...formData,
        shippingMethod,
        paymentMethod,
        agreeTerms,
      })
    }
  }

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else if (onBackToCart) {
      onBackToCart()
    } else {
      router.push(`/${locale}/cart`)
    }
  }

  return (
    <div
      data-testid="mobile-checkout-page"
      className={`md:hidden flex flex-col min-h-screen bg-gray-50 dark:bg-[#0b1120] pt-[calc(56px+env(safe-area-inset-top,0px))] pb-28 ${className}`}
    >
      {/* 1. Header with contextual back button */}
      <MobileHeader
        showBack={true}
        onBack={handleBack}
        title={
          step === 1
            ? locale === 'zh' ? '收货地址' : locale === 'ru' ? 'Адрес доставки' : 'Shipping Address'
            : step === 2
            ? locale === 'zh' ? '配送方式' : locale === 'ru' ? 'Способ доставки' : 'Delivery Method'
            : locale === 'zh' ? '结算支付' : locale === 'ru' ? 'Оплата заказа' : 'Payment & Place Order'
        }
        showSearchToggle={false}
      />

      {/* 2. Step Progress Tabs */}
      <MobileCheckoutSteps
        currentStep={step}
        onStepClick={(targetStep) => setStep(targetStep)}
      />

      {/* 3. Main Step Body */}
      <div className="p-3.5 space-y-3.5">
        {/* Collapsible Order Summary Accordion */}
        <MobileOrderSummaryCard
          items={items}
          subtotal={subtotal}
          shippingFee={shippingFee}
          total={total}
        />

        {/* Step 1: Address */}
        {step === 1 && (
          <MobileAddressStep
            formData={formData}
            onChange={(fields) => {
              setFormData((prev) => ({ ...prev, ...fields }))
              setErrors({})
            }}
            countries={countries}
            errors={errors}
          />
        )}

        {/* Step 2: Delivery */}
        {step === 2 && (
          <MobileShippingStep
            methods={shippingMethods}
            selectedMethod={shippingMethod}
            onSelectMethod={(m) => {
              setShippingMethod(m)
              setErrors({})
            }}
            totalWeight={totalWeight}
          />
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <MobilePaymentStep
            selectedPaymentMethod={paymentMethod}
            onSelectPaymentMethod={(pm) => {
              setPaymentMethod(pm)
              setErrors({})
            }}
            agreeTerms={agreeTerms}
            onToggleAgreeTerms={(v) => {
              setAgreeTerms(v)
              setErrors({})
            }}
            error={errors.paymentMethod}
          />
        )}
      </div>

      {/* 4. Sticky Bottom Action Bar */}
      <MobileCheckoutStickyBar
        currentStep={step}
        total={total}
        onNext={handleNext}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
