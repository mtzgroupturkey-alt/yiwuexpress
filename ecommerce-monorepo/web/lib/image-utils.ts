/**
 * Image Utility Functions for YIWU EXPRESS
 * Handles image URL construction for localhost and production
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005'
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || `${BASE_URL}/uploads`

/**
 * Get the full URL for an uploaded image
 * Handles both absolute URLs and relative paths
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return '/images/placeholder.png'
  
  // If already a full URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  
  // If starts with /uploads, construct full URL
  if (path.startsWith('/uploads')) {
    return `${BASE_URL}${path}`
  }
  
  // If no leading slash, add it
  if (!path.startsWith('/')) {
    return `${UPLOAD_URL}/${path}`
  }
  
  return `${BASE_URL}${path}`
}

/**
 * Get optimized image URL with Next.js Image optimization params
 */
export function getOptimizedImageUrl(
  path: string | null | undefined,
  options?: {
    width?: number
    quality?: number
  }
): string {
  const url = getImageUrl(path)
  const params = new URLSearchParams()
  
  if (options?.width) params.append('w', options.width.toString())
  if (options?.quality) params.append('q', options.quality.toString())
  
  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}

/**
 * Check if image URL is from localhost
 */
export function isLocalImage(url: string): boolean {
  return url.includes('localhost') || url.includes('127.0.0.1')
}

/**
 * Get placeholder image URL
 */
export function getPlaceholderImage(type: 'product' | 'category' | 'avatar' | 'logo' = 'product'): string {
  const placeholders = {
    product: '/images/placeholder-product.png',
    category: '/images/placeholder-category.png',
    avatar: '/images/placeholder-avatar.png',
    logo: '/images/placeholder-logo.png',
  }
  return placeholders[type] || placeholders.product
}

/**
 * Validate image file extension
 */
export function isValidImageExt(filename: string): boolean {
  const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg']
  const ext = filename.toLowerCase().substring(filename.lastIndexOf('.'))
  return validExts.includes(ext)
}
