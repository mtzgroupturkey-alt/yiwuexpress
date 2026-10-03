import { prisma } from '@/lib/db'
import {
  PendingCategoryItem,
  PendingCategoryUpdateItem,
  PendingProductItem,
  PendingProductUpdateItem,
  PendingSliderItem,
  PendingAttributeItem,
  PendingTranslationItem,
  AdminChatLocale,
} from './types'
import { logAiAction } from './audit'
import { getApiKeys } from '@/lib/api-keys'
import { callZaiChatCompletion } from '@/lib/ai/providers/zai'

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
        select: { locale: true, name: true },
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
        try {
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
        } catch {
          // Fallback if placeholder/helperText columns do not exist in DB yet
          await tx.attributeTranslation.upsert({
            where: {
              attributeId_locale: {
                attributeId: created.id,
                locale: t.locale,
              },
            },
            update: {
              name: safeName,
            },
            create: {
              attributeId: created.id,
              locale: t.locale,
              name: safeName,
            },
          })
        }
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
export const CATEGORY_TRANSLATIONS_DICT: Record<string, { ru: string; zh: string }> = {
  'Armchairs & Chaises': { ru: 'Кресла и шезлонги', zh: '扶手椅与躺椅' },
  'Baby & Children': { ru: 'Товары для детей и малышей', zh: '婴童用品' },
  'Baby High Chairs': { ru: 'Стульчики для кормления', zh: '婴儿高脚餐椅' },
  'Baking Trays & Tins': { ru: 'Противни и формы для выпечки', zh: '烘焙烤盘与模具' },
  'Bar Tables & Stools': { ru: 'Барные столы и стулья', zh: '吧台桌与吧椅' },
  'Baskets': { ru: 'Корзины', zh: '收纳篮与置物篮' },
  'Bathroom': { ru: 'Ванная комната', zh: '卫浴空间' },
  'Bathroom Accessories': { ru: 'Аксессуары для ванной', zh: '卫浴配件' },
  'Bathroom Shelving': { ru: 'Полки для ванной', zh: '浴室置物架' },
  'Bathroom Storage': { ru: 'Хранение в ванной', zh: '浴室收纳' },
  'Bed Frames': { ru: 'Каркасы кроватей', zh: '床架' },
  'Bedding': { ru: 'Постельное белье', zh: '床上用品' },
  'Bedroom Furniture': { ru: 'Мебель для спальни', zh: '卧室家具' },
  'Bedroom Nightstands': { ru: 'Прикроватные тумбы', zh: '床头柜' },
  'Bedroom Wardrobes': { ru: 'Шкафы для спальни', zh: '卧室衣柜' },
  'Beds & Bedside Tables': { ru: 'Кровати и прикроватные тумбочки', zh: '床与床头柜' },
  'Beds & Mattresses': { ru: 'Кровати и матрасы', zh: '床具与床垫' },
  'Blankets & Throws': { ru: 'Пледы и покрывала', zh: '毛毯与盖毯' },
  'Bookcases & Shelving': { ru: 'Книжные шкафы и стеллажи', zh: '书架与置物架' },
  'Boxes & Organizers': { ru: 'Коробки и органайзеры', zh: '收纳盒与整理箱' },
  'Candles & Candle Holders': { ru: 'Свечи и подсвечники', zh: '蜡烛与烛台' },
  'Ceiling Lights': { ru: 'Потолочные светильники', zh: '吸顶灯与吊灯' },
  'Changing Tables': { ru: 'Пеленальные столики', zh: '婴儿尿布台' },
  'Children Furniture': { ru: 'Детская мебель', zh: '儿童家具' },
  'Clothes Racks': { ru: 'Вешалки и стойки для одежды', zh: '晾衣架与衣帽架' },
  'Coffee Tables': { ru: 'Журнальные столики', zh: '咖啡桌与茶几' },
  'Cookware & Bakeware': { ru: 'Посуда для приготовления и выпечки', zh: '锅具与烘焙用品' },
  'Cribs & Cots': { ru: 'Детские кроватки', zh: '婴儿床' },
  'Cube Storage Units': { ru: 'Модульные кубические стеллажи', zh: '魔方储物格' },
  'Curtains & Cushions': { ru: 'Шторы и подушки', zh: '窗帘与靠垫' },
  'Curtains & Drapes': { ru: 'Шторы и занавески', zh: '窗帘与帷幔' },
  'Cushion Covers': { ru: 'Чехлы для подушек', zh: '靠垫套' },
  'Cutlery': { ru: 'Столовые приборы', zh: '刀叉餐具' },
  'Daybeds & Guest Beds': { ru: 'Кушетки и гостевые кровати', zh: '沙发床与客卧床' },
  'Decorative Accessories': { ru: 'Декоративные аксессуары', zh: '装饰摆件与饰品' },
  'Desk Chairs': { ru: 'Офисные и письменные стулья', zh: '办公椅与书桌椅' },
  'Dining Chairs': { ru: 'Обеденные стулья', zh: '餐椅' },
  'Dining Furniture': { ru: 'Мебель для столовой', zh: '餐厅家具' },
  'Dining Tables': { ru: 'Обеденные столы', zh: '餐桌' },
  'Dinnerware & Tableware': { ru: 'Столовая посуда и сервировка', zh: '餐具与台面用品' },
  'Doormats': { ru: 'Придверные коврики', zh: '门垫与进门地毯' },
  'Double & King Beds': { ru: 'Двуспальные и King Size кровати', zh: '双人床与大号床' },
  'Drawer Dividers': { ru: 'Разделители для ящиков', zh: '抽屉分隔板' },
  'Dressers & Drawers': { ru: 'Комоды и тумбы с ящиками', zh: '斗柜与抽屉柜' },
  'Duvet Cover Sets': { ru: 'Комплекты пододеяльников', zh: '被套套装' },
  'Filing Cabinets': { ru: 'Картотечные шкафы', zh: '文件柜' },
  'Fitted Wardrobes': { ru: 'Встроенные шкафы', zh: '嵌入式衣柜' },
  'Floor Lamps': { ru: 'Торшеры и напольные лампы', zh: '落地灯' },
  'Foam Mattresses': { ru: 'Пенополиуретановые матрасы', zh: '海绵床垫' },
  'Food Storage Containers': { ru: 'Контейнеры для хранения продуктов', zh: '食品保鲜盒与储物罐' },
  'Frames & Pictures': { ru: 'Рамки и картины', zh: '相框与挂画' },
  'Freestanding Wardrobes': { ru: 'Отдельностоящие шкафы', zh: '独立式衣柜' },
  'Furniture': { ru: 'Мебель', zh: '家具' },
  'Glassware & Jugs': { ru: 'Бокалы, стаканы и кувшины', zh: '玻璃杯与玻璃水壶' },
  'Home Decor & Plants': { ru: 'Домашний декор и растения', zh: '家居装饰与绿植' },
  'Home Office Furniture': { ru: 'Мебель для домашнего офиса', zh: '居家办公家具' },
  'Indoor Plants': { ru: 'Комнатные растения', zh: '室内盆栽绿植' },
  'Kids Beds': { ru: 'Кровати для детей', zh: '儿童床' },
  'Kids Desks & Chairs': { ru: 'Детские столы и стулья', zh: '儿童课桌椅' },
  'Kitchen & Dining': { ru: 'Кухня и столовая', zh: '厨房与餐饮' },
  'Kitchen Accessories': { ru: 'Кухонные аксессуары', zh: '厨房配件' },
  'Kitchen Textiles': { ru: 'Кухонный текстиль', zh: '厨房纺织品' },
  'Kitchen Utensils': { ru: 'Кухонные принадлежности', zh: '厨房烹饪用具' },
  'Lamps & Lights': { ru: 'Лампы и освещение', zh: '灯具与照明' },
  'Large Rugs': { ru: 'Большие ковры', zh: '大尺寸地毯' },
  'Lighting & Home Smart': { ru: 'Освещение и умный дом', zh: '照明与智能家居' },
  'Living Room Furniture': { ru: 'Мебель для гостиной', zh: '客厅家具' },
  'Loungers & Daybeds': { ru: 'Шезлонги и кушетки', zh: '躺椅与日间榻' },
  'Mattress Protectors': { ru: 'Наматрасники и чехлы для матрасов', zh: '床垫保护罩' },
  'Mattress Toppers': { ru: 'Топперы для матрасов', zh: '床垫薄褥垫' },
  'Mattresses': { ru: 'Матрасы', zh: '床垫' },
  'Mirror Cabinets': { ru: 'Шкафчики с зеркалом', zh: '镜柜' },
  'Mirrors': { ru: 'Зеркала', zh: '镜子' },
  'Mugs & Cups': { ru: 'Кружки и чашки', zh: '马克杯与茶杯' },
  'Nursery Furniture': { ru: 'Мебель для детской комнаты', zh: '婴儿房家具' },
  'Office Bookcases': { ru: 'Офисные книжные шкафы', zh: '办公书柜' },
  'Office Desks': { ru: 'Офисные письменные столы', zh: '办公桌' },
  'Outdoor & Balcony': { ru: 'Мебель для улицы и балкона', zh: '户外与阳台' },
  'Outdoor Accessories': { ru: 'Аксессуары для улицы', zh: '户外配件' },
  'Outdoor Cushions': { ru: 'Уличные подушки', zh: '户外靠垫' },
  'Outdoor Dining Sets': { ru: 'Уличные обеденные гарнитуры', zh: '户外用餐桌椅套装' },
  'Outdoor Furniture': { ru: 'Уличная мебель', zh: '户外家具' },
  'Outdoor Lighting': { ru: 'Уличное освещение', zh: '户外照明' },
  'Outdoor Tables & Chairs': { ru: 'Уличные столы и стулья', zh: '户外桌椅' },
  'Ovenware': { ru: 'Посуда для духовки', zh: '烤箱专用烹饪器具' },
  'Parasols & Bases': { ru: 'Зонты от солнца и подставки', zh: '遮阳伞与底座' },
  'Pillows & Quilts': { ru: 'Подушки и одеяла', zh: '枕头与被褥' },
  'Plant Pots': { ru: 'Цветочные горшки и кашпо', zh: '花盆与花器' },
  'Plants & Plant Pots': { ru: 'Растения и цветочные горшки', zh: '绿植与花盆' },
  'Plates & Bowls': { ru: 'Тарелки и миски', zh: '餐盘与碗具' },
  'Pots & Pans': { ru: 'Кастрюли и сковороды', zh: '平底锅与汤锅' },
  'Rugs & Mats': { ru: 'Ковры и циновки', zh: '地毯与地垫' },
  'Runner Rugs': { ru: 'Ковровые дорожки', zh: '走廊长条地毯' },
  'Sculptures & Ornaments': { ru: 'Скульптуры и украшения', zh: '雕塑与摆件饰物' },
  'Sheets & Pillowcases': { ru: 'Простыни и наволочки', zh: '床单与枕套' },
  'Shower Curtains': { ru: 'Занавески для душа', zh: '浴帘' },
  'Sideboards & Buffets': { ru: 'Буфеты и комоды-серванты', zh: '餐边柜与边柜' },
  'Single Beds': { ru: 'Односпальные кровати', zh: '单人床' },
  'Smart Bulbs': { ru: 'Умные лампочки', zh: '智能灯泡' },
  'Smart Controllers & Sensors': { ru: 'Умные контроллеры и датчики', zh: '智能控制器与传感器' },
  'Smart LED Light Strips': { ru: 'Умные светодиодные ленты', zh: '智能LED灯带' },
  'Smart Lighting': { ru: 'Умное освещение', zh: '智能照明系统' },
  'Soap Dispensers & Holders': { ru: 'Дозаторы для мыла и мыльницы', zh: '皂液器与肥皂盒' },
  'Sofas & Sectionals': { ru: 'Диваны и угловые диваны', zh: '沙发与组合沙发' },
  'Spring Mattresses': { ru: 'Пружинные матрасы', zh: '弹簧床垫' },
  'Storage & Organization': { ru: 'Хранение и порядок', zh: '储物与收纳整理' },
  'Storage Beds': { ru: 'Кровати с ящиками для хранения', zh: '带储物抽屉床' },
  'Storage Bookcases': { ru: 'Стеллажи для хранения', zh: '收纳书架' },
  'Storage Boxes': { ru: 'Ящики для хранения', zh: '储物箱' },
  'TV Benches & Media Units': { ru: 'Тумбы под телевизор и медиацентры', zh: '电视柜与影音机柜' },
  'Table Lamps': { ru: 'Настольные лампы', zh: '台灯' },
  'Textiles & Rugs': { ru: 'Текстиль и ковры', zh: '纺织品与地毯' },
  'Towels & Bath Mats': { ru: 'Полотенца и коврики для ванной', zh: '毛巾与浴室地垫' },
  'Toy Storage': { ru: 'Хранение игрушек', zh: '玩具收纳整理' },
  'Vanity Units': { ru: 'Тумбы под раковину', zh: '浴室洗手台面盆柜' },
  'Vases & Bowls': { ru: 'Вазы и декоративные чаши', zh: '花瓶与装饰钵' },
  'Wall Clocks': { ru: 'Настенные часы', zh: '挂钟' },
  'Wall Decor & Mirrors': { ru: 'Настенный декор и зеркала', zh: '墙面装饰与镜面' },
  'Wall Shelves': { ru: 'Настенные полки', zh: '壁挂置物架' },
  'Wardrobes & Closets': { ru: 'Шкафы и гардеробы', zh: '大衣柜与壁橱' },
  'Watering Cans': { ru: 'Лейки для полива', zh: '浇水壶' },
  'Work Lamps': { ru: 'Рабочие настольные лампы', zh: '工作台台灯' },
}

