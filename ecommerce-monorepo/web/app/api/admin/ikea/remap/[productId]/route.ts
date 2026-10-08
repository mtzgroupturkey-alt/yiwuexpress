import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { mapIkeaProductToAttributes } from '@/lib/ikea/mapToAttributes'
import { IkeaProduct } from '@/lib/ikea/types'

import {
  processIkeaSpecsToAttributes,
  enrichProductDescriptionWithLeftoverSpecs
} from '@/lib/ikea/ensureAttributes'

export async function POST(
  req: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    await requireRole(req, ['ADMIN'])

    const { productId } = params
    if (!productId) {
      return NextResponse.json({ error: 'productId parameter is required' }, { status: 400 })
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        attributeValues: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (!product.rawIkeaPayload) {
      return NextResponse.json(
        { error: 'Product does not have rawIkeaPayload stored from a previous IKEA import' },
        { status: 400 }
      )
    }

    const rawPayload = product.rawIkeaPayload as unknown as IkeaProduct
    const mappedResult = await mapIkeaProductToAttributes(
      rawPayload,
      product.categoryId || undefined
    )

    // Re-apply mapped attributes transactionally
    await prisma.$transaction(async (tx) => {
      const rawSpecs: Record<string, string> = {
        ...(rawPayload.measurements || {}),
        ...(rawPayload.specs || {})
      }

      const {
        mappedAttributes: finalMappedAttributes,
        leftoverSpecs,
        extractedWeightKg,
        extractedMaterial,
        extractedDimensions
      } = await processIkeaSpecsToAttributes(
        tx,
        product.categoryId,
        rawSpecs,
        mappedResult.mapped
      )

      const enrichedDescription = enrichProductDescriptionWithLeftoverSpecs(
        product.description || '',
        leftoverSpecs
      )

      await tx.product.update({
        where: { id: product.id },
        data: {
          description: enrichedDescription,
          ...(extractedMaterial ? { material: extractedMaterial } : {}),
          ...(extractedWeightKg ? { weightKg: extractedWeightKg } : {}),
          ...(extractedDimensions ? { dimensions: extractedDimensions } : {})
        }
      })

      const attrIdsToUpdate = finalMappedAttributes.map((m) => m.attributeId)

      if (attrIdsToUpdate.length > 0) {
        await tx.attributeValue.deleteMany({
          where: {
            productId: product.id,
            attributeId: { in: attrIdsToUpdate }
          }
        })

        for (const m of finalMappedAttributes) {
          if (m.attributeId && m.value) {
            await tx.attributeValue.create({
              data: {
                productId: product.id,
                attributeId: m.attributeId,
                value: String(m.value)
              }
            })
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      productId: product.id,
      remappedCount: mappedResult.mapped.length,
      unmappedCount: mappedResult.unmapped.length,
      mappedResult
    })
  } catch (err: any) {
    if (err.message === 'Unauthorized' || err.message === 'Forbidden') {
      return createAuthErrorResponse(err)
    }
    console.error('[API /api/admin/ikea/remap] Error:', err)
    return NextResponse.json(
      { error: err.message || 'Internal server error remapping IKEA product attributes' },
      { status: 500 }
    )
  }
}
