export const dynamic = 'force-dynamic'

import dns from 'dns'
// Fix IPv6 fetch failures on Linux hosts
if (typeof dns.setDefaultResultOrder === 'function') {
  dns.setDefaultResultOrder('ipv4first')
}

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import {
  ChatRequestPayload,
  PendingAction,
  AdminChatLocale,
} from '@/lib/ai-assistant/types'
import {
  getMissingCategories,
  getCategoryTree,
  getExistingAttributes,
  getUntranslatedContent,
  getProductStats,
  searchProducts,
  createCategories,
  updateCategories,
  createAttributes,
  bulkTranslate,
  createProducts,
  updateProducts,
  getExistingSliders,
  createSliders,
  updateSliders,
} from '@/lib/ai-assistant/tools'
import { generateAssistantResponse } from '@/lib/ai-assistant/gateway'

// Confirmation trigger dictionaries across supported languages
const CONFIRMATION_WORDS = new Set([
  // English
  'yes', 'confirm', 'ok', 'okay', 'sure', 'proceed', 'approve', 'y', 'yep', 'yeah', 'do it',
  // Russian
  'да', 'подтверждаю', 'ок', 'согласен', 'согласна', 'применить', 'подтвердить', 'давай', 'сделай',
  // Chinese
  '确认', '好的', '可以', '是的', '同意', '执行', '确定', '对', '做吧',
])

const REJECTION_WORDS = new Set([
  // English
  'no', 'cancel', 'reject', 'stop', 'abort', 'don\'t', 'dont', 'n', 'nope',
  // Russian
  'нет', 'отмена', 'отменить', 'не надо', 'стоп', 'отклонить',
  // Chinese
  '取消', '不要', '算了', '否', '停止', '拒绝',
])

