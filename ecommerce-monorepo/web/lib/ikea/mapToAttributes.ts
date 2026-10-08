import { prisma } from '@/lib/db'
import { IkeaProduct, IkeaMapResult, MappedAttributeValue, UnmappedSpec } from './types'

/**
 * Normalizes a key string: lowercases, removes punctuation, trims spaces
 * e.g. "Total Width (cm)" -> "total width cm"
 */
export function normalizeKey(key: string): string {
  return key
    .toLowerCase()
    .replace(/[():,/_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Parses numeric value and unit from spec strings like:
 * - "160 cm"
 * - "5.2 kg"
 * - "25 mm"
 * - "10.5 lbs"
 * - "47 1/4 \""
 */
export function parseNumericWithUnit(val: string): { num: number | null; unit?: string } {
  if (!val) return { num: null }
  const trimmed = val.trim()

  // Handle fractional inches: e.g. 47 1/4 " or 78 3/4 in
  const fracMatch = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)\s*(in|"|inch)?$/i)
  if (fracMatch) {
    const whole = parseInt(fracMatch[1], 10)
    const numer = parseInt(fracMatch[2], 10)
    const denom = parseInt(fracMatch[3], 10)
    if (denom !== 0) {
      return { num: Math.round((whole + numer / denom) * 100) / 100, unit: 'in' }
    }
  }

  // Handle standard decimal/integer: e.g. "160 cm", "5.2 kg", "25 mm"
  const match = trimmed.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-Z"°%]+)?/)
  if (match) {
    const num = parseFloat(match[1].replace(',', '.'))
    let unit = match[2]?.toLowerCase()
    if (unit === '"' || unit === 'inch' || unit === 'inches') unit = 'in'
    if (unit === 'lbs') unit = 'lb'
    return { num: isNaN(num) ? null : num, unit }
  }

  return { num: null }
}

/**
 * Built-in alias map mapping common IKEA spec keys to internal attribute slugs
 */
export const BUILTIN_ALIASES: Record<string, string[]> = {
  width: ['width', 'breite', 'w', 'total width', 'product width', 'mattress width', 'frame width'],
  length: ['length', 'lange', 'l', 'total length', 'product length', 'mattress length', 'frame length'],
  height: ['height', 'hohe', 'h', 'total height', 'product height', 'headboard height', 'footboard height'],
  depth: ['depth', 'tiefe', 'd', 'product depth', 'seat depth'],
  weight: ['weight', 'gewicht', 'total weight', 'package weight', 'net weight'],
  color: ['color', 'colour', 'farbe', 'shade'],
  material: ['material', 'materials', 'main parts', 'top', 'fabric', 'composition'],
  care_instructions: ['care instructions', 'care', 'washing instructions', 'maintenance'],
  designer: ['designer', 'designed by'],
  diameter: ['diameter', 'durchmesser'],
  volume: ['volume', 'capacity', 'fassungsvermogen'],
  thread_count: ['thread count', 'fadendichte'],
  overview: ['overview', 'summary', 'headline', 'overview summary'],
  features: ['key features', 'features', 'benefits', 'product features'],
  good_to_know: ['good to know', 'whats included', "what's included", 'package contents', 'set includes'],
  package_width: ['package width', 'packaging width'],
  package_height: ['package height', 'packaging height'],
  package_length: ['package length', 'packaging length'],
  package_weight: ['package weight', 'gross weight']
}

/**
 * Maps an extracted IkeaProduct to internal category attributes
 */
export async function mapIkeaProductToAttributes(
  product: IkeaProduct,
  overrideCategoryId?: string
): Promise<IkeaMapResult> {
  // 1. Resolve Target Category
  let category: any = null
  let categoryMatchedVia: 'exact' | 'configured_mapping' | 'manual' | 'default' = 'default'

  if (overrideCategoryId) {
    category = await prisma.category.findUnique({
      where: { id: overrideCategoryId },
      include: {
        attributes: {
          include: { attribute: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    })
    categoryMatchedVia = 'manual'
  }

  if (!category && product.categoryName) {
    // Check IkeaCategoryMapping table first
    const categoryMapping = await (prisma as any).ikeaCategoryMapping.findFirst({
      where: {
        OR: [
          { ikeaCategoryName: { equals: product.categoryName, mode: 'insensitive' as any } },
          ...product.categoryBreadcrumbs.map((b) => ({
            ikeaCategoryName: { equals: b, mode: 'insensitive' as any }
          }))
        ]
      },
      include: {
        category: {
          include: {
            attributes: {
              include: { attribute: true },
              orderBy: { displayOrder: 'asc' }
            }
          }
        }
      } as any
    })

    if ((categoryMapping as any)?.category) {
      category = (categoryMapping as any).category
      categoryMatchedVia = 'configured_mapping'
    }
  }

  // If still not found, try matching by name directly against categories table
  if (!category) {
    const matchedCategory = await prisma.category.findFirst({
      where: {
        OR: [
          { name: { equals: product.categoryName, mode: 'insensitive' as any } },
          ...product.categoryBreadcrumbs.map((b) => ({
            name: { contains: b, mode: 'insensitive' as any }
          }))
        ]
      },
      include: {
        attributes: {
          include: { attribute: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    })

    if (matchedCategory) {
      category = matchedCategory
      categoryMatchedVia = 'exact'
    }
  }

  // Fallback to first active category if none matched
  if (!category) {
    category = await prisma.category.findFirst({
      where: { isActive: true },
      include: {
        attributes: {
          include: { attribute: true },
          orderBy: { displayOrder: 'asc' }
        }
      }
    })
    categoryMatchedVia = 'default'
  }

  // 2. Load Attributes for Category and Global Configured Mappings
  const categoryAttributes = category?.attributes?.map((ca: any) => ca.attribute) || []
  const configuredMappings = await prisma.ikeaSpecMapping.findMany({
    include: { attribute: true }
  })

  // Map of normalized DB configured key -> mapping record
  const mappingByKey = new Map<string, any>()
  configuredMappings.forEach((m) => {
    mappingByKey.set(normalizeKey(m.ikeaKey), m)
    if (m.aliases && Array.isArray(m.aliases)) {
      m.aliases.forEach((alias: any) => {
        mappingByKey.set(normalizeKey(alias), m)
      })
    }
  })

  const mapped: MappedAttributeValue[] = []
  const unmapped: UnmappedSpec[] = []
  const mappedAttrIds = new Set<string>()

  // Combine specs and measurements
  const allSpecs: Record<string, string> = {
    ...product.measurements,
    ...product.specs,
    ...(product.designer ? { Designer: product.designer } : {})
  }

  // 3. Attribute Matching Process
  for (const [rawKey, rawValue] of Object.entries(allSpecs)) {
    if (!rawValue || typeof rawValue !== 'string' || !rawValue.trim()) continue

    const normKey = normalizeKey(rawKey)
    let matchedAttr: any = null
    let matchType: 'exact' | 'alias' | 'unit_aware' | 'configured_mapping' | 'manual' = 'exact'

    // Step A: Check configured IkeaSpecMapping in database
    if (mappingByKey.has(normKey)) {
      const conf = mappingByKey.get(normKey)
      if (conf?.attribute) {
        matchedAttr = conf.attribute
        matchType = 'configured_mapping'
      }
    }

    // Step B: Exact match against category attributes (by slug or name)
    if (!matchedAttr) {
      matchedAttr = categoryAttributes.find(
        (a: any) =>
          normalizeKey(a.name) === normKey ||
          normalizeKey(a.slug) === normKey
      )
      if (matchedAttr) matchType = 'exact'
    }

    // Step C: Built-in alias match
    if (!matchedAttr) {
      for (const [attrSlug, aliasList] of Object.entries(BUILTIN_ALIASES)) {
        if (aliasList.some((alias) => normKey === alias || normKey.includes(alias))) {
          matchedAttr = categoryAttributes.find(
            (a: any) => a.slug === attrSlug || normalizeKey(a.name) === attrSlug
          )
          if (matchedAttr) {
            matchType = 'alias'
            break
          }
        }
      }
    }

    // Step D: Process and format mapped value based on attribute type
    if (matchedAttr && !mappedAttrIds.has(matchedAttr.id)) {
      let finalValue = rawValue.trim()
      let parsedUnit: string | undefined

      if (matchedAttr.type === 'NUMBER') {
        const { num, unit } = parseNumericWithUnit(rawValue)
        if (num !== null) {
          finalValue = num.toString()
          parsedUnit = unit
          matchType = 'unit_aware'
        }
      } else if (matchedAttr.type === 'SELECT' || matchedAttr.type === 'MULTISELECT') {
        // Match against options array if defined
        if (matchedAttr.options && Array.isArray(matchedAttr.options)) {
          const lowerVal = rawValue.toLowerCase()
          const matchedOption = matchedAttr.options.find((opt: any) => {
            const optLabel = typeof opt === 'string' ? opt : opt?.label || opt?.value || ''
            return optLabel.toLowerCase() === lowerVal || lowerVal.includes(optLabel.toLowerCase())
          })
          if (matchedOption) {
            finalValue = typeof matchedOption === 'string' ? matchedOption : matchedOption.label || matchedOption.value
          }
        }
      }

      mapped.push({
        attributeId: matchedAttr.id,
        attributeName: matchedAttr.name,
        attributeSlug: matchedAttr.slug,
        attributeType: matchedAttr.type,
        value: finalValue,
        rawIkeaKey: rawKey,
        rawIkeaValue: rawValue,
        unit: parsedUnit,
        matchedVia: matchType
      })
      mappedAttrIds.add(matchedAttr.id)
    } else if (!matchedAttr) {
      unmapped.push({
        key: rawKey,
        value: rawValue
      })
    }
  }

  // 4. Construct Product Defaults for preview/persistence
  const displayName = product.name
    ? `${product.name}${product.typeName ? ' - ' + product.typeName : ''}`
    : `IKEA Item ${product.cleanItemNumber}`

  const wholesalePrice = Math.round(product.price * 0.8 * 100) / 100

  return {
    targetCategoryId: category?.id || null,
    targetCategoryName: category?.name || 'Uncategorized',
    categoryMatchedVia,
    mapped,
    unmapped,
    productDefaults: {
      name: displayName,
      description: product.description || displayName,
      price: product.price || 0,
      wholesalePrice,
      images: product.images,
      sku: `IKEA-${product.cleanItemNumber}`,
      ikeaItemNumber: product.cleanItemNumber,
      rawIkeaPayload: product
    }
  }
}
