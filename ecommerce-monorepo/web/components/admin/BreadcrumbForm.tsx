'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { CategoryDropdown } from '@/components/ui/CategoryDropdown'
import { DialogFooter } from '@/components/ui/dialog'

interface BreadcrumbFormProps {
  initialData: any
  categories: any[]
  onSave: (data: any) => void
  onCancel: () => void
}

export function BreadcrumbForm({ initialData, categories, onSave, onCancel }: BreadcrumbFormProps) {
  const [pageType, setPageType] = useState(initialData?.pageType || 'static')
  const [pageSlug, setPageSlug] = useState(initialData?.pageSlug || '')
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '')
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || '')
  const [mobileImageUrl, setMobileImageUrl] = useState(initialData?.mobileImageUrl || '')
  const [overlayColor, setOverlayColor] = useState(initialData?.overlayColor || 'rgba(26,58,92,0.6)')
  const [title, setTitle] = useState(initialData?.title || '')
  const [subtitle, setSubtitle] = useState(initialData?.subtitle || '')
  const [isActive, setIsActive] = useState(initialData?.isActive !== false)

  // Static page options
  const staticPageOptions = [
    { value: 'about', label: 'About Us' },
    { value: 'contact', label: 'Contact Us' },
    { value: 'blog', label: 'Blog' },
    { value: 'wholesale', label: 'Wholesale' },
    { value: 'hospitality', label: 'Hospitality' },
    { value: 'warranty', label: 'Warranty Registration' },
    { value: 'faq', label: 'FAQ' },
    { value: 'shipping', label: 'Shipping Info' },
    { value: 'returns', label: 'Returns' },
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      id: initialData?.id,
      pageType,
      pageSlug: pageType === 'static' ? pageSlug : null,
      categoryId: pageType === 'category' ? categoryId : null,
      imageUrl,
      mobileImageUrl: mobileImageUrl || null,
      overlayColor,
      title: title || null,
      subtitle: subtitle || null,
      isActive,
    }
    onSave(data)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Page Type */}
      <div>
        <Label>Page Type</Label>
        <Select value={pageType} onValueChange={setPageType}>
          <SelectTrigger>
            <SelectValue placeholder="Select page type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="static">Static Page</SelectItem>
            <SelectItem value="shop_default">Shop Default</SelectItem>
            <SelectItem value="category">Category</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Static Page Selection */}
      {pageType === 'static' && (
        <div>
          <Label>Static Page</Label>
          <Select value={pageSlug} onValueChange={setPageSlug}>
            <SelectTrigger>
              <SelectValue placeholder="Select a page" />
            </SelectTrigger>
            <SelectContent>
              {staticPageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Category Selection */}
      {pageType === 'category' && (
        <div>
          <Label>Category</Label>
          <div className="mt-2">
            <CategoryDropdown
              categories={categories}
              value={categoryId}
              onChange={setCategoryId}
              placeholder="Search and select a category..."
              searchPlaceholder="Type to search categories..."
              showPath={true}
              showLevelIndicator={true}
              clearable={true}
              className="w-full"
            />
          </div>
          {categories && categories.length === 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Categories are empty. Please create some categories first in the Category Management section.
            </p>
          )}
        </div>
      )}

      {/* Image Upload */}
      <div>
        <Label>Background Image</Label>
        <div className="mt-2">
          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            folder="breadcrumb"
            className="w-full"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Recommended: 1920x400px, max 2MB
        </p>
      </div>

      {/* Mobile Image (Optional) */}
      <div>
        <Label>Mobile Image (Optional)</Label>
        <div className="mt-2">
          <ImageUpload
            value={mobileImageUrl}
            onChange={setMobileImageUrl}
            folder="breadcrumb/mobile"
            className="w-full"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Different image for mobile. If not set, desktop image will be used.
        </p>
      </div>

      {/* Overlay Color */}
      <div>
        <Label>Overlay Color</Label>
        <div className="flex items-center gap-4">
          <Input
            type="text"
            value={overlayColor}
            onChange={(e) => setOverlayColor(e.target.value)}
            placeholder="rgba(26,58,92,0.6)"
            className="flex-1"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Overlay color with opacity. Example: rgba(26,58,92,0.6)
        </p>
      </div>

      {/* Title */}
      <div>
        <Label>Title (Optional)</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., Premium Cookware Collection"
        />
      </div>

      {/* Subtitle */}
      <div>
        <Label>Subtitle (Optional)</Label>
        <Input
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          placeholder="e.g., Professional-grade kitchenware from Yiwu"
        />
      </div>

      {/* Active Status */}
      <div className="flex items-center justify-between">
        <Label>Active</Label>
        <Switch checked={isActive} onCheckedChange={setIsActive} />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-[#1a3a5c] hover:bg-[#2a5a8c]">
          Save Setting
        </Button>
      </DialogFooter>
    </form>
  )
}
