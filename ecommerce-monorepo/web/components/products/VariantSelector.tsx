'use client'

import { useMemo } from 'react'

interface ProductVariant {
  id: string
  sku: string
  attributes: Record<string, string>
  price: number
  comparePrice?: number | null
  stock: number
  images: string[]
  isActive: boolean
}

interface VariantSelectorProps {
  variants: ProductVariant[]
  selectedVariant: ProductVariant | null
  onSelect: (variant: ProductVariant) => void
}

export function VariantSelector({ variants, selectedVariant, onSelect }: VariantSelectorProps) {
  // Group variants by attribute
  const attributeGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {}
    
    variants.forEach(variant => {
      if (variant.attributes && variant.isActive) {
        Object.entries(variant.attributes).forEach(([key, value]) => {
          if (!groups[key]) {
            groups[key] = new Set()
          }
          groups[key].add(value as string)
        })
      }
    })

    // Convert Sets to Arrays
    const result: Record<string, string[]> = {}
    Object.entries(groups).forEach(([key, valueSet]) => {
      result[key] = Array.from(valueSet).sort()
    })

    return result
  }, [variants])

  // Check if a specific attribute value is available
  const isValueAvailable = (attributeName: string, value: string) => {
    const currentSelection = selectedVariant?.attributes || {}
    
    return variants.some(variant => {
      if (!variant.isActive || variant.stock <= 0) return false
      
      // Check if this variant matches the selected attributes (except current one)
      const matches = Object.entries(currentSelection).every(([key, selectedValue]) => {
        if (key === attributeName) return true // Skip current attribute
        return variant.attributes?.[key] === selectedValue
      })

      return matches && variant.attributes?.[attributeName] === value
    })
  }

  // Get variant by changing one attribute
  const getVariantByAttribute = (attributeName: string, value: string) => {
    const currentSelection = selectedVariant?.attributes || {}
    
    return variants.find(variant => {
      if (!variant.isActive) return false
      
      // Match all other attributes, change only the specified one
      const matches = Object.entries(attributeGroups).every(([key]) => {
        if (key === attributeName) {
          return variant.attributes?.[key] === value
        }
        return variant.attributes?.[key] === currentSelection[key]
      })

      return matches
    })
  }

  const handleAttributeSelect = (attributeName: string, value: string) => {
    const newVariant = getVariantByAttribute(attributeName, value)
    if (newVariant) {
      onSelect(newVariant)
    }
  }

  if (Object.keys(attributeGroups).length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {Object.entries(attributeGroups).map(([attributeName, values]) => (
        <div key={attributeName} className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              {attributeName}
            </label>
            {selectedVariant?.attributes?.[attributeName] && (
              <span className="text-sm text-gray-500">
                Selected: {selectedVariant.attributes[attributeName]}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {values.map((value) => {
              const isSelected = selectedVariant?.attributes?.[attributeName] === value
              const isAvailable = isValueAvailable(attributeName, value)

              return (
                <button
                  key={value}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => handleAttributeSelect(attributeName, value)}
                  className={`
                    px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all
                    ${isSelected
                      ? 'border-[#1a3a5c] bg-[#1a3a5c] text-white'
                      : isAvailable
                      ? 'border-gray-300 bg-white text-gray-700 hover:border-[#1a3a5c] hover:bg-gray-50'
                      : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed line-through'
                    }
                  `}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      {selectedVariant && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">SKU: {selectedVariant.sku}</p>
              <p className={`text-sm font-medium ${
                selectedVariant.stock > 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {selectedVariant.stock > 0 
                  ? `${selectedVariant.stock} in stock`
                  : 'Out of stock'
                }
              </p>
            </div>
            <div className="text-right">
              {selectedVariant.comparePrice && selectedVariant.comparePrice > selectedVariant.price && (
                <p className="text-sm text-gray-500 line-through">
                  ${selectedVariant.comparePrice.toFixed(2)}
                </p>
              )}
              <p className="text-2xl font-bold text-[#1a3a5c]">
                ${selectedVariant.price.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