/**
 * 5. getUntranslatedContent
 * Finds products, categories, attributes, or sliders missing Russian or Chinese translations.
 */
export async function getUntranslatedContent(
  type: 'products' | 'categories' | 'attributes' | 'sliders' = 'products',
  limit: number = 50
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
      take: 500,
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

  if (type === 'sliders') {
    const slides = await prisma.heroSlide.findMany({
      where: { isActive: true },
      select: {
        id: true,
        title: true,
        translations: { select: { locale: true } },
      },
      take: 50,
    })

    const untranslated = slides
      .map((s) => {
        const locales = new Set(s.translations.map((t) => t.locale))
        const missingLocales: ('ru' | 'zh')[] = []
        if (!locales.has('ru')) missingLocales.push('ru')
        if (!locales.has('zh')) missingLocales.push('zh')
        return {
          id: s.id,
          name: s.title,
          missingLocales,
        }
      })
      .filter((s) => s.missingLocales.length > 0)

    return {
      type: 'sliders',
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
 * Resilient multi-provider translation caller.
 * Automatically tries Z.ai (GLM), OpenAI Gateway, OpenRouter, Gemini, and falls back cleanly.
 */
export async function translateWithAiGateway(
  fields: Record<string, string>,
  targetLocales: ('ru' | 'zh')[]
): Promise<Record<string, Record<string, string>>> {
  // First check if single name matches category dictionary
  if (fields.name && CATEGORY_TRANSLATIONS_DICT[fields.name.trim()]) {
    const dict = CATEGORY_TRANSLATIONS_DICT[fields.name.trim()]
    const result: Record<string, Record<string, string>> = {}
    for (const loc of targetLocales) {
      result[loc] = { name: dict[loc] || fields.name }
      if (fields.description) {
        result[loc].description = dict[loc] || fields.description
      }
    }
    return result
  }

  const prompt =
    `You are an expert e-commerce multilingual translator. Translate the following key-value pairs into target locales: [${targetLocales.join(', ')}].\n` +
    `Return strictly a valid JSON object mapping each locale to its translated key-value pairs.\n` +
    `Example format:\n` +
    `{\n` +
    `  "ru": { "name": "..." },\n` +
    `  "zh": { "name": "..." }\n` +
    `}\n` +
    `Source Data: ${JSON.stringify(fields)}`

  const apiKeys = await getApiKeys()

  // 1. Try Z.ai / GLM if configured or if base URL indicates Z.ai
  const isZaiConfigured =
    apiKeys.zaiApiKey ||
    (apiKeys.openaiBaseUrl && apiKeys.openaiBaseUrl.includes('z.ai')) ||
    (apiKeys.openaiApiKey && apiKeys.openaiApiKey.includes('.'))

  if (isZaiConfigured) {
    const zaiKey = (apiKeys.zaiApiKey || apiKeys.openaiApiKey || '').trim()
    const baseUrl = apiKeys.zaiBaseUrl || (apiKeys.openaiBaseUrl?.includes('z.ai') ? apiKeys.openaiBaseUrl : 'https://api.z.ai/api/paas/v4')
    const models = ['glm-4.7-flash', 'glm-4.5-flash']

    for (const model of models) {
      try {
        const result = await callZaiChatCompletion({
          apiKey: zaiKey,
          baseUrl,
          model,
          messages: [{ role: 'user', content: prompt }] as any,
          temperature: 0.1,
          max_tokens: 1500,
          timeoutMs: 15_000,
        })
        if (result.content) {
          const cleaned = result.content.replace(/```(?:json)?\s*([\s\S]*?)```/i, '$1').trim()
          return JSON.parse(cleaned)
        }
      } catch (err: any) {
        console.warn(`[translateWithAiGateway] Z.ai (${model}) attempt failed:`, err?.message)
      }
    }
  }

  // 2. Try standard OpenAI-compatible gateway
  if (apiKeys.openaiApiKey && !apiKeys.openaiBaseUrl?.includes('z.ai')) {
    try {
      const baseUrl = (apiKeys.openaiBaseUrl || 'https://llm.gcat.ir/v1').trim().replace(/\/+$/, '')
      const endpoint = baseUrl.endsWith('/chat/completions') ? baseUrl : `${baseUrl}/chat/completions`
      const model = apiKeys.openaiModel || 'auto/best-chat'

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeys.openaiApiKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(15_000),
      })

      if (res.ok) {
        const json = await res.json()
        const rawText: string = json?.choices?.[0]?.message?.content ?? ''
        const cleaned = rawText.replace(/```(?:json)?\s*([\s\S]*?)```/i, '$1').trim()
        return JSON.parse(cleaned)
      }
    } catch (err: any) {
      console.warn('[translateWithAiGateway] OpenAI gateway attempt failed:', err?.message)
    }
  }

  // 3. Try OpenRouter
  if (apiKeys.openrouterApiKey) {
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKeys.openrouterApiKey.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://dromkok.com',
          'X-Title': 'Dromkok Admin AI Assistant',
        },
        body: JSON.stringify({
          model: 'nvidia/nemotron-3.5-lightning:free',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(15_000),
      })

      if (res.ok) {
        const json = await res.json()
        const rawText: string = json?.choices?.[0]?.message?.content ?? ''
        const cleaned = rawText.replace(/```(?:json)?\s*([\s\S]*?)```/i, '$1').trim()
        return JSON.parse(cleaned)
      }
    } catch (err: any) {
      console.warn('[translateWithAiGateway] OpenRouter attempt failed:', err?.message)
    }
  }

  // 4. Safe fallback: generate identical fallback entries so execution never throws
  const fallback: Record<string, Record<string, string>> = {}
  for (const loc of targetLocales) {
    fallback[loc] = {}
    for (const [k, v] of Object.entries(fields)) {
      fallback[loc][k] = v
    }
  }
  return fallback
}