function isConfirmation(text: string): boolean {
  const normalized = text.toLowerCase().trim().replace(/[.,!?;:'"“”]/g, '')
  if (CONFIRMATION_WORDS.has(normalized)) return true

  // Support user addressing assistant (e.g. "ai assistant do it", "ai assisstand do it")
  const affirmativePhrases = [
    'do it',
    'assisstand do it',
    'assistant do it',
    'ai do it',
    'please do it',
    'yes do it',
    'go ahead',
    'proceed',
    'apply',
    'confirm and apply',
    'сделай',
    'выполни',
    'примени',
    'подтверждаю',
    'давай',
    '执行',
    '确认',
    '做吧',
    '好的',
  ]
  if (affirmativePhrases.some((p) => normalized.includes(p))) return true

  const firstWord = normalized.split(/\s+/)[0]
  return CONFIRMATION_WORDS.has(firstWord)
}

function isRejection(text: string): boolean {
  const normalized = text.toLowerCase().trim().replace(/[.,!?;:'"“”]/g, '')
  if (REJECTION_WORDS.has(normalized)) return true
  const firstWord = normalized.split(/\s+/)[0]
  return REJECTION_WORDS.has(firstWord)
}

export async function POST(request: NextRequest) {
  let user: any
  try {
    user = await requireRole(request, ['ADMIN'])
  } catch (error) {
    return createAuthErrorResponse(error as Error)
  }

  try {
    const body: ChatRequestPayload = await request.json()
    const { messages = [], locale = 'en', pendingAction = null } = body

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No messages provided.' },
        { status: 400 }
      )
    }

    const latestUserMessage = messages[messages.length - 1]
    const userText = latestUserMessage?.content?.trim() || ''

    // =========================================================================
    // SAFETY FLOW: Check if the user is confirming/rejecting an active proposal
    // =========================================================================
    if (pendingAction && pendingAction.status === 'PENDING') {
      if (isConfirmation(userText)) {
        // EXECUTE CONFIRMED WRITE OPERATION
        try {
          let executionResult: any = null

          if (pendingAction.type === 'createCategories') {
            const categories = pendingAction.payload.categories || []
            executionResult = await createCategories(categories, user.id, locale)

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Successfully created ${executionResult.createdCount} categories with multilingual translations!**\n\n` +
                executionResult.categories.map((c: any) => `- **${c.name}** (slug: \`${c.slug}\`, level: ${c.level})`).join('\n') +
                `\n\nAll changes have been committed to the database and logged to the audit ledger.`,
              ru: `✅ **Успешно создано ${executionResult.createdCount} категорий с многоязычными переводами!**\n\n` +
                executionResult.categories.map((c: any) => `- **${c.name}** (slug: \`${c.slug}\`, уровень: ${c.level})`).join('\n') +
                `\n\nВсе изменения сохранены в базе данных и зафиксированы в журнале аудита.`,
              zh: `✅ **已成功创建 ${executionResult.createdCount} 个分类并生成多语言翻译！**\n\n` +
                executionResult.categories.map((c: any) => `- **${c.name}** (slug: \`${c.slug}\`, 层级: ${c.level})`).join('\n') +
                `\n\n所有数据已写入数据库并在审计日志中登记。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'createCategories',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }

          if (pendingAction.type === 'createAttributes') {
            const attributes = pendingAction.payload.attributes || []
            executionResult = await createAttributes(attributes, user.id, locale)

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Successfully created ${executionResult.createdCount} attributes with translations!**\n\n` +
                executionResult.attributes.map((a: any) => `- **${a.name}** (type: \`${a.type}\`, slug: \`${a.slug}\`)`).join('\n') +
                `\n\nAttributes are now available for product specifications and filters.`,
              ru: `✅ **Успешно создано ${executionResult.createdCount} атрибутов с переводами!**\n\n` +
                executionResult.attributes.map((a: any) => `- **${a.name}** (тип: \`${a.type}\`, slug: \`${a.slug}\`)`).join('\n') +
                `\n\nАтрибуты теперь доступны для характеристик и фильтрации товаров.`,
              zh: `✅ **已成功创建 ${executionResult.createdCount} 个商品属性及多语言翻译！**\n\n` +
                executionResult.attributes.map((a: any) => `- **${a.name}** (类型: \`${a.type}\`, slug: \`${a.slug}\`)`).join('\n') +
                `\n\n属性已可用于商品规格配置与筛选。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'createAttributes',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }

          if (pendingAction.type === 'bulkTranslate') {
            const tr = pendingAction.payload.translations
            executionResult = await bulkTranslate(
              tr!.type,
              tr!.itemIds,
              tr?.targetLocales || ['ru', 'zh'],
              user.id
            )

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Translation completed!**\n\n` +
                `- Successfully translated: **${executionResult.translatedCount.success}** items\n` +
                `- Failed: **${executionResult.translatedCount.failed}** items\n\n` +
                `Translations were generated via the AI Gateway and saved to the database.`,
              ru: `✅ **Перевод завершён!**\n\n` +
                `- Успешно переведено: **${executionResult.translatedCount.success}** элементов\n` +
                `- Ошибок: **${executionResult.translatedCount.failed}** элементов\n\n` +
                `Переводы сгенерированы через AI Gateway и сохранены в базе данных.`,
              zh: `✅ **批量翻译已完成！**\n\n` +
                `- 成功翻译：**${executionResult.translatedCount.success}** 个项目\n` +
                `- 失败：**${executionResult.translatedCount.failed}** 个项目\n\n` +
                `翻译结果已由 AI Gateway 生成并存入数据库。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'bulkTranslate',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }

          if (pendingAction.type === 'createProducts') {
            const products = pendingAction.payload.products || (pendingAction.payload as any) || []
            executionResult = await createProducts(products, user.id, locale)

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Successfully created ${executionResult.createdCount} products!**\n\n` +
                executionResult.products.map((p: any) => `- **${p.name}** (SKU: \`${p.sku}\`, Price: $${p.price})`).join('\n') +
                `\n\nProducts and their multilingual translations are now live in the catalog.`,
              ru: `✅ **Успешно создано ${executionResult.createdCount} товаров!**\n\n` +
                executionResult.products.map((p: any) => `- **${p.name}** (Артикул: \`${p.sku}\`, Цена: $${p.price})`).join('\n') +
                `\n\nТовары и их многоязычные переводы добавлены в каталог.`,
              zh: `✅ **已成功创建 ${executionResult.createdCount} 个商品！**\n\n` +
                executionResult.products.map((p: any) => `- **${p.name}** (SKU: \`${p.sku}\`, 售价: $${p.price})`).join('\n') +
                `\n\n商品及其多语言翻译现已正式录入商城系统。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'createProducts',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }

          if (pendingAction.type === 'updateCategories') {
            const categories =
              pendingAction.payload.categoryUpdates ||
              pendingAction.payload.categories ||
              (pendingAction.payload as any) ||
              []
            executionResult = await updateCategories(categories, user.id, locale)

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Successfully updated ${executionResult.updatedCount} categories!**\n\n` +
                executionResult.categories.map((c: any) => `- **${c.name}** (slug: \`${c.slug}\`, level: ${c.level})`).join('\n') +
                `\n\nDatabase and category hierarchies have been updated.`,
              ru: `✅ **Успешно обновлено ${executionResult.updatedCount} категорий!**\n\n` +
                executionResult.categories.map((c: any) => `- **${c.name}** (slug: \`${c.slug}\`, уровень: ${c.level})`).join('\n') +
                `\n\nБаза данных и структура категорий обновлены.`,
              zh: `✅ **已成功更新 ${executionResult.updatedCount} 个分类！**\n\n` +
                executionResult.categories.map((c: any) => `- **${c.name}** (slug: \`${c.slug}\`, 层级: ${c.level})`).join('\n') +
                `\n\n分类层级结构已在数据库中生效。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'updateCategories',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }

          if (pendingAction.type === 'updateProducts') {
            const products =
              pendingAction.payload.productUpdates ||
              pendingAction.payload.products ||
              (pendingAction.payload as any) ||
              []
            executionResult = await updateProducts(products, user.id, locale)

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Successfully updated ${executionResult.updatedCount} products!**\n\n` +
                executionResult.products.map((p: any) => `- **${p.name}** (SKU: \`${p.sku}\`, Price: $${p.price})`).join('\n') +
                `\n\nCatalog records and specifications have been updated.`,
              ru: `✅ **Успешно обновлено ${executionResult.updatedCount} товаров!**\n\n` +
                executionResult.products.map((p: any) => `- **${p.name}** (Артикул: \`${p.sku}\`, Цена: $${p.price})`).join('\n') +
                `\n\nХарактеристики и цены товаров обновлены.`,
              zh: `✅ **已成功更新 ${executionResult.updatedCount} 个商品！**\n\n` +
                executionResult.products.map((p: any) => `- **${p.name}** (SKU: \`${p.sku}\`, 售价: $${p.price})`).join('\n') +
                `\n\n商品信息与规格参数已更新。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'updateProducts',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }

          if (pendingAction.type === 'createSliders') {
            const sliders = pendingAction.payload.sliders || (pendingAction.payload as any) || []
            executionResult = await createSliders(sliders, user.id, locale)

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Successfully created ${executionResult.createdCount} hero slides with translations!**\n\n` +
                executionResult.sliders.map((s: any) => `- **${s.title}** (Link: \`${s.ctaLink}\`)`).join('\n') +
                `\n\nSlides are now active on the storefront.`,
              ru: `✅ **Успешно создано ${executionResult.createdCount} слайдов с переводами!**\n\n` +
                executionResult.sliders.map((s: any) => `- **${s.title}** (Ссылка: \`${s.ctaLink}\`)`).join('\n') +
                `\n\nСлайды теперь активны на главной странице витрины.`,
              zh: `✅ **已成功创建 ${executionResult.createdCount} 个轮播图横幅及多语言翻译！**\n\n` +
                executionResult.sliders.map((s: any) => `- **${s.title}** (链接: \`${s.ctaLink}\`)`).join('\n') +
                `\n\n横幅已在商城首页展示。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'createSliders',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }

          if (pendingAction.type === 'updateSliders') {
            const sliders = pendingAction.payload.sliders || (pendingAction.payload as any) || []
            executionResult = await updateSliders(sliders, user.id, locale)

            const successMessages: Record<AdminChatLocale, string> = {
              en: `✅ **Successfully updated ${executionResult.updatedCount} hero slides!**\n\n` +
                executionResult.sliders.map((s: any) => `- **${s.title}** (Link: \`${s.ctaLink}\`)`).join('\n') +
                `\n\nChanges are now live on the storefront.`,
              ru: `✅ **Успешно обновлено ${executionResult.updatedCount} слайдов!**\n\n` +
                executionResult.sliders.map((s: any) => `- **${s.title}** (Ссылка: \`${s.ctaLink}\`)`).join('\n') +
                `\n\nИзменения применены на витрине.`,
              zh: `✅ **已成功更新 ${executionResult.updatedCount} 个轮播图横幅！**\n\n` +
                executionResult.sliders.map((s: any) => `- **${s.title}** (链接: \`${s.ctaLink}\`)`).join('\n') +
                `\n\n首页横幅已更新。`,
            }

            return NextResponse.json({
              success: true,
              role: 'assistant',
              content: successMessages[locale] || successMessages.en,
              actionExecuted: {
                type: 'updateSliders',
                status: 'SUCCESS',
                summary: pendingAction.summary,
                details: executionResult,
              },
              pendingAction: null,
            })
          }
        } catch (execError: any) {
          console.error('[AI Assistant Action Error]:', execError)
          return NextResponse.json({
            success: false,
            role: 'assistant',
            content: `❌ Error executing action: ${execError.message}`,
            pendingAction: null,
          })
        }
      } else if (isRejection(userText)) {
        // CANCEL PENDING OPERATION
        const cancelMessages: Record<AdminChatLocale, string> = {
          en: `❌ **Action cancelled.** No changes were made to the database. How else can I assist you?`,
          ru: `❌ **Действие отменено.** Изменения в базу данных не вносились. Чем ещё я могу помочь?`,
          zh: `❌ **操作已取消。** 数据库未发生任何改动。请问还需要其他帮助吗？`,
        }

        return NextResponse.json({
          success: true,
          role: 'assistant',
          content: cancelMessages[locale] || cancelMessages.en,
          pendingAction: null,
        })
      }
    }

    // =========================================================================
    // DIRECT COMMAND / INTENT INTERCEPTION FOR TRANSLATING MISSING CATEGORIES
    // =========================================================================
    const lowerUserText = userText.toLowerCase()
    const isCategoryTranslationDirectCmd =
      (lowerUserText.includes('categor') || lowerUserText.includes('категор') || lowerUserText.includes('分类')) &&
      (lowerUserText.includes('miss') || lowerUserText.includes('пропущ') || lowerUserText.includes('неперевед') || lowerUserText.includes('未翻译') || lowerUserText.includes('translat') || lowerUserText.includes('перевод') || lowerUserText.includes('翻译')) &&
      (isConfirmation(userText) || lowerUserText.includes('correct') || lowerUserText.includes('fix') || lowerUserText.includes('сделай') || lowerUserText.includes('исправ') || lowerUserText.includes('执行') || lowerUserText.includes('修复'))

    const isDirectConfirmationWithoutPending =
      !pendingAction &&
      isConfirmation(userText) &&
      messages.length > 1 &&
      messages.slice(-3).some((m) => {
        const text = m.content.toLowerCase()
        return (
          text.includes('categor') ||
          text.includes('категор') ||
          text.includes('translat') ||
          text.includes('перевод') ||
          text.includes('missed')
        )
      })

    if (isCategoryTranslationDirectCmd || isDirectConfirmationWithoutPending) {
      try {
        const executionResult = await bulkTranslate('categories', [], ['ru', 'zh'], user.id)
        const successMessages: Record<AdminChatLocale, string> = {
          en: `✅ **Successfully updated missing category translations!**\n\n` +
            `- **${executionResult.translatedCount.success}** categories were translated into Russian (RU) and Chinese (ZH).\n` +
            `- All category translations have been saved to the database.\n\n` +
            `Storefront menus and filters now display complete multilingual category names.`,
          ru: `✅ **Пропущенные переводы категорий успешно добавлены!**\n\n` +
            `- **${executionResult.translatedCount.success}** категорий переведено на русский (RU) и китайский (ZH).\n` +
            `- Все переводы сохранены в базу данных.\n\n` +
            `Меню и фильтры каталога теперь отображаются на всех поддерживаемых языках.`,
          zh: `✅ **已成功补充所有缺失的分类多语言翻译！**\n\n` +
            `- 共为 **${executionResult.translatedCount.success}** 个分类生成俄语 (RU) 和中文 (ZH) 翻译。\n` +
            `- 数据已正式写入数据库。\n\n` +
            `商城前台菜单与分类筛选现已支持完整多语言显示。`,
        }

        return NextResponse.json({
          success: true,
          role: 'assistant',
          content: successMessages[locale] || successMessages.en,
          actionExecuted: {
            type: 'bulkTranslate',
            status: 'SUCCESS',
            summary: 'Translate all missing categories to Russian and Chinese',
            details: executionResult,
          },
          pendingAction: null,
        })
      } catch (err: any) {
        console.error('[Direct Category Translation Error]:', err)
      }
    }

    // =========================================================================
    // INTENT & CONTEXT ENRICHMENT: Run read tools to supply real catalog data
    // =========================================================================
    let contextData = ''

    // 1. Category Context
    if (
      lowerUserText.includes('categor') ||
      lowerUserText.includes('категор') ||
      lowerUserText.includes('分类') ||
      lowerUserText.includes('tree') ||
      lowerUserText.includes('дерев') ||
      lowerUserText.includes('hierarchy') ||
      lowerUserText.includes('иерарх')
    ) {
      const missing = await getMissingCategories(userText)
      const tree = await getCategoryTree()
      const untranslatedCats = await getUntranslatedContent('categories', 150)
      contextData += `\n[CATEGORY TAXONOMY DATA]:\nTotal Existing: ${missing.totalExistingCategories}\nUncategorized Products: ${missing.uncategorizedProductsCount}\nExisting Categories Sample:\n${JSON.stringify(missing.existingCategoriesSample.slice(0, 15), null, 2)}\nUntranslated Categories Total: ${untranslatedCats.totalUntranslated}\nSample Untranslated Categories:\n${JSON.stringify(untranslatedCats.sampleItems.slice(0, 30), null, 2)}\nSuggested Missing Branches:\n${JSON.stringify(missing.suggestions, null, 2)}\n`
    }

    // 2. Attribute Context
    if (
      lowerUserText.includes('attribut') ||
      lowerUserText.includes('атрибут') ||
      lowerUserText.includes('属性') ||
      lowerUserText.includes('spec') ||
      lowerUserText.includes('характеристик')
    ) {
      const attrs = await getExistingAttributes()
      contextData += `\n[ATTRIBUTES DATA]:\nTotal Attributes: ${attrs.totalAttributes}\nExisting Attributes List:\n${JSON.stringify(attrs.attributes.map((a) => ({ name: a.name, slug: a.slug, type: a.type, options: a.options })), null, 2)}\n`
    }

    // 3. Translation Context
    if (
      lowerUserText.includes('translat') ||
      lowerUserText.includes('перевод') ||
      lowerUserText.includes('翻译') ||
      lowerUserText.includes('untranslated') ||
      lowerUserText.includes('непереведен') ||
      lowerUserText.includes('未翻译') ||
      lowerUserText.includes('missed') ||
      lowerUserText.includes('пропущ')
    ) {
      const [untranslatedProds, untranslatedCats, untranslatedSlides] = await Promise.all([
        getUntranslatedContent('products', 10),
        getUntranslatedContent('categories', 150),
        getUntranslatedContent('sliders', 10),
      ])
      contextData += `\n[UNTRANSLATED CONTENT DATA]:\nUntranslated Products Count: ${untranslatedProds.totalUntranslated}\nUntranslated Categories Count: ${untranslatedCats.totalUntranslated}\nSample Untranslated Categories (IDs & Names):\n${JSON.stringify(untranslatedCats.sampleItems.map(c => ({ id: c.id, name: c.name })), null, 2)}\nUntranslated Hero Sliders Count: ${untranslatedSlides.totalUntranslated}\n`
    }

    // 4. Hero Slider / Banner Context
    if (
      lowerUserText.includes('slider') ||
      lowerUserText.includes('slide') ||
      lowerUserText.includes('banner') ||
      lowerUserText.includes('слайдер') ||
      lowerUserText.includes('баннер') ||
      lowerUserText.includes('轮播') ||
      lowerUserText.includes('幻灯片')
    ) {
      const sliders = await getExistingSliders()
      contextData += `\n[HERO SLIDERS DATA]:\nTotal Slides: ${sliders.total}\nExisting Slides:\n${JSON.stringify(sliders.slides, null, 2)}\n`
    }

    // 5. Product Context
    if (
      lowerUserText.includes('product') ||
      lowerUserText.includes('товар') ||
      lowerUserText.includes('商品') ||
      lowerUserText.includes('sample') ||
      lowerUserText.includes('образец') ||
      lowerUserText.includes('item')
    ) {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { id: true, name: true, slug: true },
        take: 30,
      })
      contextData += `\n[AVAILABLE CATEGORIES FOR PRODUCTS]:\n${JSON.stringify(categories.map((c: { name: string }) => c.name), null, 2)}\n`
    }

    // 5. General Stats Context if context is still sparse
    if (!contextData) {
      const stats = await getProductStats()
      contextData = `[CATALOG OVERVIEW STATS]:\nTotal Products: ${stats.totalProducts}\nActive Products: ${stats.activeProducts}\nCategorized: ${stats.categorizedProducts}\nUncategorized: ${stats.uncategorizedProducts}\nLow Stock: ${stats.lowStockProducts}\n`
    }

    // =========================================================================
    // CALL AI GATEWAY
    // =========================================================================
    const aiResponse = await generateAssistantResponse({
      messages,
      locale,
      contextData,
    })

    return NextResponse.json({
      success: true,
      role: 'assistant',
      content: aiResponse.content,
      pendingAction: aiResponse.pendingAction || null,
      provider: aiResponse.providerUsed,
      model: aiResponse.modelUsed,
    })
  } catch (error: any) {
    console.error('[AI Assistant Chat Route Error]:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to generate response from AI Assistant.',
      },
      { status: 500 }
    )
  }
}
