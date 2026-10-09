import { normalizeProductImageUrl } from '@/lib/image-utils'
import { getProductDisplayNames } from './productNames'

/**
 * Sanitizes product objects returned by public/storefront APIs,
 * ensuring wholesale pricing, bulk tier discounts, and supplier cost metrics
 * are never leaked to unauthenticated visitors or unverified retail customers.
 * Also normalizes image paths so uploaded photos load reliably across devices.
 */
export type SanitizedProduct<T> = T & {
  isWholesaleGated: boolean
  tieredPrices?: any[]
  moq?: number
  minOrderQty?: number
  wholesalePrice?: number | null
}

export function sanitizeProductForClient<T extends Record<string, any>>(
  product: T,
  canViewWholesale: boolean,
  isAdmin: boolean = false
): SanitizedProduct<T> {
  if (!product) return product as SanitizedProduct<T>

  // 1. Strip sensitive backend/supplier margin fields, internal IKEA item numbers, and internal SKU from all non-admins
  const safe: Record<string, any> = { ...product }
  if (!isAdmin) {
    delete safe.ikeaItemNo
    delete safe.sku
    delete safe.costPrice
    delete safe.purchaseCost
    delete safe.profit
    delete safe.profitMargin
    delete safe.suppliers
    delete safe.supplierId
  }

  // 1b. Normalize thumbnail & images
  const catName = safe.category?.name || safe.categoryName || safe.category
  if (safe.thumbnail) {
    safe.thumbnail = normalizeProductImageUrl(safe.thumbnail, catName, safe.name)
  }
  if (Array.isArray(safe.images) && safe.images.length > 0) {
    safe.images = safe.images.map((img: string) => normalizeProductImageUrl(img, catName, safe.name))
  } else if (safe.thumbnail) {
    safe.images = [safe.thumbnail]
  }

  // 1c. Attach resolved Swedish & English names if not already set
  if (!safe.swedenName && !safe.englishName) {
    const { swedenName, englishName } = getProductDisplayNames(safe)
    safe.swedenName = swedenName
    safe.englishName = englishName
  }

  // 2. Strip variant sensitive fields for non-admins
  if (Array.isArray(safe.variants) && !isAdmin) {
    safe.variants = safe.variants.map((variant: any) => {
      const vSafe = { ...variant }
      delete vSafe.sku
      delete vSafe.costPrice
      return vSafe
    })
  }

  // 3. Gate wholesale price & tiered quantity discounts
  if (!canViewWholesale) {
    safe.wholesalePrice = null
    delete safe.minOrderQty
    delete safe.moq
    safe.tieredPrices = []
    safe.isWholesaleGated = true

    if (Array.isArray(safe.variants)) {
      safe.variants = safe.variants.map((variant: any) => {
        const vSafe = { ...variant }
        delete vSafe.minOrderQty
        delete vSafe.moq
        vSafe.tieredPrices = [] // Hide volume discount tiers from public/retail
        return vSafe
      })
    }
  } else {
    safe.isWholesaleGated = false
  }

  return safe as T & { isWholesaleGated: boolean }
}
