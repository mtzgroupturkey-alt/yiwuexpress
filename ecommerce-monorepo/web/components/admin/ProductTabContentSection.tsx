'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'
import {
  FileText,
  Plus,
  Trash2,
  Sparkles,
  Layers,
  Ruler,
  Box,
  CheckCircle2,
  ListPlus,
  HelpCircle,
  Info,
  Hash
} from 'lucide-react'

export type LocaleCode = 'en' | 'ru' | 'zh'

export interface DimensionItem {
  key: string
  value: string
}

export interface PackageItem {
  name?: string
  articleNumber?: string
  width?: string
  height?: string
  length?: string
  weight?: string
}

export interface TabLocaleContent {
  swedenName: string
  englishName: string
  description: string
  overviewSummary: string
  overviewHighlights: string[]
  keyFeatures: string[]
  materials: string
  careInstructions: string
  whatsIncluded: string
  dimensions: DimensionItem[]
}

export interface TabSectionPayload {
  rawIkeaPayload: any
  dimensions: Record<string, any>
  material?: string
  ikeaItemNo?: string
}

interface ProductTabContentSectionProps {
  initialRawIkeaPayload?: any
  initialDimensions?: any
  initialMaterial?: string
  initialDescription?: string
  initialName?: string
  initialIkeaItemNo?: string
  onChange: (payload: TabSectionPayload) => void
  disabled?: boolean
}

const LOCALES: { code: LocaleCode; label: string; flag: string }[] = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

function extractSwedenName(fullName?: string): string {
  if (!fullName) return ''
  const trimmed = fullName.trim()
  const m = trimmed.match(/^([A-ZÅÄÖØÆÉÈÜ0-9]{2,})/u)
  return m ? m[1] : ''
}

function extractEnglishName(fullName?: string, swedenName?: string): string {
  if (!fullName) return ''
  let cleaned = fullName.trim()
  if (swedenName && cleaned.startsWith(swedenName)) {
    cleaned = cleaned.slice(swedenName.length).trim()
    if (cleaned.startsWith('-')) cleaned = cleaned.slice(1).trim()
  }
  return cleaned
}

function dimensionsMapToArray(map?: Record<string, any> | null): DimensionItem[] {
  if (!map || typeof map !== 'object') return []
  const shippingKeys = new Set(['unit', 'packageqty', 'volumel', 'grossweightkg', 'netweightkg', 'grossweight', 'packagecount'])
  return Object.entries(map)
    .filter(([key]) => !shippingKeys.has(key.toLowerCase().replace(/[^a-z0-9]/g, '')))
    .map(([key, val]) => ({
      key: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      value: typeof val === 'number' ? `${val} cm` : String(val ?? '')
    }))
}

function dimensionsArrayToMap(arr: DimensionItem[]): Record<string, string> {
  const map: Record<string, string> = {}
  arr.forEach((item) => {
    const k = item.key.trim()
    const v = item.value.trim()
    if (k && v) {
      map[k] = v
    }
  })
  return map
}

function createEmptyLocaleContent(): TabLocaleContent {
  return {
    swedenName: '',
    englishName: '',
    description: '',
    overviewSummary: '',
    overviewHighlights: [],
    keyFeatures: [],
    materials: '',
    careInstructions: '',
    whatsIncluded: '',
    dimensions: []
  }
}

