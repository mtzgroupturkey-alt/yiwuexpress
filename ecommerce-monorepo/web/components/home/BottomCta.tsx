import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import { ArrowRight, Sparkles } from 'lucide-react'

export function BottomCta() {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      <div className="absolute inset-0 bg-primary-500" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,76,0.15),transparent_60%)]" />
      <div className="absolute inset-0 bg-[url('/pattern-china.svg')] opacity-5" />
      <Container maxWidth="2xl" className="relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 md:p-12 lg:p-16">
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary-500/20 border border-secondary-400/30 rounded-full text-secondary-300 text-xs font-semibold mb-6">
                <Sparkles className="w-3.5 h-3.5" />
                Start Your Journey
              </div>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
                Ready to Expand{' '}
                <span className="text-secondary-400">Your Business?</span>
              </h2>
              <p className="text-lg md:text-xl text-primary-200 max-w-2xl mx-auto mb-10">
                Join thousands of successful businesses sourcing premium products
                directly from Yiwu, China. Get started today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-secondary-500 hover:bg-secondary-400 text-primary-900 font-bold px-8 py-4 rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-secondary-500/30"
                >
                  Browse Products
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 border-2 border-white/30 text-white hover:bg-white/10 hover:border-secondary-400/50 hover:shadow-gold font-semibold px-8 py-4 rounded-xl text-lg transition-all duration-300"
                >
                  Contact Our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  )
}
