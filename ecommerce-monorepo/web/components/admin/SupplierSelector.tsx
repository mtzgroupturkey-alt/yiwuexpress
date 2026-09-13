'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronDown, Check, X, Building2, User } from 'lucide-react'

export interface SupplierItem {
  id: string
  name: string
  companyName?: string | null
  contactPerson?: string | null
  email?: string | null
  phone?: string | null
}

interface SupplierSelectorProps {
  suppliers: SupplierItem[]
  selectedSupplierId: string
  onSelectSupplier: (supplierId: string) => void
  disabled?: boolean
  label?: string
  placeholder?: string
  noResultsText?: string
  required?: boolean
  className?: string
}

export function SupplierSelector({
  suppliers = [],
  selectedSupplierId,
  onSelectSupplier,
  disabled = false,
  label = 'Supplier',
  placeholder = 'Search and select supplier...',
  noResultsText = 'No suppliers found',
  required = false,
  className = '',
}: SupplierSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedSupplier = useMemo(
    () => suppliers.find((s) => s.id === selectedSupplierId),
    [suppliers, selectedSupplierId]
  )

  // Filter suppliers by name, companyName, contactPerson, or email
  const filteredSuppliers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return suppliers
    return suppliers.filter((s) => {
      const nameMatch = s.name?.toLowerCase().includes(q)
      const companyMatch = s.companyName?.toLowerCase().includes(q)
      const contactMatch = s.contactPerson?.toLowerCase().includes(q)
      const emailMatch = s.email?.toLowerCase().includes(q)
      return nameMatch || companyMatch || contactMatch || emailMatch
    })
  }, [suppliers, searchQuery])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleOpen = () => {
    if (disabled) return
    setIsOpen(true)
    setTimeout(() => {
      inputRef.current?.focus()
    }, 50)
  }

  const handleSelect = (id: string) => {
    onSelectSupplier(id)
    setIsOpen(false)
    setSearchQuery('')
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectSupplier('')
    setSearchQuery('')
  }

  return (
    <div className={`space-y-2 ${className}`} ref={containerRef}>
      {label && (
        <Label className="block text-sm font-medium">
          {label} {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <div
          onClick={handleOpen}
          className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white transition-colors select-none ${
            disabled
              ? 'cursor-not-allowed bg-gray-50 opacity-60'
              : 'cursor-pointer hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a3a5c] focus:ring-offset-1'
          } ${isOpen ? 'border-[#1a3a5c] ring-2 ring-[#1a3a5c] ring-offset-1' : ''}`}
        >
          <div className="flex items-center gap-2 overflow-hidden truncate">
            <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
            {selectedSupplier ? (
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-medium text-gray-900 truncate">
                  {selectedSupplier.name}
                </span>
                {selectedSupplier.companyName && selectedSupplier.companyName !== selectedSupplier.name && (
                  <span className="text-xs text-gray-500 truncate hidden sm:inline">
                    ({selectedSupplier.companyName})
                  </span>
                )}
              </div>
            ) : (
              <span className="text-gray-400 truncate">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            {selectedSupplier && !disabled && (
              <button
                type="button"
                onClick={handleClear}
                className="text-gray-400 hover:text-gray-600 rounded-full p-0.5 hover:bg-gray-100 transition"
                title="Clear supplier"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {/* Dropdown Menu */}
        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full rounded-md border border-gray-200 bg-white shadow-lg animate-in fade-in-0 zoom-in-95">
            {/* Embedded Search Input */}
            <div className="p-2 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  ref={inputRef}
                  type="text"
                  placeholder="Type to search supplier..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 h-9 text-sm bg-gray-50 border-gray-200 focus:bg-white"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-h-60 overflow-y-auto p-1 divide-y divide-gray-50">
              {filteredSuppliers.length === 0 ? (
                <div className="py-6 text-center text-xs text-gray-500">
                  {noResultsText}
                </div>
              ) : (
                filteredSuppliers.map((supplier) => {
                  const isSelected = supplier.id === selectedSupplierId
                  return (
                    <div
                      key={supplier.id}
                      onClick={() => handleSelect(supplier.id)}
                      className={`flex items-center justify-between px-3 py-2.5 text-sm rounded cursor-pointer transition ${
                        isSelected
                          ? 'bg-indigo-50/80 text-indigo-950 font-medium'
                          : 'hover:bg-gray-50 text-gray-800'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5 overflow-hidden pr-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{supplier.name}</span>
                          {supplier.companyName && supplier.companyName !== supplier.name && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal text-gray-500 shrink-0">
                              {supplier.companyName}
                            </Badge>
                          )}
                        </div>
                        {supplier.contactPerson && (
                          <div className="flex items-center gap-1 text-[11px] text-gray-400 truncate">
                            <User className="w-3 h-3 shrink-0" />
                            <span>{supplier.contactPerson}</span>
                            {supplier.phone && <span>• {supplier.phone}</span>}
                          </div>
                        )}
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
