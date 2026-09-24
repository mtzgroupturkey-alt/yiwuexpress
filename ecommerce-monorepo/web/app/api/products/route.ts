export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getLocalField, localizeEntity } from '@/lib/utils/localize'
import { requireRole, createAuthErrorResponse, getAuthUser, isApprovedWholesaleUser } from '@/lib/auth'
import { sanitizeProductForClient } from '@/lib/utils/productSanitizer'

interface FilterMetadata {
  id: string
  name: string
  type: 'checkbox' | 'range' | 'color' | 'select'
  attributeSlug?: string
  options?: { label: string; value: string; count?: number }[]
  min?: number
  max?: number
}

// Resolve a category slug to the set of category IDs covering it and all of
// its descendants (up to 4 levels deep, matching the seeded taxonomy). Returns
// an empty array when the slug matches no category. Hoisted so the GET handler
// computes descendants exactly once and reuses them for both the product query
// and the filter-metadata aggregation.
async function getCategoryDescendantIds(categorySlug: string): Promise<string[]> {
  const category = await prisma.category.findUnique({
    where: { slug: categorySlug },
    include: {
      children: {
        include: {
          children: {
            include: {
              children: true
            }
          }
        }
      }
    }
  })

  if (!category) return []

  const categoryIds = [category.id]
  const collectChildIds = (cat: any) => {
    if (cat.children && cat.children.length > 0) {
      cat.children.forEach((child: any) => {
        categoryIds.push(child.id)
        collectChildIds(child)
      })
    }
  }
  collectChildIds(category)
  return categoryIds
}

async function fetchFilterMetadata(categoryIds: string[] | null, locale: string): Promise<FilterMetadata[]> {
  try {
    const filterMetadata: FilterMetadata[] = []

    const productFilter: any = {
      isActive: true,
      ...(categoryIds && categoryIds.length > 0 ? { categoryId: { in: categoryIds } } : {})
    }

    // 1. Availability filter (with live product counts)
    const inStockCount = await prisma.product.count({
      where: { ...productFilter, stock: { gt: 0 } }
    })
    const outOfStockCount = await prisma.product.count({
      where: { ...productFilter, stock: { lte: 0 } }
    })

    const availabilityOptions = [
      { label: locale === 'ru' ? 'В наличии' : locale === 'zh' ? '有货' : 'In Stock', value: 'in-stock', count: inStockCount },
    ]
    if (outOfStockCount > 0) {
      availabilityOptions.push({
        label: locale === 'ru' ? 'Нет в наличии' : locale === 'zh' ? '缺货' : 'Out of Stock',
        value: 'out-of-stock',
        count: outOfStockCount
      })
    }

    filterMetadata.push({
      id: 'availability',
      name: locale === 'ru' ? 'Наличие' : locale === 'zh' ? '库存状态' : 'Availability',
      type: 'checkbox',
      options: availabilityOptions
    })

    // 2. Dynamic Price Range (from active products in DB)
    const priceAgg = await prisma.product.aggregate({
      where: productFilter,
      _min: { price: true },
      _max: { price: true }
    })
    const minPrice = Math.floor(priceAgg._min.price ?? 0)
    const maxPrice = Math.ceil(priceAgg._max.price ?? 100)

    filterMetadata.push({
      id: 'price',
      name: locale === 'ru' ? 'Цена' : locale === 'zh' ? '价格' : 'Price',
      type: 'range',
      min: minPrice,
      max: Math.max(maxPrice, minPrice + 10),
    })

    // 3. Category Filter (when viewing all products, show top active categories)
    if (!categoryIds || categoryIds.length === 0) {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        include: {
          translations: {
            where: { locale: { in: [locale, 'en'] } },
            select: { locale: true, name: true }
          },
          _count: {
            select: { products: true }
          }
        },
        orderBy: { name: 'asc' }
      })

      const catOptions = categories
        .filter(c => c._count.products > 0)
        .map(c => ({
          label: getLocalField(c.translations, locale, 'name', c.name),
          value: c.slug,
          count: c._count.products
        }))

      if (catOptions.length > 0) {
        filterMetadata.push({
          id: 'category',
          name: locale === 'ru' ? 'Категории' : locale === 'zh' ? '商品分类' : 'Category',
          type: 'checkbox',
          options: catOptions
        })
      }
    }

    // 4. Dynamic Attributes from CategoryAttributes / AttributeValues
    const categoryCondition: any = categoryIds && categoryIds.length > 0
      ? { categoryId: { in: categoryIds }, isVisible: true }
      : { isVisible: true }

    const categoryAttributes = await prisma.categoryAttribute.findMany({
      where: categoryCondition,
      include: {
        attribute: {
          include: {
            translations: {
              where: { locale: { in: [locale, 'en'] } },
              select: { locale: true, name: true }
            }
          }
        }
      },
      orderBy: { displayOrder: 'asc' }
    })

    const seenAttrIds = new Set<string>()
    const filterableAttributes = categoryAttributes
      .filter(ca => ca.attribute && ca.attribute.isFilterable)
      .filter(ca => {
        if (seenAttrIds.has(ca.attribute.id)) return false
        seenAttrIds.add(ca.attribute.id)
        return true
      })

    const attributeIds = filterableAttributes.map(ca => ca.attribute.id)

    const attributeValues = attributeIds.length > 0
      ? await prisma.attributeValue.findMany({
          where: {
            attributeId: { in: attributeIds },
            product: productFilter
          },
          select: {
            attributeId: true,
            value: true
          }
        })
      : []

    const countsByAttribute = new Map<string, Map<string, number>>()
    for (const av of attributeValues) {
      if (!countsByAttribute.has(av.attributeId)) {
        countsByAttribute.set(av.attributeId, new Map())
      }
      const valMap = countsByAttribute.get(av.attributeId)!
      valMap.set(av.value, (valMap.get(av.value) || 0) + 1)
    }

    for (const ca of filterableAttributes) {
      const attr = ca.attribute
      const attrName = getLocalField(attr.translations, locale, 'name', attr.name)
      const valMap = countsByAttribute.get(attr.id)
      if (!valMap || valMap.size === 0) continue

      const options = Array.from(valMap.entries()).map(([value, count]) => ({
        label: value,
        value,
        count
      }))

      let type: FilterMetadata['type'] = 'checkbox'
      if (attr.type === 'NUMBER') type = 'range'
      if (attr.type === 'COLOR' || attr.type === 'COLOR_MULTI') type = 'color'
      if (attr.type === 'SELECT' || attr.type === 'MULTISELECT') type = 'select'

      const numericValues = options.map(o => parseFloat(o.value)).filter(n => !isNaN(n))

      filterMetadata.push({
        id: attr.slug,
        name: attrName,
        type,
        attributeSlug: attr.slug,
        options,
        min: type === 'range' && numericValues.length > 0 ? Math.min(...numericValues) : undefined,
        max: type === 'range' && numericValues.length > 0 ? Math.max(...numericValues) : undefined,
      })
    }

    return filterMetadata
  } catch (err) {
    console.error('Error fetching filter metadata:', err)
    return []
  }
}

