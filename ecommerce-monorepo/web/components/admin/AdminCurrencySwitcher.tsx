'use client'

import React, { useState, useRef, useEffect } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useAdminCurrency, type AdminCurrencyItem } from '@/app/admin/contexts/AdminCurrencyContext'
import { CurrencySymbol } from '@/components/ui/CurrencySymbol'

interface AdminCurrencySwitcherProps {
  className?: string
}

export function AdminCurrencySwitcher({ className = '' }: AdminCurrencySwitcherProps) {
  const { currency, setCurrency, currencies, currentCurrency } = useAdminCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Select Admin Currency"
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 bg-gray-50/80 hover:bg-gray-100 text-gray-700 transition-all duration-150 shadow-xs hover:border-gray-300 cursor-pointer"
        title="Admin Display Currency"
      >
        <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black flex items-center justify-center border border-emerald-200 shrink-0">
          <CurrencySymbol code={currentCurrency.code} symbol={currentCurrency.symbol} className="w-2.5 h-2.5 inline-block" />
        </span>
        <span className="font-bold text-[#1a3a5c] tracking-tight">
          {currency}
        </span>
        <ChevronDown size={13} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 max-h-80 overflow-y-auto bg-white rounded-xl shadow-xl border border-gray-100 py-1.5 z-50 animate-in fade-in-50 zoom-in-95">
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-50">
            Admin Currency
          </div>
          {currencies.map((c: AdminCurrencyItem) => {
            const isSelected = c.code === currency
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setCurrency(c.code)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-50/70 text-blue-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 text-center font-bold text-gray-500 shrink-0 flex items-center justify-center">
                    <CurrencySymbol code={c.code} symbol={c.symbol} className="w-3.5 h-3.5 inline-block" />
                  </span>
                  <span className="font-bold shrink-0">{c.code}</span>
                  <span className="text-[11px] text-gray-400 truncate max-w-[90px]">
                    {c.name}
                  </span>
                </div>
                {isSelected && <Check size={14} className="text-blue-600 shrink-0" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
export default AdminCurrencySwitcher
