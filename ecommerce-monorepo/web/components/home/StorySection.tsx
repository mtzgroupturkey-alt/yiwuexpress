'use client'

import { motion } from 'framer-motion'
import { Award, Globe, Users, ShoppingBag } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

export function StorySection() {
  const stats = [
    { icon: Award, value: '15+', label: 'Years in Business' },
    { icon: Users, value: '1,500+', label: 'Global Importers' },
    { icon: ShoppingBag, value: '10k+', label: 'Products Sourced' },
    { icon: Globe, value: '50+', label: 'Countries Served' }
  ]

  return (
    <section className="bg-gradient-to-br from-[#0c1a2b] to-[#1a3a5c] text-white py-20 px-4 md:px-8 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#c9a84c]/5 rounded-full filter blur-3xl pointer-events-none" />
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        
        {/* Left Column: Image with overlays */}
        <div className="lg:col-span-5 relative group">
          <div className="absolute -inset-1.5 bg-gradient-to-r from-[#c9a84c] to-[#b0923f] rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
          <div className="relative rounded-2xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[480px] border border-white/10 bg-gray-900 shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80" 
              alt="Yiwu Sourcing Warehouse" 
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
              <h3 className="text-xl font-bold text-white mb-1">Our Zhejiang Headquarters</h3>
              <p className="text-gray-300 text-xs font-semibold">Directly connected to the Futian Market, China.</p>
            </div>
          </div>
        </div>

        {/* Right Column: Narrative */}
        <div className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <span className="text-[#c9a84c] font-black tracking-widest text-xs uppercase">
              ABOUT YIWU EXPRESS
            </span>
            <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight" style={{ fontFamily: 'Outfit, sans-serif' }}>
              From Yiwu to Your Doorstep
            </h2>
            <h3 className="text-lg md:text-xl font-semibold text-[#c9a84c] mt-2">
              15 Years of Connecting Businesses to the World's Largest Wholesale Market
            </h3>
          </div>

          <div className="space-y-4 text-gray-300 text-sm md:text-base leading-relaxed">
            <p>
              Founded in 2011, YIWU EXPRESS started with a simple vision: to bridge the gap between global buyers and the massive Yiwu Futian Wholesale Market. Navigating overseas manufacturing, language barriers, and export compliance can be daunting. We made it our mission to make sourcing seamless, transparent, and direct.
            </p>
            <p>
              Over the last fifteen years, we have grown from a small translation agency to a full-service sourcing, quality inspection, and cargo consolidation partner. With our local warehouses in Zhejiang and dedicated logistics lines across the Middle East, Europe, Russia, and Central Asia, we ensure your bulk goods are sourced, verified, and delivered safely.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <Card key={index} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className="bg-[#c9a84c]/20 p-2 rounded-full text-[#c9a84c] mb-2">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-white">{stat.value}</span>
                    <span className="text-[10px] text-gray-400 font-semibold uppercase mt-1 tracking-wider">{stat.label}</span>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

      </div>
    </section>
  )
}
