'use client'

import Link from 'next/link'
import { Container } from '@/components/ui/Container'

export function TopBar() {
  const topBarLinks = [
    { name: 'About Us', href: '/about' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact Us', href: '/contact' },
    { name: 'Wholesale', href: '/wholesale' },
    { name: 'Hospitality', href: '/hospitality' },
    { name: 'Where to buy', href: '/where-to-buy' },
  ]

  return (
    <div className="bg-[#1a1a2e] text-white/80 text-xs py-2 hidden md:block">
      <Container maxWidth="2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {topBarLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="hover:text-white transition-colors uppercase tracking-wider text-[10px] font-medium"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center space-x-4 text-[10px]">
            <span className="opacity-60">Welcome to our Official Store</span>
          </div>
        </div>
      </Container>
    </div>
  )
}