// GET /api/products - Get all products with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categorySlug = searchParams.get('category')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const newArrivals = searchParams.get('new')
    const colors = searchParams.getAll('color') // Get color filters
    const limitParam = searchParams.get('limit')
    const isAll = limitParam === 'all' || limitParam === 'unlimited' || limitParam === '0' || limitParam === '-1'
    const page = parseInt(searchParams.get('page') || '1')
    const parsedLimit = limitParam ? parseInt(limitParam) : 20
    const limit = isAll ? 0 : (isNaN(parsedLimit) || parsedLimit <= 0 ? 20 : parsedLimit)
    const skip = isAll ? undefined : (page - 1) * limit
    const take = isAll ? undefined : limit
    const locale = searchParams.get('locale') || 'en'
    const sort = searchParams.get('sort') || 'relevance'

    // Build where clause
    const where: any = {
      isActive: true
    }

    const idsParam = searchParams.get('ids')
    if (idsParam) {
      const idList = idsParam.split(',').map((id) => id.trim()).filter(Boolean)
      if (idList.length > 0) {
        where.id = { in: idList }
      }
    }

    // Resolve the selected category (and all descendants) once; reused for both
    // the product query filter and the filter-metadata aggregation below.
    let categoryIds: string[] = []
    if (categorySlug) {
      categoryIds = await getCategoryDescendantIds(categorySlug)
      if (categoryIds.length > 0) {
        // Filter by category and all its descendants
        where.categoryId = { in: categoryIds }
      }
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } }
      ]
    }

    // Attribute filters are AND-combined: each pushes its own condition so a
    // later filter never clobbers an earlier one (color + size + range all
    // apply together). Prisma ANDs the entries of `where.AND`.
    const andConditions: any[] = []

    // Color filter (legacy)
    if (colors && colors.length > 0) {
      andConditions.push({
        attributeValues: {
          some: {
            attribute: {
              type: { in: ['COLOR', 'COLOR_MULTI'] }
            },
            OR: colors.map(color => ({
              value: { contains: color }
            }))
          }
        }
      })
    }

    // Dynamic attribute filters from query params
    // Format: attr[attributeSlug]=value1,value2 or attr[attributeSlug][min]=10&attr[attributeSlug][max]=50
    const dynamicFilters: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      if (!key.startsWith('attr[')) return

      const rangeMatch = key.match(/^attr\[(.*?)\]\[(min|max)\]$/)
      if (rangeMatch) {
        const attrSlug = rangeMatch[1]
        const rangeType = rangeMatch[2]
        if (!dynamicFilters[attrSlug]) dynamicFilters[attrSlug] = {}
        dynamicFilters[attrSlug][rangeType] = parseFloat(value)
        return
      }

      const match = key.match(/^attr\[(.*?)\]$/)
      if (match) {
        const attrSlug = match[1]
        dynamicFilters[attrSlug] = value.split(',')
      }
    })

    // Apply dynamic filters
    for (const [attrSlug, value] of Object.entries(dynamicFilters)) {
      if (!value) continue

      // Handle direct product price range filter (supports array [min, max], object {min, max}, string "min,max")
      if (attrSlug === 'price') {
        let minVal: number | undefined
        let maxVal: number | undefined
        if (Array.isArray(value)) {
          if (value.length >= 2) {
            minVal = parseFloat(value[0])
            maxVal = parseFloat(value[1])
          } else if (value.length === 1) {
            maxVal = parseFloat(value[0])
          }
        } else if (typeof value === 'object' && value !== null) {
          minVal = (value as any).min !== undefined ? parseFloat((value as any).min) : undefined
          maxVal = (value as any).max !== undefined ? parseFloat((value as any).max) : undefined
        } else if (typeof value === 'string') {
          const parts = (value as string).split(',')
          if (parts.length >= 2) {
            minVal = parseFloat(parts[0])
            maxVal = parseFloat(parts[1])
          } else {
            maxVal = parseFloat(value)
          }
        }

        const priceCondition: any = {}
        if (minVal !== undefined && !isNaN(minVal)) priceCondition.gte = minVal
        if (maxVal !== undefined && !isNaN(maxVal)) priceCondition.lte = maxVal
        if (Object.keys(priceCondition).length > 0) {
          where.price = priceCondition
        }
        continue
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        // Range filter: { min, max }.
        const hasMin = value.min !== undefined && !isNaN(value.min)
        const hasMax = value.max !== undefined && !isNaN(value.max)
        if (!hasMin && !hasMax) continue

        const rows = await prisma.attributeValue.findMany({
          where: { attribute: { slug: attrSlug } },
          select: { productId: true, value: true }
        })
        const matchingIds = rows
          .filter(row => {
            const n = parseFloat(row.value)
            if (isNaN(n)) return false
            if (hasMin && n < value.min) return false
            if (hasMax && n > value.max) return false
            return true
          })
          .map(row => row.productId)

        // Empty matchingIds intentionally yields zero products for this range.
        andConditions.push({ id: { in: matchingIds } })
      } else if (Array.isArray(value)) {
        // Handle availability filter
        if (attrSlug === 'availability') {
          if (value.includes('in-stock') && !value.includes('out-of-stock')) {
            where.stock = { gt: 0 }
          } else if (value.includes('out-of-stock') && !value.includes('in-stock')) {
            where.stock = { lte: 0 }
          }
          continue
        }

        // Handle category filter
        if (attrSlug === 'category') {
          const catRows = await prisma.category.findMany({
            where: { slug: { in: value } },
            select: { id: true }
          })
          if (catRows.length > 0) {
            where.categoryId = { in: catRows.map(c => c.id) }
          }
          continue
        }

        // Multi-value checkbox/select filter
        andConditions.push({
          attributeValues: {
            some: {
              attribute: { slug: attrSlug },
              value: { in: value }
            }
          }
        })
      }
    }

    if (andConditions.length > 0) {
      where.AND = andConditions
    }

    if (featured === 'true') {
      where.isFeatured = true
    }

    if (newArrivals === 'true') {
      where.isNewArrival = true
    }

    // Determine ordering based on sort query param
    let orderBy: any = []
    
    switch (sort) {
      case 'price-asc':
        orderBy = [{ price: 'asc' }]
        break
      case 'price-desc':
        orderBy = [{ price: 'desc' }]
        break
      case 'newest':
        orderBy = [{ createdAt: 'desc' }]
        break
      case 'popularity':
        orderBy = [{ reviewCount: 'desc' }, { rating: 'desc' }]
        break
      case 'name-asc':
        orderBy = [{ name: 'asc' }]
        break
      case 'name-desc':
        orderBy = [{ name: 'desc' }]
        break
      case 'relevance':
      default:
        if (featured === 'true') {
          orderBy = [{ featuredOrder: 'asc' }]
        } else if (newArrivals === 'true') {
          orderBy = [{ newArrivalOrder: 'asc' }]
        } else {
          orderBy = [
            { isFeatured: 'desc' },
            { createdAt: 'desc' }
          ]
        }
        break
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // categoryIds already resolved above (reused for both the product query and
    // the filter metadata below).

    // Fetch filter metadata (attributes for this category)
    const filterMetadata = await fetchFilterMetadata(categoryIds.length > 0 ? categoryIds : null, locale)

    // Get products
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
            parent: {
              select: {
                id: true,
                name: true,
                slug: true,
                translations: {
                  where: { locale: { in: [locale, 'en'] } },
                  select: { locale: true, name: true }
                }
              }
            },
            translations: {
              where: { locale: { in: [locale, 'en'] } },
              select: { locale: true, name: true }
            }
          }
        },
        translations: {
          where: { locale: { in: [locale, 'en'] } },
          select: { locale: true, name: true, description: true }
        }
      },
      orderBy,
      ...(skip !== undefined ? { skip } : {}),
      ...(take !== undefined ? { take } : {})
    })

    // Expand-and-Contract read-path localization: resolve each product's name,
    // description (and its category name) to the active locale with English
    // fallback, so the storefront never renders a blank text container.
    const localizedProducts = products.map((product: any) => {
      const { name, description } = localizeEntity(
        product.translations,
        locale,
        { name: product.name, description: product.description }
      )
      const category = product.category
        ? {
            ...product.category,
            name: getLocalField(
              product.category.translations,
              locale,
              'name',
              product.category.name
            ),
            parent: product.category.parent
              ? {
                  ...product.category.parent,
                  name: getLocalField(
                    product.category.parent.translations,
                    locale,
                    'name',
                    product.category.parent.name
                  )
                }
              : null
          }
        : product.category
      return {
        ...product,
        name,
        description,
        category
      }
    })

    // Check caller wholesale access permissions
    const currentUser = await getAuthUser(request)
    const canViewWholesale = isApprovedWholesaleUser(currentUser)
    const isAdmin = currentUser?.role === 'ADMIN'

    const safeProducts = localizedProducts.map((p: any) =>
      sanitizeProductForClient(p, canViewWholesale, isAdmin)
    )

    return NextResponse.json({
      success: true,
      data: safeProducts,
      pagination: {
        page: isAll ? 1 : page,
        limit: isAll ? total : limit,
        total,
        pages: isAll ? 1 : Math.ceil(total / (limit || 1))
      },
      filters: filterMetadata
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product (Admin only)
export async function POST(request: Request) {
  try {
    // Authorization: only ADMIN may create products.
    await requireRole(request, ['ADMIN'])

    const body = await request.json()

    // Validate required fields
    const requiredFields = ['sku', 'name', 'slug', 'price', 'weightKg']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Check if SKU or slug already exists
    const existing = await prisma.product.findFirst({
      where: {
        OR: [
          { sku: body.sku },
          { slug: body.slug }
        ]
      }
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: 'Product with this SKU or slug already exists' },
        { status: 400 }
      )
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

    // Expand-and-Contract dual-write: the English copy is mirrored onto the
    // legacy root columns so non-migrated read paths keep working, and every
    // supplied locale (incl. en) is persisted independently.
    const englishEntry = incomingTranslations.find((t) => t.locale === 'en')
    if (englishEntry) {
      productData.name = englishEntry.name ?? productData.name
      productData.description = englishEntry.description ?? null
      if (englishEntry.metaTitle) productData.metaTitle = englishEntry.metaTitle
      if (englishEntry.metaDescription) productData.metaDescription = englishEntry.metaDescription
    }

    // Create product + write all locale rows atomically. If any locale upsert
    // fails (e.g. a DB constraint), the whole operation rolls back so we never
    // leave a half-saved product behind.
    const created = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: productData,
        include: { category: true }
      })

      for (const t of incomingTranslations) {
        if (!t.locale) continue
        await tx.productTranslation.upsert({
          where: { productId_locale: { productId: product.id, locale: t.locale } },
          create: {
            productId: product.id,
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
        })
      }

      // If attributes are provided, fetch attribute IDs and create attribute values + translations
      if (attributes && Object.keys(attributes).length > 0) {
        const attributeSlugs = Object.keys(attributes)
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
                productId: product.id,
                value: rawStr
              }
            })

            // Localized attribute values: attributeTranslations can be:
            // 1. { [attrSlug]: { en: '...', ru: '...', zh: '...' } }
            // 2. { ru: { [attrSlug]: '...' }, zh: { [attrSlug]: '...' } }
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

      return product
    })

    // Fetch product with attribute values
    const productWithAttributes = await prisma.product.findUnique({
      where: { id: created.id },
      include: {
        category: true,
        attributeValues: {
          include: {
            attribute: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      data: productWithAttributes
    }, { status: 201 })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error creating product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
