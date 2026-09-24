/**
 * Image Utility Functions for Global Trade
 * Handles image URL construction for localhost and production
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3005'
const UPLOAD_URL = process.env.NEXT_PUBLIC_UPLOAD_URL || `${BASE_URL}/uploads`

/**
 * Default placeholder image path for fallback
 */
export const DEFAULT_PLACEHOLDER = '/images/product-placeholder.webp'

/**
 * Resolve a fallback image source. Returns the provided fallback, or the
 * default placeholder when none is supplied.
 */
export function getFallbackSrc(src?: string | null): string {
  if (!src) return DEFAULT_PLACEHOLDER
  return src
}

/**
 * Normalizes any product image URL to a reliable root-relative or absolute HTTPS URL.
 * Handles:
 * - Empty / null / undefined -> DEFAULT_PLACEHOLDER
 * - Data URLs (data:image/...) -> returns as-is
 * - Localhost URLs (http://localhost:3001/uploads/..., http://localhost:3005/...) -> strips origin to root-relative /uploads/...
 * - Insecure HTTP URLs on dromkok.com -> upgrades to https://
 * - Paths missing leading slash (uploads/... or images/...) -> adds leading slash
 * - Bare filenames (1670674373.jpg) -> /uploads/products/1670674373.jpg
 * - Root-relative /uploads/... and /images/... -> returns as-is
 */
export function normalizeProductImageUrl(src?: string | null): string {
  if (!src || typeof src !== 'string') return DEFAULT_PLACEHOLDER
  const trimmed = src.trim()
  if (!trimmed) return DEFAULT_PLACEHOLDER

  // 1. Base64 data URLs
  if (trimmed.startsWith('data:image/')) {
    return trimmed
  }

  // 2. Strip localhost / loopback domains so mobile phones don't try connecting to localhost
  if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    const withoutOrigin = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')
    return normalizeProductImageUrl(withoutOrigin)
  }

  // 3. Absolute HTTP/HTTPS URLs
  if (/^https?:\/\//i.test(trimmed)) {
    // If it points to dromkok.com, strip origin or force HTTPS
    if (/^http:\/\/([^/]+\.)?dromkok\.com/i.test(trimmed)) {
      return trimmed.replace(/^http:\/\//i, 'https://')
    }
    return trimmed
  }

  // 4. Starts with /uploads/ or /images/
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/images/')) {
    return trimmed
  }

  // 5. Starts with uploads/ or images/ (missing leading slash)
  if (trimmed.startsWith('uploads/') || trimmed.startsWith('images/')) {
    return `/${trimmed}`
  }

  // 6. Leading slash with other path
  if (trimmed.startsWith('/')) {
    return trimmed
  }

  // 7. Bare filename or relative path (e.g., '1670674373.jpg', 'products/xyz.jpg')
  if (trimmed.startsWith('products/')) {
    return `/uploads/${trimmed}`
  }

  // Default bare file to /uploads/products/
  return `/uploads/products/${trimmed}`
}

/**
 * Get the full URL for an uploaded image.
 * Uses root-relative URLs so assets load reliably across localhost and production.
 */
export function getImageUrl(path: string | null | undefined): string {
  if (!path) return DEFAULT_PLACEHOLDER
  return normalizeProductImageUrl(path)
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
    product: '/images/product-placeholder.webp',
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
