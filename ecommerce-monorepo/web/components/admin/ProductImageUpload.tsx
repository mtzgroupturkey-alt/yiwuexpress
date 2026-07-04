'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Link2, Image as ImageIcon } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

interface ProductImageUploadProps {
  images: string[]
  onChange: (images: string[]) => void
  maxImages?: number
}

export function ProductImageUpload({ images, onChange, maxImages = 10 }: ProductImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed maxImages
    if (images.length + files.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const uploadedUrls: string[] = []

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError(`File ${file.name} is too large. Maximum size is 5MB`)
          continue
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
        if (!validTypes.includes(file.type)) {
          setError(`${file.name} is not a valid image format`)
          continue
        }

        // Upload to server
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', 'products')

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          credentials: 'include', // Send httpOnly cookie
          body: formData
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || 'Upload failed')
        }

        const { url } = await response.json()
        uploadedUrls.push(url)
      }

      // Add uploaded URLs to existing images
      onChange([...images, ...uploadedUrls])
      setIsUploading(false)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload images. Please try again.')
      console.error('Upload error:', err)
      setIsUploading(false)
    }
  }

  const handleAddUrl = () => {
    if (!urlInput.trim()) {
      setError('Please enter a valid URL')
      return
    }

    // Check if we've reached the max images
    if (images.length >= maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    // Basic URL validation
    try {
      new URL(urlInput)
    } catch {
      setError('Please enter a valid URL')
      return
    }

    // Add URL to images
    onChange([...images, urlInput.trim()])
    setUrlInput('')
    setShowUrlInput(false)
    setError(null)
  }

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newImages = [...images]
    ;[newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]]
    onChange(newImages)
  }

  const handleMoveDown = (index: number) => {
    if (index === images.length - 1) return
    const newImages = [...images]
    ;[newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]]
    onChange(newImages)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">Product Images</Label>
        <span className="text-sm text-gray-500">
          {images.length} / {maxImages} images
        </span>
      </div>

      {/* Upload Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={handleFileSelect}
          disabled={isUploading || images.length >= maxImages}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload from Computer'}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={images.length >= maxImages}
          className="flex items-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          Add from URL
        </Button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* URL Input Section */}
      {showUrlInput && (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddUrl()}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={handleAddUrl}
                disabled={!urlInput.trim()}
              >
                Add
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlInput('')
                  setError(null)
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Helper Text */}
      <p className="text-sm text-gray-500">
        First image will be used as the product thumbnail. Drag to reorder images.
      </p>

      {/* Image Grid */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((url, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square rounded overflow-hidden bg-gray-100">
                  <img
                    src={url}
                    alt={`Product image ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.png'
                    }}
                  />
                  
                  {/* Thumbnail Badge */}
                  {index === 0 && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      Thumbnail
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === images.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveImage(index)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Image URL Display */}
                <p className="text-xs text-gray-500 mt-2 truncate" title={url}>
                  {url.startsWith('http') ? '🔗 URL' : '📁 Uploaded'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <ImageIcon className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-sm font-medium">No images added yet</p>
            <p className="text-xs mt-1">Upload from computer or add from URL</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