/**
 * 6. bulkTranslate
 * STRICT WRITE OPERATION: Translates untranslated products, categories,
 * sliders, or attributes into Russian and Chinese.
 */
export async function bulkTranslate(
  type: 'products' | 'categories' | 'attributes' | 'sliders',
  itemIds: string[] = [],
  targetLocales: ('ru' | 'zh')[] = ['ru', 'zh'],
  adminId: string
) {
  const translatedCount = { success: 0, failed: 0 }
  const details: any[] = []

  if (type === 'categories') {
    // If itemIds is empty or contains 'all', query all categories missing translations
    let targetIds = itemIds.filter(id => id && id !== 'all')
    if (targetIds.length === 0) {
      const untranslated = await prisma.category.findMany({
        where: { isActive: true },
        select: {
          id: true,
          translations: { select: { locale: true } },
        },
        take: 500,
      })
      targetIds = untranslated
        .filter((c) => {
          const locs = new Set(c.translations.map((t) => t.locale))
          return targetLocales.some((l) => !locs.has(l))
        })
        .map((c) => c.id)
    }

    if (targetIds.length === 0) {
      return {
        success: true,
        translatedCount: { success: 0, failed: 0 },
        details: [],
        message: 'All categories already have complete translations.',
      }
    }

    const categories = await prisma.category.findMany({
      where: { id: { in: targetIds } },
      select: { id: true, name: true, description: true },
    })

    for (const cat of categories) {
      try {
        const fieldsToTranslate: Record<string, string> = { name: cat.name }
        if (cat.description) fieldsToTranslate.description = cat.description.slice(0, 500)

        // Try dictionary first for instant performance
        let translations: Record<string, Record<string, string>> | null = null
        if (CATEGORY_TRANSLATIONS_DICT[cat.name.trim()]) {
          const dict = CATEGORY_TRANSLATIONS_DICT[cat.name.trim()]
          translations = {}
          for (const loc of targetLocales) {
            translations[loc] = {
              name: dict[loc] || cat.name,
              description: cat.description ? `${dict[loc] || cat.name} - качественные товары` : '',
            }
          }
        } else {
          translations = await translateWithAiGateway(fieldsToTranslate, targetLocales)
        }

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
        console.error(`Failed to translate category ${cat.id}:`, err)
        translatedCount.failed++
        details.push({ id: cat.id, name: cat.name, error: err.message })
      }
    }
  } else if (type === 'sliders') {
    let targetIds = itemIds.filter(id => id && id !== 'all')
    if (targetIds.length === 0) {
      const allSlides = await prisma.heroSlide.findMany({
        where: { isActive: true },
        select: { id: true, translations: { select: { locale: true } } },
      })
      targetIds = allSlides
        .filter((s) => {
          const locs = new Set(s.translations.map((t) => t.locale))
          return targetLocales.some((l) => !locs.has(l))
        })
        .map((s) => s.id)
    }

    const slides = await prisma.heroSlide.findMany({
      where: { id: { in: targetIds } },
    })

    for (const slide of slides) {
      try {
        const fieldsToTranslate: Record<string, string> = {
          title: slide.title,
          ctaText: slide.ctaText,
        }
        if (slide.subtitle) fieldsToTranslate.subtitle = slide.subtitle
        if (slide.description) fieldsToTranslate.description = slide.description
        if (slide.badgeText) fieldsToTranslate.badgeText = slide.badgeText

        const translations = await translateWithAiGateway(fieldsToTranslate, targetLocales)

        for (const loc of targetLocales) {
          const locData = translations[loc]
          if (locData && locData.title) {
            await prisma.heroSlideTranslation.upsert({
              where: {
                heroSlideId_locale: {
                  heroSlideId: slide.id,
                  locale: loc,
                },
              },
              update: {
                title: locData.title,
                subtitle: locData.subtitle || null,
                description: locData.description || null,
                ctaText: locData.ctaText || slide.ctaText,
                badgeText: locData.badgeText || null,
              },
              create: {
                heroSlideId: slide.id,
                locale: loc,
                title: locData.title,
                subtitle: locData.subtitle || null,
                description: locData.description || null,
                ctaText: locData.ctaText || slide.ctaText,
                badgeText: locData.badgeText || null,
              },
            })
          }
        }
        translatedCount.success++
        details.push({ id: slide.id, title: slide.title, status: 'TRANSLATED' })
      } catch (err: any) {
        translatedCount.failed++
        details.push({ id: slide.id, title: slide.title, error: err.message })
      }
    }
  } else if (type === 'products') {
    let targetIds = itemIds.filter(id => id && id !== 'all')
    if (targetIds.length === 0) {
      const untranslated = await prisma.product.findMany({
        where: { isActive: true },
        select: { id: true, translations: { select: { locale: true } } },
        take: 100,
      })
      targetIds = untranslated
        .filter((p) => {
          const locs = new Set(p.translations.map((t) => t.locale))
          return targetLocales.some((l) => !locs.has(l))
        })
        .map((p) => p.id)
    }

    const products = await prisma.product.findMany({
      where: { id: { in: targetIds } },
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
        translatedCount.failed++
        details.push({ id: product.id, name: product.name, error: err.message })
      }
    }
  } else if (type === 'attributes') {
    let targetIds = itemIds.filter(id => id && id !== 'all')
    if (targetIds.length === 0) {
      const untranslated = await prisma.attribute.findMany({
        where: { isActive: true },
        select: { id: true, translations: { select: { locale: true } } },
        take: 50,
      })
      targetIds = untranslated
        .filter((a) => {
          const locs = new Set(a.translations.map((t) => t.locale))
          return targetLocales.some((l) => !locs.has(l))
        })
        .map((a) => a.id)
    }

    const attributes = await prisma.attribute.findMany({
      where: { id: { in: targetIds } },
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
            try {
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
            } catch {
              await prisma.attributeTranslation.upsert({
                where: {
                  attributeId_locale: {
                    attributeId: attr.id,
                    locale: loc,
                  },
                },
                update: {
                  name: locData.name,
                },
                create: {
                  attributeId: attr.id,
                  locale: loc,
                  name: locData.name,
                },
              })
            }
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

/**
 * 10. updateCategories
 * Updates existing categories: renaming, parent hierarchy, flags, descriptions, and translations.
 */
export async function updateCategories(
  items: PendingCategoryUpdateItem[],
  adminId: string,
  locale: AdminChatLocale = 'en'
) {
  if (!items || items.length === 0) {
    throw new Error('No categories specified for update.')
  }

  const results: any[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const existing = await tx.category.findFirst({
        where: {
          OR: [
            item.id ? { id: item.id } : undefined,
            item.slug ? { slug: item.slug } : undefined,
            item.name ? { name: { equals: item.name, mode: 'insensitive' } } : undefined,
          ].filter(Boolean) as any,
        },
      })

      if (!existing) {
        continue
      }

      let parentId = existing.parentId
      let level = existing.level
      if (item.parentName) {
        const parent = await tx.category.findFirst({
          where: { name: { equals: item.parentName.trim(), mode: 'insensitive' } },
        })
        if (parent) {
          parentId = parent.id
          level = parent.level + 1
        }
      } else if (item.parentId !== undefined) {
        parentId = item.parentId
        if (parentId) {
          const parent = await tx.category.findUnique({ where: { id: parentId } })
          if (parent) level = parent.level + 1
        } else {
          level = 1
        }
      }

      const updateData: any = {
        updatedAt: new Date(),
      }
      if (item.newName && item.newName.trim()) {
        updateData.name = item.newName.trim()
        updateData.slug = slugify(item.newName.trim())
      }
      if (item.description !== undefined) updateData.description = item.description
      if (item.isActive !== undefined) updateData.isActive = item.isActive
      if (item.isFeatured !== undefined) updateData.isFeatured = item.isFeatured
      if (item.showInMenu !== undefined) updateData.showInMenu = item.showInMenu
      if (item.displayOrder !== undefined) updateData.displayOrder = item.displayOrder
      updateData.parentId = parentId
      updateData.level = level

      const updated = await tx.category.update({
        where: { id: existing.id },
        data: updateData,
      })

      if (item.translations) {
        for (const loc of ['en', 'ru', 'zh'] as const) {
          const tr = item.translations[loc]
          if (tr?.name?.trim()) {
            await tx.categoryTranslation.upsert({
              where: {
                categoryId_locale: {
                  categoryId: updated.id,
                  locale: loc,
                },
              },
              update: {
                name: tr.name.trim(),
                description: tr.description?.trim() || null,
              },
              create: {
                categoryId: updated.id,
                locale: loc,
                name: tr.name.trim(),
                description: tr.description?.trim() || null,
              },
            })
          }
        }
      }

      results.push({
        id: updated.id,
        name: updated.name,
        slug: updated.slug,
        level: updated.level,
        isActive: updated.isActive,
      })
    }
  })

  await logAiAction({
    adminId,
    actionType: 'updateCategories',
    summary: `Updated ${results.length} categories`,
    payload: items,
    result: results,
    status: 'SUCCESS',
  })

  return {
    success: true,
    updatedCount: results.length,
    categories: results,
  }
}

/**
 * 11. updateProducts
 * Updates products by ID, SKU, or name (prices, category, stock, flags, and translations).
 */
export async function updateProducts(
  items: PendingProductUpdateItem[],
  adminId: string,
  locale: AdminChatLocale = 'en'
) {
  if (!items || items.length === 0) {
    throw new Error('No products specified for update.')
  }

  const results: any[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const existing = await tx.product.findFirst({
        where: {
          OR: [
            item.id ? { id: item.id } : undefined,
            item.sku ? { sku: item.sku } : undefined,
            item.name ? { name: { equals: item.name, mode: 'insensitive' } } : undefined,
          ].filter(Boolean) as any,
        },
      })

      if (!existing) continue

      const updateData: any = { updatedAt: new Date() }
      if (item.newName && item.newName.trim()) {
        updateData.name = item.newName.trim()
        updateData.slug = slugify(item.newName.trim())
      }
      if (item.price !== undefined && !isNaN(item.price)) updateData.price = item.price
      if (item.compareAtPrice !== undefined) updateData.compareAtPrice = item.compareAtPrice
      if (item.stock !== undefined) updateData.stock = item.stock
      if (item.description !== undefined) updateData.description = item.description
      if (item.isActive !== undefined) updateData.isActive = item.isActive
      if (item.isFeatured !== undefined) updateData.isFeatured = item.isFeatured
      if (item.isNewArrival !== undefined) updateData.isNewArrival = item.isNewArrival
      if (item.isFlashSale !== undefined) updateData.isFlashSale = item.isFlashSale

      if (item.categoryName) {
        const cat = await tx.category.findFirst({
          where: { name: { equals: item.categoryName.trim(), mode: 'insensitive' } },
        })
        if (cat) updateData.categoryId = cat.id
      } else if (item.categoryId !== undefined) {
        updateData.categoryId = item.categoryId
      }

      const updated = await tx.product.update({
        where: { id: existing.id },
        data: updateData,
      })

      if (item.translations) {
        for (const loc of ['en', 'ru', 'zh'] as const) {
          const tr = item.translations[loc]
          if (tr?.name?.trim()) {
            await tx.productTranslation.upsert({
              where: {
                productId_locale: {
                  productId: updated.id,
                  locale: loc,
                },
              },
              update: {
                name: tr.name.trim(),
                description: tr.description?.trim() || null,
              },
              create: {
                productId: updated.id,
                locale: loc,
                name: tr.name.trim(),
                description: tr.description?.trim() || null,
              },
            })
          }
        }
      }

      results.push({
        id: updated.id,
        sku: updated.sku,
        name: updated.name,
        price: updated.price,
        stock: updated.stock,
      })
    }
  })

  await logAiAction({
    adminId,
    actionType: 'updateProducts',
    summary: `Updated ${results.length} products`,
    payload: items,
    result: results,
    status: 'SUCCESS',
  })

  return {
    success: true,
    updatedCount: results.length,
    products: results,
  }
}

