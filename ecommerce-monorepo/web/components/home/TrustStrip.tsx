import { Container } from '@/components/ui/Container'
import { Shield, Truck, HeadphonesIcon, RotateCcw } from 'lucide-react'

const trustItems = [
  { icon: Shield, label: 'Secure Payments', sub: 'SSL encryption' },
  { icon: Truck, label: 'Global Shipping', sub: 'Worldwide delivery' },
  { icon: HeadphonesIcon, label: '24/7 Support', sub: 'Dedicated service' },
  { icon: RotateCcw, label: 'Easy Returns', sub: '30-day policy' },
]

export function TrustStrip() {
  return (
    <div className="bg-gray-50 border-b border-gray-100">
      <Container maxWidth="2xl">
        <div className="flex items-center justify-between py-3 md:py-3">
          {trustItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-2 md:gap-2.5">
                <Icon className="w-5 h-5 md:w-5 md:h-5 text-secondary-600 flex-shrink-0" />
                <span className="text-xs md:text-sm font-bold text-primary-600 whitespace-nowrap">{item.label}</span>
                <span className="hidden md:inline text-xs text-gray-500">— {item.sub}</span>
              </div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
