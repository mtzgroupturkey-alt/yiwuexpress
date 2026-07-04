import { SharedLayout } from '@/components/layout/SharedLayout'
import { TrustStrip } from '@/components/home/TrustStrip'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { NewArrivals } from '@/components/home/NewArrivals'
import { StatsTrustSection } from '@/components/home/StatsTrustSection'
import { BottomCta } from '@/components/home/BottomCta'

export default function Home() {
  return (
    <SharedLayout showHero={true}>
      {/* Trust Strip */}
      <TrustStrip />

      {/* Shop by Category */}
      <div className="bg-gray-50 py-8 md:py-12">
        <CategoryGrid />
      </div>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* New Arrivals */}
      <NewArrivals />

      {/* Stats + Trust Section (merged) */}
      <StatsTrustSection />

      {/* Bottom CTA */}
      <BottomCta />
    </SharedLayout>
  )
}
