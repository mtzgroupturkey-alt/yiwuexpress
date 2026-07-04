import { Container } from '@/components/ui/Container'
import { Package, Building2, Globe, Award, Store, ShieldCheck, Combine, FileText } from 'lucide-react'

const stats = [
  { icon: Package, value: '10K+', label: 'Products' },
  { icon: Building2, value: '500+', label: 'Suppliers' },
  { icon: Globe, value: '50+', label: 'Countries Served' },
  { icon: Award, value: '15+', label: 'Years Experience' },
]

const sourcingItems = [
  {
    icon: Store,
    title: 'Direct from Yiwu Market',
    description: 'Source directly from 75,000+ suppliers, no middlemen markups.',
  },
  {
    icon: ShieldCheck,
    title: 'Quality Inspection',
    description: 'Every order checked before shipping to ensure product standards.',
  },
  {
    icon: Combine,
    title: 'Consolidated Shipping',
    description: 'Combine orders from multiple suppliers into one cost-effective shipment.',
  },
  {
    icon: FileText,
    title: 'Low MOQ / Flexible Orders',
    description: 'Order small quantities to test products before scaling up.',
  },
]

export function StatsTrustSection() {
  return (
    <section className="py-16 md:py-20 bg-white">
      <Container maxWidth="2xl">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-bold text-primary-500">
            Why Choose Yiwu Express?
          </h2>
          <p className="text-gray-500 mt-3 max-w-2xl mx-auto text-sm md:text-base">
            We connect you with China&apos;s largest wholesale market — quality products, reliable service, global reach.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-14">
          {stats.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.label} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary-50 text-primary-500 mb-4">
                  <Icon className="w-7 h-7" />
                </div>
                <p className="text-3xl md:text-4xl font-bold text-primary-500">{item.value}</p>
                <p className="text-sm text-gray-500 mt-1">{item.label}</p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {sourcingItems.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.title}
                className="group bg-white rounded-2xl p-6 text-center shadow-sm hover:shadow-md border border-gray-100 transition-all duration-300"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary-50 text-primary-500 group-hover:bg-secondary-50 group-hover:text-secondary-500 transition-colors duration-300 mb-4">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-primary-500 mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.description}</p>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
