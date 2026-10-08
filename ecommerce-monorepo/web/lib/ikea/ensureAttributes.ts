import { normalizeKey, parseNumericWithUnit } from './mapToAttributes'

export interface StandardAttributeDef {
  keys: string[]
  slug: string
  name: string
  type: 'TEXT' | 'NUMBER'
}

export const STANDARD_IKEA_ATTRIBUTES: StandardAttributeDef[] = [
  { keys: ['material', 'materials', 'main parts'], slug: 'material', name: 'Material', type: 'TEXT' },
  { keys: ['care instructions', 'care', 'washing instructions'], slug: 'care_instructions', name: 'Care instructions', type: 'TEXT' },
  { keys: ['designer', 'designed by'], slug: 'designer', name: 'Designer', type: 'TEXT' },
  { keys: ['good to know', 'whats included', "what's included", 'package contents'], slug: 'good_to_know', name: 'Good to know', type: 'TEXT' },
  { keys: ['package dimensions', 'packaging dimensions'], slug: 'package_dimensions', name: 'Package dimensions', type: 'TEXT' },
  { keys: ['package weight', 'gross weight'], slug: 'package_weight', name: 'Package weight', type: 'TEXT' },
  { keys: ['diameter', 'durchmesser'], slug: 'diameter', name: 'Diameter', type: 'TEXT' },
  { keys: ['thread count', 'fadendichte'], slug: 'thread_count', name: 'Thread count', type: 'TEXT' },
  { keys: ['coating', 'pan coating', 'surface treatment'], slug: 'coating', name: 'Coating', type: 'TEXT' },
  { keys: ['width'], slug: 'width', name: 'Width', type: 'NUMBER' },
  { keys: ['height'], slug: 'height', name: 'Height', type: 'NUMBER' },
  { keys: ['length'], slug: 'length', name: 'Length', type: 'NUMBER' },
  { keys: ['weight'], slug: 'weight', name: 'Weight', type: 'NUMBER' },
]

/**
 * Ensures an attribute and its category link exist in the database.
 * If they do not exist, creates them.
 */
export async function ensureCategoryAttribute(
  tx: any,
  categoryId: string,
  def: { slug: string; name: string; type: 'TEXT' | 'NUMBER' }
) {
  let attr = await tx.attribute.findUnique({
    where: { slug: def.slug }
  })

  if (!attr) {
    attr = await tx.attribute.create({
      data: {
        slug: def.slug,
        name: def.name,
        type: def.type,
        isActive: true,
        isVisible: true,
        isFilterable: true
      }
    })
  }

  const existingLink = await tx.categoryAttribute.findUnique({
    where: {
      categoryId_attributeId: {
        categoryId,
        attributeId: attr.id
      }
    }
  })

  if (!existingLink) {
    await tx.categoryAttribute.create({
      data: {
        categoryId,
        attributeId: attr.id,
        isVisible: true,
        isRequired: false
      }
    })
  }

  return attr
}

/**
 * Resolves IKEA specs into attributes:
 * - If a spec matches a standard attribute and is not yet mapped:
 *   creates the attribute & category link, returning it as a mapped attribute.
 * - Any remaining specs that are NOT attributes are returned in leftoverSpecs
 *   so they can be placed into the product description.
 */
export async function processIkeaSpecsToAttributes(
  tx: any,
  categoryId: string | null | undefined,
  allSpecs: Record<string, string>,
  alreadyMapped: Array<{ attributeId: string; value: string; attributeSlug?: string }>
): Promise<{
  mappedAttributes: Array<{ attributeId: string; value: string }>
  leftoverSpecs: Array<{ key: string; value: string }>
  extractedWeightKg?: number
  extractedMaterial?: string
  extractedDimensions?: { length: number; width: number; height: number }
}> {
  const mappedList = [...alreadyMapped]
  const mappedAttrIds = new Set(alreadyMapped.map((m) => m.attributeId))
  const leftoverSpecs: Array<{ key: string; value: string }> = []

  let extractedWeightKg: number | undefined
  let extractedMaterial: string | undefined
  let extractedDimensions: { length: number; width: number; height: number } | undefined

  let lengthNum: number | undefined
  let widthNum: number | undefined
  let heightNum: number | undefined

  for (const [rawKey, rawVal] of Object.entries(allSpecs)) {
    if (!rawVal || typeof rawVal !== 'string' || !rawVal.trim()) continue

    const normKey = normalizeKey(rawKey)
    const valTrimmed = rawVal.trim()

    // Check top-level product field extraction
    if (normKey === 'material' || normKey === 'materials' || normKey === 'main parts') {
      extractedMaterial = valTrimmed
    }
    if (normKey === 'weight' || normKey === 'net weight' || normKey === 'package weight') {
      const parsed = parseNumericWithUnit(valTrimmed)
      if (parsed.num !== null && !extractedWeightKg) {
        extractedWeightKg = parsed.num
      }
    }
    if (normKey === 'length') {
      const p = parseNumericWithUnit(valTrimmed)
      if (p.num !== null) lengthNum = p.num
    }
    if (normKey === 'width') {
      const p = parseNumericWithUnit(valTrimmed)
      if (p.num !== null) widthNum = p.num
    }
    if (normKey === 'height') {
      const p = parseNumericWithUnit(valTrimmed)
      if (p.num !== null) heightNum = p.num
    }

    // Try matching to standard attribute definitions
    let matchedDef: StandardAttributeDef | undefined
    for (const def of STANDARD_IKEA_ATTRIBUTES) {
      if (def.keys.some((k) => normKey === k || normKey.includes(k))) {
        matchedDef = def
        break
      }
    }

    if (matchedDef && categoryId) {
      // Ensure attribute and category link exist
      const attr = await ensureCategoryAttribute(tx, categoryId, matchedDef)
      if (!mappedAttrIds.has(attr.id)) {
        let finalVal = valTrimmed
        if (matchedDef.type === 'NUMBER') {
          const parsed = parseNumericWithUnit(valTrimmed)
          if (parsed.num !== null) {
            finalVal = String(parsed.num)
          }
        }
        mappedList.push({
          attributeId: attr.id,
          value: finalVal
        })
        mappedAttrIds.add(attr.id)
      }
    } else {
      leftoverSpecs.push({ key: rawKey, value: valTrimmed })
    }
  }

  if (lengthNum !== undefined && widthNum !== undefined && heightNum !== undefined) {
    extractedDimensions = { length: lengthNum, width: widthNum, height: heightNum }
  }

  return {
    mappedAttributes: mappedList,
    leftoverSpecs,
    extractedWeightKg,
    extractedMaterial,
    extractedDimensions
  }
}

/**
 * Enriches a product description by appending any leftover specs
 * that were not mapped or created as attributes.
 */
export function enrichProductDescriptionWithLeftoverSpecs(
  baseDescription: string,
  leftoverSpecs: Array<{ key: string; value: string }>
): string {
  if (!leftoverSpecs || leftoverSpecs.length === 0) return baseDescription

  const unmentioned = leftoverSpecs.filter((spec) => {
    const keyLower = spec.key.toLowerCase()
    return !baseDescription.toLowerCase().includes(keyLower)
  })

  if (unmentioned.length === 0) return baseDescription

  const appendText = unmentioned
    .map((s) => `• ${s.key}: ${s.value}`)
    .join('\n')

  return `${baseDescription.trim()}\n\nAdditional Details:\n${appendText}`
}
