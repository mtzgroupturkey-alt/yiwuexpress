'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus, ShoppingBag, ShoppingCart, Users, ClipboardList,
  DollarSign, Truck, ChevronDown
} from 'lucide-react'

export function QuickActions() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const actions = [
    {
      label: 'New Product',
      icon: ShoppingBag,
      href: '/admin/products/new',
      color: 'text-blue-600 bg-blue-50',
    },
    {
      label: 'New Purchase Order',
      icon: ClipboardList,
      href: '/admin/purchase-orders/new',
      color: 'text-amber-600 bg-amber-50',
    },
    {
      label: 'Financial Ledger',
      icon: DollarSign,
      href: '/admin/finance/overview',
      color: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: 'Logistics Overview',
      icon: Truck,
      href: '/admin/logistics/overview',
      color: 'text-sky-600 bg-sky-50',
    },
    {
      label: 'Customers Hub',
      icon: Users,
      href: '/admin/customers',
      color: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold shadow-sm hover:opacity-95 transition-all"
      >
        <Plus size={14} />
        <span>Quick Action</span>
        <ChevronDown size={13} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-gray-100 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Create & Shortcuts
            </div>
            <div className="mt-1 space-y-1">
              {actions.map((act) => (
                <button
                  key={act.href}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    router.push(act.href)
                  }}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${act.color}`}>
                    <act.icon size={15} />
                  </div>
                  <span>{act.label}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
