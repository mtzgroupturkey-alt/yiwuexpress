import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { cleanIkeaItemNumber } from '@/lib/ikea/fetchProduct'
import {
  processIkeaSpecsToAttributes,
  enrichProductDescriptionWithLeftoverSpecs
} from '@/lib/ikea/ensureAttributes'

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

export async function POST(req: NextRequest) {
  try {
    await requireRole(req, ['ADMIN'])

    const body = await req.json()
    const { items, overwriteExisting = false } = body

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'items must be a non-empty array of products to import' },
        { status: 400 }
      )
    }

    const importedResults = []

    // Run imports in a single resilient transaction
    const transactionResult = await prisma.$transaction(async (tx) => {
      const records = []

      for (const item of items) {
        const cleanNum = cleanIkeaItemNumber(item.itemNumber || item.cleanItemNumber)
        if (!cleanNum) continue

        const sku = `IKEA-${cleanNum}`
        const baseSlug = slugify(item.name || `ikea-${cleanNum}`)
        const slug = `${baseSlug}-${cleanNum}`

        // Check if product already exists by ikeaItemNumber, ikeaItemNo, or sku
        const existing = await tx.product.findFirst({
          where: {
            OR: [
              { ikeaItemNumber: cleanNum },
              { ikeaItemNo: cleanNum },
              { sku: sku }
            ]
          },
          include: {
            attributeValues: true
          }
        })

        // Gather all available specs from payload and unmappedSpecs
        const rawSpecs: Record<string, string> = {
          ...(item.rawIkeaPayload?.measurements || {}),
          ...(item.rawIkeaPayload?.specs || {}),
          ...(item.unmappedSpecs
            ? Object.fromEntries(item.unmappedSpecs.map((u: any) => [u.key, u.value]))
            : {})
        }

        const targetCategoryId = item.categoryId || existing?.categoryId

        // Process specs: make into attributes if standard/needed, otherwise return as leftover
        const {
          mappedAttributes: finalMappedAttributes,
          leftoverSpecs,
          extractedWeightKg,
          extractedMaterial,
          extractedDimensions
        } = await processIkeaSpecsToAttributes(
          tx,
          targetCategoryId,
          rawSpecs,
          item.mappedAttributes || []
        )

        // Put any leftover non-attribute specs into description
        const enrichedDescription = enrichProductDescriptionWithLeftoverSpecs(
          item.description || existing?.description || item.name || '',
          leftoverSpecs
        )

        let productRecord: any

        if (existing) {
          // Idempotent update
          const updateData: any = {
            ikeaItemNo: cleanNum,
            ikeaItemNumber: cleanNum,
            rawIkeaPayload: item.rawIkeaPayload || existing.rawIkeaPayload
          }

          if (extractedMaterial) updateData.material = extractedMaterial
          if (extractedWeightKg) updateData.weightKg = extractedWeightKg
          if (extractedDimensions) updateData.dimensions = extractedDimensions

          if (overwriteExisting) {
            updateData.name = item.name || existing.name
            updateData.description = enrichedDescription
            updateData.price = typeof item.price === 'number' ? item.price : existing.price
            updateData.wholesalePrice =
              typeof item.wholesalePrice === 'number' ? item.wholesalePrice : existing.wholesalePrice
            if (item.categoryId) updateData.categoryId = item.categoryId
            if (item.images && item.images.length > 0) {
              updateData.images = item.images
              updateData.thumbnail = item.images[0]
            }
          }

          productRecord = await tx.product.update({
            where: { id: existing.id },
            data: updateData
          })

          // Update attribute values
          if (finalMappedAttributes.length > 0) {
            const attrIdsToUpdate = finalMappedAttributes.map((a: any) => a.attributeId)

            await tx.attributeValue.deleteMany({
              where: {
                productId: existing.id,
                attributeId: { in: attrIdsToUpdate }
              }
            })

            for (const attr of finalMappedAttributes) {
              if (attr.attributeId && attr.value) {
                await tx.attributeValue.create({
                  data: {
                    productId: existing.id,
                    attributeId: attr.attributeId,
                    value: String(attr.value)
                  }
                })
              }
            }
          }
        } else {
          // Create brand new product
          const images = item.images && item.images.length > 0 ? item.images : []
          const price = typeof item.price === 'number' ? item.price : 0
          const wholesalePrice =
            typeof item.wholesalePrice === 'number'
              ? item.wholesalePrice
              : Math.round(price * 0.8 * 100) / 100

          productRecord = await tx.product.create({
            data: {
              sku,
              ikeaItemNo: cleanNum,
              ikeaItemNumber: cleanNum,
              name: item.name || `IKEA Item ${cleanNum}`,
              slug,
              description: enrichedDescription,
              categoryId: item.categoryId || null,
              price,
              wholesalePrice,
              images,
              thumbnail: images[0] || null,
              stock: 100,
              weightKg: extractedWeightKg || 1.0,
              material: extractedMaterial || null,
              dimensions: extractedDimensions ?? undefined,
              countryOfOrigin: 'China',
              rawIkeaPayload: item.rawIkeaPayload || null,
              isActive: true,
              availableForRetail: true,
              availableForWholesale: true
            }
          })

          // Insert attribute values
          for (const attr of finalMappedAttributes) {
            if (attr.attributeId && attr.value) {
              await tx.attributeValue.create({
                data: {
                  productId: productRecord.id,
                  attributeId: attr.attributeId,
                  value: String(attr.value)
                }
              })
            }
          }
        }

        records.push({
          productId: productRecord.id,
          sku: productRecord.sku,
          name: productRecord.name,
          ikeaItemNumber: cleanNum,
          action: existing ? 'updated' : 'created'
        })
      }

      return records
    })

    return NextResponse.json({
      success: true,
      importedCount: transactionResult.length,
      products: transactionResult
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return createAuthErrorResponse(err)
    }
    console.error('[API /api/admin/ikea/import] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error importing IKEA products' },
      { status: 500 }
    )
  }
}