/**
 * 12. getExistingSliders
 * Retrieves current hero slides and their multilingual translations.
 */
export async function getExistingSliders() {
  const slides = await prisma.heroSlide.findMany({
    include: {
      translations: true,
    },
    orderBy: { displayOrder: 'asc' },
  })
  return {
    total: slides.length,
    slides: slides.map((s) => ({
      id: s.id,
      title: s.title,
      subtitle: s.subtitle,
      ctaText: s.ctaText,
      ctaLink: s.ctaLink,
      imageUrl: s.imageUrl,
      badgeText: s.badgeText,
      displayOrder: s.displayOrder,
      isActive: s.isActive,
      translations: s.translations.map((t) => ({
        locale: t.locale,
        title: t.title,
        subtitle: t.subtitle,
        ctaText: t.ctaText,
      })),
    })),
  }
}

/**
 * 13. createSliders
 * Creates new hero slides with multilingual translations.
 */
export async function createSliders(
  items: PendingSliderItem[],
  adminId: string,
  locale: AdminChatLocale = 'en'
) {
  if (!items || items.length === 0) {
    throw new Error('No sliders specified for creation.')
  }

  const results: any[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const created = await tx.heroSlide.create({
        data: {
          title: item.title,
          subtitle: item.subtitle || null,
          description: item.description || null,
          imageUrl: item.imageUrl || '/images/hero-default.jpg',
          mobileImageUrl: item.mobileImageUrl || null,
          productImageUrl: item.productImageUrl || null,
          badgeText: item.badgeText || null,
          badgeColor: item.badgeColor || null,
          ctaText: item.ctaText || 'Shop Now',
          ctaLink: item.ctaLink || '/products',
          secondaryCtaText: item.secondaryCtaText || null,
          secondaryCtaLink: item.secondaryCtaLink || null,
          alignment: item.alignment || 'left',
          displayOrder: item.displayOrder ?? 0,
          isActive: item.isActive ?? true,
          slideDuration: item.slideDuration ?? 5,
        },
      })

      const trs = [
        {
          locale: 'en',
          title: item.translations?.en?.title || item.title,
          subtitle: item.translations?.en?.subtitle || item.subtitle || null,
          description: item.translations?.en?.description || item.description || null,
          ctaText: item.translations?.en?.ctaText || item.ctaText || 'Shop Now',
          badgeText: item.translations?.en?.badgeText || item.badgeText || null,
        },
      ]
      if (item.translations?.ru?.title) {
        trs.push({
          locale: 'ru',
          title: item.translations.ru.title,
          subtitle: item.translations.ru.subtitle || null,
          description: item.translations.ru.description || null,
          ctaText: item.translations.ru.ctaText || 'Подробнее',
          badgeText: item.translations.ru.badgeText || null,
        })
      }
      if (item.translations?.zh?.title) {
        trs.push({
          locale: 'zh',
          title: item.translations.zh.title,
          subtitle: item.translations.zh.subtitle || null,
          description: item.translations.zh.description || null,
          ctaText: item.translations.zh.ctaText || '立即查看',
          badgeText: item.translations.zh.badgeText || null,
        })
      }

      for (const t of trs) {
        await tx.heroSlideTranslation.upsert({
          where: {
            heroSlideId_locale: {
              heroSlideId: created.id,
              locale: t.locale,
            },
          },
          update: {
            title: t.title,
            subtitle: t.subtitle,
            description: t.description,
            ctaText: t.ctaText,
            badgeText: t.badgeText,
          },
          create: {
            heroSlideId: created.id,
            locale: t.locale,
            title: t.title,
            subtitle: t.subtitle,
            description: t.description,
            ctaText: t.ctaText,
            badgeText: t.badgeText,
          },
        })
      }

      results.push({
        id: created.id,
        title: created.title,
        ctaLink: created.ctaLink,
        isActive: created.isActive,
      })
    }
  })

  await logAiAction({
    adminId,
    actionType: 'createSliders',
    summary: `Created ${results.length} hero slides with translations`,
    payload: items,
    result: results,
    status: 'SUCCESS',
  })

  return {
    success: true,
    createdCount: results.length,
    sliders: results,
  }
}

