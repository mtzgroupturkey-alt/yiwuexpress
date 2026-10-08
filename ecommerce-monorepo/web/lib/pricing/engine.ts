import { prisma } from '@/lib/db'

export interface PricingContext {
  userId?: string
  userType?: string // 'RETAIL' | 'WHOLESALE' | 'BOTH'
  verificationStatus?: string // 'UNVERIFIED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  role?: string // 'USER' | 'ADMIN' | 'SUPPLIER'
  isApprovedWholesale: boolean
  mode: 'RETAIL' | 'WHOLESALE'
}

export interface InputOrderItem {
  productId: string
  variantId?: string | null
  variantAttributes?: any
  selectedOptions?: any
  quantity: number
}

export interface CalculatedOrderItem {
  productId: string
  variantId: string | null
  variantAttributes: any
  selectedOptions: any
  productName: string
  productSku: string
  productImage: string | null
  quantity: number
  price: number
  total: number
  priceType: 'RETAIL' | 'WHOLESALE' | 'TIERED' | 'CONTRACT'
}

export interface OrderCalculationResult {
  items: CalculatedOrderItem[]
  subtotal: number
  shippingFee: number
  tax: number
  discount: number
  total: number
  totalWeight: number
  stockDecrements: Array<{
    productId: string
    variantId?: string
    quantity: number
    productName: string
  }>
}

export interface ShippingOption {
  id: string
  name: string
  estimatedDays: string
  price: number
  currency: string
}

export interface ResolveShippingParams {
  shippingCountryId?: string | null
  shippingMethod?: string | null
  totalWeight: number
  mode?: 'RETAIL' | 'WHOLESALE'
}

export interface ResolvedShipping {
  shippingFee: number
  options: ShippingOption[]
  selectedMethod?: ShippingOption
  currency: string
}

/**
 * Reusable, authoritative shipping rate calculator.
 * Queries destination country and database-configured shippingMethods JSON.
 * Guarantees 100% parity between shipping estimator and order totals.
 */
export async function resolveShippingRates(params: ResolveShippingParams): Promise<ResolvedShipping> {
  const {
    shippingCountryId,
    shippingMethod,
    totalWeight,
    mode = 'RETAIL',
  } = params

  const normalizedWeight = Math.max(0, Number(totalWeight) || 0)
  const fallbackFee = mode === 'WHOLESALE' ? 50.0 : 15.0

  if (!shippingCountryId) {
    return {
      shippingFee: 0,
      options: [],
      currency: 'USD',
    }
  }

  const country = await prisma.country.findFirst({
    where: {
      OR: [
        { id: shippingCountryId },
        { code: { equals: shippingCountryId, mode: 'insensitive' } },
      ],
      isActive: true,
    },
  })

  if (!country) {
    return {
      shippingFee: fallbackFee,
      options: [
        {
          id: 'standard',
          name: 'Standard Freight',
          estimatedDays: '15-25 days',
          price: fallbackFee,
          currency: 'USD',
        },
      ],
      currency: 'USD',
    }
  }

  const currency = country.currency || 'USD'
  const rawMethods = (country.shippingMethods as any) || {}
  const options: ShippingOption[] = []

  const defaultNames: Record<string, string> = {
    standard: 'Standard Delivery',
    express: 'Air Express',
  }

  const defaultDays: Record<string, string> = {
    standard: '7-14 days',
    express: '3-5 days',
  }

  for (const [key, rawConfig] of Object.entries(rawMethods)) {
    const config = rawConfig as any
    if (config && config.enabled) {
      const baseRate = Number(config.baseRate) || 0
      const ratePerKg = Number(config.ratePerKg) || 0
      const price = Number((baseRate + normalizedWeight * ratePerKg).toFixed(2))
      const name = config.name || defaultNames[key.toLowerCase()] || `${key.charAt(0).toUpperCase() + key.slice(1)} Shipping`
      const estimatedDays = config.estimatedDays || defaultDays[key.toLowerCase()] || '5-10 days'

      options.push({
        id: key,
        name,
        estimatedDays,
        price,
        currency,
      })
    }
  }

  if (options.length === 0) {
    return {
      shippingFee: fallbackFee,
      options: [
        {
          id: 'standard',
          name: 'Standard Freight',
          estimatedDays: '15-25 days',
          price: fallbackFee,
          currency,
        },
      ],
      currency,
    }
  }

  const methodKey = (shippingMethod || 'standard').toLowerCase()
  const matchedOption = options.find((opt) => opt.id.toLowerCase() === methodKey) || options[0]

  return {
    shippingFee: matchedOption.price,
    options,
    selectedMethod: matchedOption,
    currency,
  }
}

/**
 * Authoritative Server-Side Pricing Engine
 * Calculates item totals, resolves wholesale/tiered/contract prices,
 * verifies MOQ, and computes shipping fees and taxes server-side.
 */
