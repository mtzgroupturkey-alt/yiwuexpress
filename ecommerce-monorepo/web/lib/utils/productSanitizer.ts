/**
 * Sanitizes product objects returned by public/storefront APIs,
 * ensuring wholesale pricing, bulk tier discounts, and supplier cost metrics
 * are never leaked to unauthenticated visitors or unverified retail customers.
 */
export function sanitizeProductForClient<T extends Record<string, any>>(
  product: T,
  canViewWholesale: boolean,
  isAdmin: boolean = false
): T {
  if (!product) return product

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

  return safe as T
}