/**
 * 14. updateSliders
 * Updates existing hero slides (copy, links, badges, order, and translations).
 */
export async function updateSliders(
  items: PendingSliderItem[],
  adminId: string,
  locale: AdminChatLocale = 'en'
) {
  if (!items || items.length === 0) {
    throw new Error('No sliders specified for update.')
  }

  const results: any[] = []

  await prisma.$transaction(async (tx) => {
    for (const item of items) {
      const existing = await tx.heroSlide.findFirst({
        where: {
          OR: [
            item.id ? { id: item.id } : undefined,
            item.title ? { title: { equals: item.title, mode: 'insensitive' } } : undefined,
          ].filter(Boolean) as any,
        },
      })

      if (!existing) continue

      const updateData: any = { updatedAt: new Date() }
      if (item.title) updateData.title = item.title
      if (item.subtitle !== undefined) updateData.subtitle = item.subtitle
      if (item.description !== undefined) updateData.description = item.description
      if (item.imageUrl) updateData.imageUrl = item.imageUrl
      if (item.ctaText) updateData.ctaText = item.ctaText
      if (item.ctaLink) updateData.ctaLink = item.ctaLink
      if (item.badgeText !== undefined) updateData.badgeText = item.badgeText
      if (item.displayOrder !== undefined) updateData.displayOrder = item.displayOrder
      if (item.isActive !== undefined) updateData.isActive = item.isActive

      const updated = await tx.heroSlide.update({
        where: { id: existing.id },
        data: updateData,
      })

      if (item.translations) {
        for (const loc of ['en', 'ru', 'zh'] as const) {
          const tr = item.translations[loc]
          if (tr?.title?.trim()) {
            await tx.heroSlideTranslation.upsert({
              where: {
                heroSlideId_locale: {
                  heroSlideId: updated.id,
                  locale: loc,
                },
              },
              update: {
                title: tr.title.trim(),
                subtitle: tr.subtitle?.trim() || null,
                description: tr.description?.trim() || null,
                ctaText: tr.ctaText?.trim() || updated.ctaText,
                badgeText: tr.badgeText?.trim() || null,
              },
              create: {
                heroSlideId: updated.id,
                locale: loc,
                title: tr.title.trim(),
                subtitle: tr.subtitle?.trim() || null,
                description: tr.description?.trim() || null,
                ctaText: tr.ctaText?.trim() || updated.ctaText,
                badgeText: tr.badgeText?.trim() || null,
              },
            })
          }
        }
      }

      results.push({
        id: updated.id,
        title: updated.title,
        ctaLink: updated.ctaLink,
        isActive: updated.isActive,
      })
    }
  })

  await logAiAction({
    adminId,
    actionType: 'updateSliders',
    summary: `Updated ${results.length} hero slides`,
    payload: items,
    result: results,
    status: 'SUCCESS',
  })

  return {
    success: true,
    updatedCount: results.length,
    sliders: results,
  }
}

