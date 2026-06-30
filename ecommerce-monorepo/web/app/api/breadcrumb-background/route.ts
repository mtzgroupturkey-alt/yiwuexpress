import { NextRequest, NextResponse } from 'next/server'
import { getBreadcrumbBackground, getBreadcrumbBackgroundWithParentFallback } from '@/lib/breadcrumb-service'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const pageSlug = searchParams.get('pageSlug')
    const categoryId = searchParams.get('categoryId')

    console.log('[API] breadcrumb-background called with:', { pageSlug, categoryId })

    let setting = null

    if (categoryId) {
      // Category-specific breadcrumb with parent fallback
      console.log('[API] Looking for category setting with parent fallback:', categoryId)
      setting = await getBreadcrumbBackgroundWithParentFallback(categoryId)
    } else if (pageSlug) {
      // Static page breadcrumb
      console.log('[API] Looking for static page setting:', pageSlug)
      setting = await getBreadcrumbBackground({
        pageType: 'static',
        pageSlug
      })
    }

    // If no specific setting found, try shop_default
    if (!setting) {
      console.log('[API] No specific setting found, trying shop_default')
      setting = await getBreadcrumbBackground({
        pageType: 'shop_default'
      })
      console.log('[API] Shop default setting result:', setting)
    }

    console.log('[API] Final setting to return:', setting)

    return NextResponse.json({
      success: true,
      setting,
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