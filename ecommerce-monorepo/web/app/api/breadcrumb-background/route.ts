export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getBreadcrumbBackground, getBreadcrumbBackgroundWithParentFallback } from '@/lib/breadcrumb-service'
import { localizePageBanner } from '@/lib/utils/localize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('pageSlug')
    const categoryId = searchParams.get('categoryId')
    const locale = searchParams.get('locale') || 'en'

    let setting = null

    if (categoryId) {
      setting = await getBreadcrumbBackgroundWithParentFallback(categoryId)
    } else if (pageSlug) {
      setting = await getBreadcrumbBackground({
        pageType: 'static',
        pageSlug
      })
    }

    if (!setting) {
      setting = await getBreadcrumbBackground({
        pageType: 'shop_default'
      })
    }

    if (!setting) {
      setting = { imageUrl: null, mobileImageUrl: null, overlayColor: null, title: null, subtitle: null }
    }

    // Localize title/subtitle when translation data is present.
    const localized = localizePageBanner(setting as any, locale)

    return NextResponse.json({
      success: true,
      setting: localized,
      debug: {
        pageSlug,
        categoryId,
        foundSetting: !!setting,
        settingType: setting ? (categoryId ? 'category-hierarchy' : pageSlug ? 'static' : 'shop_default') : 'none',
        fallbackUsed: categoryId && setting ? 'possible' : 'no'
      }
    })
  } catch (error) {
    console.error('Error fetching breadcrumb background:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch breadcrumb background' },
      { status: 500 }
    )
  }
}