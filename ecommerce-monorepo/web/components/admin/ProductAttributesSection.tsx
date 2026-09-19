'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ColorSelector } from '@/components/ui/ColorSelector'
import { ColorSwatch } from '@/components/ui/ColorSwatch'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'
import {
  getLocalizedOptionLabel,
  getLocalizedColorList,
  getLocalizedColorName
} from '@/lib/utils/attributeOptionTranslations'

interface ProductAttributesSectionProps {
  categoryId: string | null | undefined
  initialValues?: Record<string, any>
  /** Per-locale translations for attribute values: { [slug]: { en: string, ru: string, zh: string } } */
  attributeTranslations?: Record<string, Record<string, string>>
  onChange: (values: Record<string, any>, translations: Record<string, Record<string, string>>) => void
}

export function ProductAttributesSection({
  categoryId,
  initialValues = {},
  attributeTranslations: initialTranslations = {},
  onChange,
}: ProductAttributesSectionProps) {
  const { dict } = useAdminLocale()
  const [categoryAttributes, setCategoryAttributes] = useState<any[]>([])
  const [attributeValues, setAttributeValues] = useState<Record<string, any>>(initialValues)
  const [attrTranslations, setAttrTranslations] = useState<Record<string, Record<string, string>>>(initialTranslations)
  const [activeTab, setActiveTab] = useState<'en' | 'ru' | 'zh'>('en')
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

  // Synchronize incoming attributeTranslations prop whenever it updates (e.g. from Auto-Translate)
  useEffect(() => {
    if (initialTranslations && Object.keys(initialTranslations).length > 0) {
      setAttrTranslations(prev => {
        const next = { ...prev }
        for (const [k, v] of Object.entries(initialTranslations)) {
          next[k] = { ...(next[k] || {}), ...v }
        }
        return next
      })
    }
  }, [initialTranslations])

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
          onChange(initVals, attrTranslations)
        }
      }
    } catch (err) {
      console.error('Error fetching category attributes:', err)
      setCategoryAttributes([])
    } finally {
      setLoading(false)
    }
  }

  // Automatically keep option and color translations populated in attrTranslations
  useEffect(() => {
    if (categoryAttributes.length > 0 && Object.keys(attributeValues).length > 0) {
      let changed = false
      const nextTrans = { ...attrTranslations }

      for (const attr of categoryAttributes) {
        const val = attributeValues[attr.slug]
        if (val === undefined || val === null || val === '') continue

        if (attr.type === 'COLOR' || attr.type === 'COLOR_MULTI') {
          const colorArr: string[] = Array.isArray(val) ? val : [val]
          if (!nextTrans[attr.slug]?.ru || !nextTrans[attr.slug]?.zh) {
            nextTrans[attr.slug] = {
              ...(nextTrans[attr.slug] || {}),
              en: nextTrans[attr.slug]?.en || getLocalizedColorList(colorArr, 'en'),
              ru: nextTrans[attr.slug]?.ru || getLocalizedColorList(colorArr, 'ru'),
              zh: nextTrans[attr.slug]?.zh || getLocalizedColorList(colorArr, 'zh'),
            }
            changed = true
          }
        } else if (attr.type === 'SELECT') {
          const optStr = typeof val === 'string' ? val : String(val)
          if (optStr.trim() && (!nextTrans[attr.slug]?.ru || !nextTrans[attr.slug]?.zh)) {
            nextTrans[attr.slug] = {
              ...(nextTrans[attr.slug] || {}),
              en: nextTrans[attr.slug]?.en || getLocalizedOptionLabel(attr.slug, optStr, 'en'),
              ru: nextTrans[attr.slug]?.ru || getLocalizedOptionLabel(attr.slug, optStr, 'ru'),
              zh: nextTrans[attr.slug]?.zh || getLocalizedOptionLabel(attr.slug, optStr, 'zh'),
            }
            changed = true
          }
        } else if (attr.type === 'MULTISELECT') {
          const multiArr: string[] = Array.isArray(val) ? val : [val]
          if (multiArr.length > 0 && (!nextTrans[attr.slug]?.ru || !nextTrans[attr.slug]?.zh)) {
            nextTrans[attr.slug] = {
              ...(nextTrans[attr.slug] || {}),
              en: nextTrans[attr.slug]?.en || multiArr.map(v => getLocalizedOptionLabel(attr.slug, v, 'en')).join(', '),
              ru: nextTrans[attr.slug]?.ru || multiArr.map(v => getLocalizedOptionLabel(attr.slug, v, 'ru')).join(', '),
              zh: nextTrans[attr.slug]?.zh || multiArr.map(v => getLocalizedOptionLabel(attr.slug, v, 'zh')).join(', '),
            }
            changed = true
          }
        }
      }

      if (changed) {
        setAttrTranslations(nextTrans)
        onChange(attributeValues, nextTrans)
      }
    }
  }, [categoryAttributes, attributeValues])

  const getLocalizedAttributeName = (attribute: any, tab: 'en' | 'ru' | 'zh') => {
    if (tab === 'en') return attribute.name
    if (attribute.translations && Array.isArray(attribute.translations)) {
      const match = attribute.translations.find((t: any) => t.locale === tab)
      if (match && match.name && match.name.trim().length > 0) {
        return match.name
      }
    }
    return attribute.name
  }

  const getTranslatableFieldsForLocale = (loc: 'en' | 'ru' | 'zh'): Record<string, string> => {
    const fields: Record<string, string> = {}
    for (const attr of categoryAttributes) {
      if (['TEXT', 'TEXTAREA'].includes(attr.type)) {
        if (loc === 'en') {
          const val = attributeValues[attr.slug]
          if (typeof val === 'string' && val.trim().length > 0) {
            fields[attr.slug] = val.trim()
          }
        } else {
          const val = attrTranslations[attr.slug]?.[loc]
          if (typeof val === 'string' && val.trim().length > 0) {
            fields[attr.slug] = val.trim()
          }
        }
      }
    }
    return fields
  }

  const handleChange = (slug: string, value: any) => {
    const attr = categoryAttributes.find(a => a.slug === slug)
    const attrType = attr?.type

    let nextVals = { ...attributeValues }
    let nextTrans = { ...attrTranslations }

    if (!nextTrans[slug]) {
      nextTrans[slug] = {}
    }

    if (attrType === 'COLOR' || attrType === 'COLOR_MULTI') {
      const colorArr: string[] = Array.isArray(value) ? value : (value ? [value] : [])
      nextVals[slug] = colorArr
      nextTrans[slug] = {
        ...nextTrans[slug],
        en: getLocalizedColorList(colorArr, 'en'),
        ru: getLocalizedColorList(colorArr, 'ru'),
        zh: getLocalizedColorList(colorArr, 'zh'),
      }
      setAttributeValues(nextVals)
      setAttrTranslations(nextTrans)
      onChange(nextVals, nextTrans)
      return
    }

    if (attrType === 'SELECT') {
      const optStr = typeof value === 'string' ? value : String(value || '')
      nextVals[slug] = optStr
      nextTrans[slug] = {
        ...nextTrans[slug],
        en: getLocalizedOptionLabel(slug, optStr, 'en'),
        ru: getLocalizedOptionLabel(slug, optStr, 'ru'),
        zh: getLocalizedOptionLabel(slug, optStr, 'zh'),
      }
      setAttributeValues(nextVals)
      setAttrTranslations(nextTrans)
      onChange(nextVals, nextTrans)
      return
    }

    if (attrType === 'MULTISELECT') {
      const multiArr: string[] = Array.isArray(value) ? value : (value ? [value] : [])
      nextVals[slug] = multiArr
      nextTrans[slug] = {
        ...nextTrans[slug],
        en: multiArr.map(v => getLocalizedOptionLabel(slug, v, 'en')).join(', '),
        ru: multiArr.map(v => getLocalizedOptionLabel(slug, v, 'ru')).join(', '),
        zh: multiArr.map(v => getLocalizedOptionLabel(slug, v, 'zh')).join(', '),
      }
      setAttributeValues(nextVals)
      setAttrTranslations(nextTrans)
      onChange(nextVals, nextTrans)
      return
    }

    // Standard text, textarea, or other types
    if (activeTab === 'en') {
      nextVals[slug] = value
      setAttributeValues(nextVals)
      nextTrans[slug] = {
        ...nextTrans[slug],
        en: typeof value === 'string' ? value : String(value ?? '')
      }
    } else {
      nextTrans[slug] = {
        ...nextTrans[slug],
        [activeTab]: typeof value === 'string' ? value : String(value ?? '')
      }
    }

    setAttrTranslations(nextTrans)
    onChange(nextVals, nextTrans)
  }

  const renderInput = (attribute: any) => {
    const slug = attribute.slug
    const isEn = activeTab === 'en'
    const value = isEn 
      ? (attributeValues[slug] ?? '') 
      : (attrTranslations[slug]?.[activeTab] ?? '')
    const colorOpts: { label: string; value: string }[] = attribute.colorOptions || []

    const placeholderText = !isEn && attributeValues[slug]
      ? `EN: "${attributeValues[slug]}"`
      : (attribute.placeholder || '')

    switch (attribute.type) {
      // ── Text types ──────────────────────────────────────────────────────
      case 'TEXT':
        return (
          <Input
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={placeholderText}
          />
        )

      case 'TEXTAREA':
        return (
          <textarea
            value={value || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={placeholderText}
            rows={3}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] outline-none"
          />
        )

      case 'NUMBER':
        return (
          <Input
            type="number"
            value={attributeValues[slug] ?? ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            placeholder={attribute.placeholder || ''}
          />
        )

      // ── Select types ────────────────────────────────────────────────────
      case 'SELECT':
        return (
          <select
            value={attributeValues[slug] || ''}
            onChange={e => handleChange(attribute.slug, e.target.value)}
            className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] outline-none"
          >
            <option value="">Select {getLocalizedAttributeName(attribute, activeTab)}</option>
            {attribute.options?.map((opt: any) => {
              const optVal = typeof opt === 'object' && opt !== null ? (opt.value || opt.label || '') : opt
              const translatedOpt = getLocalizedOptionLabel(attribute.slug, opt, activeTab)
              return (
                <option key={optVal} value={optVal}>{translatedOpt}</option>
              )
            })}
          </select>
        )

      case 'MULTISELECT':
        return (
          <select
            multiple
            value={Array.isArray(attributeValues[slug]) ? attributeValues[slug] : (attributeValues[slug] ? [attributeValues[slug]] : [])}
            onChange={e => {
              const selected = Array.from(e.target.selectedOptions, o => o.value)
              handleChange(attribute.slug, selected)
            }}
            className="w-full border border-gray-300 rounded-md p-2 text-sm min-h-[100px] focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] outline-none"
          >
            {attribute.options?.map((opt: any) => {
              const optVal = typeof opt === 'object' && opt !== null ? (opt.value || opt.label || '') : opt
              const translatedOpt = getLocalizedOptionLabel(attribute.slug, opt, activeTab)
              return (
                <option key={optVal} value={optVal}>{translatedOpt}</option>
              )
            })}
          </select>
        )

      // ── Color & Color Multi — rich swatch multi-select + color picker ────
      case 'COLOR':
      case 'COLOR_MULTI': {
        const rawColorVal = attributeValues[slug]
        const selectedVals: string[] = Array.isArray(rawColorVal)
          ? rawColorVal
          : (typeof rawColorVal === 'string' && rawColorVal.trim() ? [rawColorVal] : [])

        return (
          <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80">
            <ColorSelector
              options={colorOpts}
              selected={selectedVals}
              onChange={vals => handleChange(attribute.slug, vals)}
              multi={true}
              size="md"
              showLabels
              allowCustomColor={true}
              locale={activeTab}
            />
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
        <CardHeader><CardTitle>{dict.products.productAttributes}</CardTitle></CardHeader>
        <CardContent><p className="text-sm text-gray-500 animate-pulse">{dict.products.loadingAttributes}</p></CardContent>
      </Card>
    )
  }
  if (categoryAttributes.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle>{dict.products.productAttributes}</CardTitle>
            <p className="text-sm text-gray-600">{dict.products.categoryAttributesSubtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AutoTranslateButton
              sourceLocale={activeTab}
              label={`✨ ${dict.common.autoTranslate}`}
              allFields={{
                en: getTranslatableFieldsForLocale('en'),
                ru: getTranslatableFieldsForLocale('ru'),
                zh: getTranslatableFieldsForLocale('zh'),
              }}
              onTranslated={(translationsByLocale) => {
                const nextTrans = { ...attrTranslations }
                for (const [loc, fields] of Object.entries(translationsByLocale)) {
                  for (const [slug, val] of Object.entries(fields)) {
                    if (!nextTrans[slug]) nextTrans[slug] = {}
                    nextTrans[slug][loc] = val
                  }
                }
                // Ensure all SELECT, MULTISELECT, and COLOR attributes have localized values in nextTrans
                for (const attr of categoryAttributes) {
                  const val = attributeValues[attr.slug]
                  if (val === undefined || val === null || val === '') continue
                  if (attr.type === 'COLOR' || attr.type === 'COLOR_MULTI') {
                    const arr: string[] = Array.isArray(val) ? val : [val]
                    if (!nextTrans[attr.slug]) nextTrans[attr.slug] = {}
                    nextTrans[attr.slug].en = getLocalizedColorList(arr, 'en')
                    nextTrans[attr.slug].ru = getLocalizedColorList(arr, 'ru')
                    nextTrans[attr.slug].zh = getLocalizedColorList(arr, 'zh')
                  } else if (attr.type === 'SELECT') {
                    const optStr = typeof val === 'string' ? val : String(val)
                    if (optStr.trim()) {
                      if (!nextTrans[attr.slug]) nextTrans[attr.slug] = {}
                      nextTrans[attr.slug].en = getLocalizedOptionLabel(attr.slug, optStr, 'en')
                      nextTrans[attr.slug].ru = getLocalizedOptionLabel(attr.slug, optStr, 'ru')
                      nextTrans[attr.slug].zh = getLocalizedOptionLabel(attr.slug, optStr, 'zh')
                    }
                  } else if (attr.type === 'MULTISELECT') {
                    const multiArr: string[] = Array.isArray(val) ? val : [val]
                    if (multiArr.length > 0) {
                      if (!nextTrans[attr.slug]) nextTrans[attr.slug] = {}
                      nextTrans[attr.slug].en = multiArr.map(v => getLocalizedOptionLabel(attr.slug, v, 'en')).join(', ')
                      nextTrans[attr.slug].ru = multiArr.map(v => getLocalizedOptionLabel(attr.slug, v, 'ru')).join(', ')
                      nextTrans[attr.slug].zh = multiArr.map(v => getLocalizedOptionLabel(attr.slug, v, 'zh')).join(', ')
                    }
                  }
                }
                setAttrTranslations(nextTrans)
                onChange(attributeValues, nextTrans)
              }}
            />
            {/* Locale switcher tabs for attributes */}
            <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
              {(['en', 'ru', 'zh'] as const).map(loc => {
                const flags: Record<string, string> = { en: '🇬🇧 EN', ru: '🇷🇺 RU', zh: '🇨🇳 ZH' }
                return (
                  <button
                    key={loc}
                    type="button"
                    onClick={() => setActiveTab(loc)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                      activeTab === loc ? 'bg-primary-600 text-white shadow-sm bg-[#1a3a5c]' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {flags[loc]}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {categoryAttributes.map(attribute => (
          <div key={attribute.id}>
            <Label htmlFor={attribute.slug} className="mb-1 flex items-center justify-between">
              <span className="font-semibold text-gray-800">
                {getLocalizedAttributeName(attribute, activeTab)}
                {attribute.isRequired && <span className="text-red-500 ml-1">*</span>}
              </span>
              <span className="text-[10px] uppercase bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-bold">
                {activeTab}
              </span>
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
  if (type === 'MULTISELECT' || type === 'COLOR_MULTI' || type === 'COLOR') return []
  if (type === 'CHECKBOX') return false
  return ''
}