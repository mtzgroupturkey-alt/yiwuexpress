'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/Container'
import TextType from '@/components/ui/TextType'

export function TopBar() {
  const topBarLinks = [
    { name: 'Home', href: '/' },
    { name: 'About Us', href: '/about' },
    { name: 'Services', href: '/services' },
    { name: 'Shop', href: '/products' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Wholesale', href: '/wholesale' },
    { name: 'Hospitality', href: '/hospitality' },
    { name: 'Where to buy', href: '/where-to-buy' },
  ]

  return (
    <div className="bg-gradient-to-r from-[#1a3a5c] via-[#2a4a6c] to-[#1a3a5c] text-white/80 text-xs py-2 hidden md:block border-b border-[#c9a84c]/20 overflow-hidden">
      {/* Subtle Pattern Overlay */}
      <div 
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(201, 168, 76, 0.3) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }}
      ></div>
      
      {/* Animated Gradient Orb - Left */}
      <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-40 h-40 bg-[#c9a84c]/10 rounded-full blur-3xl"></div>
      
      {/* Animated Gradient Orb - Right */}
      <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-40 h-40 bg-[#c9a84c]/10 rounded-full blur-3xl"></div>
      
      <Container maxWidth="2xl" className="relative z-10">
        <div className="flex items-center justify-between">
          {/* LEFT SIDE: Welcome Message with Typing Animation */}
          <div className="flex items-center space-x-4">
            <span className="text-[#c9a84c] text-sm drop-shadow-lg">✦</span>
            <TextType
              text={[
                "Welcome to YIWU EXPRESS - Premium Kitchenware from Yiwu, China",
                "Global Trade Solutions - Quality You Can Trust",
                "Wholesale & Retail - Best Prices Guaranteed"
              ]}
              as="span"
              typingSpeed={50}
              deletingSpeed={30}
              pauseDuration={3000}
              showCursor={true}
              cursorCharacter="_"
              cursorBlinkDuration={0.6}
              className="text-white/70 text-[10px] tracking-wider font-medium drop-shadow-sm"
              loop={true}
            />
          </div>
          
          {/* RIGHT SIDE: Static Page Links */}
          <div className="flex items-center space-x-6">
            {topBarLinks.map((link, index) => (
              <Link
                key={link.name}
                href={link.href}
                className="relative hover:text-white transition-all duration-300 uppercase tracking-wider text-[10px] font-medium text-white/70 hover:text-[#c9a84c] group"
              >
                {link.name}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-gradient-to-r from-[#c9a84c] to-transparent group-hover:w-full transition-all duration-300"></span>
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}