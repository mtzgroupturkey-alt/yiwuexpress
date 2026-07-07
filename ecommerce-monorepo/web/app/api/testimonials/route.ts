import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const featuredOnly = searchParams.get('featured') === 'true'

    const testimonials = await prisma.testimonial.findMany({
      where: featuredOnly ? { isFeatured: true } : {},
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ success: true, data: testimonials })
  } catch (error) {
    console.error('Error fetching testimonials:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req)
    const payload = token ? verifyToken(token) : null
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, company, role, quote, rating = 5, avatar, image, isFeatured = false } = body

    if (!name || !company || !role || !quote) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        name,
        company,
        role,
        quote,
        rating: Number(rating),
        avatar,
        image,
        isFeatured: !!isFeatured
      }
    })

    return NextResponse.json({ success: true, data: testimonial }, { status: 201 })
  } catch (error) {
    console.error('Error creating testimonial:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
