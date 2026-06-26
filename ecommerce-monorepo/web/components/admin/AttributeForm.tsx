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

interface AttributeFormProps {
  initialData?: any
  categoryId: string | null
  onSuccess: () => void
  onCancel: () => void
}

const attributeTypes = [
  { value: 'TEXT', label: 'Text' },
  { value: 'TEXTAREA', label: 'Text Area' },
  { value: 'NUMBER', label: 'Number' },
  { value: 'SELECT', label: 'Select (Dropdown)' },
  { value: 'MULTISELECT', label: 'Multi Select' },
  { value: 'COLOR', label: 'Color Picker' },
  { value: 'FILE', label: 'File Upload' },
  { value: 'URL', label: 'URL/Link' },
  { value: 'CHECKBOX', label: 'Checkbox' },
  { value: 'DATE', label: 'Date' },
]

export function AttributeForm({ initialData, categoryId, onSuccess, onCancel }: AttributeFormProps) {
  const [name, setName] = useState(initialData?.name || '')
  const [slug, setSlug] = useState(initialData?.slug || '')
  const [type, setType] = useState(initialData?.type || 'TEXT')
  const [options, setOptions] = useState(
    initialData?.options ? (Array.isArray(initialData.options) ? initialData.options.join(', ') : '') : ''
  )
  const [placeholder, setPlaceholder] = useState(initialData?.placeholder || '')
  const [helperText, setHelperText] = useState(initialData?.helperText || '')
  const [isRequired, setIsRequired] = useState(initialData?.isRequired || false)
  const [isFilterable, setIsFilterable] = useState(initialData?.isFilterable !== false)
  const [isVariant, setIsVariant] = useState(initialData?.isVariant || false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-generate slug from name
  useEffect(() => {
    if (!initialData && name && !slug) {
      const generatedSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_')
      setSlug(generatedSlug)
    }
  }, [name, slug, initialData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!categoryId) {
      toast.error('Please select a category from the left sidebar first')
      return
    }

    if (!name.trim()) {
      toast.error('Attribute name is required')
      return
    }

    if (!type) {
      toast.error('Attribute type is required')
      return
    }

    if ((type === 'SELECT' || type === 'MULTISELECT') && !options.trim()) {
      toast.error('Options are required for SELECT and MULTISELECT types')
      return
    }

    setIsSubmitting(true)

    try {
      const data = {
        name: name.trim(),
        slug: slug ? slug.trim() : name.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
        type,
        options: options ? options.split(',').map((s: string) => s.trim()).filter(Boolean) : [],
        placeholder: placeholder.trim(),
        helperText: helperText.trim(),
        isRequired,
        isFilterable,
        isVariant,
        categoryId,
      }

      console.log('Submitting attribute data:', data)

      const url = initialData?.id 
        ? `/api/admin/attributes/${initialData.id}`
        : '/api/admin/attributes'
      
      const method = initialData?.id ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to save attribute')
      }

      toast.success(initialData ? 'Attribute updated successfully' : 'Attribute created successfully')
      onSuccess()
    } catch (error: any) {
      console.error('Error saving attribute:', error)
      toast.error(error.message || 'Failed to save attribute')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Attribute Name *</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Material"
          required
        />
      </div>

      <div>
        <Label>Slug</Label>
        <Input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="e.g., material"
        />
        <p className="text-xs text-gray-500 mt-1">Leave empty to auto-generate from name</p>
      </div>

      <div>
        <Label>Attribute Type *</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
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

      {(type === 'SELECT' || type === 'MULTISELECT') && (
        <div>
          <Label>Options *</Label>
          <Input
            value={options}
            onChange={(e) => setOptions(e.target.value)}
            placeholder="S, M, L, XL"
          />
          <p className="text-xs text-gray-500 mt-1">Comma-separated list of options</p>
        </div>
      )}

      <div>
        <Label>Placeholder</Label>
        <Input
          value={placeholder}
          onChange={(e) => setPlaceholder(e.target.value)}
          placeholder="e.g., Select material..."
        />
      </div>

      <div>
        <Label>Helper Text</Label>
        <Textarea
          value={helperText}
          onChange={(e) => setHelperText(e.target.value)}
          placeholder="Additional instructions for this field"
          rows={2}
        />
      </div>

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

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button 
          type="submit" 
          className="bg-[#1a3a5c] hover:bg-[#2a5a8c]"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : (initialData ? 'Update' : 'Create')} Attribute
        </Button>
      </DialogFooter>
    </form>
  )
}
