'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { DialogFooter } from '@/components/ui/dialog'
import { toast } from 'react-hot-toast'
import { AutoTranslateButton } from '@/components/admin/AutoTranslateButton'
import { Plus, X, Palette, Sparkles, Globe2, List, Edit3, Info } from 'lucide-react'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'
import {
  COLOR_TRANSLATIONS,
  OPTION_TRANSLATIONS,
  getLocalizedOptionLabel,
} from '@/lib/utils/attributeOptionTranslations'

interface AttributeFormProps {
  initialData?: any
  categoryId: string | null
  onSuccess: () => void
  onCancel: () => void
}

interface ColorEntry {
  label: string
  value: string // hex
  translations?: {
    ru?: string
    zh?: string
  }
}

export interface OptionEntry {
  id: string
  value: string
  label: string
  translations: {
    ru: string
    zh: string
  }
}

export function AttributeForm({ initialData, categoryId, onSuccess, onCancel }: AttributeFormProps) {
  const { dict, locale: currentLocale } = useAdminLocale()
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [type, setType] = useState(initialData?.type || 'TEXT')
  
  // Option entries for SELECT / MULTISELECT
  const [optionsMode, setOptionsMode] = useState<'structured' | 'quick'>('structured')
  const [quickOptionsText, setQuickOptionsText] = useState('')
  const [optionItems, setOptionItems] = useState<OptionEntry[]>(() => {
    if (!initialData?.options || !Array.isArray(initialData.options)) return []
    return initialData.options.map((opt: any, index: number) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          id: `opt_${Date.now()}_${index}`,
          value: opt.value || opt.label || '',
          label: opt.label || opt.value || '',
          translations: {
            ru: opt.translations?.ru || getLocalizedOptionLabel(initialData.slug || '', opt.label || opt.value, 'ru'),
            zh: opt.translations?.zh || getLocalizedOptionLabel(initialData.slug || '', opt.label || opt.value, 'zh'),
          },
        }
      }
      const str = String(opt)
      const ruTrans = getLocalizedOptionLabel(initialData.slug || '', str, 'ru')
      const zhTrans = getLocalizedOptionLabel(initialData.slug || '', str, 'zh')
      return {
        id: `opt_${Date.now()}_${index}`,
        value: str,
        label: str,
        translations: {
          ru: ruTrans !== str ? ruTrans : '',
          zh: zhTrans !== str ? zhTrans : '',
        },
      }
    })
  })

  // Color options
  const [colorOptions, setColorOptions] = useState<ColorEntry[]>(() => {
    if (!initialData?.colorOptions || !Array.isArray(initialData.colorOptions)) return []
    return initialData.colorOptions.map((c: any) => ({
      label: c.label || '',
      value: c.value || '#1a3a5c',
      translations: {
        ru: c.translations?.ru || '',
        zh: c.translations?.zh || '',
      },
    }))
  })

  const [placeholder, setPlaceholder] = useState(initialData?.placeholder || '')
  const [helperText, setHelperText] = useState(initialData?.helperText || '')
  const [isRequired, setIsRequired] = useState(initialData?.isRequired || false)
  const [isFilterable, setIsFilterable] = useState(initialData?.isFilterable !== false)
  const [isVariant, setIsVariant] = useState(initialData?.isVariant || false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTranslatingOptions, setIsTranslatingOptions] = useState(false)

  const attributeTypes = [
    { value: 'TEXT',        label: dict.attributes.types.TEXT },
    { value: 'TEXTAREA',    label: dict.attributes.types.TEXTAREA },
    { value: 'NUMBER',      label: dict.attributes.types.NUMBER },
    { value: 'SELECT',      label: dict.attributes.types.SELECT },
    { value: 'MULTISELECT', label: dict.attributes.types.MULTISELECT },
    { value: 'COLOR',       label: dict.attributes.types.COLOR },
    { value: 'COLOR_MULTI', label: dict.attributes.types.COLOR_MULTI },
    { value: 'FILE',        label: dict.attributes.types.FILE },
    { value: 'URL',         label: dict.attributes.types.URL },
    { value: 'CHECKBOX',    label: dict.attributes.types.CHECKBOX },
    { value: 'DATE',        label: dict.attributes.types.DATE },
  ]

  // Translations for locales other than English (name, placeholder, helperText)
  const [translations, setTranslations] = useState<
    Record<string, { name: string; placeholder: string; helperText: string }>
  >(() => {
    const map: Record<string, { name: string; placeholder: string; helperText: string }> = {
      ru: { name: '', placeholder: '', helperText: '' },
      zh: { name: '', placeholder: '', helperText: '' },
    }
    ;(initialData?.translations || []).forEach((t: any) => {
      map[t.locale] = {
        name: t.name || '',
        placeholder: t.placeholder || '',
        helperText: t.helperText || '',
      }
    })
    return map
  })

  const isColorType  = type === 'COLOR' || type === 'COLOR_MULTI'
  const isSelectType = type === 'SELECT' || type === 'MULTISELECT'

  const updateTranslation = (locale: string, field: 'name' | 'placeholder' | 'helperText', val: string) =>
    setTranslations((prev) => ({
      ...prev,
      [locale]: {
        name: prev[locale]?.name || '',
        placeholder: prev[locale]?.placeholder || '',
        helperText: prev[locale]?.helperText || '',
        [field]: val,
      },
    }))

  // Auto-generate slug from name (only on create)
  useEffect(() => {
    if (!initialData && name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '_'))
    }
  }, [name, slug, initialData])

  // ── Option item helpers ───────────────────────────────────────────────────
  const addOptionItem = (defaultText = '') => {
    const ruGuess = defaultText ? getLocalizedOptionLabel(slug, defaultText, 'ru') : ''
    const zhGuess = defaultText ? getLocalizedOptionLabel(slug, defaultText, 'zh') : ''
    setOptionItems((prev) => [
      ...prev,
      {
        id: `opt_${Date.now()}_${Math.random()}`,
        value: defaultText,
        label: defaultText,
        translations: {
          ru: ruGuess !== defaultText ? ruGuess : '',
          zh: zhGuess !== defaultText ? zhGuess : '',
        },
      },
    ])
  }

  const updateOptionItem = (index: number, field: 'label' | 'ru' | 'zh', val: string) => {
    setOptionItems((prev) => {
      const next = [...prev]
      if (field === 'label') {
        next[index] = {
          ...next[index],
          label: val,
          value: val,
        }
        // Auto guess translations if available in dictionary
        const ruGuess = getLocalizedOptionLabel(slug, val, 'ru')
        const zhGuess = getLocalizedOptionLabel(slug, val, 'zh')
        if (ruGuess !== val && !next[index].translations.ru) {
          next[index].translations.ru = ruGuess
        }
        if (zhGuess !== val && !next[index].translations.zh) {
          next[index].translations.zh = zhGuess
        }
      } else {
        next[index] = {
          ...next[index],
          translations: {
            ...next[index].translations,
            [field]: val,
          },
        }
      }
      return next
    })
  }

  const removeOptionItem = (index: number) => {
    setOptionItems((prev) => prev.filter((_, i) => i !== index))
  }

  const parseQuickOptions = () => {
    if (!quickOptionsText.trim()) return
    const parts = quickOptionsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
    parts.forEach((p) => addOptionItem(p))
    setQuickOptionsText('')
    setOptionsMode('structured')
    toast.success(`Added ${parts.length} options with dictionary translations`)
  }

  // Auto-translate options via API / dictionary
  const handleAutoTranslateOptions = async () => {
    if (!optionItems.length) {
      toast.error('Add some options first')
      return
    }

    setIsTranslatingOptions(true)
    try {
      // Build dictionary of options that need translation
      const fieldsToTranslate: Record<string, string> = {}
      optionItems.forEach((opt, idx) => {
        if (opt.label.trim()) {
          fieldsToTranslate[`opt_${idx}`] = opt.label.trim()
        }
      })

      if (Object.keys(fieldsToTranslate).length === 0) {
        setIsTranslatingOptions(false)
        return
      }

      const res = await fetch('/api/admin/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: fieldsToTranslate,
          targetLocales: ['ru', 'zh'],
        }),
      })

      const json = await res.json()
      if (res.ok && json.success && json.translations) {
        setOptionItems((prev) =>
          prev.map((opt, idx) => {
            const key = `opt_${idx}`
            const ruTrans = json.translations.ru?.[key] || getLocalizedOptionLabel(slug, opt.label, 'ru')
            const zhTrans = json.translations.zh?.[key] || getLocalizedOptionLabel(slug, opt.label, 'zh')
            return {
              ...opt,
              translations: {
                ru: ruTrans !== opt.label ? ruTrans : opt.translations.ru || '',
                zh: zhTrans !== opt.label ? zhTrans : opt.translations.zh || '',
              },
            }
          })
        )
        toast.success(dict.common?.saveSuccess || 'Options translated successfully')
      } else {
        // Fallback: translate using built-in dictionary
        setOptionItems((prev) =>
          prev.map((opt) => {
            const ruTrans = getLocalizedOptionLabel(slug, opt.label, 'ru')
            const zhTrans = getLocalizedOptionLabel(slug, opt.label, 'zh')
            return {
              ...opt,
              translations: {
                ru: opt.translations.ru || (ruTrans !== opt.label ? ruTrans : ''),
                zh: opt.translations.zh || (zhTrans !== opt.label ? zhTrans : ''),
              },
            }
          })
        )
        toast.success('Applied dictionary translations')
      }
    } catch (err) {
      console.error('Error translating options:', err)
      // Dictionary fallback
      setOptionItems((prev) =>
        prev.map((opt) => {
          const ruTrans = getLocalizedOptionLabel(slug, opt.label, 'ru')
          const zhTrans = getLocalizedOptionLabel(slug, opt.label, 'zh')
          return {
            ...opt,
            translations: {
              ru: opt.translations.ru || (ruTrans !== opt.label ? ruTrans : ''),
              zh: opt.translations.zh || (zhTrans !== opt.label ? zhTrans : ''),
            },
          }
        })
      )
      toast.success('Applied local dictionary translations')
    } finally {
      setIsTranslatingOptions(false)
    }
  }

  // ── Color option helpers ──────────────────────────────────────────────────
  const addColorOption = () =>
    setColorOptions((prev) => [...prev, { label: '', value: '#1a3a5c', translations: { ru: '', zh: '' } }])

  const loadDefaultPalette = () => {
    const defaults: ColorEntry[] = [
      { label: 'Black', value: '#000000', translations: { ru: 'Чёрный', zh: '黑色' } },
      { label: 'White', value: '#FFFFFF', translations: { ru: 'Белый', zh: '白色' } },
      { label: 'Gray', value: '#6B7280', translations: { ru: 'Серый', zh: '灰色' } },
      { label: 'Red', value: '#EF4444', translations: { ru: 'Красный', zh: '红色' } },
      { label: 'Blue', value: '#3B82F6', translations: { ru: 'Синий', zh: '蓝色' } },
      { label: 'Green', value: '#10B981', translations: { ru: 'Зелёный', zh: '绿色' } },
      { label: 'Yellow', value: '#EAB308', translations: { ru: 'Жёлтый', zh: '黄色' } },
      { label: 'Orange', value: '#F97316', translations: { ru: 'Оранжевый', zh: '橙色' } },
      { label: 'Purple', value: '#8B5CF6', translations: { ru: 'Фиолетовый', zh: '紫色' } },
      { label: 'Navy', value: '#1E3A8A', translations: { ru: 'Тёмно-синий', zh: '藏青色' } },
      { label: 'Brown', value: '#78350F', translations: { ru: 'Коричневый', zh: '棕色' } },
      { label: 'Beige', value: '#D4B996', translations: { ru: 'Бежевый', zh: '米色' } },
    ]
    setColorOptions(defaults)
    toast.success('Loaded standard color palette with multilingual names')
  }

  const updateColorOption = (index: number, field: string, val: string) =>
    setColorOptions((prev) => {
      const next = [...prev]
      if (field === 'value') {
        const cleanHex = val.toUpperCase()
        const dictMatch = COLOR_TRANSLATIONS[cleanHex]
        next[index] = {
          ...next[index],
          value: val,
          label: next[index].label || dictMatch?.en || '',
          translations: {
            ru: next[index].translations?.ru || dictMatch?.ru || '',
            zh: next[index].translations?.zh || dictMatch?.zh || '',
          },
        }
      } else if (field === 'label') {
        next[index] = { ...next[index], label: val }
      } else if (field === 'ru' || field === 'zh') {
        next[index] = {
          ...next[index],
          translations: {
            ...next[index].translations,
            [field]: val,
          },
        }
      }
      return next
    })

  const removeColorOption = (index: number) =>
    setColorOptions((prev) => prev.filter((_, i) => i !== index))

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryId) {
      toast.error(dict.attributes.selectCategoryHelp)
      return
    }
    if (!name.trim()) {
      toast.error(`${dict.attributes.attributeName} is required`)
      return
    }
    if (!type) {
      toast.error(`${dict.attributes.attributeType} is required`)
      return
    }

    const validOptions = optionItems.filter((o) => o.label.trim())
    if (isSelectType && validOptions.length === 0) {
      toast.error(dict.attributes.optionsHelp || 'Please provide at least one option')
      return
    }
    if (isColorType && colorOptions.length === 0) {
      toast.error(dict.attributes.colorOptionsSingleHelp)
      return
    }

    setIsSubmitting(true)
    try {
      const finalColorOptions = isColorType
        ? colorOptions
            .filter((c) => c.label.trim() && c.value)
            .map((c) => ({
              label: c.label.trim(),
              value: c.value,
              translations: {
                ru: c.translations?.ru?.trim() || '',
                zh: c.translations?.zh?.trim() || '',
              },
            }))
        : null

      // Save options as rich objects preserving translations
      const finalOptions = isSelectType
        ? validOptions.map((o) => ({
            value: o.value.trim() || o.label.trim(),
            label: o.label.trim(),
            translations: {
              ru: o.translations?.ru?.trim() || '',
              zh: o.translations?.zh?.trim() || '',
            },
          }))
        : []

      const data = {
        name: name.trim(),
        slug: slug ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        type,
        options: finalOptions,
        colorOptions: finalColorOptions,
        placeholder: placeholder.trim(),
        helperText: helperText.trim(),
        isRequired,
        isFilterable,
        isVariant,
        categoryId,
        translations: ['ru', 'zh']
          .filter(
            (l) =>
              translations[l]?.name?.trim() ||
              translations[l]?.placeholder?.trim() ||
              translations[l]?.helperText?.trim()
          )
          .map((l) => ({
            locale: l,
            name: translations[l]?.name?.trim() || name.trim(),
            placeholder: translations[l]?.placeholder?.trim() || placeholder.trim(),
            helperText: translations[l]?.helperText?.trim() || helperText.trim(),
          })),
      }

      const url = initialData?.id ? `/api/admin/attributes/${initialData.id}` : '/api/admin/attributes'
      const method = initialData?.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || dict.common.errorOccurred)

      toast.success(initialData ? dict.common.updateSuccess : dict.common.saveSuccess)
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || dict.common.errorOccurred)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-4 pb-4">
        {/* Name */}
        <div>
          <Label>{dict.attributes.attributeName} *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Coating / Finish, Capacity, Material"
            required
          />
        </div>

        {/* Translations (RU / ZH) */}
        <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-[#1a3a5c]" />
              {dict.products?.translations || 'Attribute Name Translations'} ({dict.common.optional})
            </p>
            <AutoTranslateButton
              allFields={{
                en: { name, placeholder, helperText },
                ru: {
                  name: translations.ru?.name || '',
                  placeholder: translations.ru?.placeholder || '',
                  helperText: translations.ru?.helperText || '',
                },
                zh: {
                  name: translations.zh?.name || '',
                  placeholder: translations.zh?.placeholder || '',
                  helperText: translations.zh?.helperText || '',
                },
              }}
              onTranslated={(result) => {
                if (result.en?.name && !name.trim()) setName(result.en.name)
                if (result.en?.placeholder && !placeholder.trim()) setPlaceholder(result.en.placeholder)
                if (result.en?.helperText && !helperText.trim()) setHelperText(result.en.helperText)
                setTranslations((prev) => {
                  const next = { ...prev }
                  for (const loc of ['ru', 'zh'] as const) {
                    if (result[loc]) {
                      next[loc] = {
                        name: result[loc].name ?? prev[loc]?.name ?? '',
                        placeholder: result[loc].placeholder ?? prev[loc]?.placeholder ?? '',
                        helperText: result[loc].helperText ?? prev[loc]?.helperText ?? '',
                      }
                    }
                  }
                  return next
                })
              }}
            />
          </div>
          {(['ru', 'zh'] as const).map((loc) => (
            <div key={loc} className="flex items-center gap-2">
              <span className="w-8 text-xs font-semibold uppercase text-gray-500">{loc}</span>
              <Input
                value={translations[loc]?.name || ''}
                onChange={(e) => updateTranslation(loc, 'name', e.target.value)}
                placeholder={`${dict.common.name} (${loc.toUpperCase()})`}
                className="flex-1 h-8 text-xs"
              />
            </div>
          ))}
        </div>

        {/* Slug */}
        <div>
          <Label>{dict.products.slug}</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="e.g., coating, capacity" />
          <p className="text-xs text-gray-500 mt-1">{dict.attributes.slugHelp}</p>
        </div>

        {/* Type */}
        <div>
          <Label>{dict.attributes.attributeType} *</Label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger>
              <SelectValue placeholder={dict.attributes.selectTypePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {attributeTypes.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Multilingual Options for SELECT / MULTISELECT */}
        {isSelectType && (
          <div className="border border-indigo-100 rounded-xl p-4 bg-indigo-50/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <Label className="text-indigo-950 font-bold flex items-center gap-1.5">
                  <List className="w-4 h-4 text-indigo-600" />
                  {dict.attributes.options} *
                </Label>
                <p className="text-xs text-indigo-700/80">
                  Configure options with English, Russian, and Chinese translations so dropdowns display correctly on the storefront.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAutoTranslateOptions}
                  disabled={isTranslatingOptions || optionItems.length === 0}
                  className={[
                    'group relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-semibold text-white shrink-0 whitespace-nowrap',
                    'bg-gradient-to-r from-violet-500 via-fuchsia-500 to-indigo-500 bg-[length:200%_auto]',
                    'transition-all hover:bg-right focus:outline-none focus:ring-2 focus:ring-fuchsia-300',
                    'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-300',
                  ].join(' ')}
                >
                  <Sparkles className={isTranslatingOptions ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} aria-hidden />
                  {isTranslatingOptions ? dict.common.translating || 'Translating...' : 'Auto-Translate Options'}
                </button>

                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setOptionsMode(optionsMode === 'structured' ? 'quick' : 'structured')}
                  className="h-7 text-xs text-gray-600"
                >
                  {optionsMode === 'structured' ? 'Bulk Paste' : 'Table View'}
                </Button>
              </div>
            </div>

            {/* Quick Bulk Entry Input */}
            {optionsMode === 'quick' && (
              <div className="p-3 bg-white rounded-lg border border-indigo-200 space-y-2">
                <Label className="text-xs font-semibold text-gray-700">Paste Comma-Separated Options:</Label>
                <div className="flex gap-2">
                  <Input
                    value={quickOptionsText}
                    onChange={(e) => setQuickOptionsText(e.target.value)}
                    placeholder="e.g., Food-Grade PTFE Non-Stick, Ceramic Coated, Uncoated Pure Steel"
                    className="text-xs h-8"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={parseQuickOptions}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white h-8 text-xs"
                  >
                    Add & Localize
                  </Button>
                </div>
              </div>
            )}

            {/* Structured Options Table */}
            <div className="space-y-2">
              <div className="grid grid-cols-12 gap-2 text-[11px] font-bold uppercase text-indigo-900 px-2">
                <div className="col-span-5">Default / English (EN) *</div>
                <div className="col-span-3">Russian (RU)</div>
                <div className="col-span-3">Chinese (ZH)</div>
                <div className="col-span-1 text-center">Del</div>
              </div>

              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {optionItems.map((opt, idx) => (
                  <div
                    key={opt.id || idx}
                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded-lg border border-indigo-100 shadow-2xs"
                  >
                    <div className="col-span-5">
                      <Input
                        value={opt.label}
                        onChange={(e) => updateOptionItem(idx, 'label', e.target.value)}
                        placeholder="e.g., 24 Standard Size Cups"
                        className="h-8 text-xs font-medium"
                        required
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={opt.translations.ru || ''}
                        onChange={(e) => updateOptionItem(idx, 'ru', e.target.value)}
                        placeholder="Русский"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-3">
                      <Input
                        value={opt.translations.zh || ''}
                        onChange={(e) => updateOptionItem(idx, 'zh', e.target.value)}
                        placeholder="中文"
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="col-span-1 flex justify-center">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeOptionItem(idx)}
                        className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {optionItems.length === 0 && (
                  <div className="text-center py-6 text-indigo-400 text-xs border border-dashed border-indigo-200 rounded-lg bg-white/70">
                    No options configured yet. Click "+ Add Option" below or use "Bulk Paste".
                  </div>
                )}
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => addOptionItem('')}
                className="w-full text-xs h-8 border-dashed border-indigo-300 text-indigo-700 bg-white hover:bg-indigo-50"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Dropdown Option
              </Button>
            </div>
          </div>
        )}

        {/* Color Options for COLOR / COLOR_MULTI */}
        {isColorType && (
          <div className="border border-gray-200 rounded-xl p-4 bg-gray-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <Label className="flex items-center gap-2 font-bold text-gray-900">
                  <Palette className="w-4 h-4 text-[#1a3a5c]" />
                  {dict.attributes.colorOptions} *
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  {type === 'COLOR_MULTI'
                    ? dict.attributes.colorOptionsMultiHelp
                    : dict.attributes.colorOptionsSingleHelp}
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={loadDefaultPalette}
                className="text-xs h-7 text-[#1a3a5c] border-[#1a3a5c]/30 hover:bg-[#1a3a5c]/5"
              >
                <Palette className="w-3.5 h-3.5 mr-1.5" />
                {currentLocale === 'zh' ? '载入标准多语言色板' : currentLocale === 'ru' ? 'Загрузить мультиязычную палитру' : 'Load Standard Palette'}
              </Button>
            </div>

            <div className="space-y-2 mb-3">
              {colorOptions.map((color, i) => (
                <div
                  key={i}
                  className="grid grid-cols-12 gap-2 items-center p-2 bg-white rounded-lg border border-gray-200"
                >
                  {/* Color preview + native picker */}
                  <div className="col-span-1 flex items-center justify-center">
                    <div
                      className="w-8 h-8 rounded-lg border-2 border-gray-300 shadow-inner cursor-pointer relative overflow-hidden"
                      style={{ backgroundColor: color.value }}
                    >
                      <input
                        type="color"
                        value={color.value}
                        onChange={(e) => updateColorOption(i, 'value', e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        title={dict.attributes.colorOptions}
                      />
                    </div>
                  </div>

                  {/* Hex input */}
                  <div className="col-span-2">
                    <Input
                      value={color.value}
                      onChange={(e) => updateColorOption(i, 'value', e.target.value)}
                      placeholder="#FF0000"
                      className="h-8 font-mono text-xs"
                    />
                  </div>

                  {/* English Label */}
                  <div className="col-span-3">
                    <Input
                      value={color.label}
                      onChange={(e) => updateColorOption(i, 'label', e.target.value)}
                      placeholder="Name (EN)"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Russian Translation */}
                  <div className="col-span-3">
                    <Input
                      value={color.translations?.ru || ''}
                      onChange={(e) => updateColorOption(i, 'ru', e.target.value)}
                      placeholder="Русский"
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Chinese Translation */}
                  <div className="col-span-2">
                    <Input
                      value={color.translations?.zh || ''}
                      onChange={(e) => updateColorOption(i, 'zh', e.target.value)}
                      placeholder="中文"
                      className="h-8 text-xs"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeColorOption(i)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {colorOptions.length === 0 && (
                <div className="text-center py-6 text-gray-400 text-xs border border-dashed border-gray-200 rounded-lg bg-white">
                  {dict.attributes.noColorsYet}
                </div>
              )}
            </div>

            <Button type="button" variant="outline" size="sm" onClick={addColorOption} className="text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />
              {dict.attributes.addColor}
            </Button>
          </div>
        )}

        {/* Placeholder (Multilingual Inputs) */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#1a3a5c]" />
              {dict.attributes.placeholder} (Hint / Example)
            </Label>
            <span className="text-[11px] text-slate-500 font-normal">
              e.g., Apple, Nike, Tefal, Bosch
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-14 text-[11px] font-bold uppercase text-slate-700 bg-white border border-slate-200 py-1 px-1.5 rounded text-center shrink-0 shadow-2xs">
                EN *
              </span>
              <Input
                value={placeholder}
                onChange={(e) => setPlaceholder(e.target.value)}
                placeholder="e.g., Apple, Nike, Tefal, Bosch (EN)"
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14 text-[11px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 py-1 px-1.5 rounded text-center shrink-0 shadow-2xs">
                RU
              </span>
              <Input
                value={translations.ru?.placeholder || ''}
                onChange={(e) => updateTranslation('ru', 'placeholder', e.target.value)}
                placeholder="напр., Apple, Nike, Tefal, Bosch (Русский)"
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="w-14 text-[11px] font-bold uppercase text-red-700 bg-red-50 border border-red-200 py-1 px-1.5 rounded text-center shrink-0 shadow-2xs">
                ZH
              </span>
              <Input
                value={translations.zh?.placeholder || ''}
                onChange={(e) => updateTranslation('zh', 'placeholder', e.target.value)}
                placeholder="例如：苹果、耐克、特福、博世 (中文)"
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Helper Text (Multilingual Inputs) */}
        <div className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-[#1a3a5c]" />
              {dict.attributes.helperText} (Guidance / Instructions)
            </Label>
            <span className="text-[11px] text-slate-500 font-normal">
              Instructions for sellers & customers
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-14 text-[11px] font-bold uppercase text-slate-700 bg-white border border-slate-200 py-1 px-1.5 rounded text-center shrink-0 mt-0.5 shadow-2xs">
                EN *
              </span>
              <Input
                value={helperText}
                onChange={(e) => setHelperText(e.target.value)}
                placeholder={dict.attributes.helperTextPlaceholder || 'Additional instructions for sellers/staff (EN)'}
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>

            <div className="flex items-start gap-2">
              <span className="w-14 text-[11px] font-bold uppercase text-blue-700 bg-blue-50 border border-blue-200 py-1 px-1.5 rounded text-center shrink-0 mt-0.5 shadow-2xs">
                RU
              </span>
              <Input
                value={translations.ru?.helperText || ''}
                onChange={(e) => updateTranslation('ru', 'helperText', e.target.value)}
                placeholder="Дополнительные инструкции для продавцов (Русский)"
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>

            <div className="flex items-start gap-2">
              <span className="w-14 text-[11px] font-bold uppercase text-red-700 bg-red-50 border border-red-200 py-1 px-1.5 rounded text-center shrink-0 mt-0.5 shadow-2xs">
                ZH
              </span>
              <Input
                value={translations.zh?.helperText || ''}
                onChange={(e) => updateTranslation('zh', 'helperText', e.target.value)}
                placeholder="针对商家或买家的规格填写指南 (中文)"
                className="h-8 text-xs bg-white border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Toggles */}
        <div className="flex items-center justify-between pt-1">
          <div className="space-y-0.5">
            <Label>{dict.attributes.required}</Label>
            <p className="text-xs text-gray-500">{dict.attributes.requiredHelp}</p>
          </div>
          <Switch checked={isRequired} onCheckedChange={setIsRequired} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{dict.attributes.filterable}</Label>
            <p className="text-xs text-gray-500">{dict.attributes.filterableHelp}</p>
          </div>
          <Switch checked={isFilterable} onCheckedChange={setIsFilterable} />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>{dict.attributes.usedForVariants}</Label>
            <p className="text-xs text-gray-500">{dict.attributes.usedForVariantsHelp}</p>
          </div>
          <Switch checked={isVariant} onCheckedChange={setIsVariant} />
        </div>
      </div>

      <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t mt-4 flex-shrink-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          {dict.common.cancel}
        </Button>
        <Button type="submit" className="bg-[#1a3a5c] hover:bg-[#2a5a8c]" disabled={isSubmitting}>
          {isSubmitting ? dict.common.saving : initialData ? dict.common.update : dict.common.save}{' '}
          {dict.attributes.attributeName}
        </Button>
      </DialogFooter>
    </form>
  )
}