export function ProductTabContentSection({
  initialRawIkeaPayload,
  initialDimensions,
  initialMaterial,
  initialDescription,
  initialName,
  initialIkeaItemNo,
  onChange,
  disabled = false,
}: ProductTabContentSectionProps) {
  const [activeLocale, setActiveLocale] = useState<LocaleCode>('en')
  const [activeInnerTab, setActiveInnerTab] = useState<'details' | 'overview' | 'measurements'>('overview')

  // Article number state
  const [articleNumber, setArticleNumber] = useState<string>(() => {
    return (
      initialRawIkeaPayload?.articleNumber ||
      initialRawIkeaPayload?.itemNumber ||
      initialIkeaItemNo ||
      ''
    )
  })

  // Multi-locale content storage
  const [localeData, setLocaleData] = useState<Record<LocaleCode, TabLocaleContent>>(() => {
    const en = createEmptyLocaleContent()
    const ru = createEmptyLocaleContent()
    const zh = createEmptyLocaleContent()

    const raw = initialRawIkeaPayload || {}
    const translations = raw.translations || {}

    // Sweden Name
    const autoSweden = extractSwedenName(raw.name || initialName || '')
    en.swedenName = raw.swedenName || raw.swedishName || raw.productDetails?.swedenName || autoSweden || ''
    ru.swedenName = raw.translations?.ru?.swedenName || raw.translations?.ru?.productDetails?.swedenName || en.swedenName
    zh.swedenName = raw.translations?.zh?.swedenName || raw.translations?.zh?.productDetails?.swedenName || en.swedenName

    // English Name
    const autoEng = extractEnglishName(raw.name, en.swedenName) || initialName || ''
    en.englishName = raw.englishName || raw.productDetails?.englishName || autoEng || ''
    ru.englishName = raw.translations?.ru?.englishName || raw.translations?.ru?.productDetails?.englishName || ''
    zh.englishName = raw.translations?.zh?.englishName || raw.translations?.zh?.productDetails?.englishName || ''

    // Description
    en.description = raw.productDetails?.description || raw.description || initialDescription || ''
    ru.description = raw.translations?.ru?.productDetails?.description || raw.translations?.ru?.description || ''
    zh.description = raw.translations?.zh?.productDetails?.description || raw.translations?.zh?.description || ''

    // Overview summary
    en.overviewSummary = raw.overview?.summary || initialDescription || ''
    ru.overviewSummary = raw.overview?.translations?.ru?.summary || translations.ru?.overview?.summary || ''
    zh.overviewSummary = raw.overview?.translations?.zh?.summary || translations.zh?.overview?.summary || ''

    // Overview highlights
    en.overviewHighlights = Array.isArray(raw.overview?.features) ? [...raw.overview.features] : []
    ru.overviewHighlights = Array.isArray(raw.overview?.translations?.ru?.features)
      ? [...raw.overview.translations.ru.features]
      : Array.isArray(translations.ru?.overview?.features)
      ? [...translations.ru.overview.features]
      : []
    zh.overviewHighlights = Array.isArray(raw.overview?.translations?.zh?.features)
      ? [...raw.overview.translations.zh.features]
      : Array.isArray(translations.zh?.overview?.features)
      ? [...translations.zh.overview.features]
      : []

    // Key features bullets
    en.keyFeatures = Array.isArray(raw.productDetails?.keyFeatures) ? [...raw.productDetails.keyFeatures] : []
    ru.keyFeatures = Array.isArray(raw.productDetails?.translations?.ru?.keyFeatures)
      ? [...raw.productDetails.translations.ru.keyFeatures]
      : Array.isArray(translations.ru?.productDetails?.keyFeatures)
      ? [...translations.ru.productDetails.keyFeatures]
      : []
    zh.keyFeatures = Array.isArray(raw.productDetails?.translations?.zh?.keyFeatures)
      ? [...raw.productDetails.translations.zh.keyFeatures]
      : Array.isArray(translations.zh?.productDetails?.keyFeatures)
      ? [...translations.zh.productDetails.keyFeatures]
      : []

    // Materials
    en.materials = raw.productDetails?.materials !== undefined ? (raw.productDetails.materials || '') : (initialMaterial || '')
    ru.materials = raw.productDetails?.translations?.ru?.materials || translations.ru?.productDetails?.materials || ''
    zh.materials = raw.productDetails?.translations?.zh?.materials || translations.zh?.productDetails?.materials || ''

    // Care instructions
    en.careInstructions = raw.productDetails?.careInstructions || ''
    ru.careInstructions = raw.productDetails?.translations?.ru?.careInstructions || translations.ru?.productDetails?.careInstructions || ''
    zh.careInstructions = raw.productDetails?.translations?.zh?.careInstructions || translations.zh?.productDetails?.careInstructions || ''

    // What's included
    en.whatsIncluded = raw.productDetails?.whatsIncluded || ''
    ru.whatsIncluded = raw.productDetails?.translations?.ru?.whatsIncluded || translations.ru?.productDetails?.whatsIncluded || ''
    zh.whatsIncluded = raw.productDetails?.translations?.zh?.whatsIncluded || translations.zh?.productDetails?.whatsIncluded || ''

    // Dimensions
    const enDims = raw.measurementsTab?.dimensions || initialDimensions || {}
    en.dimensions = dimensionsMapToArray(enDims)

    const ruDims = raw.measurementsTab?.translations?.ru?.dimensions || translations.ru?.measurementsTab?.dimensions || null
    ru.dimensions = ruDims ? dimensionsMapToArray(ruDims) : []

    const zhDims = raw.measurementsTab?.translations?.zh?.dimensions || translations.zh?.measurementsTab?.dimensions || null
    zh.dimensions = zhDims ? dimensionsMapToArray(zhDims) : []

    return { en, ru, zh }
  })

  // Packaging list
  const [packagingList, setPackagingList] = useState<PackageItem[]>(() => {
    return Array.isArray(initialRawIkeaPayload?.measurementsTab?.packaging)
      ? [...initialRawIkeaPayload.measurementsTab.packaging]
      : []
  })

  // Emit changes to parent
  const emitChanges = useCallback(
    (
      currentLocales: Record<LocaleCode, TabLocaleContent>,
      currentPackaging: PackageItem[],
      currentArticleNum: string
    ) => {
      const en = currentLocales.en
      const ru = currentLocales.ru
      const zh = currentLocales.zh

      const enDimMap = dimensionsArrayToMap(en.dimensions)
      const ruDimMap = dimensionsArrayToMap(ru.dimensions)
      const zhDimMap = dimensionsArrayToMap(zh.dimensions)

      const updatedRawPayload = {
        ...(initialRawIkeaPayload || {}),
        swedenName: en.swedenName,
        englishName: en.englishName,
        articleNumber: currentArticleNum,
        overview: {
          ...(initialRawIkeaPayload?.overview || {}),
          summary: en.overviewSummary,
          features: en.overviewHighlights.filter(Boolean),
          translations: {
            ru: {
              summary: ru.overviewSummary,
              features: ru.overviewHighlights.filter(Boolean)
            },
            zh: {
              summary: zh.overviewSummary,
              features: zh.overviewHighlights.filter(Boolean)
            }
          }
        },
        productDetails: {
          ...(initialRawIkeaPayload?.productDetails || {}),
          swedenName: en.swedenName,
          englishName: en.englishName,
          articleNumber: currentArticleNum,
          description: en.description,
          keyFeatures: en.keyFeatures.filter(Boolean),
          materials: en.materials,
          careInstructions: en.careInstructions,
          whatsIncluded: en.whatsIncluded,
          translations: {
            ru: {
              swedenName: ru.swedenName,
              englishName: ru.englishName,
              articleNumber: currentArticleNum,
              description: ru.description,
              keyFeatures: ru.keyFeatures.filter(Boolean),
              materials: ru.materials,
              careInstructions: ru.careInstructions,
              whatsIncluded: ru.whatsIncluded
            },
            zh: {
              swedenName: zh.swedenName,
              englishName: zh.englishName,
              articleNumber: currentArticleNum,
              description: zh.description,
              keyFeatures: zh.keyFeatures.filter(Boolean),
              materials: zh.materials,
              careInstructions: zh.careInstructions,
              whatsIncluded: zh.whatsIncluded
            }
          }
        },
        measurementsTab: {
          ...(initialRawIkeaPayload?.measurementsTab || {}),
          dimensions: enDimMap,
          packaging: currentPackaging,
          translations: {
            ru: { dimensions: ruDimMap },
            zh: { dimensions: zhDimMap }
          }
        },
        translations: {
          ru: {
            swedenName: ru.swedenName,
            englishName: ru.englishName,
            articleNumber: currentArticleNum,
            description: ru.description,
            overview: {
              summary: ru.overviewSummary,
              features: ru.overviewHighlights.filter(Boolean)
            },
            productDetails: {
              swedenName: ru.swedenName,
              englishName: ru.englishName,
              articleNumber: currentArticleNum,
              description: ru.description,
              keyFeatures: ru.keyFeatures.filter(Boolean),
              materials: ru.materials,
              careInstructions: ru.careInstructions,
              whatsIncluded: ru.whatsIncluded
            },
            measurementsTab: { dimensions: ruDimMap }
          },
          zh: {
            swedenName: zh.swedenName,
            englishName: zh.englishName,
            articleNumber: currentArticleNum,
            description: zh.description,
            overview: {
              summary: zh.overviewSummary,
              features: zh.overviewHighlights.filter(Boolean)
            },
            productDetails: {
              swedenName: zh.swedenName,
              englishName: zh.englishName,
              articleNumber: currentArticleNum,
              description: zh.description,
              keyFeatures: zh.keyFeatures.filter(Boolean),
              materials: zh.materials,
              careInstructions: zh.careInstructions,
              whatsIncluded: zh.whatsIncluded
            },
            measurementsTab: { dimensions: zhDimMap }
          }
        }
      }

      onChange({
        rawIkeaPayload: updatedRawPayload,
        dimensions: Object.keys(enDimMap).length > 0 ? enDimMap : (initialDimensions || {}),
        material: en.materials.trim(),
        ikeaItemNo: currentArticleNum || undefined
      })
    },
    [initialRawIkeaPayload, initialDimensions, initialMaterial, onChange]
  )

  const updateCurrentLocale = (updater: (prev: TabLocaleContent) => TabLocaleContent) => {
    setLocaleData((prev) => {
      const next = {
        ...prev,
        [activeLocale]: updater(prev[activeLocale])
      }
      emitChanges(next, packagingList, articleNumber)
      return next
    })
  }

  const updatePackaging = (newPackaging: PackageItem[]) => {
    setPackagingList(newPackaging)
    emitChanges(localeData, newPackaging, articleNumber)
  }

  const handleArticleNumberChange = (newVal: string) => {
    setArticleNumber(newVal)
    emitChanges(localeData, packagingList, newVal)
  }

  // Flattened fields for Auto-Translate
  const getFlatFieldsForLocale = (loc: LocaleCode): Record<string, string> => {
    const data = localeData[loc]
    const flat: Record<string, string> = {}
    if (data.englishName) flat.englishName = data.englishName
    if (data.description) flat.description = data.description
    if (data.overviewSummary) flat.overviewSummary = data.overviewSummary
    if (data.materials) flat.materials = data.materials
    if (data.careInstructions) flat.careInstructions = data.careInstructions
    if (data.whatsIncluded) flat.whatsIncluded = data.whatsIncluded

    data.overviewHighlights.forEach((h, i) => {
      if (h) flat[`ov_feat_${i}`] = h
    })
    data.keyFeatures.forEach((kf, i) => {
      if (kf) flat[`kf_${i}`] = kf
    })
    data.dimensions.forEach((d, i) => {
      if (d.key) flat[`dim_key_${i}`] = d.key
      if (d.value) flat[`dim_val_${i}`] = d.value
    })
    return flat
  }

  // Handle auto-translation result
  const handleTranslated = (translations: Record<string, Record<string, string>>) => {
    setLocaleData((prev) => {
      const next = { ...prev }
      ;(['ru', 'zh'] as LocaleCode[]).forEach((targetLocale) => {
        const trans = translations[targetLocale]
        if (!trans) return

        const current = { ...next[targetLocale] }
        if (trans.englishName) current.englishName = trans.englishName
        if (trans.description) current.description = trans.description
        if (trans.overviewSummary) current.overviewSummary = trans.overviewSummary
        if (trans.materials) current.materials = trans.materials
        if (trans.careInstructions) current.careInstructions = trans.careInstructions
        if (trans.whatsIncluded) current.whatsIncluded = trans.whatsIncluded

        // Reconstruct highlights
        const highlights: string[] = []
        next.en.overviewHighlights.forEach((_, i) => {
          highlights.push(trans[`ov_feat_${i}`] || next.en.overviewHighlights[i])
        })
        if (highlights.length > 0) current.overviewHighlights = highlights

        // Reconstruct keyFeatures
        const kfs: string[] = []
        next.en.keyFeatures.forEach((_, i) => {
          kfs.push(trans[`kf_${i}`] || next.en.keyFeatures[i])
        })
        if (kfs.length > 0) current.keyFeatures = kfs

        // Reconstruct dimensions
        const dims: DimensionItem[] = []
        next.en.dimensions.forEach((d, i) => {
          dims.push({
            key: trans[`dim_key_${i}`] || d.key,
            value: trans[`dim_val_${i}`] || d.value
          })
        })
        if (dims.length > 0) current.dimensions = dims

        next[targetLocale] = current
      })

      emitChanges(next, packagingList, articleNumber)
      return next
    })
  }

  const current = localeData[activeLocale]

  // Add dimension preset
  const addPresetDimension = (keyName: string) => {
    if (current.dimensions.some((d) => d.key.toLowerCase() === keyName.toLowerCase())) return
    updateCurrentLocale((prev) => ({
      ...prev,
      dimensions: [...prev.dimensions, { key: keyName, value: '' }]
    }))
  }

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 space-y-6">
      {/* Header with Title and Language Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#1a3a5c]" />
            <h2 className="text-lg font-bold text-[#1a3a5c]">Storefront Tab Content & Descriptions</h2>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Edit Sweden Name, English Name, Article #, Description, Key Features, and Measurements.
          </p>
        </div>

        {/* Locale tabs + Auto-Translate Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {LOCALES.map(({ code, label, flag }) => {
              const isActive = activeLocale === code
              return (
                <button
                  key={code}
                  type="button"
                  disabled={disabled}
                  onClick={() => setActiveLocale(code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-white text-[#1a3a5c] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{flag}</span>
                  <span>{label}</span>
                </button>
              )
            })}
          </div>

          <AutoTranslateButton
            allFields={{
              en: getFlatFieldsForLocale('en'),
              ru: getFlatFieldsForLocale('ru'),
              zh: getFlatFieldsForLocale('zh')
            }}
            sourceLocale={activeLocale}
            onTranslated={handleTranslated}
            disabled={disabled}
            label="✨ Auto-Translate Tabs"
          />
        </div>
      </div>

      {/* Inner Subtabs: Overview | Product Details Info | Measurements */}
      <div className="flex space-x-2 border-b border-slate-100 pb-2">
        <button
          type="button"
          onClick={() => setActiveInnerTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeInnerTab === 'overview'
              ? 'bg-[#1a3a5c] text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Product Overview</span>
          {current.overviewHighlights.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 bg-white/20 rounded-full font-semibold">
              {current.overviewHighlights.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveInnerTab('details')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeInnerTab === 'details'
              ? 'bg-[#1a3a5c] text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Product Details &amp; Information</span>
          {current.keyFeatures.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 bg-white/20 rounded-full font-semibold">
              {current.keyFeatures.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveInnerTab('measurements')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
            activeInnerTab === 'measurements'
              ? 'bg-[#1a3a5c] text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Ruler className="w-4 h-4" />
          <span>Measurements &amp; Packaging</span>
          {current.dimensions.length > 0 && (
            <span className="text-[11px] px-1.5 py-0.2 bg-white/20 rounded-full font-semibold">
              {current.dimensions.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: PRODUCT DETAILS & IDENTIFICATION */}
      {activeInnerTab === 'details' && (
        <div className="space-y-6 animate-fade-in">
          {/* Key Features (Bullet Points) */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Key Features (Bullet Points) ({activeLocale.toUpperCase()})
                </Label>
                <p className="text-[11px] text-gray-400">
                  Displayed as bullet points in the &quot;Product details&quot; tab. Delete any unwanted text.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  updateCurrentLocale((prev) => ({
                    ...prev,
                    keyFeatures: [...prev.keyFeatures, '']
                  }))
                }
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Key Feature
              </Button>
            </div>

            {current.keyFeatures.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No key features bullet points. Click &quot;Add Key Feature&quot; to add.
              </div>
            ) : (
              <div className="space-y-2.5">
                {current.keyFeatures.map((kf, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-100 text-[#1a3a5c] font-bold text-xs flex items-center justify-center shrink-0 mt-2">
                      {idx + 1}
                    </span>
                    <textarea
                      rows={2}
                      value={kf}
                      disabled={disabled}
                      onChange={(e) => {
                        const val = e.target.value
                        updateCurrentLocale((prev) => {
                          const updated = [...prev.keyFeatures]
                          updated[idx] = val
                          return { ...prev, keyFeatures: updated }
                        })
                      }}
                      placeholder={`Key feature #${idx + 1}...`}
                      className="w-full border border-gray-300 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] transition-all bg-gray-50/40 focus:bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      onClick={() => {
                        updateCurrentLocale((prev) => ({
                          ...prev,
                          keyFeatures: prev.keyFeatures.filter((_, i) => i !== idx)
                        }))
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2 mt-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Materials & Care */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Materials ({activeLocale.toUpperCase()})
              </Label>
              <textarea
                rows={3}
                value={current.materials}
                disabled={disabled}
                onChange={(e) =>
                  updateCurrentLocale((prev) => ({ ...prev, materials: e.target.value }))
                }
                placeholder="e.g. Aluminium, Stainless steel, Ceramic non-stick coating..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] transition-all"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Care Instructions ({activeLocale.toUpperCase()})
              </Label>
              <textarea
                rows={3}
                value={current.careInstructions}
                disabled={disabled}
                onChange={(e) =>
                  updateCurrentLocale((prev) => ({ ...prev, careInstructions: e.target.value }))
                }
                placeholder="e.g. Handwash only. Suitable for gas, induction and ceramic hobs..."
                className="w-full border border-gray-300 rounded-xl p-3 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] transition-all"
              />
            </div>
          </div>

          {/* What's Included */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              What&apos;s Included ({activeLocale.toUpperCase()})
            </Label>
            <Input
              value={current.whatsIncluded}
              disabled={disabled}
              onChange={(e) =>
                updateCurrentLocale((prev) => ({ ...prev, whatsIncluded: e.target.value }))
              }
              placeholder="e.g. Pot 5L with lid, saucepan 2L with lid, saucepan 1L with lid..."
              className="rounded-xl text-sm"
            />
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCT OVERVIEW */}
      {activeInnerTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          {/* Overview Summary */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                Product Overview Summary ({activeLocale.toUpperCase()})
              </Label>
              <span className="text-[11px] text-gray-400">
                Shown as the main paragraph in the Overview tab
              </span>
            </div>
            <textarea
              rows={4}
              value={current.overviewSummary}
              disabled={disabled}
              onChange={(e) =>
                updateCurrentLocale((prev) => ({ ...prev, overviewSummary: e.target.value }))
              }
              placeholder="e.g. Modern, sleek and versatile cookware with non-stick coating and even, quick heat distribution..."
              className="w-full border border-gray-300 rounded-xl p-3.5 text-sm focus:ring-2 focus:ring-[#1a3a5c]/20 focus:border-[#1a3a5c] transition-all"
            />
          </div>

          {/* Key Highlights list (displayed on Overview tab) */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Overview Highlights (Key Highlights)
                </Label>
                <p className="text-[11px] text-gray-400">
                  Displayed in cards on the Overview tab.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  updateCurrentLocale((prev) => ({
                    ...prev,
                    overviewHighlights: [...prev.overviewHighlights, '']
                  }))
                }
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Highlight
              </Button>
            </div>

            {current.overviewHighlights.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No overview highlights defined yet. Click &quot;Add Highlight&quot; to add highlights.
              </div>
            ) : (
              <div className="space-y-2.5">
                {current.overviewHighlights.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-50 text-[#1a3a5c] font-bold text-xs flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <Input
                      value={feat}
                      disabled={disabled}
                      onChange={(e) => {
                        const val = e.target.value
                        updateCurrentLocale((prev) => {
                          const updated = [...prev.overviewHighlights]
                          updated[idx] = val
                          return { ...prev, overviewHighlights: updated }
                        })
                      }}
                      placeholder={`Highlight #${idx + 1}`}
                      className="rounded-xl flex-1 text-sm bg-gray-50/40 focus:bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                      onClick={() => {
                        updateCurrentLocale((prev) => ({
                          ...prev,
                          overviewHighlights: prev.overviewHighlights.filter((_, i) => i !== idx)
                        }))
                      }}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: MEASUREMENTS & PACKAGING */}
      {activeInnerTab === 'measurements' && (
        <div className="space-y-8 animate-fade-in">
          {/* Dimensions Table */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Product Dimensions ({activeLocale.toUpperCase()})
                </Label>
                <p className="text-[11px] text-gray-400">
                  Displayed as specification cards in the &quot;Measurements&quot; tab.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                  onClick={() =>
                    updateCurrentLocale((prev) => ({
                      ...prev,
                      dimensions: [...prev.dimensions, { key: '', value: '' }]
                    }))
                  }
                  className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Dimension
                </Button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs text-slate-500 py-1">
              <span className="text-[11px] font-medium mr-1">Quick add:</span>
              {['Length', 'Width', 'Height', 'Depth', 'Diameter', 'Volume', 'Weight', 'Net Weight', 'Gross Weight'].map(
                (preset) => (
                  <button
                    key={preset}
                    type="button"
                    disabled={disabled}
                    onClick={() => addPresetDimension(preset)}
                    className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 transition-colors text-[11px] font-medium"
                  >
                    + {preset}
                  </button>
                )
              )}
            </div>

            {current.dimensions.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No dimensions defined. Use Quick Add or click &quot;Add Dimension&quot;.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-bold uppercase text-slate-400">
                  <div className="col-span-5 sm:col-span-4">Dimension Name</div>
                  <div className="col-span-6 sm:col-span-7">Value (with units)</div>
                  <div className="col-span-1 text-center">Action</div>
                </div>
                {current.dimensions.map((dim, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-5 sm:col-span-4">
                      <Input
                        value={dim.key}
                        disabled={disabled}
                        onChange={(e) => {
                          const val = e.target.value
                          updateCurrentLocale((prev) => {
                            const updated = [...prev.dimensions]
                            updated[idx] = { ...updated[idx], key: val }
                            return { ...prev, dimensions: updated }
                          })
                        }}
                        placeholder="e.g. Length, Diameter"
                        className="rounded-xl text-sm"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-7">
                      <Input
                        value={dim.value}
                        disabled={disabled}
                        onChange={(e) => {
                          const val = e.target.value
                          updateCurrentLocale((prev) => {
                            const updated = [...prev.dimensions]
                            updated[idx] = { ...updated[idx], value: val }
                            return { ...prev, dimensions: updated }
                          })
                        }}
                        placeholder="e.g. 53 cm, 2.5 kg, 5 l"
                        className="rounded-xl text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                          updateCurrentLocale((prev) => ({
                            ...prev,
                            dimensions: prev.dimensions.filter((_, i) => i !== idx)
                          }))
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Packaging Details */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
                  Packaging Details
                </Label>
                <p className="text-[11px] text-gray-400">
                  Displayed under &quot;Packaging Details&quot; in the Measurements tab.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  updatePackaging([
                    ...packagingList,
                    {
                      name: `Package ${packagingList.length + 1}`,
                      articleNumber: '',
                      width: '',
                      height: '',
                      length: '',
                      weight: ''
                    }
                  ])
                }
                className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50 text-xs gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Package
              </Button>
            </div>

            {packagingList.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500">
                No package details. Click &quot;Add Package&quot; to configure package box dimensions.
              </div>
            ) : (
              <div className="space-y-3">
                {packagingList.map((pkg, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                      <div className="flex items-center gap-2">
                        <Box className="w-4 h-4 text-[#1a3a5c]" />
                        <span className="font-bold text-xs text-slate-800">
                          Package {idx + 1}
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={disabled}
                        onClick={() => {
                          updatePackaging(packagingList.filter((_, i) => i !== idx))
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg text-xs h-7 px-2"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-1" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
                      <div className="sm:col-span-2">
                        <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Package Name
                        </Label>
                        <Input
                          value={pkg.name || ''}
                          disabled={disabled}
                          onChange={(e) => {
                            const updated = [...packagingList]
                            updated[idx] = { ...updated[idx], name: e.target.value }
                            updatePackaging(updated)
                          }}
                          placeholder="e.g. Cookware set box"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Width
                        </Label>
                        <Input
                          value={pkg.width || ''}
                          disabled={disabled}
                          onChange={(e) => {
                            const updated = [...packagingList]
                            updated[idx] = { ...updated[idx], width: e.target.value }
                            updatePackaging(updated)
                          }}
                          placeholder="e.g. 33 cm"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Height
                        </Label>
                        <Input
                          value={pkg.height || ''}
                          disabled={disabled}
                          onChange={(e) => {
                            const updated = [...packagingList]
                            updated[idx] = { ...updated[idx], height: e.target.value }
                            updatePackaging(updated)
                          }}
                          placeholder="e.g. 17 cm"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Length
                        </Label>
                        <Input
                          value={pkg.length || ''}
                          disabled={disabled}
                          onChange={(e) => {
                            const updated = [...packagingList]
                            updated[idx] = { ...updated[idx], length: e.target.value }
                            updatePackaging(updated)
                          }}
                          placeholder="e.g. 53 cm"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                      <div className="sm:col-span-2 md:col-span-1">
                        <Label className="text-[11px] font-semibold text-slate-600 block mb-1">
                          Weight
                        </Label>
                        <Input
                          value={pkg.weight || ''}
                          disabled={disabled}
                          onChange={(e) => {
                            const updated = [...packagingList]
                            updated[idx] = { ...updated[idx], weight: e.target.value }
                            updatePackaging(updated)
                          }}
                          placeholder="e.g. 4.63 kg"
                          className="rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
