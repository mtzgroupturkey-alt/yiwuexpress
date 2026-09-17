'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, X, Filter, RotateCcw } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useCurrency } from '@/hooks/useCurrency'

interface FilterSection {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'color' | 'select'
  attributeSlug?: string
  options?: { label: string; value: string; count?: number }[]
  min?: number
  max?: number
  value?: [number, number]
}

interface FilterSidebarProps {
  filters: FilterSection[]
  selectedFilters?: Record<string, any>
  onFilterChange: (filters: Record<string, any>) => void
  onClearFilters: () => void
  onClose?: () => void
  isMobile?: boolean
}

export function FilterSidebar({
  filters,
  selectedFilters: externalFilters,
  onFilterChange,
  onClearFilters,
  onClose,
  isMobile,
}: FilterSidebarProps) {
  const t = useTranslations('Products')
  const { formatPrice } = useCurrency()
  const [expandedSections, setExpandedSections] = useState<string[]>(filters.map(f => f.id))
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>(externalFilters || {})

  useEffect(() => {
    if (externalFilters !== undefined) {
      setSelectedFilters(externalFilters)
    }
  }, [externalFilters])

  useEffect(() => {
    setExpandedSections(filters.map(f => f.id))
  }, [filters])

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleFilterChange = (sectionId: string, value: any) => {
    const newFilters = { ...selectedFilters, [sectionId]: value }
    setSelectedFilters(newFilters)
    onFilterChange(newFilters)
  }

  const handleClearAll = () => {
    setSelectedFilters({})
    onClearFilters()
  }

  const getFilterLabel = (key: string, value: any): string => {
    const section = filters.find(f => f.id === key)
    if (!section) return String(value)
    
    if (section.type === 'range') {
      if (Array.isArray(value)) {
        return `${formatPrice(value[0])} - ${formatPrice(value[1])}`
      }
      if (typeof value === 'object' && value !== null) {
        return `${formatPrice(value.min ?? 0)} - ${formatPrice(value.max)}`
      }
    }
    
    if (section.type === 'checkbox' && Array.isArray(value)) {
      return value.map(v => {
        const option = section.options?.find(opt => opt.value === v)
        return option?.label || v
      }).join(', ')
    }
    
    if (section.type === 'color') {
      const option = section.options?.find(opt => opt.value === value)
      return option?.label || value
    }
    
    return String(value)
  }

  const hasActiveFilters = Object.keys(selectedFilters).length > 0

  return (
    <div className="bg-white dark:bg-[#0B1524] rounded-2xl p-4 sm:p-5 border border-slate-200/90 dark:border-slate-800 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#0055A4]" />
          <h2 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">
            {t('filters')}
          </h2>
        </div>
        
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              onClick={handleClearAll}
              className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-950/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('clearAll')}</span>
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Applied Filter Chips */}
      {hasActiveFilters && (
        <div className="mb-4 pb-3 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
          {Object.entries(selectedFilters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null
            return (
              <span
                key={key}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#0055A4]/10 text-[#0055A4] dark:bg-[#0055A4]/25 dark:text-blue-300 border border-[#0055A4]/20"
              >
                <span className="truncate max-w-[130px]">{getFilterLabel(key, value)}</span>
                <button
                  onClick={() => {
                    const newFilters = { ...selectedFilters }
                    delete newFilters[key]
                    setSelectedFilters(newFilters)
                    onFilterChange(newFilters)
                  }}
                  className="hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )
          })}
        </div>
      )}

      {/* Filter Sections Accordion */}
      <div className="space-y-4">
        {filters.map((section) => (
          <div key={section.id} className="border-b border-slate-100 dark:border-slate-800/80 pb-3.5 last:border-b-0">
            <button
              className="flex items-center justify-between w-full text-left py-1 group cursor-pointer"
              onClick={() => toggleSection(section.id)}
            >
              <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#0055A4] transition-colors">
                {section.name}
              </span>
              {expandedSections.includes(section.id) ? (
                <ChevronUp className="w-4 h-4 text-slate-400 group-hover:text-[#0055A4]" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-[#0055A4]" />
              )}
            </button>

            {expandedSections.includes(section.id) && (
              <div className="mt-2.5 space-y-2">
                {section.type === 'checkbox' && section.options?.map((option) => {
                  const isChecked = selectedFilters[section.id]?.includes(option.value) || false
                  return (
                    <label key={option.value} className="flex items-center justify-between text-xs cursor-pointer group py-1">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            const current = selectedFilters[section.id] || []
                            const newValue = e.target.checked
                              ? [...current, option.value]
                              : current.filter((v: string) => v !== option.value)
                            handleFilterChange(section.id, newValue.length > 0 ? newValue : undefined)
                          }}
                          className="w-4 h-4 text-[#0055A4] border-slate-300 rounded focus:ring-[#0055A4] cursor-pointer"
                        />
                        <span className={`truncate group-hover:text-[#0055A4] transition-colors ${isChecked ? 'font-bold text-[#0055A4]' : 'text-slate-600 dark:text-slate-300'}`}>
                          {option.label}
                        </span>
                      </div>
                      {option.count !== undefined && (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-md">
                          {option.count}
                        </span>
                      )}
                    </label>
                  )
                })}

                {section.type === 'range' && (
                  <div className="px-1 py-2">
                    <input
                      type="range"
                      min={section.min || 0}
                      max={section.max || 1000}
                      value={
                        typeof selectedFilters[section.id] === 'object' && selectedFilters[section.id] !== null && !Array.isArray(selectedFilters[section.id])
                          ? selectedFilters[section.id].max ?? section.max ?? 1000
                          : Array.isArray(selectedFilters[section.id])
                          ? selectedFilters[section.id][1]
                          : section.max ?? 1000
                      }
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        handleFilterChange(section.id, { min: section.min || 0, max: value })
                      }}
                      className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#0055A4]"
                    />
                    <div className="flex justify-between mt-2 text-xs font-mono font-bold text-slate-500">
                      <span>{formatPrice(section.min || 0)}</span>
                      <span className="text-[#0055A4]">
                        {formatPrice(
                          typeof selectedFilters[section.id] === 'object' && selectedFilters[section.id] !== null && !Array.isArray(selectedFilters[section.id])
                            ? selectedFilters[section.id].max ?? section.max ?? 1000
                            : Array.isArray(selectedFilters[section.id])
                            ? selectedFilters[section.id][1]
                            : section.max ?? 1000
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {section.type === 'color' && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {section.options?.map((option) => {
                      const isSelected = selectedFilters[section.id] === option.value
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleFilterChange(section.id, isSelected ? undefined : option.value)}
                          className="relative p-0.5 rounded-full cursor-pointer"
                          title={option.label}
                        >
                          <div
                            className={`w-6 h-6 rounded-full border-2 transition-all ${
                              isSelected ? 'border-[#0055A4] scale-110 shadow-sm' : 'border-slate-300 dark:border-slate-700 hover:scale-105'
                            }`}
                            style={{ backgroundColor: option.value }}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
