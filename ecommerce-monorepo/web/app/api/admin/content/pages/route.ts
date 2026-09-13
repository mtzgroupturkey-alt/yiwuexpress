export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

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

export async function GET(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const pages = await prisma.pageContent.findMany({
      orderBy: { updatedAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: pages })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { slug, title, content, metaTitle, metaDesc, isPublished = true } = body

    if (!slug || !title || !content) {
      return NextResponse.json({ error: 'Slug, title, and content are required' }, { status: 400 })
    }

    const page = await prisma.pageContent.upsert({
      where: { slug: slug.toLowerCase().trim() },
      create: {
        slug: slug.toLowerCase().trim(),
        title,
        content,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        isPublished,
        author: admin.role,
      },
      update: {
        title,
        content,
        metaTitle: metaTitle || null,
        metaDesc: metaDesc || null,
        isPublished,
      },
    })

    return NextResponse.json({ success: true, data: page })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
