import { useTranslations } from 'next-intl'
import { Container } from '@/components/ui/Container'
import { Shield, Truck, HeadphonesIcon, RotateCcw } from 'lucide-react'

const trustItems = [
  { icon: Shield, labelKey: 'securePayments', subKey: 'securePaymentsSub' },
  { icon: Truck, labelKey: 'globalShipping', subKey: 'globalShippingSub' },
  { icon: HeadphonesIcon, labelKey: 'support247', subKey: 'support247Sub' },
  { icon: RotateCcw, labelKey: 'easyReturns', subKey: 'easyReturnsSub' },
]

export function TrustStrip() {
  const t = useTranslations('Home.trust')
  return (
    <div className="bg-gray-50 border-b border-gray-100">
      <Container maxWidth="2xl">
        <div className="flex items-center justify-between py-3 md:py-3">
          {trustItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.labelKey} className="flex items-center gap-2 md:gap-2.5">
                <Icon className="w-5 h-5 md:w-5 md:h-5 text-secondary-600 flex-shrink-0" />
                <span className="text-xs md:text-sm font-bold text-primary-600 whitespace-nowrap">{t(item.labelKey as any)}</span>
                <span className="hidden md:inline text-xs text-gray-500">— {t(item.subKey as any)}</span>
              </div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
