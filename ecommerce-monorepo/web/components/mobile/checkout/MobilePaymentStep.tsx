'use client'

import React from 'react'
import { CreditCard, ShieldCheck, Building2, Wallet, Check, AlertCircle } from 'lucide-react'
import { useLocale } from 'next-intl'

export interface PaymentMethodOption {
  id: string
  name: string
  description?: string
  iconType?: 'card' | 'paypal' | 'bank' | 'escrow'
}

interface MobilePaymentStepProps {
  selectedPaymentMethod: string
  onSelectPaymentMethod: (methodId: string) => void
  agreeTerms: boolean
  onToggleAgreeTerms: (checked: boolean) => void
  error?: string
  className?: string
}

const DEFAULT_PAYMENT_METHODS: PaymentMethodOption[] = [
  {
    id: 'card',
    name: 'Credit / Debit Card',
    description: 'Instant settlement via Visa, Mastercard, or UnionPay',
    iconType: 'card',
  },
  {
    id: 'paypal',
    name: 'PayPal Global Wallet',
    description: 'Safe online payments with PayPal Buyer Protection',
    iconType: 'paypal',
  },
  {
    id: 'bank_transfer',
    name: 'Telegraphic Wire Transfer (T/T)',
    description: 'Direct B2B commercial invoice for international banking',
    iconType: 'bank',
  },
  {
    id: 'trade_assurance',
    name: 'Trade Assurance Escrow',
    description: 'Funds released to supplier only upon customs inspection signoff',
    iconType: 'escrow',
  },
]

export function MobilePaymentStep({
  selectedPaymentMethod,
  onSelectPaymentMethod,
  agreeTerms,
  onToggleAgreeTerms,
  error,
  className = '',
}: MobilePaymentStepProps) {
  const locale = useLocale()

  const getIcon = (type?: string) => {
    switch (type) {
      case 'paypal':
        return Wallet
      case 'bank':
        return Building2
      case 'escrow':
        return ShieldCheck
      default:
        return CreditCard
    }
  }

  return (
    <div
      data-testid="mobile-payment-step"
      className={`space-y-4 ${className}`}
    >
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 space-y-3 shadow-2xs">
        <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-slate-400">
          {locale === 'zh' ? '选择支付方式' : locale === 'ru' ? 'Способ оплаты' : 'Payment Method'}
        </h3>

        {/* Payment Methods List */}
        <div className="space-y-2.5">
          {DEFAULT_PAYMENT_METHODS.map((pm) => {
            const isSelected = selectedPaymentMethod === pm.id
            const Icon = getIcon(pm.iconType)

            return (
              <button
                key={pm.id}
                type="button"
                onClick={() => onSelectPaymentMethod(pm.id)}
                className={`w-full min-h-[58px] p-3.5 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-98 touch-manipulation ${
                  isSelected
                    ? 'bg-primary-50/60 dark:bg-primary-950/30 border-primary-600 dark:border-primary-500 ring-2 ring-primary-500/20 shadow-2xs'
                    : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                      {pm.name}
                    </p>
                    {pm.description && (
                      <p className="text-[10px] text-gray-400 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {pm.description}
                      </p>
                    )}
                  </div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-300 dark:border-slate-600'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5" />}
                </div>
              </button>
            )
          })}
        </div>

        {error && (
          <p className="text-[11px] text-red-500 font-semibold flex items-center gap-1 pt-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </p>
        )}
      </div>

      {/* Terms Agreement Checkbox */}
      <div className="bg-white dark:bg-[#0f172a] rounded-2xl border border-gray-200/80 dark:border-slate-800 p-4 shadow-2xs">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={agreeTerms}
            onChange={(e) => onToggleAgreeTerms(e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded text-primary-600 focus:ring-primary-500 shrink-0"
          />
          <span className="text-xs text-gray-600 dark:text-slate-300 leading-relaxed">
            {locale === 'zh'
              ? '我已阅读并同意《用户服务协议》、《全球贸易物流保障条例》与退款政策。'
              : locale === 'ru'
              ? 'Я принимаю условия обслуживания, правила международной доставки и политику возврата.'
              : 'I agree to the Terms of Service, International Trade Shipping Policy, and Buyer Protection terms.'}
          </span>
        </label>
      </div>
    </div>
  )
}
