import { prisma } from '@/lib/db'
import {
  PendingCategoryItem,
  PendingAttributeItem,
  PendingTranslationItem,
  AdminChatLocale,
} from './types'
import { logAiAction } from './audit'
import { getApiKeys } from '@/lib/api-keys'

/**
 * Generate a clean, URL-safe slug from a string with fallback suffix.
 */
export function slugify(text: string): string {
  const base = text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')

  return base || `item-${Date.now().toString(36)}`
}

/**
 * 1. getMissingCategories
 * Analyzes current categories and suggests missing taxonomies based on
 * the queried domain (e.g. tools, clothing, electronics, auto parts)
 * or general catalog gaps.
 */
export async function getMissingCategories(query?: string) {
  const existingCategories = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      level: true,
      parentId: true,
      parent: { select: { id: true, name: true } },
      children: { select: { id: true, name: true, slug: true } },
      _count: { select: { products: true, children: true } },
    },
    orderBy: [{ level: 'asc' }, { name: 'asc' }],
  })

  // Known standard e-commerce taxonomies for intelligent gap detection
  const standardTaxonomies: Record<string, { parent: string; children: string[] }> = {
    tools: {
      parent: 'Tools & Hardware',
      children: [
        'Power Tools',
        'Hand Tools',
        'Measuring & Layout Tools',
        'Tool Storage & Organization',
        'Safety Equipment & PPE',
        'Welding & Soldering',
        'Fasteners & Hardware',
      ],
    },
    autoparts: {
      parent: 'Automotive & Auto Parts',
      children: [
        'Brake Systems',
        'Engine & Transmission',
        'Car Electronics & GPS',
        'Auto Lighting & Bulbs',
        'Tires & Wheels Accessories',
        'Interior Accessories',
        'Exterior & Body Parts',
        'Diagnostic Tools & Scanners',
      ],
    },
    clothing: {
      parent: 'Apparel & Clothing',
      children: [
        "Men's Clothing",
        "Women's Clothing",
        "Children's Clothing",
        'Footwear & Shoes',
        'Workwear & Uniforms',
        'Sportswear & Outdoor',
        'Underwear & Loungewear',
      ],
    },
    electronics: {
      parent: 'Consumer Electronics',
      children: [
        'Mobile Phones & Tablets',
        'Mobile Accessories',
        'Chargers & Cables',
        'Audio & Headphones',
        'Smart Watches & Wearables',
        'Computer Peripherals',
        'Batteries & Power Banks',
      ],
    },
    home: {
      parent: 'Home & Kitchen',
      children: [
        'Kitchenware & Cookware',
        'Small Kitchen Appliances',
        'Home Storage & Organization',
        'Lighting & Ceiling Fans',
        'Bathroom Accessories',
        'Home Décor',
        'Cleaning Supplies',
      ],
    },
  }

  const existingNamesLower = new Set(existingCategories.map((c) => c.name.toLowerCase()))

  // Detect which domain matches the query, or evaluate all
  const q = (query || '').toLowerCase().trim()
  const matchedTaxonomies: Array<{
    domain: string
    suggestedParent: string
    missingChildren: string[]
  }> = []

  for (const [key, taxonomy] of Object.entries(standardTaxonomies)) {
    if (!q || q.includes(key) || taxonomy.parent.toLowerCase().includes(q) || taxonomy.children.some((c) => c.toLowerCase().includes(q))) {
      const missingChildren = taxonomy.children.filter(
        (child) => !existingNamesLower.has(child.toLowerCase())
      )

      matchedTaxonomies.push({
        domain: key,
        suggestedParent: taxonomy.parent,
        missingChildren,
      })
    }
  }

  // Count products with no category
  const uncategorizedProductsCount = await prisma.product.count({
    where: { categoryId: null },
  })

  return {
    totalExistingCategories: existingCategories.length,
    uncategorizedProductsCount,
    existingCategoriesSample: existingCategories.slice(0, 30).map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      level: c.level,
      parentName: c.parent?.name || null,
      childrenCount: c._count.children,
      productsCount: c._count.products,
    })),
    suggestions: matchedTaxonomies,
  }
}

/**
 * 2. createCategories
 * STRICT WRITE OPERATION: Only executed after explicit admin confirmation.
 * Runs in a Prisma transaction.
 */
