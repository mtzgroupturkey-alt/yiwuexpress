export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser, isApprovedWholesaleUser } from '@/lib/auth'
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer'
import { localizeProduct, localizeCategory } from '@/lib/utils/localize'

function withTranslations<T extends Record<string, any>>(select: T): T {
  return { ...select, translations: { select: { locale: true, name: true, description: true } } }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const limit = Math.max(1, Math.min(24, parseInt(searchParams.get('limit') || '4', 10)))
    const skip = searchParams.get('skip') ? Math.max(0, parseInt(searchParams.get('skip') || '0', 10)) : (page - 1) * limit
    const locale = searchParams.get('locale') || 'en'

    // First, get the current product to find related products
    const currentProduct = await prisma.product.findUnique({
      where: { slug },
      select: {
        id: true,
        categoryId: true,
      },
    })

    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Product select projection
    const productSelect = withTranslations({
      id: true,
      sku: true,
      name: true,
      slug: true,
      description: true,
      price: true,
      compareAtPrice: true,
      thumbnail: true,
      images: true,
      stock: true,
      minOrderQty: true,
      wholesalePrice: true,
      attributeValues: {
        include: {
          attribute: true,
        },
      },
      category: {
        select: {
          id: true,
          name: true,
          slug: true,
          translations: {
            select: { locale: true, name: true },
          },
        },
      },
    })

    // Count active products in the same category (excluding current product)
    const categoryCount = currentProduct.categoryId
      ? await prisma.product.count({
          where: {
            categoryId: currentProduct.categoryId,
            id: { not: currentProduct.id },
            isActive: true,
          },
        })
      : 0

    // Count active products outside this category (excluding current product)
    const otherWhere = currentProduct.categoryId
      ? {
          categoryId: { not: currentProduct.categoryId },
          id: { not: currentProduct.id },
          isActive: true,
        }
      : {
          id: { not: currentProduct.id },
          isActive: true,
        }

    const otherCount = await prisma.product.count({
      where: otherWhere,
    })

    const totalCatalogCount = categoryCount + otherCount
    let relatedProducts: any[] = []

    if (totalCatalogCount > 0) {
      const offset = skip

      if (offset < categoryCount) {
        // 1. Fetch from current category first
        const takeFromCategory = Math.min(limit, categoryCount - offset)
        const catItems = await prisma.product.findMany({
          where: {
            categoryId: currentProduct.categoryId!,
            id: { not: currentProduct.id },
            isActive: true,
          },
          take: takeFromCategory,
          skip: offset,
          orderBy: { createdAt: 'desc' },
          select: productSelect,
        })
        relatedProducts.push(...catItems)

        // If category had fewer items than requested limit, backfill from other products
        const remainingNeeded = limit - relatedProducts.length
        if (remainingNeeded > 0 && otherCount > 0) {
          const otherItems = await prisma.product.findMany({
            where: otherWhere,
            take: Math.min(remainingNeeded, otherCount),
            skip: 0,
            orderBy: { createdAt: 'desc' },
            select: productSelect,
          })
          relatedProducts.push(...otherItems)
        }
      } else {
        // 2. Category products exhausted - infinite scroll from other products with cyclic wrap
        const otherOffset = offset - categoryCount

        if (otherCount > 0) {
          const wrappedSkip = otherOffset % otherCount
          const firstChunkTake = Math.min(limit, otherCount - wrappedSkip)

          const firstChunk = await prisma.product.findMany({
            where: otherWhere,
            take: firstChunkTake,
            skip: wrappedSkip,
            orderBy: { createdAt: 'desc' },
            select: productSelect,
          })
          relatedProducts.push(...firstChunk)

          const remainingNeeded = limit - relatedProducts.length
          if (remainingNeeded > 0) {
            const wrapItems = await prisma.product.findMany({
              where: otherWhere,
              take: Math.min(remainingNeeded, otherCount),
              skip: 0,
              orderBy: { createdAt: 'desc' },
              select: productSelect,
            })
            relatedProducts.push(...wrapItems)
          }
        } else if (categoryCount > 0) {
          // If all catalog products belong to the same category, cycle within category
          const wrappedSkip = offset % categoryCount
          const firstChunkTake = Math.min(limit, categoryCount - wrappedSkip)

          const firstChunk = await prisma.product.findMany({
            where: {
              categoryId: currentProduct.categoryId!,
              id: { not: currentProduct.id },
              isActive: true,
            },
            take: firstChunkTake,
            skip: wrappedSkip,
            orderBy: { createdAt: 'desc' },
            select: productSelect,
          })
          relatedProducts.push(...firstChunk)

          const remainingNeeded = limit - relatedProducts.length
          if (remainingNeeded > 0) {
            const wrapItems = await prisma.product.findMany({
              where: {
                categoryId: currentProduct.categoryId!,
                id: { not: currentProduct.id },
                isActive: true,
              },
              take: Math.min(remainingNeeded, categoryCount),
              skip: 0,
              orderBy: { createdAt: 'desc' },
              select: productSelect,
            })
            relatedProducts.push(...wrapItems)
          }
        }
      }
    }

    // Transform products for display
    const transformedProducts = relatedProducts.map(product => {
      const localized = localizeProduct(product, locale)
      // Transform attributeValues array into a key-value object
      const attributes: Record<string, any> = {}
      if (product.attributeValues && Array.isArray(product.attributeValues)) {
        product.attributeValues.forEach((av: any) => {
          try {
            // Try to parse as JSON first (for arrays and objects)
            attributes[av.attribute.slug] = JSON.parse(av.value)
          } catch {
            // If not JSON, use as string
            attributes[av.attribute.slug] = av.value
          }
        })
      }

      return {
        id: product.id,
        sku: product.sku,
        slug: product.slug,
        name: localized.name,
        description: localized.description,
        price: parseFloat(product.price.toString()),
        compareAtPrice: product.compareAtPrice ? parseFloat(product.compareAtPrice.toString()) : undefined,
        image: product.thumbnail || (product.images?.[0] as string) || '/images/product-placeholder.webp',
        thumbnail: product.thumbnail,
        images: product.images || [],
        category: product.category ? localizeCategory(product.category, locale).name : undefined,
        stock: product.stock,
        minOrder: product.minOrderQty,
        minOrderQty: product.minOrderQty,
        wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice.toString()) : undefined,
        colors: extractColors(attributes, locale),
      }
    })

    const currentUser = await getAuthUser(request)
    const canViewWholesale = isApprovedWholesaleUser(currentUser)
    const isAdmin = currentUser?.role === 'ADMIN'

    const safeProducts = transformedProducts.map((p) =>
      sanitizeProductForClient(p, canViewWholesale, isAdmin)
    )

    return NextResponse.json({
      success: true,
      data: safeProducts,
      pagination: {
        page,
        limit,
        total: totalCatalogCount,
        hasMore: totalCatalogCount > 0 && relatedProducts.length > 0,
      },
    })
  } catch (error) {
    console.error('Error fetching related products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch related products' },
      { status: 500 }
    )
  }
}

// Helper function to extract color options from product attributes
const colorLabelByLocale: Record<string, string> = {
  en: 'Color {n}',
  ru: 'Цвет {n}',
  zh: '颜色 {n}',
}
function extractColors(attributes: any, locale = 'en'): { label: string; value: string }[] | undefined {
  if (!attributes) return undefined

  // Check for common color attribute keys
  const colorKeys = ['colors', 'color', 'colour', 'colours']
  const tmpl = colorLabelByLocale[locale] || colorLabelByLocale.en
  
  for (const key of colorKeys) {
    const value = attributes[key]
    if (Array.isArray(value) && value.length > 0) {
      // Check if values are hex colors
      if (typeof value[0] === 'string' && value[0].startsWith('#')) {
        return value.map((hex: string, idx: number) => ({
          label: tmpl.replace('{n}', String(idx + 1)),
          value: hex,
        }))
      }
    }
  }

  return undefined
}
