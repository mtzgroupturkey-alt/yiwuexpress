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
 * Maps product name and/or category to a real high-resolution product image
 * from /images/products/ so cards never look broken or empty.
 */
export function getCategoryFallbackImage(category?: string | null, name?: string | null): string {
  const text = `${category || ''} ${name || ''}`.toLowerCase();
  if (text.includes('watch') || text.includes('electronic') || text.includes('smart')) {
    return '/images/products/smartwatch.jpg';
  }
  if (text.includes('headphone') || text.includes('earphone') || text.includes('audio') || text.includes('sound')) {
    return '/images/products/headphones.jpg';
  }
  if (text.includes('cable') || text.includes('usb') || text.includes('charger') || text.includes('wire')) {
    return '/images/products/cable.jpg';
  }
  if (text.includes('power') || text.includes('bank') || text.includes('battery')) {
    return '/images/products/power-bank.jpg';
  }
  if (text.includes('shirt') || text.includes('cloth') || text.includes('apparel') || text.includes('wear')) {
    return '/images/products/tshirt.jpg';
  }
  if (text.includes('jean') || text.includes('pant') || text.includes('denim') || text.includes('trouser')) {
    return '/images/products/jeans.jpg';
  }
  if (text.includes('jacket') || text.includes('coat') || text.includes('winter')) {
    return '/images/products/winter-jacket.jpg';
  }
  if (text.includes('coffee') || text.includes('mug') || text.includes('cup')) {
    return '/images/products/ceramic-coffee-mug-set-4-piece.jpg';
  }
  if (text.includes('kettle') || text.includes('blender') || text.includes('mixer')) {
    return '/images/products/electric-kettle-1-7l-stainless-steel.jpg';
  }
  if (text.includes('pan') || text.includes('pot') || text.includes('skillet') || text.includes('cook') || text.includes('kitchen')) {
    return '/images/products/stainless-steel-frying-pan-10.jpg';
  }
  if (text.includes('light') || text.includes('lamp') || text.includes('led')) {
    return '/images/products/string-lights.jpg';
  }
  if (text.includes('toy') || text.includes('car') || text.includes('rc') || text.includes('block') || text.includes('kid')) {
    return '/images/products/rc-car.jpg';
  }
  if (text.includes('plant') || text.includes('garden') || text.includes('home')) {
    return '/images/products/plant-pots.jpg';
  }
  return '/images/products/placeholder.jpg';
}

/**
 * Resolve a fallback image source. Returns the provided fallback, or the
 * default placeholder when none is supplied.
 */
export function getFallbackSrc(src?: string | null, category?: string | null, name?: string | null): string {
  if (!src) return category || name ? getCategoryFallbackImage(category, name) : DEFAULT_PLACEHOLDER
  return src
}

/**
 * Normalizes any product image URL to a reliable root-relative or absolute HTTPS URL.
 * Handles:
 * - Empty / null / undefined -> smart category fallback or DEFAULT_PLACEHOLDER
 * - Data URLs (data:image/...) -> returns as-is
 * - Localhost URLs (http://localhost:3001/uploads/..., http://localhost:3005/...) -> strips origin to root-relative /uploads/...
 * - Insecure HTTP URLs on dromkok.com -> upgrades to https://
 * - Paths missing leading slash (uploads/... or images/...) -> adds leading slash
 * - Bare filenames (1670674373.jpg) -> /uploads/products/1670674373.jpg
 * - Root-relative /uploads/... and /images/... -> returns as-is
 */
export function normalizeProductImageUrl(src?: string | null, category?: string | null, name?: string | null): string {
  const fallback = category || name ? getCategoryFallbackImage(category, name) : DEFAULT_PLACEHOLDER
  if (!src || typeof src !== 'string') return fallback
  const trimmed = src.trim()
  if (!trimmed) return fallback

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
