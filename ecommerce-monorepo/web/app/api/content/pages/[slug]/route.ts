export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getPageContent } from '@/lib/contentPages'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const locale = searchParams.get('locale') || 'en'
    const slug = params.slug

    if (!slug) {
      return NextResponse.json({ success: false, error: 'Slug is required' }, { status: 400 })
    }

    const page = await getPageContent(slug, locale)

    return NextResponse.json({
      success: true,
      data: page
    })
  } catch (err: any) {
    console.error('[API Public PageContent] Error:', err)
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch page content' },
      { status: 500 }
    )
  }
}
