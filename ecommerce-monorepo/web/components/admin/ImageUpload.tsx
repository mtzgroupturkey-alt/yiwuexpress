'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  value: string
  onChange: (value: string) => void
  folder?: string
  className?: string
  label?: string
}

export function ImageUpload({ value, onChange, folder = 'categories', className = '', label = 'Upload Image' }: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image (JPEG, PNG, WebP, or GIF)')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Convert image to base64 data URL for preview
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        onChange(base64String)
        setIsUploading(false)
      }
      reader.onerror = () => {
        setError('Failed to read file. Please try again.')
        setIsUploading(false)
      }
      reader.readAsDataURL(file)
      
      // TODO: In production, upload to your storage service (AWS S3, Cloudinary, etc.)
      // Example:
      // const formData = new FormData()
      // formData.append('file', file)
      // const response = await fetch('/api/upload', { method: 'POST', body: formData })
      // const { url } = await response.json()
      // onChange(url)
    } catch (err) {
      setError('Failed to upload image. Please try again.')
      console.error('Upload error:', err)
      setIsUploading(false)
    }
  }

  const handleRemove = () => {
    onChange('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleFileSelect}
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {isUploading ? 'Uploading...' : 'Upload Image'}
        </Button>
        
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      
      {value && (
        <div className="mt-2">
          <p className="text-sm text-gray-500 mb-1">Preview:</p>
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      )}
      
      <p className="text-xs text-gray-500">
        Recommended: 400×400px square image. Max 5MB.
      </p>
    </div>
  )
}