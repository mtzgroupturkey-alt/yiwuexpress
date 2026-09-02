import { SharedLayout } from '@/components/layout/SharedLayout'
import { TrustStrip } from '@/components/home/TrustStrip'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FlashDealsSection } from '@/components/home/FlashDealsSection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { BulkWholesaleBanner } from '@/components/home/BulkWholesaleBanner'
import { BestSellers } from '@/components/home/BestSellers'
import { NewArrivals } from '@/components/home/NewArrivals'
import { TestimonialSection } from '@/components/home/TestimonialSection'
import { BottomCta } from '@/components/home/BottomCta'

export default function Home() {
  return (
    <SharedLayout showHero={true}>
      {/* 1. Shopping Trust Strip: Direct Factory Pricing, Quality Inspected, Volume Tiers */}
      <TrustStrip />

      {/* 2. Shop by Category: Industrial Machinery, Power Tools, Workshop Hardware */}
      <div className="bg-gray-50/80 py-10 md:py-16">
        <CategoryGrid />
      </div>

      {/* 3. Limited Time Flash Deals & Factory Promotions */}
      <FlashDealsSection />

      {/* 4. Handpicked Featured Industrial Equipment & Tools */}
      <FeaturedProducts />

      {/* 5. B2B Wholesale & Custom Factory Sourcing RFQ Banner */}
      <BulkWholesaleBanner />

      {/* 6. Best Sellers & Customer Favorites */}
      <BestSellers />

      {/* 7. Trending New Factory Arrivals */}
      <div className="bg-gray-50/60 py-6">
        <NewArrivals />
      </div>

      {/* 8. Verified Customer Reviews & Quality Testimonials */}
      <TestimonialSection />

      {/* 9. Bottom Catalog Conversion CTA */}
      <BottomCta />
    </SharedLayout>
  )
}
