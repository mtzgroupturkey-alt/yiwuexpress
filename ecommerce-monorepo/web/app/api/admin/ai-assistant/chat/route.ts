export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
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
  createAttributes,
  bulkTranslate,
} from '@/lib/ai-assistant/tools'
import { generateAssistantResponse } from '@/lib/ai-assistant/gateway'

// Confirmation trigger dictionaries across supported languages
const CONFIRMATION_WORDS = new Set([
  // English
  'yes', 'confirm', 'ok', 'okay', 'sure', 'proceed', 'approve', 'y', 'yep', 'yeah', 'do it',
  // Russian
  'да', 'подтверждаю', 'ок', 'согласен', 'согласна', 'применить', 'подтвердить', 'давай',
  // Chinese
  '确认', '好的', '可以', '是的', '同意', '执行', '确定', '对',
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
  const normalized = text.toLowerCase().trim().replace(/[.,!?;:]/g, '')
  if (CONFIRMATION_WORDS.has(normalized)) return true
  // Also check if text starts with confirmation word
  const firstWord = normalized.split(/\s+/)[0]
  return CONFIRMATION_WORDS.has(firstWord)
}

function isRejection(text: string): boolean {
  const normalized = text.toLowerCase().trim().replace(/[.,!?;:]/g, '')
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
    // INTENT & CONTEXT ENRICHMENT: Run read tools to supply real catalog data
    // =========================================================================
    let contextData = ''
    const lowerUserText = userText.toLowerCase()

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
      contextData += `\n[CATEGORY TAXONOMY DATA]:\nTotal Existing: ${missing.totalExistingCategories}\nUncategorized Products: ${missing.uncategorizedProductsCount}\nExisting Categories Sample:\n${JSON.stringify(missing.existingCategoriesSample.slice(0, 15), null, 2)}\nSuggested Missing Branches:\n${JSON.stringify(missing.suggestions, null, 2)}\n`
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
      lowerUserText.includes('未翻译')
    ) {
      const [untranslatedProds, untranslatedCats] = await Promise.all([
        getUntranslatedContent('products', 10),
        getUntranslatedContent('categories', 10),
      ])
      contextData += `\n[UNTRANSLATED CONTENT DATA]:\nUntranslated Products Count: ${untranslatedProds.totalUntranslated}\nSample Untranslated Products:\n${JSON.stringify(untranslatedProds.sampleItems, null, 2)}\nUntranslated Categories Count: ${untranslatedCats.totalUntranslated}\nSample Untranslated Categories:\n${JSON.stringify(untranslatedCats.sampleItems, null, 2)}\n`
    }

    // 4. General Stats Context if context is still sparse
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
