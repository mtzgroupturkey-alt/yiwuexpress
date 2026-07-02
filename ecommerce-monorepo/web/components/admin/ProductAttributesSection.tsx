'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorSelector } from '@/components/ui/ColorSelector'
import { ColorSwatch } from '@/components/ui/ColorSwatch'

interface ProductAttributesSectionProps {
  categoryId: string | null | undefined
  initialValues?: Record<string, any>
  onChange: (values: Record<string, any>) => void
}

export function ProductAttributesSection({
  categoryId,
  initialValues = {},
  onChange,
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
        if (Object.keys(attributeValues).length === 0) {
          const initVals: Record<string, any> = {}
          data.data.forEach((attr: any) => {
            initVals[attr.slug] = initialValues[attr.slug] ?? defaultForType(attr.type)
          })
          setAttributeValues(initVals)
          onChange(initVals)
        }
      }
    } catch (err) {
      console.error('Error fetching category attributes:', err)
      setCategoryAttributes([])
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (slug: string, value: any) => {
    const next = { ...attributeValues, [slug]: value }
    setAttributeValues(next)
    onChange(next)
  }

  const renderInput = (attribute: any) => {
    const value = attributeValues[attribute.slug]
    const colorOpts: { label: string; value: string }[] = attribute.colorOptions || []

    switch (attribute.type) {
      // ── Text types ──────────────────────────────────────────────────────
      case 'TEXT':
        return (
          <Input
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
            rows={3}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] outline-none"
          />
        )

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
          />
        )

      // ── Select types ────────────────────────────────────────────────────
      case 'SELECT':
        return (
          <select
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] outline-none"
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
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions, o => o.value)
              handleChange(attribute.slug, selected)
            }}
            className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[100px] focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] outline-none"
          >
            {attribute.options?.map((opt: string) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        )

      // ── Color — single pick with swatches (or hex fallback) ────────────
      case 'COLOR': {
        const currentHex = Array.isArray(value) ? value[0] : (value || '')
        const selected   = currentHex ? [currentHex] : []

        if (colorOpts.length > 0) {
          return (
            <div className="space-y-2">
              <ColorSelector
                options={colorOpts}
                selected={selected}
                onChange={vals => handleChange(attribute.slug, vals[0] ?? '')}
                multi={false}
                size="md"
                showLabels
              />
              {/* Current selection display */}
              {currentHex && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <div className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: currentHex }} />
                  <span>{colorOpts.find(c => c.value === currentHex)?.label || currentHex}</span>
                </div>
              )}
            </div>
          )
        }

        // fallback: plain color+hex inputs
        return (
          <div className="flex gap-2 items-center">
            <div
              className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-inner overflow-hidden relative cursor-pointer"
              style={{ backgroundColor: value || '#000000' }}
            >
              <input
                type="color"
                value={value || '#000000'}
                onChange={e => handleChange(attribute.slug, e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
              />
            </div>
            <Input
              type="text"
              value={value || ''}
              onChange={e => handleChange(attribute.slug, e.target.value)}
              placeholder="#000000"
              className="font-mono"
            />
          </div>
        )
      }

      // ── Color multi — swatch multi-select ───────────────────────────────
      case 'COLOR_MULTI': {
        const selectedVals: string[] = Array.isArray(value)
          ? value
          : (value ? [value] : [])

        if (colorOpts.length > 0) {
          return (
            <div className="space-y-2">
              <ColorSelector
                options={colorOpts}
                selected={selectedVals}
                onChange={vals => handleChange(attribute.slug, vals)}
                multi
                size="md"
                showLabels
              />
              {selectedVals.length > 0 && (
                <p className="text-xs text-gray-500">
                  Selected: {selectedVals.map(v => colorOpts.find(c => c.value === v)?.label || v).join(', ')}
                </p>
              )}
            </div>
          )
        }

        // fallback: tag-style multi
        return (
          <div className="space-y-2">
            {Array.isArray(value) && value.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {value.map((hex: string) => (
                  <div key={hex} className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-0.5 text-xs">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: hex }} />
                    {hex}
                    <button
                      type="button"
                      onClick={() => handleChange(attribute.slug, value.filter((v: string) => v !== hex))}
                      className="ml-1 text-gray-400 hover:text-red-500"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 italic">No color options defined on this attribute</p>
          </div>
        )
      }

      // ── Others ─────────────────────────────────────────────────────────
      case 'URL':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || 'https://'}
          />
        )

      case 'CHECKBOX':
        return (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={!!value}
              onChange={e => handleChange(attribute.slug, e.target.checked)}
              className="w-4 h-4 rounded text-[#1a3a5c]"
            />
            <span className="text-sm">{attribute.helperText || 'Enable'}</span>
          </label>
        )

      case 'DATE':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
          />
        )

      case 'FILE':
        return (
          <Input
            type="url"
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || 'Enter file URL'}
          />
        )

      default:
        return (
          <Input
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
          />
        )
    }
  }

  if (!categoryId) return null
  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Product Attributes</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-gray-500 animate-pulse">Loading attributes…</p></CardContent>
      </Card>
    )
  }
  if (categoryAttributes.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Attributes</CardTitle>
        <p className="text-sm text-gray-600">Category-specific attributes for this product</p>
      </CardHeader>
      <CardContent className="space-y-5">
        {categoryAttributes.map(attribute => (
          <div key={attribute.id}>
            <Label htmlFor={attribute.slug} className="mb-1 block">
              {attribute.name}
              {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
            </Label>
            {renderInput(attribute)}
            {attribute.helperText && attribute.type !== 'CHECKBOX' && (
              <p className="text-xs text-[#1a3a5c]/70 mt-1 italic">{attribute.helperText}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function validateRequiredAttributes(
  categoryAttributes: any[],
  attributeValues: Record<string, any>
): string[] {
  return categoryAttributes
    .filter(attr => {
      if (!attr.isRequired) return false
      const val = attributeValues[attr.slug]
      if (!val) return true
      if (Array.isArray(val) && val.length === 0) return true
      return false
    })
    .map(attr => attr.name)
}

function defaultForType(type: string): any {
  if (type === 'MULTISELECT' || type === 'COLOR_MULTI') return []
  if (type === 'CHECKBOX') return false
  return ''
}
