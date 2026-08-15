export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { localizeAttribute, localizeAttributeValue, localizeCategory } from '@/lib/utils/localize'

const prisma = new PrismaClient()

// GET /api/products/[slug] - Get single product by slug
export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    const { searchParams } = new URL(request.url)
    const requestedLocale = searchParams.get('locale') || 'en'

    // Read-path localization: only fetch translations for the active locale
    // plus the English fallback, minimizing payload (Expand-and-Contract Phase 3).
    const localesToFetch = Array.from(new Set([requestedLocale, 'en']))

    const product = await prisma.product.findFirst({
      where: {
        isActive: true,
        OR: [
          { id: slug },
          { slug: slug }
        ]
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            translations: {
              where: { locale: { in: localesToFetch } },
              select: { locale: true, name: true }
            },
            parentId: true,
            attributes: {
              where: {
                isVisible: true
              },
              orderBy: {
                displayOrder: 'asc'
              },
              include: {
                attribute: {
                  include: { translations: true }
                }
              }
            },
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                translations: {
                  where: { locale: { in: localesToFetch } },
                  select: { locale: true, name: true }
                },
                attributes: {
                  where: {
                    isVisible: true
                  },
                  orderBy: {
                    displayOrder: 'asc'
                  },
                  include: {
                    attribute: {
                      include: { translations: true }
                    }
                  }
                }
              }
            }
          }
        },
        attributeValues: {
          include: {
            attribute: true,
            translations: true
          }
        },
        translations: {
          where: {
            locale: { in: localesToFetch }
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: 'Product not available' },
        { status: 404 }
      )
    }

    // Transform attributeValues array into a key-value object.
    // Keep a translation map (English value -> localized value) for localization.
    const attributes: Record<string, any> = {}
    const valueTranslationMap: Record<string, string> = {}
    if (product.attributeValues && Array.isArray(product.attributeValues)) {
      product.attributeValues.forEach((av: any) => {
        let parsed: any
        try {
          // Try to parse as JSON first (for arrays and objects)
          parsed = JSON.parse(av.value)
        } catch {
          // If not JSON, use as string
          parsed = av.value
        }
        attributes[av.attribute.slug] = parsed

        if (typeof av.value === 'string' && av.translations) {
          const tr = (av.translations as any[]).find(
            (t) => t.locale === requestedLocale && t.value && t.value.trim().length > 0
          )
          if (tr) valueTranslationMap[av.value] = tr.value
        }
      })
    }

    // Localize the values stored in the attributes object (best-effort string/array match)
    if (requestedLocale !== 'en') {
      for (const slug of Object.keys(attributes)) {
        const val = attributes[slug]
        if (typeof val === 'string' && valueTranslationMap[val]) {
          attributes[slug] = valueTranslationMap[val]
        } else if (Array.isArray(val)) {
          attributes[slug] = val.map((v) => (typeof v === 'string' && valueTranslationMap[v] ? valueTranslationMap[v] : v))
        }
      }
    }

    // Helper to flatten CategoryAttribute join-table rows into the shape the frontend expects
    const flattenCategoryAttrs = (catAttrs: any[]) =>
      catAttrs
        .filter((ca: any) => ca.attribute) // safety check
        .map((ca: any) => ({
          id: ca.attribute.id,
          slug: ca.attribute.slug,
          name: localizeAttribute(ca.attribute, requestedLocale).name,
          inputType: ca.attribute.type,   // Attribute.type is the inputType
          isRequired: ca.isRequired ?? ca.attribute.isRequired,
          isFilterable: ca.attribute.isFilterable,
          isVisible: ca.isVisible,
          displayOrder: ca.displayOrder ?? ca.attribute.displayOrder,
          options: ca.attribute.options,
        }))

    // Combine parent and current category attributes
    const parentAttributes = flattenCategoryAttrs(product.category?.parent?.attributes || [])
    const currentAttributes = flattenCategoryAttrs(product.category?.attributes || [])
    
    // Merge attributes - parent first, then current category
    // Deduplicate by slug (current category attributes override parent)
    const allAttributes = [...parentAttributes, ...currentAttributes]
    const uniqueAttributes = allAttributes.reduce((acc: any[], attr: any) => {
      // If attribute with same slug doesn't exist, add it
      // If it exists, the later one (from current category) will be kept
      const existingIndex = acc.findIndex(a => a.slug === attr.slug)
      if (existingIndex === -1) {
        acc.push(attr)
      } else {
        acc[existingIndex] = attr // Override with current category's version
      }
      return acc
    }, [])


    // Localize the product's category (and parent) names to the active locale
    // with English fallback, so the storefront never shows a base-language name.
    const rawCategory = product.category as any
    const localizedCategory = rawCategory
      ? {
          ...rawCategory,
          name: localizeCategory(rawCategory, requestedLocale).name,
          parent: rawCategory.parent
            ? {
                ...rawCategory.parent,
                name: localizeCategory(rawCategory.parent, requestedLocale).name
              }
            : rawCategory.parent
        }
      : rawCategory

    // Format the response to include categoryAttributes in the expected format
    const formattedProduct = {
      ...product,
      category: localizedCategory,
      attributes,
      categoryAttributes: uniqueAttributes
    }

    return NextResponse.json({
      success: true,
      data: formattedProduct
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}
