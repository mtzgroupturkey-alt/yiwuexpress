export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAuthUser } from '@/lib/auth'

// PUT - Update breadcrumb setting
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { pageType, pageSlug, categoryId, imageUrl, mobileImageUrl, overlayColor, title, subtitle, isActive, translations } = body

    if (!params.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const en = Array.isArray(translations)
      ? translations.find((t: any) => t.locale === 'en')
      : undefined

    const setting = await prisma.breadcrumbSetting.update({
      where: { id: params.id },
      data: {
        pageType,
        pageSlug: pageType === 'static' ? pageSlug : null,
        categoryId: pageType === 'category' ? categoryId : null,
        imageUrl,
        mobileImageUrl: mobileImageUrl || null,
        overlayColor: overlayColor || null,
        title: en?.title ?? title ?? null,
        subtitle: en?.subtitle ?? subtitle ?? null,
        isActive,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    })

    if (Array.isArray(translations)) {
      for (const t of translations) {
        if (!t.locale) continue
        await prisma.pageBannerTranslation.upsert({
          where: { pageBannerId_locale: { pageBannerId: params.id, locale: t.locale } },
          create: {
            pageBannerId: params.id,
            locale: t.locale,
            title: t.title ?? null,
            subtitle: t.subtitle ?? null,
          },
          update: { title: t.title ?? null, subtitle: t.subtitle ?? null },
        })
      }
    }

    return NextResponse.json({ data: setting })
  } catch (error) {
    console.error('Error updating breadcrumb setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete breadcrumb setting
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(req)
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!params.id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    await prisma.breadcrumbSetting.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting breadcrumb setting:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
