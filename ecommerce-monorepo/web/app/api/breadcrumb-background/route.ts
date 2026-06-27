import { NextRequest, NextResponse } from 'next/server'
import { getBreadcrumbBackground } from '@/lib/breadcrumb-service'

// GET - Fetch breadcrumb background for a specific page
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const pageSlug = searchParams.get('pageSlug')
    const categoryId = searchParams.get('categoryId')

    if (!pageSlug && !categoryId) {
      return NextResponse.json(
        { error: 'Either pageSlug or categoryId is required' },
        { status: 400 }
      )
    }

    const setting = await getBreadcrumbBackground({
      pageType: categoryId ? 'category' : 'static',
      pageSlug: pageSlug || undefined,
      categoryId: categoryId || undefined,
    })

    return NextResponse.json({ setting })
  } catch (error) {
    console.error('Error fetching breadcrumb background:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
