export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { PendingAction, AdminChatLocale } from '@/lib/ai-assistant/types'
import { createCategories, createAttributes, bulkTranslate } from '@/lib/ai-assistant/tools'

export async function POST(request: NextRequest) {
  let user: any
  try {
    user = await requireRole(request, ['ADMIN'])
  } catch (error) {
    return createAuthErrorResponse(error as Error)
  }

  try {
    const body = await request.json()
    const { action, locale = 'en' }: { action: PendingAction; locale?: AdminChatLocale } = body

    if (!action || !action.type || !action.payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid pending action payload.' },
        { status: 400 }
      )
    }

    let result: any = null

    switch (action.type) {
      case 'createCategories': {
        const payload = action.payload || {}
        const categories =
          payload.categories ||
          (Array.isArray(payload) ? payload : null) ||
          (action as any).categories ||
          []

        if (!Array.isArray(categories) || categories.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No categories found in action payload.' },
            { status: 400 }
          )
        }
        result = await createCategories(categories, user.id, locale)
        break
      }

      case 'createAttributes': {
        const payload = action.payload || {}
        const attributes =
          payload.attributes ||
          (Array.isArray(payload) ? payload : null) ||
          (action as any).attributes ||
          []

        if (!Array.isArray(attributes) || attributes.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No attributes found in action payload.' },
            { status: 400 }
          )
        }
        result = await createAttributes(attributes, user.id, locale)
        break
      }

      case 'bulkTranslate': {
        const payload = action.payload || {}
        const translations = payload.translations || (action as any).translations || payload

        if (!translations || !translations.itemIds || !Array.isArray(translations.itemIds) || translations.itemIds.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No translation items found in action payload.' },
            { status: 400 }
          )
        }
        result = await bulkTranslate(
          translations.type,
          translations.itemIds,
          translations.targetLocales || ['ru', 'zh'],
          user.id
        )
        break
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unsupported action type: ${(action as any).type}` },
          { status: 400 }
        )
    }

    return NextResponse.json({
      success: true,
      actionId: action.id,
      actionType: action.type,
      result,
      message: 'Operation executed successfully.',
    })
  } catch (error: any) {
    console.error('[AI Assistant Execute] Execution failed:', error.stack || error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to execute proposed changes.' },
      { status: 500 }
    )
  }
}