export async function createCategories(
  items: PendingCategoryItem[],
  adminId: string,
  locale: AdminChatLocale = 'en'
) {
  if (!items || items.length === 0) {
    throw new Error('No categories provided to create.')
  }

  const results: Array<{ id: string; name: string; slug: string; level: number; parentId: string | null }> = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      let finalSlug = item.slug ? slugify(item.slug) : slugify(item.name)

      // Ensure slug uniqueness
      let slugCandidate = finalSlug
      let counter = 1
      while (await tx.category.findUnique({ where: { slug: slugCandidate } })) {
        slugCandidate = `${finalSlug}-${counter}`
        counter++
      }
      finalSlug = slugCandidate

      // Resolve parentId if parentName was provided
      let parentId = item.parentId || null
      let level = item.level || 1

      if (!parentId && item.parentName) {
        const parentCat = await tx.category.findFirst({
          where: { name: { equals: item.parentName, mode: 'insensitive' } },
        })
        if (parentCat) {
          parentId = parentCat.id
          level = parentCat.level + 1
        }
      } else if (parentId) {
        const parentCat = await tx.category.findUnique({ where: { id: parentId } })
        if (parentCat) {
          level = parentCat.level + 1
        }
      }

      // Create Category
      const created = await tx.category.create({
        data: {
          name: item.name.trim(),
          slug: finalSlug,
          description: item.description?.trim() || null,
          parentId,
          level,
          isActive: true,
          showInMenu: true,
        },
      })

      // Create translations for ru, zh, and en
      const translationsToCreate: Array<{ locale: string; name: string; description: string | null }> = []

      // Add English translation
      translationsToCreate.push({
        locale: 'en',
        name: item.translations?.en?.name?.trim() || item.name.trim(),
        description: item.translations?.en?.description?.trim() || item.description?.trim() || null,
      })

      // Add Russian translation if present
      if (item.translations?.ru?.name?.trim()) {
        translationsToCreate.push({
          locale: 'ru',
          name: item.translations.ru.name.trim(),
          description: item.translations.ru.description?.trim() || null,
        })
      }

      // Add Chinese translation if present
      if (item.translations?.zh?.name?.trim()) {
        translationsToCreate.push({
          locale: 'zh',
          name: item.translations.zh.name.trim(),
          description: item.translations.zh.description?.trim() || null,
        })
      }

      for (const t of translationsToCreate) {
        await tx.categoryTranslation.upsert({
          where: {
            categoryId_locale: {
              categoryId: created.id,
              locale: t.locale,
            },
          },
          update: {
            name: t.name,
            description: t.description,
          },
          create: {
            categoryId: created.id,
            locale: t.locale,
            name: t.name,
            description: t.description,
          },
        })
      }

      results.push({
        id: created.id,
        name: created.name,
        slug: created.slug,
        level: created.level,
        parentId: created.parentId,
      })
    }
  })

  // Log to audit log
  await logAiAction({
    adminId,
    actionType: 'createCategories',
    summary: `Created ${results.length} categories with translations`,
    payload: items,
    result: results,
    status: 'SUCCESS',
  })

  return {
    success: true,
    createdCount: results.length,
    categories: results,
  }
}

/**
 * 3. getExistingAttributes
 * Lists existing attributes, their types, and bindings.
 */
export async function getExistingAttributes(categoryId?: string) {
  const where: any = {}
  if (categoryId) {
    where.categories = {
      some: { categoryId },
    }
  }

  const attributes = await prisma.attribute.findMany({
    where,
    include: {
      translations: {
        select: { locale: true, name: true, placeholder: true, helperText: true },
      },
      categories: {
        include: {
          category: { select: { id: true, name: true, slug: true } },
        },
      },
      _count: { select: { values: true } },
    },
    orderBy: { displayOrder: 'asc' },
  })

  return {
    totalAttributes: attributes.length,
    attributes: attributes.map((a) => ({
      id: a.id,
      name: a.name,
      slug: a.slug,
      type: a.type,
      options: a.options,
      colorOptions: a.colorOptions,
      placeholder: a.placeholder,
      helperText: a.helperText,
      isRequired: a.isRequired,
      isFilterable: a.isFilterable,
      isVariant: a.isVariant,
      valuesCount: a._count.values,
      categories: a.categories.map((c) => ({
        id: c.category.id,
        name: c.category.name,
      })),
      translations: a.translations,
    })),
  }
}

/**
 * 4. createAttributes
 * STRICT WRITE OPERATION: Only executed after explicit admin confirmation.
 * Runs in a Prisma transaction.
 */
