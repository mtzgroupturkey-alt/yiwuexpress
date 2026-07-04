import { Container } from '@/components/ui/Container'
import { Shield, Truck, HeadphonesIcon, RotateCcw } from 'lucide-react'

const trustItems = [
  {
    icon: Shield,
    title: 'Secure Payments',
    description: 'Protected by SSL encryption',
  },
  {
    icon: Truck,
    title: 'Global Shipping',
    description: 'Worldwide delivery available',
  },
  {
    icon: HeadphonesIcon,
    title: '24/7 Support',
    description: 'Dedicated customer service',
  },
  {
    icon: RotateCcw,
    title: 'Easy Returns',
    description: '30-day return policy',
  },
]

export function TrustSection() {
  return (
    <section className="bg-gray-50 py-12 md:py-16">
      <Container maxWidth="2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          {trustItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.title} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-100 text-primary-600 mb-3">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.description}</p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
