'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Container } from '@/components/ui/Container'

export function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-[#1a1a2e] via-[#1a3a5c] to-[#2a4a6c] overflow-hidden">
      <Container>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center min-h-[500px] py-12">
          {/* Left: Text Content */}
          <div className="text-white space-y-6 z-10">
            <p className="text-[#c9a84c] text-sm uppercase tracking-widest font-medium">
              Weeknight wins start with
            </p>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight">
              Rise Ceramic Nonstick
              <br />
              <span className="text-[#c9a84c]">Bakeware</span>
            </h1>
            <p className="text-white/80 text-lg max-w-lg leading-relaxed">
              From bubbling enchiladas to golden bakes, bring beauty and ease to every summer meal.
            </p>
            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/products"
                className="bg-[#c9a84c] text-[#1a1a2e] px-8 py-3 rounded-full font-semibold hover:bg-[#e8d48b] transition-all transform hover:scale-105 shadow-lg"
              >
                SHOP NOW
              </Link>
              <Link
                href="/products/rise-bakeware"
                className="border-2 border-white/30 text-white px-8 py-3 rounded-full font-semibold hover:bg-white/10 transition-all"
              >
                Rise Baking Made Beautiful
              </Link>
            </div>
          </div>

          {/* Right: Product Image */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md aspect-square">
              {/* Fallback gradient if image doesn't exist */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#c9a84c]/20 to-transparent rounded-full blur-3xl"></div>
              
              {/* Product image placeholder */}
              <div className="relative w-full h-full flex items-center justify-center">
                <div className="w-80 h-80 bg-gradient-to-br from-[#c9a84c]/30 to-[#c9a84c]/10 rounded-full flex items-center justify-center">
                  <svg className="w-48 h-48 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h18v18H3V3zm0 6h18M9 3v18" />
                  </svg>
                </div>
              </div>

              {/* Decorative Badge */}
              <div className="absolute -top-4 -right-4 bg-[#c9a84c] text-[#1a1a2e] px-6 py-3 rounded-full text-sm font-bold shadow-xl animate-pulse">
                NEW
              </div>

              {/* Decorative Elements */}
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-[#c9a84c]/20 rounded-full blur-2xl"></div>
              <div className="absolute top-1/4 -right-8 w-32 h-32 bg-white/5 rounded-full blur-3xl"></div>
            </div>
          </div>
        </div>
      </Container>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/10 to-transparent" />
        <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-gradient-to-tr from-white/5 to-transparent" />
      </div>

      {/* Decorative Circles */}
      <div className="absolute -top-20 -left-20 w-40 h-40 bg-[#c9a84c]/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -right-20 w-60 h-60 bg-white/5 rounded-full blur-3xl"></div>
    </section>
  )
}
