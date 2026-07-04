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
        <div className="flex items-center justify-between py-2.5 md:py-3">
          {trustItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="flex items-center gap-1.5 md:gap-2.5">
                <Icon className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary-500 flex-shrink-0" />
                <span className="text-[11px] md:text-xs font-semibold text-primary-500 whitespace-nowrap">{item.label}</span>
                <span className="hidden md:inline text-[11px] text-gray-400">— {item.sub}</span>
              </div>
            )
          })}
        </div>
      </Container>
    </div>
  )
}
