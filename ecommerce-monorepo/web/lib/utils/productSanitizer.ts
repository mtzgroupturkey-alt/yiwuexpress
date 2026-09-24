import { normalizeProductImageUrl } from '@/lib/image-utils'

/**
 * Sanitizes product objects returned by public/storefront APIs,
 * ensuring wholesale pricing, bulk tier discounts, and supplier cost metrics
 * are never leaked to unauthenticated visitors or unverified retail customers.
 * Also normalizes image paths so uploaded photos load reliably across devices.
 */
export function sanitizeProductForClient<T extends Record<string, any>>(
  product: T,
  canViewWholesale: boolean,
  isAdmin: boolean = false
): T & { isWholesaleGated: boolean } {
  if (!product) return product as T & { isWholesaleGated: boolean }

  // 1. Strip sensitive backend/supplier margin fields from all non-admins
  const safe: Record<string, any> = { ...product }
  if (!isAdmin) {
    delete safe.costPrice
    delete safe.purchaseCost
    delete safe.profit
    delete safe.profitMargin
    delete safe.suppliers
    delete safe.supplierId
  }

  // 1b. Normalize thumbnail & images
  if (safe.thumbnail) {
    safe.thumbnail = normalizeProductImageUrl(safe.thumbnail)
  }
  if (Array.isArray(safe.images) && safe.images.length > 0) {
    safe.images = safe.images.map((img: string) => normalizeProductImageUrl(img))
  } else if (safe.thumbnail) {
    safe.images = [safe.thumbnail]
  }

  // 2. Gate wholesale price & tiered quantity discounts
  if (!canViewWholesale) {
    safe.wholesalePrice = null
    safe.isWholesaleGated = true

    if (Array.isArray(safe.variants)) {
      safe.variants = safe.variants.map((variant: any) => {
        const vSafe = { ...variant }
        if (!isAdmin) {
          delete vSafe.costPrice
        }
        vSafe.tieredPrices = [] // Hide volume discount tiers from public/retail
        return vSafe
      })
    }
  } else {
    safe.isWholesaleGated = false
  }

  return safe as T & { isWholesaleGated: boolean }
}