export async function calculateOrderTotals(
  inputItems: InputOrderItem[],
  context: PricingContext,
  shippingCountryId: string,
  shippingMethod?: string
): Promise<OrderCalculationResult> {
  if (!inputItems || inputItems.length === 0) {
    throw new Error('Order must contain at least one item')
  }

  // 1. Batch fetch all products and variants in a single database round-trip
  const productIds = Array.from(new Set(inputItems.map((i) => i.productId)))
  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isActive: true,
    },
    include: {
      variants: {
        where: { isActive: true },
        include: {
          tieredPrices: {
            orderBy: { minQuantity: 'desc' },
          },
        },
      },
      contractPrices: context.userId
        ? {
            where: {
              userId: context.userId,
            },
          }
        : false,
    },
  })

  const productMap = new Map(products.map((p) => [p.id, p]))

  let subtotal = 0
  let totalWeight = 0
  const calculatedItems: CalculatedOrderItem[] = []
  const stockDecrements: Array<{
    productId: string
    variantId?: string
    quantity: number
    productName: string
  }> = []

  for (const item of inputItems) {
    const qty = Number(item.quantity)
    if (!qty || qty < 1) {
      throw new Error('Item quantity must be at least 1')
    }

    const product = productMap.get(item.productId)
    if (!product || !product.isActive) {
      throw new Error(`Product ${item.productId} is not available`)
    }

    // Check channel availability
    if (context.mode === 'RETAIL' && !product.availableForRetail) {
      throw new Error(`Product ${product.name} is not available for retail purchase`)
    }
    if (context.mode === 'WHOLESALE' && !product.availableForWholesale) {
      throw new Error(`Product ${product.name} is not available for wholesale purchase`)
    }

    // Check inventory
    if (product.stock < qty) {
      throw new Error(`Insufficient stock for ${product.name} (available: ${product.stock}, requested: ${qty})`)
    }

    let selectedVariant: any = null
    if (item.variantId) {
      selectedVariant = product.variants.find((v) => v.id === item.variantId)
      if (!selectedVariant) {
        throw new Error(`Selected variant not found for ${product.name}`)
      }
      if (selectedVariant.stock < qty) {
        throw new Error(`Insufficient stock for variant of ${product.name}`)
      }
    }

    // Enforce Minimum Order Quantity (MOQ) for wholesale mode
    const effectiveMoq = context.mode === 'WHOLESALE' ? (product.minOrderQty || 1) : 1
    if (qty < effectiveMoq) {
      throw new Error(`Minimum order quantity for ${product.name} is ${effectiveMoq} units`)
    }

    // Pricing Resolution Order:
    // 1. Contract Price (User-specific negotiated pricing)
    // 2. Tiered Price (Quantity break for variant)
    // 3. Wholesale Price (Base wholesale price)
    // 4. Variant/Product Base Price (Retail)
    let unitPrice = selectedVariant?.price ?? product.price
    let priceType: CalculatedOrderItem['priceType'] = 'RETAIL'

    if (context.mode === 'WHOLESALE' && context.isApprovedWholesale) {
      // 1. Contract Price
      const contract = product.contractPrices?.find(
        (cp) =>
          cp.productId === product.id &&
          qty >= cp.minQuantity &&
          (!cp.validUntil || cp.validUntil > new Date())
      )

      if (contract) {
        unitPrice = contract.customPrice
        priceType = 'CONTRACT'
      } else if (selectedVariant && selectedVariant.tieredPrices?.length > 0) {
        // 2. Variant Tiered Price
        const matchedTier = selectedVariant.tieredPrices.find(
          (t: any) => qty >= t.minQuantity && (!t.maxQuantity || qty <= t.maxQuantity)
        )
        if (matchedTier) {
          unitPrice = matchedTier.price
          priceType = 'TIERED'
        } else if (product.wholesalePrice) {
          unitPrice = product.wholesalePrice
          priceType = 'WHOLESALE'
        }
      } else if (product.wholesalePrice) {
        // 3. Product Base Wholesale Price
        unitPrice = product.wholesalePrice
        priceType = 'WHOLESALE'
      }
    }

    const itemTotal = Number((unitPrice * qty).toFixed(2))
    subtotal += itemTotal

    const unitWeight = Number(product.weightKg) || 0.2
    totalWeight += unitWeight * qty

    calculatedItems.push({
      productId: product.id,
      variantId: item.variantId || null,
      variantAttributes: item.variantAttributes || null,
      selectedOptions: item.selectedOptions || item.variantAttributes || null,
      productName: product.name,
      productSku: selectedVariant?.sku || product.sku,
      productImage: product.thumbnail,
      quantity: qty,
      price: unitPrice,
      total: itemTotal,
      priceType,
    })

    stockDecrements.push({
      productId: product.id,
      variantId: item.variantId || undefined,
      quantity: qty,
      productName: product.name,
    })
  }

  // 2. Authoritative Shipping Fee Calculation
  let shippingFee = 0
  if (shippingCountryId) {
    const shippingResult = await resolveShippingRates({
      shippingCountryId,
      shippingMethod,
      totalWeight,
      mode: context.mode,
    })
    shippingFee = shippingResult.shippingFee
  }

  // 3. Authoritative Tax & Discount Calculation
  // Verified wholesale cross-border export orders are tax-exempt (0%), retail standard VAT/sales tax is 0% or configured
  const taxRate = context.mode === 'WHOLESALE' && context.isApprovedWholesale ? 0.0 : 0.0
  const tax = Number((subtotal * taxRate).toFixed(2))
  const discount = 0.0 // Promotion engine discounts can be validated here
  const total = Number((subtotal + shippingFee + tax - discount).toFixed(2))

  return {
    items: calculatedItems,
    subtotal: Number(subtotal.toFixed(2)),
    shippingFee,
    tax,
    discount,
    total,
    totalWeight: Number(totalWeight.toFixed(2)),
    stockDecrements,
  }
}
