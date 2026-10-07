export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'
import { PendingAction, AdminChatLocale } from '@/lib/ai-assistant/types'
import {
  createCategories,
  updateCategories,
  createAttributes,
  bulkTranslate,
  createProducts,
  updateProducts,
  deleteEmptyCategories,
} from '@/lib/ai-assistant/tools'

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

      case 'updateCategories': {
        const payload = action.payload || {}
        const categories =
          payload.categoryUpdates ||
          payload.categories ||
          (Array.isArray(payload) ? payload : null) ||
          []

        if (!Array.isArray(categories) || categories.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No categories found for update in action payload.' },
            { status: 400 }
          )
        }
        result = await updateCategories(categories, user.id, locale)
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

        const itemIds = translations?.itemIds || []
        result = await bulkTranslate(
          translations?.type || 'categories',
          itemIds,
          translations?.targetLocales || ['ru', 'zh'],
          user.id
        )
        break
      }

      case 'createProducts': {
        const payload = action.payload || {}
        const products =
          payload.products ||
          (Array.isArray(payload) ? payload : null) ||
          (action as any).products ||
          []

        if (!Array.isArray(products) || products.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No products found in action payload.' },
            { status: 400 }
          )
        }
        result = await createProducts(products, user.id, locale)
        break
      }

      case 'updateProducts': {
        const payload = action.payload || {}
        const products =
          payload.productUpdates ||
          payload.products ||
          (Array.isArray(payload) ? payload : null) ||
          []

        if (!Array.isArray(products) || products.length === 0) {
          return NextResponse.json(
            { success: false, error: 'No products found for update in action payload.' },
            { status: 400 }
          )
        }
        result = await updateProducts(products, user.id, locale)
        break
      }

      case 'deleteEmptyCategories': {
        const payload = action.payload || {}
        const confirmationPhrase = (payload as any).confirmationPhrase || ''
        const categoryIds = (payload as any).categoryIds || []
        result = await deleteEmptyCategories(user.id, confirmationPhrase, categoryIds)
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
