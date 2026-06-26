'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'

interface ProductAttributesSectionProps {
  categoryId: string | null | undefined
  initialValues?: Record<string, any>
  onChange: (values: Record<string, any>) => void
}

export function ProductAttributesSection({ 
  categoryId, 
  initialValues = {},
  onChange 
}: ProductAttributesSectionProps) {
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>(initialValues)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (categoryId) {
      fetchCategoryAttributes(categoryId)
    } else {
      setCategoryAttributes([])
      setAttributeValues({})
    }
  }, [categoryId])

  useEffect(() => {
    // Initialize with passed values
    if (initialValues && Object.keys(initialValues).length > 0) {
      setAttributeValues(initialValues)
    }
  }, [initialValues])

  const fetchCategoryAttributes = async (catId: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/categories/${catId}/attributes`)
      const data = await response.json()
      if (data.data) {
        setCategoryAttributes(data.data || [])
        // Initialize attribute values if not already set
        if (Object.keys(attributeValues).length === 0) {
          const initialVals: Record<string, any> = {}
          data.data.forEach((attr: any) => {
            initialVals[attr.slug] = initialValues[attr.slug] || ''
          })
          setAttributeValues(initialVals)
          onChange(initialVals)
        }
      }
    } catch (error) {
      console.error('Error fetching category attributes:', error)
      setCategoryAttributes([])
    } finally {
      setLoading(false)
    }
  }

  const handleAttributeChange = (slug: string, value: any) => {
    const newValues = {
      ...attributeValues,
      [slug]: value
    }
    setAttributeValues(newValues)
    onChange(newValues)
  }

  const renderAttributeInput = (attribute: any) => {
    const value = attributeValues[attribute.slug] || ''

    switch (attribute.type) {
      case 'TEXT':
        return (
          <Input
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
          />
        )
      
      case 'TEXTAREA':
        return (
          <textarea
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
            rows={3}
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
          />
        )
      
      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
          />
        )
      
      case 'SELECT':
        return (
          <select
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm"
          >
            <option value="">Select {attribute.name}</option>
            {attribute.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      
      case 'MULTISELECT':
        return (
          <select
            multiple
            value={Array.isArray(value) ? value : (value ? [value] : [])}
            onChange={(e) => {
              const selectedOptions = Array.from(e.target.selectedOptions, option => option.value)
              handleAttributeChange(attribute.slug, selectedOptions)
            }}
            className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[100px]"
          >
            {attribute.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )
      
      case 'COLOR':
        return (
          <div className="flex gap-2">
            <Input
              type="color"
              value={value || '#000000'}
              onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
              className="w-20"
            />
            <Input
              type="text"
              value={value}
              onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
              placeholder="#000000"
            />
          </div>
        )
      
      case 'URL':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || 'https://'}
          />
        )
      
      case 'CHECKBOX':
        return (
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={!!value}
              onChange={(e) => handleAttributeChange(attribute.slug, e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm">{attribute.helperText || 'Enable'}</span>
          </label>
        )
      
      case 'DATE':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
          />
        )
      
      case 'FILE':
        return (
          <Input
            type="url"
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || 'Enter file URL'}
          />
        )
      
      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleAttributeChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
          />
        )
    }
  }

  // Validate required attributes
  const getRequiredAttributesErrors = () => {
    return categoryAttributes
      .filter(attr => attr.isRequired && !attributeValues[attr.slug])
      .map(attr => attr.name)
  }

  if (!categoryId) {
    return null
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Product Attributes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">Loading attributes...</p>
        </CardContent>
      </Card>
    )
  }

  if (categoryAttributes.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Attributes</CardTitle>
        <p className="text-sm text-gray-600">
          Category-specific attributes for this product
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {categoryAttributes.map((attribute) => (
          <div key={attribute.id}>
            <Label htmlFor={attribute.slug}>
              {attribute.name}
              {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderAttributeInput(attribute)}
            {attribute.helperText && attribute.type !== 'CHECKBOX' && (
              <p className="text-xs text-gray-500 mt-1">{attribute.helperText}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

// Export helper function to validate attributes
export function validateRequiredAttributes(
  categoryAttributes: any[],
  attributeValues: Record<string, any>
): string[] {
  return categoryAttributes
    .filter(attr => attr.isRequired && !attributeValues[attr.slug])
    .map(attr => attr.name)
}
