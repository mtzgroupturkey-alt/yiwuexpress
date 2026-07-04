import { SharedLayout } from '@/components/layout/SharedLayout'
import { CategoryGrid } from '@/components/home/CategoryGrid'
import { FeaturedProducts } from '@/components/home/FeaturedProducts'
import { NewArrivals } from '@/components/home/NewArrivals'
import { BestSellers } from '@/components/home/BestSellers'
import { SpecialOffers } from '@/components/home/SpecialOffers'
import { TrustSection } from '@/components/home/TrustSection'
import BlogSection from '@/components/BlogSection'
import { Container } from '@/components/ui/Container'

export default function Home() {
  return (
    <SharedLayout showHero={true}>
      {/* Shop by Category */}
      <div className="bg-gray-50 py-8 md:py-12">
        <CategoryGrid />
      </div>

      {/* Featured Products */}
      <FeaturedProducts />

      {/* New Arrivals */}
      <NewArrivals />

      {/* Best Sellers - only shown if data available */}
      <BestSellers />

      {/* Special Offers - only shown if sale products exist */}
      <SpecialOffers />

      {/* Trust Section */}
      <TrustSection />

      {/* Blog Section */}
      <BlogSection />

      {/* Newsletter Section */}
      <section className="relative py-12 bg-slate-800 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
        <Container maxWidth="2xl" className="relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="bg-slate-700/50 backdrop-blur-sm border border-slate-600 rounded-2xl p-8 md:p-10">
              <div className="grid md:grid-cols-2 gap-6 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold mb-3">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    Stay Updated
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                    Get Exclusive Deals & Updates
                  </h2>
                  <p className="text-slate-300 text-sm">
                    Subscribe to our newsletter for wholesale pricing, new arrivals, and industry insights.
                  </p>
                </div>
                <div>
                  <form className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="email"
                      placeholder="Enter your email"
                      className="flex-1 px-4 py-3 bg-slate-900/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      required
                    />
                    <button
                      type="submit"
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-blue-500/50 whitespace-nowrap"
                    >
                      Subscribe
                    </button>
                  </form>
                  <p className="text-xs text-slate-400 mt-3 flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    We respect your privacy. Unsubscribe anytime.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </SharedLayout>
  )
}
