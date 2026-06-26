'use client'

import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  name: string
  href: string
}

interface BreadcrumbProps {
  items: BreadcrumbItem[]
}

export function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 py-4" aria-label="Breadcrumb">
      <Link href="/" className="hover:text-[#1a3a5c] flex items-center transition-colors">
        <Home className="w-4 h-4" />
      </Link>
      {items.map((item, index) => (
        <div key={item.href} className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-gray-400" />
          {index === items.length - 1 ? (
            <span className="text-[#1a3a5c] font-medium">{item.name}</span>
          ) : (
            <Link href={item.href} className="hover:text-[#1a3a5c] transition-colors">
              {item.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}
