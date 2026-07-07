'use client'

import { Shield, ShieldCheck, Truck, Headphones, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface TrustBadgesMiniProps {
  className?: string
  layout?: 'grid' | 'row'
}

export function TrustBadgesMini({ className, layout = 'grid' }: TrustBadgesMiniProps) {
  const badges = [
    { icon: Lock, label: 'Secure Checkout', desc: 'SSL Encrypted', color: 'text-blue-600 bg-blue-50' },
    { icon: Shield, label: '30-Day Guarantee', desc: 'Money-Back', color: 'text-green-600 bg-green-50' },
    { icon: ShieldCheck, label: 'Verified Supplier', desc: '15 Years Sourcing', color: 'text-yellow-600 bg-yellow-50' },
    { icon: Truck, label: 'Fast Shipping', desc: 'Sea & Air Cargo', color: 'text-purple-600 bg-purple-50' },
    { icon: Headphones, label: '24/7 Support', desc: 'Always Available', color: 'text-pink-600 bg-pink-50' }
  ]

  return (
    <div className={cn(
      layout === 'grid' 
        ? "grid grid-cols-2 md:grid-cols-5 gap-3" 
        : "flex flex-wrap items-center gap-4 justify-center md:justify-start",
      className
    )}>
      {badges.map((badge, idx) => {
        const Icon = badge.icon
        return (
          <div 
            key={idx} 
            className="flex items-center gap-2 p-2.5 rounded-lg border border-gray-200 bg-white shadow-sm hover:shadow transition-shadow animate-fade-in"
          >
            <div className={cn("p-1.5 rounded-full", badge.color)}>
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">{badge.label}</p>
              <p className="text-[10px] text-gray-500 leading-none mt-0.5">{badge.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
