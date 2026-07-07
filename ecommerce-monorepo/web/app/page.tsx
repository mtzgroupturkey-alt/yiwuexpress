import { SharedLayout } from '@/components/layout/SharedLayout'
import { TrustStrip } from '@/components/home/TrustStrip'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { NewArrivals } from '@/components/home/NewArrivals'
import { BottomCta } from '@/components/home/BottomCta'
import { AboutYiwuExpress } from '@/components/home/AboutYiwuExpress'
import { Container } from '@/components/ui/Container'

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

      {/* About Yiwu Express - Comprehensive section with stats, features, and timeline */}
      <AboutYiwuExpress />

      {/* Bottom CTA */}
      <BottomCta />
    </SharedLayout>
  )
}

