export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { localizeProduct, localizeCategory } from '@/lib/utils/localize'

const prisma = new PrismaClient()

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
    const limit = parseInt(searchParams.get('limit') || '4')
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

    let relatedProducts: any[] = []

    // Try to get products from the same category first
    if (currentProduct.categoryId) {
      relatedProducts = await prisma.product.findMany({
        where: {
          categoryId: currentProduct.categoryId,
          id: { not: currentProduct.id }, // Exclude current product
          isActive: true,
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: withTranslations({
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
              attribute: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              translations: {
                select: { locale: true, name: true }
              },
            },
          },
        }),
      })
    }

    // If no related products found, get random products as fallback
    if (relatedProducts.length === 0) {
      relatedProducts = await prisma.product.findMany({
        where: {
          id: { not: currentProduct.id },
          isActive: true,
        },
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: withTranslations({
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
              attribute: true
            }
          },
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              translations: {
                select: { locale: true, name: true }
              },
            },
          },
        }),
      })
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
        slug: product.slug,
        name: localized.name,
        description: localized.description,
        price: parseFloat(product.price.toString()),
        image: product.thumbnail || (product.images?.[0] as string) || '/images/placeholder.jpg',
        category: product.category ? localizeCategory(product.category, locale).name : undefined,
        stock: product.stock,
        minOrder: product.minOrderQty,
        wholesalePrice: product.wholesalePrice ? parseFloat(product.wholesalePrice.toString()) : undefined,
        colors: extractColors(attributes, locale),
      }
    })

    return NextResponse.json({
      success: true,
      data: transformedProducts,
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
