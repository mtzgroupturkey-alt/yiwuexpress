export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// GET /api/admin/products/[id] - Get single product (admin view)
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN'])
    const { id } = params

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        attributeValues: {
          include: {
            attribute: true,
            translations: true
          }
        },
        translations: true  // ← Add translations to the include
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Transform attributeValues array into key-value objects for values and translations
    const attributes: Record<string, any> = {}
    const attributeTranslations: Record<string, Record<string, string>> = {}
    product.attributeValues.forEach(av => {
      try {
        // Try to parse as JSON first (for arrays and objects)
        attributes[av.attribute.slug] = JSON.parse(av.value)
      } catch {
        // If not JSON, use as string
        attributes[av.attribute.slug] = av.value
      }

      if (av.translations && av.translations.length > 0) {
        if (!attributeTranslations[av.attribute.slug]) {
          attributeTranslations[av.attribute.slug] = {}
        }
        av.translations.forEach(t => {
          attributeTranslations[av.attribute.slug][t.locale] = t.value
        })
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        ...product,
        attributes,
        attributeTranslations
      }
    })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden') || error.message.includes('Account is disabled'))) {
      return createAuthErrorResponse(error)
    }
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/admin/products/[id] - Update product
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN'])
    const { id } = params
    const body = await request.json()

    // Check if product exists
    const existing = await prisma.product.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // If SKU or slug is being changed, check for conflicts
    if (body.sku && body.sku !== existing.sku) {
      const skuConflict = await prisma.product.findFirst({
        where: {
          sku: body.sku,
          id: { not: id }
        }
      })
      if (skuConflict) {
        return NextResponse.json(
          { success: false, error: 'SKU already exists' },
          { status: 400 }
        )
      }
    }

    if (body.slug && body.slug !== existing.slug) {
      const slugConflict = await prisma.product.findFirst({
        where: {
          slug: body.slug,
          id: { not: id }
        }
      })
      if (slugConflict) {
        return NextResponse.json(
          { success: false, error: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    // Extract attributes and translations from body
    const { attributes, attributeTranslations, translations, ...productData } = body

    // Normalize the incoming translations payload into an array of
    // { locale, name, description, metaTitle, metaDescription } rows (en/ru/zh).
    const incomingTranslations: Array<{
      locale: string
      name?: string
      description?: string | null
      metaTitle?: string | null
      metaDescription?: string | null
    }> =
      Array.isArray(translations)
        ? translations
        : translations && typeof translations === 'object'
          ? Object.entries(translations as Record<string, any>).map(([locale, value]) => ({
              locale,
              name: value?.name,
              description: value?.description ?? null,
              metaTitle: value?.metaTitle ?? null,
              metaDescription: value?.metaDescription ?? null
            }))
          : []

    // Expand-and-Contract dual-write: every supplied locale (incl. en) is
    // persisted independently, and the English copy is mirrored back onto the
    // legacy root columns so non-migrated read paths keep working.
    const englishEntry = incomingTranslations.find((t) => t.locale === 'en')
    if (englishEntry) {
      productData.name = englishEntry.name ?? productData.name
      productData.description = englishEntry.description ?? null
      if (englishEntry.metaTitle) productData.metaTitle = englishEntry.metaTitle
      if (englishEntry.metaDescription) productData.metaDescription = englishEntry.metaDescription
    }

    // Update product + write all locale rows atomically.
    const translationUpserts = incomingTranslations
      .filter((t) => t.locale)
      .map((t) => ({
        where: { productId_locale: { productId: id, locale: t.locale } },
        create: {
          productId: id,
          locale: t.locale,
          name: t.name ?? '',
          description: t.description ?? null,
          metaTitle: t.metaTitle ?? null,
          metaDescription: t.metaDescription ?? null
        },
        update: {
          name: t.name ?? '',
          description: t.description ?? null,
          metaTitle: t.metaTitle ?? null,
          metaDescription: t.metaDescription ?? null
        }
      }))

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: productData,
        include: { category: true }
      })

      for (const u of translationUpserts) {
        await tx.productTranslation.upsert(u)
      }

      // Handle attribute values update
      if (attributes && typeof attributes === 'object') {
        // Delete existing attribute values for this product (cascade deletes AttributeValueTranslation)
        await tx.attributeValue.deleteMany({
          where: { productId: id }
        })

        // Get all attributes by slug
        const attributeSlugs = Object.keys(attributes)
        if (attributeSlugs.length > 0) {
          const attributeRecords = await tx.attribute.findMany({
            where: {
              slug: { in: attributeSlugs }
            }
          })

          for (const attr of attributeRecords) {
            const value = attributes[attr.slug]
            if (value !== undefined && value !== null && value !== '') {
              const rawStr = typeof value === 'object' ? JSON.stringify(value) : String(value)
              const createdAv = await tx.attributeValue.create({
                data: {
                  attributeId: attr.id,
                  productId: id,
                  value: rawStr
                }
              })

              const directMap = attributeTranslations?.[attr.slug]
              const ruVal = directMap?.ru ?? attributeTranslations?.ru?.[attr.slug]
              const zhVal = directMap?.zh ?? attributeTranslations?.zh?.[attr.slug]
              const enVal = directMap?.en ?? attributeTranslations?.en?.[attr.slug] ?? rawStr

              const locMap: Record<string, string | undefined> = { en: enVal, ru: ruVal, zh: zhVal }
              for (const [loc, locVal] of Object.entries(locMap)) {
                if (locVal && typeof locVal === 'string' && locVal.trim().length > 0) {
                  await tx.attributeValueTranslation.upsert({
                    where: {
                      attributeValueId_locale: {
                        attributeValueId: createdAv.id,
                        locale: loc
                      }
                    },
                    create: {
                      attributeValueId: createdAv.id,
                      locale: loc,
                      value: locVal.trim()
                    },
                    update: {
                      value: locVal.trim()
                    }
                  })
                }
              }
            }
          }
        }
      }
    })

    // Fetch updated product with attribute values and translations
    const productWithAttributes = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        attributeValues: {
          include: {
            attribute: true,
            translations: true
          }
        },
        translations: true  // ← Add translations to the response
      }
    })

    return NextResponse.json({
      success: true,
      data: productWithAttributes,
      message: 'Product updated successfully'
    })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden') || error.message.includes('Account is disabled'))) {
      return createAuthErrorResponse(error)
    }
    console.error('Error updating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN'])
    const { id } = params

    // Check if product has associated orders
    const orderCount = await prisma.orderItem.count({
      where: { productId: id }
    })

    if (orderCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Cannot delete product with existing orders. Consider marking it as inactive instead.' 
        },
        { status: 400 }
      )
    }

    await prisma.product.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })
  } catch (error) {
    if (error instanceof Error && (error.message.includes('Unauthorized') || error.message.includes('Forbidden') || error.message.includes('Account is disabled'))) {
      return createAuthErrorResponse(error)
    }
    console.error('Error deleting product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