export async function createAttributes(
  items: PendingAttributeItem[],
  adminId: string,
  locale: AdminChatLocale = 'en'
) {
  if (!items || items.length === 0) {
    throw new Error('No attributes provided to create.')
  }

  const results: Array<{ id: string; name: string; slug: string; type: string }> = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      let finalSlug = item.slug ? slugify(item.slug) : slugify(item.name)

      let slugCandidate = finalSlug
      let counter = 1
      while (await tx.attribute.findUnique({ where: { slug: slugCandidate } })) {
        slugCandidate = `${finalSlug}-${counter}`
        counter++
      }
      finalSlug = slugCandidate

      const created = await tx.attribute.create({
        data: {
          name: item.name.trim(),
          slug: finalSlug,
          type: item.type || 'TEXT',
          options: item.options && item.options.length > 0 ? item.options : undefined,
          placeholder: item.placeholder?.trim() || null,
          helperText: item.helperText?.trim() || null,
          isRequired: Boolean(item.isRequired),
          isFilterable: item.isFilterable !== false,
          isVariant: Boolean(item.isVariant),
          isActive: true,
        },
      })

      // Create translations in en, ru, zh
      const translationsToCreate: Array<{
        locale: string
        name: string
        placeholder: string | null
        helperText: string | null
      }> = []

      translationsToCreate.push({
        locale: 'en',
        name: item.translations?.en?.name?.trim() || item.name.trim(),
        placeholder: item.translations?.en?.placeholder?.trim() || item.placeholder?.trim() || null,
        helperText: item.translations?.en?.helperText?.trim() || item.helperText?.trim() || null,
      })

      if (item.translations?.ru?.name?.trim()) {
        translationsToCreate.push({
          locale: 'ru',
          name: item.translations.ru.name.trim(),
          placeholder: item.translations.ru.placeholder?.trim() || null,
          helperText: item.translations.ru.helperText?.trim() || null,
        })
      }

      if (item.translations?.zh?.name?.trim()) {
        translationsToCreate.push({
          locale: 'zh',
          name: item.translations.zh.name.trim(),
          placeholder: item.translations.zh.placeholder?.trim() || null,
          helperText: item.translations.zh.helperText?.trim() || null,
        })
      }

      for (const t of translationsToCreate) {
        await tx.attributeTranslation.upsert({
          where: {
            attributeId_locale: {
              attributeId: created.id,
              locale: t.locale,
            },
          },
          update: {
            name: t.name,
            placeholder: t.placeholder,
            helperText: t.helperText,
          },
          create: {
            attributeId: created.id,
            locale: t.locale,
            name: t.name,
            placeholder: t.placeholder,
            helperText: t.helperText,
          },
        })
      }

      // Bind to categories if specified
      if (item.categoryIds && item.categoryIds.length > 0) {
        for (const catId of item.categoryIds) {
          await tx.categoryAttribute.upsert({
            where: {
              categoryId_attributeId: {
                categoryId: catId,
                attributeId: created.id,
              },
            },
            update: {},
            create: {
              categoryId: catId,
              attributeId: created.id,
            },
          })
        }
      }

      results.push({
        id: created.id,
        name: created.name,
        slug: created.slug,
        type: created.type,
      })
    }
  })

  // Log to audit
  await logAiAction({
    adminId,
    actionType: 'createAttributes',
    summary: `Created ${results.length} attributes with translations and category associations`,
    payload: items,
    result: results,
    status: 'SUCCESS',
  })

  return {
    success: true,
    createdCount: results.length,
    attributes: results,
  }
}

/**
 * 5. getUntranslatedContent
 * Finds products, categories, or attributes missing Russian or Chinese translations.
 */
export async function getUntranslatedContent(
  type: 'products' | 'categories' | 'attributes' = 'products',
  limit: number = 20
) {
  if (type === 'products') {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        translations: { select: { locale: true } },
      },
      take: 200,
    })

    const untranslated = products
      .map((p) => {
        const locales = new Set(p.translations.map((t) => t.locale))
        const missingLocales: ('ru' | 'zh')[] = []
        if (!locales.has('ru')) missingLocales.push('ru')
        if (!locales.has('zh')) missingLocales.push('zh')
        return {
          id: p.id,
          name: p.name,
          sku: p.sku,
          missingLocales,
        }
      })
      .filter((p) => p.missingLocales.length > 0)

    return {
      type: 'products',
      totalUntranslated: untranslated.length,
      sampleItems: untranslated.slice(0, limit),
    }
  }

  if (type === 'categories') {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        translations: { select: { locale: true } },
      },
      take: 200,
    })

    const untranslated = categories
      .map((c) => {
        const locales = new Set(c.translations.map((t) => t.locale))
        const missingLocales: ('ru' | 'zh')[] = []
        if (!locales.has('ru')) missingLocales.push('ru')
        if (!locales.has('zh')) missingLocales.push('zh')
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          missingLocales,
        }
      })
      .filter((c) => c.missingLocales.length > 0)

    return {
      type: 'categories',
      totalUntranslated: untranslated.length,
      sampleItems: untranslated.slice(0, limit),
    }
  }

  // Attributes
  const attributes = await prisma.attribute.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      slug: true,
      translations: { select: { locale: true } },
    },
    take: 200,
  })

  const untranslated = attributes
    .map((a) => {
      const locales = new Set(a.translations.map((t) => t.locale))
      const missingLocales: ('ru' | 'zh')[] = []
      if (!locales.has('ru')) missingLocales.push('ru')
      if (!locales.has('zh')) missingLocales.push('zh')
      return {
        id: a.id,
        name: a.name,
        slug: a.slug,
        missingLocales,
      }
    })
    .filter((a) => a.missingLocales.length > 0)

  return {
    type: 'attributes',
    totalUntranslated: untranslated.length,
    sampleItems: untranslated.slice(0, limit),
  }
}

