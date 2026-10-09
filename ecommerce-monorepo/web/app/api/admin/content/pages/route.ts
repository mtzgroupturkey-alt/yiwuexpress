export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { DEFAULT_PAGE_CONTENTS, invalidatePageCache } from '@/lib/contentPages'

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const payload = verifyToken(token)
  if (!payload?.userId) return null
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, role: true },
  })
  return user?.role === 'ADMIN' ? user : null
}

// Ensure default system pages (like register-b2b) exist in database
async function ensureDefaultPages() {
  const defaultKeys = Object.keys(DEFAULT_PAGE_CONTENTS)
  for (const slug of defaultKeys) {
    const existing = await prisma.pageContent.findUnique({
      where: { slug }
    })
    if (!existing) {
      const defEn = DEFAULT_PAGE_CONTENTS[slug].en
      const defRu = DEFAULT_PAGE_CONTENTS[slug].ru
      const defZh = DEFAULT_PAGE_CONTENTS[slug].zh

      await prisma.pageContent.create({
        data: {
          slug,
          title: defEn.title,
          subtitle: defEn.subtitle,
          badge: defEn.badge,
          content: defEn.content || '',
          metaTitle: defEn.metaTitle,
          metaDesc: defEn.metaDesc,
          sections: defEn.sections || {},
          isPublished: true,
          author: 'SYSTEM',
          translations: {
            create: [
              {
                locale: 'ru',
                title: defRu.title,
                subtitle: defRu.subtitle,
                badge: defRu.badge,
                content: defRu.content || '',
                metaTitle: defRu.metaTitle,
                metaDesc: defRu.metaDesc,
                sections: defRu.sections || {}
              },
              {
                locale: 'zh',
                title: defZh.title,
                subtitle: defZh.subtitle,
                badge: defZh.badge,
                content: defZh.content || '',
                metaTitle: defZh.metaTitle,
                metaDesc: defZh.metaDesc,
                sections: defZh.sections || {}
              }
            ]
          }
        }
      })
    }
  }
}

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Seed defaults if missing
    await ensureDefaultPages()

    const pages = await prisma.pageContent.findMany({
      include: {
        translations: true
      },
      orderBy: { updatedAt: 'desc' },
    })

    return NextResponse.json({ success: true, data: pages })
  } catch (error: any) {
    console.error('[API Admin Pages GET] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      slug,
      title,
      subtitle = '',
      badge = '',
      content = '',
      metaTitle = '',
      metaDesc = '',
      sections = {},
      isPublished = true,
      translations = [] // Array of { locale, title, subtitle, badge, content, metaTitle, metaDesc, sections }
    } = body

    if (!slug || !title) {
      return NextResponse.json({ error: 'Slug and title are required' }, { status: 400 })
    }

    const normSlug = slug.toLowerCase().trim()

    // Upsert main page content (English canonical row)
    const page = await prisma.pageContent.upsert({
      where: { slug: normSlug },
      create: {
        slug: normSlug,
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        badge: badge?.trim() || null,
        content: content || '',
        metaTitle: metaTitle?.trim() || null,
        metaDesc: metaDesc?.trim() || null,
        sections: sections || {},
        isPublished: isPublished !== false,
        author: admin.role,
      },
      update: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        badge: badge?.trim() || null,
        content: content || '',
        metaTitle: metaTitle?.trim() || null,
        metaDesc: metaDesc?.trim() || null,
        sections: sections || {},
        isPublished: isPublished !== false,
      },
    })

    // Upsert any locale translations provided (ru, zh, etc.)
    if (Array.isArray(translations) && translations.length > 0) {
      for (const t of translations) {
        if (!t.locale || t.locale === 'en') continue

        await prisma.pageContentTranslation.upsert({
          where: {
            pageId_locale: {
              pageId: page.id,
              locale: t.locale
            }
          },
          create: {
            pageId: page.id,
            locale: t.locale,
            title: t.title?.trim() || null,
            subtitle: t.subtitle?.trim() || null,
            badge: t.badge?.trim() || null,
            content: t.content || '',
            metaTitle: t.metaTitle?.trim() || null,
            metaDesc: t.metaDesc?.trim() || null,
            sections: t.sections || {}
          },
          update: {
            title: t.title?.trim() || null,
            subtitle: t.subtitle?.trim() || null,
            badge: t.badge?.trim() || null,
            content: t.content || '',
            metaTitle: t.metaTitle?.trim() || null,
            metaDesc: t.metaDesc?.trim() || null,
            sections: t.sections || {}
          }
        })
      }
    }

    // Invalidate in-memory cache
    invalidatePageCache(normSlug)

    // Return the updated page with its translations
    const updated = await prisma.pageContent.findUnique({
      where: { id: page.id },
      include: {
        translations: true
      }
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error('[API Admin Pages POST] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
