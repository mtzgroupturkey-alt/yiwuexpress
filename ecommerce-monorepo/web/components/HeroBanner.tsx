'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowRight, ShoppingBag, Grid3x3 } from 'lucide-react'

interface HeroBannerProps {
  title?: string
  subtitle?: string
  backgroundImage?: string
  ctaPrimary?: {
    text: string
    href: string
  }
  ctaSecondary?: {
    text: string
    href: string
  }
}

export default function HeroBanner({
  title = "Premium Kitchenware from Yiwu, China",
  subtitle = "Discover quality kitchen products at wholesale prices. Direct from the world's largest commodity market.",
  backgroundImage = "/uploads/hero-kitchen.jpg",
  ctaPrimary = { text: "Shop Now", href: "/products" },
  ctaSecondary = { text: "View Categories", href: "/products" }
}: HeroBannerProps) {
  const [imageError, setImageError] = useState(false)
  const [currentSlide, setCurrentSlide] = useState(0)

  const slides = [
    {
      title: "Premium Kitchenware from Yiwu, China",
      subtitle: "Discover quality kitchen products at wholesale prices. Direct from the world's largest commodity market.",
      image: backgroundImage,
      svg: "/assets/kitchenware-animated.svg"
    },
    {
      title: "Wholesale Prices for Quality Products",
      subtitle: "Get the best deals on cookware, utensils, and kitchen accessories. Perfect for retailers and restaurants.",
      image: backgroundImage
    },
    {
      title: "Global Shipping & Customs Support",
      subtitle: "We handle all logistics, customs clearance, and documentation. Focus on your business, we'll handle the rest.",
      image: backgroundImage
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [slides.length])

  const currentSlideData = slides[currentSlide]

  return (
    <section className="relative overflow-hidden bg-gray-900 text-white">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        {!imageError ? (
          <>
            <img
              src={currentSlideData.image}
              alt="Hero background"
              className="w-full h-full object-cover transition-opacity duration-1000"
              onError={() => setImageError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-primary-900/95 via-primary-800/85 to-primary-900/60"></div>
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary-900 via-primary-800 to-primary-700"></div>
        )}
      </div>

      {/* Decorative Pattern Overlay */}
      <div className="absolute inset-0 chinese-pattern opacity-5 z-10"></div>

      {/* Content */}
      <div className="container mx-auto px-4 py-16 md:py-24 lg:py-28 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className={`${currentSlideData.svg ? 'lg:col-span-7' : 'lg:col-span-12'} max-w-3xl`}>
            {/* Badge */}
            <div className="inline-flex items-center justify-center mb-6 bg-white/10 backdrop-blur-sm rounded-full px-5 py-2 border border-white/20">
              <span className="text-sm font-medium">🏆 Trusted by 1,500+ Businesses Worldwide</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold mb-6 leading-tight">
              {currentSlideData.title.split(' ').slice(0, -3).join(' ')}
              <span className="block text-secondary-400 mt-2">
                {currentSlideData.title.split(' ').slice(-3).join(' ')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-200 mb-10 leading-relaxed">
              {currentSlideData.subtitle}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href={ctaPrimary.href}
                className="group inline-flex items-center justify-center px-8 py-4 bg-secondary-500 text-white font-semibold rounded-lg hover:bg-secondary-600 transition-all shadow-xl hover:shadow-2xl hover:scale-105"
              >
                <ShoppingBag className="w-5 h-5 mr-2" />
                {ctaPrimary.text}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <Link
                href={ctaSecondary.href}
                className="group inline-flex items-center justify-center px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-white/20 transition-all border border-white/30"
              >
                <Grid3x3 className="w-5 h-5 mr-2" />
                {ctaSecondary.text}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap gap-6 mt-12 pt-8 border-t border-white/20">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-secondary-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                </div>
                <span className="font-medium">Quality Guaranteed</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <span className="font-medium">Free Shipping*</span>
              </div>

              <div className="flex items-center gap-2 text-sm">
                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-5 h-5 text-secondary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span className="font-medium">Secure Payment</span>
              </div>
            </div>
          </div>

          {currentSlideData.svg && (
            <div className="lg:col-span-5 flex justify-center items-center">
              <div className="w-full max-w-[450px] aspect-square rounded-2xl bg-white/5 backdrop-blur-md p-6 border border-white/10 shadow-2xl hover:scale-105 transition-all duration-500">
                <img
                  src={currentSlideData.svg}
                  alt="Animated Kitchenware illustration"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-8 right-8 z-20 flex gap-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              currentSlide === index 
                ? 'bg-secondary-400 w-8' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 hidden md:block">
        <div className="animate-bounce">
          <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </div>
    </section>
  )
}