/**
 * Helper to call existing AI gateway for translation
 */
async function translateWithAiGateway(
  fields: Record<string, string>,
  targetLocales: ('ru' | 'zh')[]
): Promise<Record<string, Record<string, string>>> {
  const apiKeys = await getApiKeys()
  const apiKey = apiKeys.openaiApiKey
  const baseUrl = (apiKeys.openaiBaseUrl || 'https://llm.gcat.ir/v1').trim().replace(/\/+$/, '')
  const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
  const model = apiKeys.openaiModel || 'auto/best-chat'

  if (!apiKey) {
    throw new Error('AI API Key is not configured. Please add an API Key in System Settings.')
  }

  const prompt =
    `You are an expert e-commerce translator. Translate the following key-value pairs into target locales: [${targetLocales.join(', ')}].\n` +
    `Return strictly valid minified JSON object mapping each locale to its key-value translations.\n` +
    `Example format: {"ru": {"name": "..."}, "zh": {"name": "..."}}\n` +
    `Data: ${JSON.stringify(fields)}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
    }),
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`AI Gateway error (${res.status}): ${errText.slice(0, 200)}`)
  }

  const json = await res.json()
  const rawText: string = json?.choices?.[0]?.message?.content ?? ''
  
  // Parse json from response
  try {
    const cleaned = rawText.replace(/```(?:json)?\s*([\s\S]*?)```/i, '$1').trim()
    return JSON.parse(cleaned)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (match) {
      return JSON.parse(match[0])
    }
    throw new Error('Could not parse JSON response from AI Gateway')
  }
}

/**
 * 6. bulkTranslate
 * STRICT WRITE OPERATION: Translates untranslated products, categories,
 * or attributes into Russian and Chinese using the existing AI Gateway.
 */
export async function bulkTranslate(
  type: 'products' | 'categories' | 'attributes',
  itemIds: string[],
  targetLocales: ('ru' | 'zh')[] = ['ru', 'zh'],
  adminId: string
) {
  if (!itemIds || itemIds.length === 0) {
    throw new Error('No items selected for translation.')
  }

  const translatedCount = { success: 0, failed: 0 }
  const details: any[] = []

  if (type === 'products') {
    const products = await prisma.product.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, description: true },
    })

    for (const product of products) {
      try {
        const fieldsToTranslate: Record<string, string> = { name: product.name }
        if (product.description) {
          fieldsToTranslate.description = product.description.slice(0, 1000)
        }

        const translations = await translateWithAiGateway(fieldsToTranslate, targetLocales)

        for (const loc of targetLocales) {
          const locData = translations[loc]
          if (locData && locData.name) {
            await prisma.productTranslation.upsert({
              where: {
                productId_locale: {
                  productId: product.id,
                  locale: loc,
                },
              },
              update: {
                name: locData.name,
                description: locData.description || null,
              },
              create: {
                productId: product.id,
                locale: loc,
                name: locData.name,
                description: locData.description || null,
              },
            })
          }
        }
        translatedCount.success++
        details.push({ id: product.id, name: product.name, status: 'TRANSLATED' })
      } catch (err: any) {
        console.error(`Failed to translate product ${product.id}:`, err)
        translatedCount.failed++
        details.push({ id: product.id, name: product.name, error: err.message })
      }
    }
  } else if (type === 'categories') {
    const categories = await prisma.category.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, description: true },
    })

    for (const cat of categories) {
      try {
        const fieldsToTranslate: Record<string, string> = { name: cat.name }
        if (cat.description) fieldsToTranslate.description = cat.description.slice(0, 500)

        const translations = await translateWithAiGateway(fieldsToTranslate, targetLocales)

        for (const loc of targetLocales) {
          const locData = translations[loc]
          if (locData && locData.name) {
            await prisma.categoryTranslation.upsert({
              where: {
                categoryId_locale: {
                  categoryId: cat.id,
                  locale: loc,
                },
              },
              update: {
                name: locData.name,
                description: locData.description || null,
              },
              create: {
                categoryId: cat.id,
                locale: loc,
                name: locData.name,
                description: locData.description || null,
              },
            })
          }
        }
        translatedCount.success++
        details.push({ id: cat.id, name: cat.name, status: 'TRANSLATED' })
      } catch (err: any) {
        translatedCount.failed++
        details.push({ id: cat.id, name: cat.name, error: err.message })
      }
    }
  } else if (type === 'attributes') {
    const attributes = await prisma.attribute.findMany({
      where: { id: { in: itemIds } },
      select: { id: true, name: true, placeholder: true, helperText: true },
    })

    for (const attr of attributes) {
      try {
        const fieldsToTranslate: Record<string, string> = { name: attr.name }
        if (attr.placeholder) fieldsToTranslate.placeholder = attr.placeholder
        if (attr.helperText) fieldsToTranslate.helperText = attr.helperText

        const translations = await translateWithAiGateway(fieldsToTranslate, targetLocales)

        for (const loc of targetLocales) {
          const locData = translations[loc]
          if (locData && locData.name) {
            await prisma.attributeTranslation.upsert({
              where: {
                attributeId_locale: {
                  attributeId: attr.id,
                  locale: loc,
                },
              },
              update: {
                name: locData.name,
                placeholder: locData.placeholder || null,
                helperText: locData.helperText || null,
              },
              create: {
                attributeId: attr.id,
                locale: loc,
                name: locData.name,
                placeholder: locData.placeholder || null,
                helperText: locData.helperText || null,
              },
            })
          }
        }
        translatedCount.success++
        details.push({ id: attr.id, name: attr.name, status: 'TRANSLATED' })
      } catch (err: any) {
        translatedCount.failed++
        details.push({ id: attr.id, name: attr.name, error: err.message })
      }
    }
  }

  // Log to audit
  await logAiAction({
    adminId,
    actionType: 'bulkTranslate',
    summary: `Bulk translated ${translatedCount.success} ${type} into ${targetLocales.join(', ')}`,
    payload: { type, itemIds, targetLocales },
    result: { translatedCount, details },
    status: translatedCount.success > 0 ? 'SUCCESS' : 'FAILED',
  })

  return {
    success: true,
    translatedCount,
    details,
  }
}

/**
 * 7. getCategoryTree
 * Returns full or filtered category hierarchy tree.
 */
export async function getCategoryTree(parentId?: string | null) {
  const rootCategories = await prisma.category.findMany({
    where: parentId !== undefined ? { parentId } : { parentId: null },
    include: {
      translations: { select: { locale: true, name: true } },
      children: {
        include: {
          translations: { select: { locale: true, name: true } },
          children: {
            include: {
              translations: { select: { locale: true, name: true } },
              _count: { select: { products: true } },
            },
          },
          _count: { select: { products: true } },
        },
      },
      _count: { select: { products: true } },
    },
    orderBy: { displayOrder: 'asc' },
  })

  return {
    categoriesCount: rootCategories.length,
    tree: rootCategories,
  }
}

/**
 * 8. searchProducts & getProductStats
 */
export async function searchProducts(query: string, limit: number = 10) {
  const products = await prisma.product.findMany({
    where: {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { sku: { contains: query, mode: 'insensitive' } },
        { category: { name: { contains: query, mode: 'insensitive' } } },
      ],
    },
    include: {
      category: { select: { id: true, name: true } },
      translations: { select: { locale: true, name: true } },
    },
    take: limit,
  })

  return {
    count: products.length,
    products: products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      price: p.price,
      wholesalePrice: p.wholesalePrice,
      stock: p.stock,
      categoryName: p.category?.name || 'Uncategorized',
      translationsCount: p.translations.length,
    })),
  }
}

export async function getProductStats() {
  const [total, active, withCategory, withoutCategory, lowStock] = await Promise.all([
    prisma.product.count(),
    prisma.product.count({ where: { isActive: true } }),
    prisma.product.count({ where: { categoryId: { not: null } } }),
    prisma.product.count({ where: { categoryId: null } }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
  ])

  return {
    totalProducts: total,
    activeProducts: active,
    categorizedProducts: withCategory,
    uncategorizedProducts: withoutCategory,
    lowStockProducts: lowStock,
  }
}
