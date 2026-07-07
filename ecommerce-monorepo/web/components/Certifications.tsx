'use client'

import { ShieldCheck, Award, CheckCircle2, BadgeCheck } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CertificationsProps {
  className?: string
}

export function Certifications({ className }: CertificationsProps) {
  const certifications = [
    { icon: BadgeCheck, title: 'ISO 9001 Certified', desc: 'Quality Management Standards' },
    { icon: ShieldCheck, title: 'Trade Assurance', desc: 'Secure Business & Payments' },
    { icon: CheckCircle2, title: 'Alibaba Verified', desc: 'Authenticated Sourcing Agent' },
    { icon: Award, title: 'SGS Certified', desc: 'Independent Quality Inspection' }
  ]

  return (
    <div className={cn("grid grid-cols-2 md:grid-cols-4 gap-4 py-8", className)}>
      {certifications.map((cert, index) => {
        const Icon = cert.icon
        return (
          <div 
            key={index}
            className="flex items-center gap-3 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 hover:bg-white/10 transition-colors"
          >
            <div className="bg-[#c9a84c]/20 p-2 rounded-lg text-[#c9a84c]">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-sm">{cert.title}</h4>
              <p className="text-gray-400 text-xs mt-0.5">{cert.desc}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
