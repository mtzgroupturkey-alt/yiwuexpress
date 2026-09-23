import { prisma } from '@/lib/db'
import {
  PendingCategoryItem,
  PendingProductItem,
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
  const batchCreatedMap = new Map<string, { id: string; level: number }>()

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (!item || !item.name?.trim()) continue

      let finalSlug = item.slug ? slugify(item.slug) : slugify(item.name)

      // Ensure slug uniqueness
      let slugCandidate = finalSlug
      let counter = 1
      while (await tx.category.findUnique({ where: { slug: slugCandidate } })) {
        slugCandidate = `${finalSlug}-${counter}`
        counter++
      }
      finalSlug = slugCandidate

      // Flexible parent resolution:
      let parentId: string | null = null
      let level = item.level && item.level > 0 ? item.level : 1

      // 1. Check if parent was created in this same batch
      const parentNameTarget = (item.parentName || item.parentId || '').trim()
      if (parentNameTarget && batchCreatedMap.has(parentNameTarget.toLowerCase())) {
        const parentInfo = batchCreatedMap.get(parentNameTarget.toLowerCase())!
        parentId = parentInfo.id
        level = parentInfo.level + 1
      }

      // 2. Otherwise search in database by ID, slug, or name
      if (!parentId && item.parentId) {
        const parentCat = await tx.category.findFirst({
          where: {
            OR: [
              { id: item.parentId },
              { slug: item.parentId },
              { name: { equals: item.parentId, mode: 'insensitive' } },
            ],
          },
        })
        if (parentCat) {
          parentId = parentCat.id
          level = parentCat.level + 1
        }
      }

      // 3. Or search in database by parentName
      if (!parentId && item.parentName) {
        const parentCat = await tx.category.findFirst({
          where: {
            OR: [
              { name: { equals: item.parentName, mode: 'insensitive' } },
              { slug: slugify(item.parentName) },
            ],
          },
        })
        if (parentCat) {
          parentId = parentCat.id
          level = parentCat.level + 1
        }
      }

      const trimmedName = item.name.trim()

      // Check if category already exists by name or slug
      let existing = await tx.category.findFirst({
        where: { name: { equals: trimmedName, mode: 'insensitive' } },
      })

      if (!existing && item.slug) {
        existing = await tx.category.findUnique({
          where: { slug: slugify(item.slug) },
        })
      }

      let categoryRecord: { id: string; name: string; slug: string; level: number; parentId: string | null }

      if (existing) {
        // If it already exists, update parentId if needed and reuse without failing
        const updated = await tx.category.update({
          where: { id: existing.id },
          data: {
            description: item.description?.trim() || existing.description,
            parentId: existing.parentId || parentId,
            isActive: true,
            showInMenu: true,
          },
        })
        categoryRecord = {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          level: updated.level,
          parentId: updated.parentId,
        }
      } else {
        // Ensure slug uniqueness
        let slugCandidate = finalSlug
        let counter = 1
        while (await tx.category.findUnique({ where: { slug: slugCandidate } })) {
          slugCandidate = `${finalSlug}-${counter}`
          counter++
        }
        finalSlug = slugCandidate

        // Create Category
        const created = await tx.category.create({
          data: {
            name: trimmedName,
            slug: finalSlug,
            description: item.description?.trim() || null,
            parentId,
            level,
            isActive: true,
            showInMenu: true,
          },
        })
        categoryRecord = {
          id: created.id,
          name: created.name,
          slug: created.slug,
          level: created.level,
          parentId: created.parentId,
        }
      }

      // Register in batch map for child items in same payload
      batchCreatedMap.set(categoryRecord.name.toLowerCase(), { id: categoryRecord.id, level: categoryRecord.level })
      batchCreatedMap.set(categoryRecord.slug.toLowerCase(), { id: categoryRecord.id, level: categoryRecord.level })

      // Create translations for ru, zh, and en
      const translationsToCreate: Array<{ locale: string; name: string; description: string | null }> = []

      // Add English translation
      translationsToCreate.push({
        locale: 'en',
        name: item.translations?.en?.name?.trim() || categoryRecord.name,
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
        const safeName = (t.name || categoryRecord.name).trim()
        await tx.categoryTranslation.upsert({
          where: {
            categoryId_locale: {
              categoryId: categoryRecord.id,
              locale: t.locale,
            },
          },
          update: {
            name: safeName,
            description: t.description,
          },
          create: {
            categoryId: categoryRecord.id,
            locale: t.locale,
            name: safeName,
            description: t.description,
          },
        })
      }

      results.push(categoryRecord)
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
    // Valid Prisma AttributeType enum values
    const VALID_ATTRIBUTE_TYPES = new Set([
      'TEXT', 'TEXTAREA', 'NUMBER', 'SELECT', 'MULTISELECT',
      'COLOR', 'COLOR_MULTI', 'FILE', 'URL', 'CHECKBOX', 'DATE'
    ])

    for (const item of items) {
      if (!item || !item.name?.trim()) continue

      let finalSlug = item.slug ? slugify(item.slug) : slugify(item.name)

      let slugCandidate = finalSlug
      let counter = 1
      while (await tx.attribute.findUnique({ where: { slug: slugCandidate } })) {
        slugCandidate = `${finalSlug}-${counter}`
        counter++
      }
      finalSlug = slugCandidate

      // Normalize attribute type
      const rawType = String(item.type || 'TEXT').toUpperCase().trim()
      let safeType: any = 'TEXT'
      if (VALID_ATTRIBUTE_TYPES.has(rawType)) {
        safeType = rawType
      } else if (rawType.includes('SELECT') || rawType.includes('DROPDOWN') || rawType.includes('RADIO') || rawType.includes('OPTION')) {
        safeType = 'SELECT'
      } else if (rawType.includes('NUM') || rawType.includes('INT') || rawType.includes('FLOAT') || rawType.includes('PRICE') || rawType.includes('WEIGHT')) {
        safeType = 'NUMBER'
      } else if (rawType.includes('CHECK') || rawType.includes('BOOL') || rawType.includes('SWITCH')) {
        safeType = 'CHECKBOX'
      } else if (rawType.includes('COLOR')) {
        safeType = rawType.includes('MULTI') ? 'COLOR_MULTI' : 'COLOR'
      } else if (rawType.includes('AREA') || rawType.includes('DESC')) {
        safeType = 'TEXTAREA'
      } else {
        safeType = 'TEXT'
      }

      // Format options
      const safeOptions = Array.isArray(item.options) && item.options.length > 0 ? item.options : undefined

      const created = await tx.attribute.create({
        data: {
          name: item.name.trim(),
          slug: finalSlug,
          type: safeType,
          options: safeOptions,
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
        const safeName = (t.name || item.name.trim()).trim()
        await tx.attributeTranslation.upsert({
          where: {
            attributeId_locale: {
              attributeId: created.id,
              locale: t.locale,
            },
          },
          update: {
            name: safeName,
            placeholder: t.placeholder,
            helperText: t.helperText,
          },
          create: {
            attributeId: created.id,
            locale: t.locale,
            name: safeName,
            placeholder: t.placeholder,
            helperText: t.helperText,
          },
        })
      }

      // Bind to categories safely by verifying IDs or resolving categoryNames
      const categoryIdsToBind = new Set<string>()

      if (Array.isArray(item.categoryIds)) {
        for (const cid of item.categoryIds) {
          if (!cid) continue
          const cat = await tx.category.findFirst({
            where: {
              OR: [
                { id: cid },
                { slug: cid },
                { name: { equals: cid, mode: 'insensitive' } },
              ],
            },
            select: { id: true },
          })
          if (cat) categoryIdsToBind.add(cat.id)
        }
      }

      if (Array.isArray(item.categoryNames)) {
        for (const cname of item.categoryNames) {
          if (!cname) continue
          const cat = await tx.category.findFirst({
            where: {
              OR: [
                { name: { equals: cname, mode: 'insensitive' } },
                { slug: slugify(cname) },
              ],
            },
            select: { id: true },
          })
          if (cat) categoryIdsToBind.add(cat.id)
        }
      }

      for (const catId of categoryIdsToBind) {
        await tx.categoryAttribute.upsert({
          where: {
            categoryId_attributeId: {
              categoryId: catId,
              attributeId: created.id,
            },
          },
          update: {
            isVisible: true,
          },
          create: {
            categoryId: catId,
            attributeId: created.id,
            isRequired: Boolean(item.isRequired),
            isVisible: true,
          },
        })
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

/**
 * 9. createProducts
 * STRICT WRITE OPERATION: Creates new product items with category associations,
 * images, pricing, and multilingual translations.
 */
export async function createProducts(
  items: PendingProductItem[],
  adminId: string,
  locale: AdminChatLocale = 'en'
) {
  if (!items || items.length === 0) {
    throw new Error('No products provided to create.')
  }

  const results: Array<{ id: string; name: string; sku: string; price: number; categoryName?: string }> = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (!item || !item.name?.trim()) continue

      const trimmedName = item.name.trim()

      // Generate or normalize SKU
      let sku = (item.sku || '').trim().toUpperCase()
      if (!sku) {
        const prefix = trimmedName.replace(/[^A-Za-z0-9]/g, '').slice(0, 3).toUpperCase() || 'PRD'
        sku = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`
      }

      // Ensure SKU uniqueness
      let skuCandidate = sku
      let skuCounter = 1
      while (await tx.product.findUnique({ where: { sku: skuCandidate } })) {
        skuCandidate = `${sku}-${skuCounter}`
        skuCounter++
      }
      sku = skuCandidate

      // Generate slug and ensure uniqueness
      let baseSlug = item.slug ? slugify(item.slug) : slugify(trimmedName)
      let slugCandidate = baseSlug
      let slugCounter = 1
      while (await tx.product.findUnique({ where: { slug: slugCandidate } })) {
        slugCandidate = `${baseSlug}-${slugCounter}`
        slugCounter++
      }
      const finalSlug = slugCandidate

      // Resolve Category
      let categoryId: string | null = null
      if (item.categoryId) {
        const found = await tx.category.findUnique({ where: { id: item.categoryId } })
        if (found) categoryId = found.id
      }
      if (!categoryId && item.categoryName) {
        const catName = item.categoryName.trim()
        let found = await tx.category.findFirst({
          where: {
            OR: [
              { name: { equals: catName, mode: 'insensitive' } },
              { slug: slugify(catName) },
            ],
          },
        })
        if (!found) {
          // Auto-create category if it does not exist
          found = await tx.category.create({
            data: {
              name: catName,
              slug: slugify(catName),
              isActive: true,
              showInMenu: true,
            },
          })
        }
        categoryId = found.id
      }

      const price = typeof item.price === 'number' && !isNaN(item.price) ? item.price : 19.99
      const images = Array.isArray(item.images) && item.images.length > 0 ? item.images : ['/images/placeholder.jpg']

      const created = await tx.product.create({
        data: {
          name: trimmedName,
          sku,
          slug: finalSlug,
          description: item.description?.trim() || null,
          price,
          compareAtPrice: item.compareAtPrice || null,
          categoryId,
          images,
          thumbnail: images[0] || null,
          stock: typeof item.stock === 'number' ? item.stock : 100,
          weightKg: typeof item.weightKg === 'number' ? item.weightKg : 0.5,
          isActive: true,
          availableForRetail: true,
          availableForWholesale: true,
        },
      })

      // Translations
      const translationsToCreate: Array<{ locale: string; name: string; description: string | null }> = [
        {
          locale: 'en',
          name: item.translations?.en?.name?.trim() || trimmedName,
          description: item.translations?.en?.description?.trim() || item.description?.trim() || null,
        },
      ]

      if (item.translations?.ru?.name?.trim()) {
        translationsToCreate.push({
          locale: 'ru',
          name: item.translations.ru.name.trim(),
          description: item.translations.ru.description?.trim() || null,
        })
      }

      if (item.translations?.zh?.name?.trim()) {
        translationsToCreate.push({
          locale: 'zh',
          name: item.translations.zh.name.trim(),
          description: item.translations.zh.description?.trim() || null,
        })
      }

      for (const t of translationsToCreate) {
        await tx.productTranslation.upsert({
          where: {
            productId_locale: {
              productId: created.id,
              locale: t.locale,
            },
          },
          update: {
            name: t.name,
            description: t.description,
          },
          create: {
            productId: created.id,
            locale: t.locale,
            name: t.name,
            description: t.description,
          },
        })
      }

      results.push({
        id: created.id,
        name: created.name,
        sku: created.sku,
        price: created.price,
        categoryName: item.categoryName,
      })
    }
  })

  // Log to audit
  await logAiAction({
    adminId,
    actionType: 'createProducts',
    summary: `Created ${results.length} products with category links, images, and translations`,
    payload: items,
    result: results,
    status: 'SUCCESS',
  })

  return {
    success: true,
    createdCount: results.length,
    products: results,
  }
}

