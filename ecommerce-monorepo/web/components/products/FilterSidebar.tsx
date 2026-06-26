'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'

interface FilterSection {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'color'
  options?: { label: string; value: string; count?: number }[]
  min?: number
  max?: number
  value?: [number, number]
}

interface FilterSidebarProps {
  filters: FilterSection[]
  onFilterChange: (filters: Record<string, any>) => void
  onClearFilters: () => void
  onClose?: () => void
  isMobile?: boolean
}

export function FilterSidebar({ filters, onFilterChange, onClearFilters, onClose, isMobile }: FilterSidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(filters.map(f => f.id))
  const [selectedFilters, setSelectedFilters] = useState<Record<string, any>>({})

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
    
    if (section.type === 'range' && Array.isArray(value)) {
      return `$${value[0]} - $${value[1]}`
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

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-[#1a3a5c]">Filters</h2>
        <div className="flex items-center space-x-2">
          {Object.keys(selectedFilters).length > 0 && (
            <button
              onClick={handleClearAll}
              className="text-sm text-gray-500 hover:text-[#1a3a5c] transition-colors"
            >
              Clear All
            </button>
          )}
          {isMobile && onClose && (
            <button onClick={onClose} className="p-2 text-gray-500 hover:text-[#1a3a5c]">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Applied Filters */}
      {Object.keys(selectedFilters).length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {Object.entries(selectedFilters).map(([key, value]) => {
            if (!value || (Array.isArray(value) && value.length === 0)) return null
            return (
              <div
                key={key}
                className="bg-[#1a3a5c]/10 text-[#1a3a5c] px-3 py-1 rounded-full text-sm flex items-center gap-2"
              >
                <span className="truncate max-w-[150px]">{getFilterLabel(key, value)}</span>
                <button
                  onClick={() => {
                    const newFilters = { ...selectedFilters }
                    delete newFilters[key]
                    setSelectedFilters(newFilters)
                    onFilterChange(newFilters)
                  }}
                  className="hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Filter Sections */}
      <div className="space-y-4">
        {filters.map((section) => (
          <div key={section.id} className="border-b border-gray-100 pb-4 last:border-b-0">
            <button
              className="flex items-center justify-between w-full text-left"
              onClick={() => toggleSection(section.id)}
            >
              <span className="font-medium text-gray-700">{section.name}</span>
              {expandedSections.includes(section.id) ? (
                <ChevronUp className="w-4 h-4 text-gray-400" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-400" />
              )}
            </button>

            {expandedSections.includes(section.id) && (
              <div className="mt-3 space-y-3">
                {section.type === 'checkbox' && section.options?.map((option) => {
                  const isChecked = selectedFilters[section.id]?.includes(option.value) || false
                  return (
                    <label key={option.value} className="flex items-center space-x-3 text-sm cursor-pointer group">
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
                        className="w-4 h-4 text-[#1a3a5c] border-gray-300 rounded focus:ring-[#1a3a5c]"
                      />
                      <span className="text-gray-600 group-hover:text-[#1a3a5c] transition-colors">
                        {option.label}
                      </span>
                      {option.count !== undefined && (
                        <span className="text-gray-400 text-xs">({option.count})</span>
                      )}
                    </label>
                  )
                })}

                {section.type === 'range' && (
                  <div className="px-2">
                    <input
                      type="range"
                      min={section.min || 0}
                      max={section.max || 100}
                      value={selectedFilters[section.id]?.[1] || section.max || 100}
                      onChange={(e) => {
                        const value = parseInt(e.target.value)
                        handleFilterChange(section.id, [section.min || 0, value])
                      }}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1a3a5c]"
                    />
                    <div className="flex justify-between mt-2 text-sm text-gray-600">
                      <span>${section.min || 0}</span>
                      <span className="font-medium text-[#1a3a5c]">
                        ${selectedFilters[section.id]?.[1] || section.max || 100}
                      </span>
                    </div>
                  </div>
                )}

                {section.type === 'color' && (
                  <div className="flex flex-wrap gap-3">
                    {section.options?.map((option) => {
                      const isSelected = selectedFilters[section.id] === option.value
                      return (
                        <button
                          key={option.value}
                          onClick={() => handleFilterChange(section.id, isSelected ? undefined : option.value)}
                          className={`relative group`}
                          title={option.label}
                        >
                          <div
                            className={`w-8 h-8 rounded-full border-2 transition-all ${
                              isSelected ? 'border-[#1a3a5c] scale-110' : 'border-gray-300 hover:border-gray-400'
                            }`}
                            style={{ backgroundColor: option.value }}
                          />
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            </div>
                          )}
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

      {/* Apply Button (Mobile) */}
      {isMobile && (
        <button
          className="w-full mt-6 bg-[#1a3a5c] text-white py-3 rounded-lg font-medium hover:bg-[#2a5a8c] transition-colors"
          onClick={onClose}
        >
          Apply Filters
        </button>
      )}
    </div>
  )
}
