import { SharedLayout } from '@/components/layout/SharedLayout'
import { ShopByCategory } from '@/components/home/ShopByCategory'
import { TrustStrip } from '@/components/home/TrustStrip'
import { MarketplaceTabbedShowcase } from '@/components/home/MarketplaceTabbedShowcase'
import { FlashDealsSection } from '@/components/home/FlashDealsSection'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { BulkWholesaleBanner } from '@/components/home/BulkWholesaleBanner'
import { TestimonialSection } from '@/components/home/TestimonialSection'
import { BottomCta } from '@/components/home/BottomCta'

export default function Home() {
  return (
    <SharedLayout showHero={true}>
      {/* 1. Shopping Trust Strip: Direct Factory Pricing, Quality Inspected, Volume Tiers (After Hero Slider) */}
      <TrustStrip />

      {/* 2. Shop by Category Navigation Strip (Category Hub) */}
      <ShopByCategory />

      {/* 3. Modern Segmented Marketplace Showcase (5element / emall style) */}
      <MarketplaceTabbedShowcase />

      {/* 4. Limited Time Flash Deals & Factory Promotions */}
      <FlashDealsSection />

      {/* 5. B2B Wholesale & Custom Factory Sourcing RFQ Banner */}
      <BulkWholesaleBanner />

      {/* 6. Handpicked Featured Industrial Equipment & Tools */}
      <FeaturedProducts />

      {/* 8. Verified Customer Reviews & Quality Testimonials */}
      <TestimonialSection />

      {/* 9. Bottom Catalog Conversion CTA */}
      <BottomCta />
    </SharedLayout>
  )
}
