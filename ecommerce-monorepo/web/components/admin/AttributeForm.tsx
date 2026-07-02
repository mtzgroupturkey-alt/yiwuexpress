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
import { Plus, X, Palette } from 'lucide-react'

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

const attributeTypes = [
  { value: 'TEXT',        label: 'Text' },
  { value: 'TEXTAREA',    label: 'Text Area' },
  { value: 'NUMBER',      label: 'Number' },
  { value: 'SELECT',      label: 'Select (Dropdown)' },
  { value: 'MULTISELECT', label: 'Multi Select' },
  { value: 'COLOR',       label: 'Color Picker (Single)' },
  { value: 'COLOR_MULTI', label: 'Color Picker (Multi-Select)' },
  { value: 'FILE',        label: 'File Upload' },
  { value: 'URL',         label: 'URL/Link' },
  { value: 'CHECKBOX',    label: 'Checkbox' },
  { value: 'DATE',        label: 'Date' },
]

export function AttributeForm({ initialData, categoryId, onSuccess, onCancel }: AttributeFormProps) {
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

  const isColorType  = type === 'COLOR' || type === 'COLOR_MULTI'
  const isSelectType = type === 'SELECT' || type === 'MULTISELECT'

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
      toast.error('Please select a category from the left sidebar first')
      return
    }
    if (!name.trim()) { toast.error('Attribute name is required'); return }
    if (!type)         { toast.error('Attribute type is required'); return }

    if (isSelectType && !options.trim()) {
      toast.error('Options are required for SELECT and MULTISELECT types')
      return
    }
    if (isColorType && colorOptions.length === 0) {
      toast.error('Add at least one color option for COLOR type attributes')
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
      }

      const url    = initialData?.id ? `/api/admin/attributes/${initialData.id}` : '/api/admin/attributes'
      const method = initialData?.id ? 'PUT' : 'POST'

      const res    = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await res.json()

      if (!res.ok) throw new Error(result.error || 'Failed to save attribute')

      toast.success(initialData ? 'Attribute updated' : 'Attribute created')
      onSuccess()
    } catch (error: any) {
      toast.error(error.message || 'Failed to save attribute')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      <div className="space-y-4 pb-4">
      {/* Name */}
      <div>
        <Label>Attribute Name *</Label>
        <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Colors" required />
      </div>

      {/* Slug */}
      <div>
        <Label>Slug</Label>
        <Input value={slug} onChange={e => setSlug(e.target.value)} placeholder="e.g., colors" />
        <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from name</p>
      </div>

      {/* Type */}
      <div>
        <Label>Attribute Type *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
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
          <Label>Options *</Label>
          <Input value={options} onChange={e => setOptions(e.target.value)} placeholder="S, M, L, XL" />
          <p className="text-xs text-gray-500 mt-1">Comma-separated list</p>
        </div>
      )}

      {/* Color Options for COLOR / COLOR_MULTI */}
      {isColorType && (
        <div>
          <Label className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-[#1a3a5c]" />
            Color Options *
          </Label>
          <p className="text-xs text-gray-500 mb-3">
            {type === 'COLOR_MULTI'
              ? 'Users can select multiple colors from this list'
              : 'Users will pick one color from this list'}
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
                      title="Pick color"
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
                  placeholder="Color name (e.g., Red)"
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
                No colors added yet. Click "Add Color" below.
              </div>
            )}
          </div>

          <Button type="button" variant="outline" size="sm" onClick={addColorOption}>
            <Plus className="w-4 h-4 mr-2" />
            Add Color
          </Button>

          {/* Live preview */}
          {colorOptions.filter(c => c.value && c.label).length > 0 && (
            <div className="mt-3 p-3 bg-white border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-500 mb-2 font-medium">Preview:</p>
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
        <Label>Placeholder</Label>
        <Input value={placeholder} onChange={e => setPlaceholder(e.target.value)} placeholder="e.g., Select color..." />
      </div>

      {/* Helper Text */}
      <div>
        <Label>Helper Text</Label>
        <Textarea value={helperText} onChange={e => setHelperText(e.target.value)} placeholder="Additional instructions" rows={2} />
      </div>

      {/* Toggles */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Required</Label>
          <p className="text-xs text-gray-500">Must be filled when adding products</p>
        </div>
        <Switch checked={isRequired} onCheckedChange={setIsRequired} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Filterable</Label>
          <p className="text-xs text-gray-500">Can be used as a filter on product listing</p>
        </div>
        <Switch checked={isFilterable} onCheckedChange={setIsFilterable} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Used for Variants</Label>
          <p className="text-xs text-gray-500">Can be used to create product variants (SKU)</p>
        </div>
        <Switch checked={isVariant} onCheckedChange={setIsVariant} />
      </div>
      </div>

      <DialogFooter className="sticky bottom-0 bg-white pt-4 border-t mt-4 flex-shrink-0">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#1a3a5c] hover:bg-[#2a5a8c]" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')} Attribute
        </Button>
      </DialogFooter>
    </form>
  )
}
