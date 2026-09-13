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
import { Plus, X, Palette } from 'lucide-react'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

interface AttributeFormProps {
  initialData?: any
  categoryId: string | null
  onSuccess: () => void
  onCancel: () => void
}

interface ColorEntry {
  label: string
  value: string // hex
}

export function AttributeForm({ initialData, categoryId, onSuccess, onCancel }: AttributeFormProps) {
  const { dict } = useAdminLocale()
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [type, setType] = useState(initialData?.type || 'TEXT')
  const [options, setOptions] = useState(
    initialData?.options ? (Array.isArray(initialData.options) ? initialData.options.join(', ') : '') : ''
  )
  const [colorOptions, setColorOptions] = useState<ColorEntry[]>(
    initialData?.colorOptions || []
  )
  const [placeholder, setPlaceholder] = useState(initialData?.placeholder || '')
  const [helperText, setHelperText] = useState(initialData?.helperText || '')
  const [isRequired, setIsRequired] = useState(initialData?.isRequired || false)
  const [isFilterable, setIsFilterable] = useState(initialData?.isFilterable !== false)
  const [isVariant, setIsVariant] = useState(initialData?.isVariant || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  // Phase 2: translations for locales other than English (name field)
  const [translations, setTranslations] = useState<Record<string, { name: string }>>(() => {
    const map: Record<string, { name: string }> = {}
    ;(initialData?.translations || []).forEach((t: any) => {
      map[t.locale] = { name: t.name || '' }
    })
    return map
  })

  const isColorType  = type === 'COLOR' || type === 'COLOR_MULTI'
  const isSelectType = type === 'SELECT' || type === 'MULTISELECT'

  const updateTranslation = (locale: string, name: string) =>
    setTranslations((prev) => ({ ...prev, [locale]: { name } }))

  // Auto-generate slug from name (only on create)
  useEffect(() => {
    if (!initialData && name && !slug) {
      setSlug(name.toLowerCase().replace(/[^a-z0-9]+/g, '_'))
    }
  }, [name, slug, initialData])

  // ── Color option helpers ──────────────────────────────────────────────────
  const addColorOption = () =>
    setColorOptions(prev => [...prev, { label: '', value: '#1a3a5c' }])

  const updateColorOption = (index: number, field: keyof ColorEntry, val: string) =>
    setColorOptions(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: val }
      return next
    })

  const removeColorOption = (index: number) =>
    setColorOptions(prev => prev.filter((_, i) => i !== index))

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!categoryId) {
      toast.error(dict.attributes.selectCategoryHelp)
      return
    }
    if (!name.trim()) { toast.error(`${dict.attributes.attributeName} is required`); return }
    if (!type)         { toast.error(`${dict.attributes.attributeType} is required`); return }

    if (isSelectType && !options.trim()) {
      toast.error(dict.attributes.optionsHelp)
      return
    }
    if (isColorType && colorOptions.length === 0) {
      toast.error(dict.attributes.colorOptionsSingleHelp)
      return
    }

    setIsSubmitting(true)
    try {
      const finalColorOptions = isColorType
        ? colorOptions.filter(c => c.label.trim() && c.value)
        : null

      const data = {
        name: name.trim(),
        slug: slug ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        type,
        options: isSelectType
          ? options.split(',').map((s: string) => s.trim()).filter(Boolean)
          : [],
        colorOptions: finalColorOptions,
        placeholder: placeholder.trim(),
        helperText: helperText.trim(),
        isRequired,
        isFilterable,
        isVariant,
        categoryId,
        translations: ['ru', 'zh']
          .filter((l) => translations[l]?.name?.trim())
          .map((l) => ({ locale: l, name: translations[l].name.trim() })),
      }

      const url    = initialData?.id ? `/api/admin/attributes/${initialData.id}` : '/api/admin/attributes'
      const method = initialData?.id ? 'PUT' : 'POST'

      const res    = await fetch(url, {
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
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Colors" required />
      </div>

      {/* Translations (RU / ZH) */}
      <div className="border border-gray-200 rounded-lg p-3 bg-gray-50 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs font-medium text-gray-600">{dict.products.translations} ({dict.common.optional})</p>
          <AutoTranslateButton
            allFields={{
              en: { name },
              ru: { name: translations.ru?.name || '' },
              zh: { name: translations.zh?.name || '' },
            }}
            onTranslated={(result) => {
              if (result.en?.name && !name.trim()) {
                setName(result.en.name)
              }
              setTranslations((prev) => {
                const next = { ...prev }
                for (const locale of Object.keys(result)) {
                  if (locale === 'ru' || locale === 'zh') {
                    next[locale] = { name: result[locale].name || prev[locale]?.name || '' }
                  }
                }
                return next
              })
            }}
          />
        </div>
        {(['ru', 'zh'] as const).map((locale) => (
          <div key={locale} className="flex items-center gap-2">
            <span className="w-8 text-xs font-semibold uppercase text-gray-500">{locale}</span>
            <Input
              value={translations[locale]?.name || ''}
              onChange={e => updateTranslation(locale, e.target.value)}
              placeholder={`${dict.common.name} (${locale.toUpperCase()})`}
              className="flex-1"
            />
          </div>
        ))}
      </div>

      {/* Slug */}
      <div>
        <Label>{dict.products.slug}</Label>
        <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g., colors" />
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
            {attributeTypes.map(t => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Options for SELECT / MULTISELECT */}
      {isSelectType && (
        <div>
          <Label>{dict.attributes.options} *</Label>
          <Input value={options} onChange={e => setOptions(e.target.value)} placeholder="S, M, L, XL" />
          <p className="text-xs text-gray-500 mt-1">{dict.attributes.optionsHelp}</p>
        </div>
      )}

      {/* Color Options for COLOR / COLOR_MULTI */}
      {isColorType && (
        <div>
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#1a3a5c]" />
            {dict.attributes.colorOptions} *
          </Label>
          <p className="text-xs text-gray-500 mb-3">
            {type === 'COLOR_MULTI'
              ? dict.attributes.colorOptionsMultiHelp
              : dict.attributes.colorOptionsSingleHelp}
          </p>

          <div className="space-y-2 mb-3">
            {colorOptions.map((color, i) => (
              <div key={i} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                {/* Color preview + native picker */}
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-lg border-2 border-gray-300 shadow-inner cursor-pointer overflow-hidden"
                    style={{ backgroundColor: color.value }}
                  >
                    <input
                      type="color"
                      value={color.value}
                      onChange={e => updateColorOption(i, 'value', e.target.value)}
                      className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                      title={dict.attributes.colorOptions}
                    />
                  </div>
                </div>

                {/* Hex input */}
                <Input
                  value={color.value}
                  onChange={e => updateColorOption(i, 'value', e.target.value)}
                  placeholder="#FF0000"
                  className="w-28 font-mono text-sm"
                />

                {/* Label */}
                <Input
                  value={color.label}
                  onChange={e => updateColorOption(i, 'label', e.target.value)}
                  placeholder={dict.attributes.colorNamePlaceholder}
                  className="flex-1"
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeColorOption(i)}
                  className="text-red-400 hover:text-red-600 hover:bg-red-50 px-2"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}

            {colorOptions.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm border border-dashed border-gray-200 rounded-lg">
                {dict.attributes.noColorsYet}
              </div>
            )}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addColorOption}>
            <Plus className="w-4 h-4 mr-2" />
            {dict.attributes.addColor}
          </Button>

          {/* Live preview */}
          {colorOptions.filter(c => c.value && c.label).length > 0 && (
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 font-medium">{dict.attributes.preview}:</p>
              <div className="flex flex-wrap gap-3">
                {colorOptions
                  .filter(c => c.value && c.label)
                  .map((color, i) => (
                    <div key={i} className="flex flex-col items-center gap-1">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-gray-200 shadow-sm"
                        style={{ backgroundColor: color.value }}
                      />
                      <span className="text-[10px] text-gray-600 max-w-[48px] truncate text-center">
                        {color.label}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Placeholder */}
      <div>
        <Label>{dict.attributes.placeholder}</Label>
        <Input value={placeholder} onChange={e => setPlaceholder(e.target.value)} placeholder="e.g., Select color..." />
      </div>

      {/* Helper Text */}
      <div>
        <Label>{dict.attributes.helperText}</Label>
        <Textarea value={helperText} onChange={e => setHelperText(e.target.value)} placeholder={dict.attributes.helperTextPlaceholder} rows={2} />
      </div>

      {/* Toggles */}
      <div className="flex items-center justify-between">
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
          {isSubmitting ? dict.common.saving : (initialData ? dict.common.update : dict.common.save)} {dict.attributes.attributeName}
        </Button>
      </DialogFooter>
    </form>
  )
}
