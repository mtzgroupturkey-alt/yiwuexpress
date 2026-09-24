'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Upload, X, Link2, Image as ImageIcon, Video as VideoIcon, Play } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useAdminLocale } from '@/app/admin/contexts/AdminLocaleContext'

interface MediaItem {
  url: string
  type: 'image' | 'video'
}

interface ProductMediaUploadProps {
  media: MediaItem[]
  onChange: (media: MediaItem[]) => void
  maxItems?: number
}

export function ProductMediaUpload({ media, onChange, maxItems = 15 }: ProductMediaUploadProps) {
  const { dict } = useAdminLocale()
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [uploadType, setUploadType] = useState<'image' | 'video'>('image')
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  const handleImageSelect = () => {
    imageInputRef.current?.click()
  }

  const handleVideoSelect = () => {
    videoInputRef.current?.click()
  }

  const detectMediaType = (url: string): 'image' | 'video' => {
    // Check for video platforms
    if (url.includes('youtube.com') || url.includes('youtu.be') || 
        url.includes('vimeo.com') || url.includes('dailymotion.com')) {
      return 'video'
    }
    
    // Check file extension
    const videoExtensions = ['.mp4', '.webm', '.mov', '.avi', '.mkv', '.m4v']
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
    
    const lowerUrl = url.toLowerCase()
    
    if (videoExtensions.some(ext => lowerUrl.endsWith(ext))) {
      return 'video'
    }
    
    if (imageExtensions.some(ext => lowerUrl.endsWith(ext))) {
      return 'image'
    }
    
    // Default to image if can't determine
    return 'image'
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const files = event.target.files
    if (!files || files.length === 0) return

    // Check if adding these files would exceed maxItems
    if (media.length + files.length > maxItems) {
      setError(dict.products.mediaMaxAllowed.replace('{max}', maxItems.toString()))
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      const uploadedItems: MediaItem[] = []

      // Upload each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Validate file size
        const maxSize = type === 'video' ? 100 * 1024 * 1024 : 5 * 1024 * 1024 // 100MB for video, 5MB for image
        if (file.size > maxSize) {
          setError(
            dict.products.mediaTooLarge
              .replace('{name}', file.name)
              .replace('{max}', type === 'video' ? '100MB' : '5MB')
          )
          continue
        }

        // Validate file type
        if (type === 'image') {
          const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg']
          if (!validTypes.includes(file.type)) {
            setError(dict.products.invalidImageFormat.replace('{name}', file.name))
            continue
          }
        } else {
          const validTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
          if (!validTypes.includes(file.type)) {
            setError(dict.products.invalidVideoFormat.replace('{name}', file.name))
            continue
          }
        }

        // Upload to server
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', type)

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        })

        const data = await response.json()

        if ((data.success || data.url) && data.url) {
          uploadedItems.push({
            url: data.url,
            type
          })
        } else {
          setError(`Failed to upload ${file.name}: ${data.error || 'Unknown error'}`)
        }
      }

      if (uploadedItems.length > 0) {
        onChange([...media, ...uploadedItems])
      }
    } catch (err: any) {
      setError(`Upload failed: ${err.message}`)
    } finally {
      setIsUploading(false)
      // Reset input
      if (type === 'image' && imageInputRef.current) {
        imageInputRef.current.value = ''
      }
      if (type === 'video' && videoInputRef.current) {
        videoInputRef.current.value = ''
      }
    }
  }

  const handleAddUrl = () => {
    if (!urlInput.trim()) return

    // Check if adding this URL would exceed maxItems
    if (media.length >= maxItems) {
      setError(dict.products.mediaMaxAllowed.replace('{max}', maxItems.toString()))
      return
    }

    const type = detectMediaType(urlInput.trim())
    
    onChange([...media, {
      url: urlInput.trim(),
      type
    }])

    setUrlInput('')
    setShowUrlInput(false)
    setError(null)
  }

  const handleRemoveItem = (index: number) => {
    const newMedia = media.filter((_, i) => i !== index)
    onChange(newMedia)
  }

  const handleMoveUp = (index: number) => {
    if (index === 0) return
    const newMedia = [...media]
    ;[newMedia[index - 1], newMedia[index]] = [newMedia[index], newMedia[index - 1]]
    onChange(newMedia)
  }

  const handleMoveDown = (index: number) => {
    if (index === media.length - 1) return
    const newMedia = [...media]
    ;[newMedia[index], newMedia[index + 1]] = [newMedia[index + 1], newMedia[index]]
    onChange(newMedia)
  }

  const getVideoThumbnail = (url: string): string => {
    // YouTube
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.includes('youtu.be') 
        ? url.split('youtu.be/')[1]?.split('?')[0]
        : url.split('v=')[1]?.split('&')[0]
      return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : ''
    }
    
    // Vimeo
    if (url.includes('vimeo.com')) {
      return '' // Vimeo requires API call for thumbnail
    }
    
    return '' // For direct video URLs, no thumbnail preview
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-base font-semibold">{dict.products.imagesVideos}</Label>
        <span className="text-sm text-gray-500">
          {media.length} / {maxItems} items ({media.filter(m => m.type === 'image').length} {dict.products.imageBadge.toLowerCase()}s, {media.filter(m => m.type === 'video').length} {dict.products.videoBadge.toLowerCase()}s)
        </span>
      </div>

      {/* Upload Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          variant="outline"
          onClick={handleImageSelect}
          disabled={isUploading || media.length >= maxItems}
          className="flex items-center gap-2"
        >
          <ImageIcon className="w-4 h-4" />
          {isUploading ? dict.common.loading : dict.products.uploadImages}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleVideoSelect}
          disabled={isUploading || media.length >= maxItems}
          className="flex items-center gap-2"
        >
          <VideoIcon className="w-4 h-4" />
          {isUploading ? dict.common.loading : dict.products.uploadVideos}
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowUrlInput(!showUrlInput)}
          disabled={media.length >= maxItems}
          className="flex items-center gap-2"
        >
          <Link2 className="w-4 h-4" />
          {dict.products.addFromUrl}
        </Button>

        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleFileChange(e, 'image')}
          className="hidden"
        />
        
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          multiple
          onChange={(e) => handleFileChange(e, 'video')}
          className="hidden"
        />
      </div>

      {/* URL Input Section */}
      {showUrlInput && (
        <Card className="border-2 border-dashed">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {dict.products.enterMediaUrlPrompt}
              </p>
              <div className="flex gap-2">
                <Input
                  type="url"
                  placeholder="https://example.com/media.mp4 or https://youtube.com/watch?v=..."
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
                  {dict.common.add}
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
                  {dict.common.cancel}
                </Button>
              </div>
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
      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-sm text-blue-800">
          <strong>💡 {dict.products.mediaTips}</strong>
        </p>
      </div>

      {/* Media Grid */}
      {media.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {media.map((item, index) => (
            <Card key={index} className="relative group">
              <CardContent className="p-2">
                <div className="relative aspect-square rounded overflow-hidden bg-gray-100">
                  {item.type === 'image' ? (
                    <img
                      src={item.url}
                      alt={`Product media ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                  ) : (
                    <div className="relative w-full h-full">
                      {getVideoThumbnail(item.url) ? (
                        <img
                          src={getVideoThumbnail(item.url)}
                          alt={`Video thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                          <VideoIcon className="w-12 h-12 text-white opacity-50" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30">
                        <Play className="w-12 h-12 text-white opacity-90" />
                      </div>
                    </div>
                  )}
                  
                  {/* Thumbnail Badge */}
                  {index === 0 && item.type === 'image' && (
                    <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
                      {dict.products.thumbnailBadge}
                    </div>
                  )}

                  {/* Media Type Badge */}
                  <div className="absolute top-2 right-2">
                    {item.type === 'video' ? (
                      <div className="bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <VideoIcon className="w-3 h-3" />
                        {dict.products.videoBadge}
                      </div>
                    ) : (
                      <div className="bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                        <ImageIcon className="w-3 h-3" />
                        {dict.products.imageBadge}
                      </div>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                      title="Move up"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === media.length - 1}
                      className="h-8 w-8 p-0"
                      title="Move down"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleRemoveItem(index)}
                      className="h-8 w-8 p-0"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Media URL Display */}
                <p className="text-xs text-gray-500 mt-2 truncate" title={item.url}>
                  {item.url.startsWith('http') ? '🔗 URL' : '📁 Uploaded'} • {item.type}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="flex gap-4 mb-4">
              <ImageIcon className="w-12 h-12 opacity-50" />
              <VideoIcon className="w-12 h-12 opacity-50" />
            </div>
            <p className="text-sm font-medium">{dict.products.noMediaAdded}</p>
            <p className="text-xs mt-1">{dict.products.uploadFromComputerOrUrl}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
