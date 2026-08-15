export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'

async function checkAdmin(req: NextRequest) {
  const token = getTokenFromRequest(req)
  const payload = token ? verifyToken(token) : null
  return payload && payload.role === 'ADMIN'
}

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    if (!await checkAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testimonialId = params.id
    const body = await req.json()
    const { name, company, role, quote, rating, avatar, image, isFeatured, translations } = body

    const updateData: any = {
      ...(name && { name }),
      ...(company && { company }),
      ...(role && { role }),
      ...(quote && { quote }),
      ...(rating !== undefined && { rating: Number(rating) }),
      ...(avatar !== undefined && { avatar }),
      ...(image !== undefined && { image }),
      ...(isFeatured !== undefined && { isFeatured: !!isFeatured })
    }

    const en = Array.isArray(translations)
      ? translations.find((t: any) => t.locale === 'en')
      : undefined

    if (en) {
      updateData.quote = en.quote ?? updateData.quote
      updateData.role = en.role ?? null
      updateData.company = en.company ?? null
    }

    const updated = await prisma.testimonial.update({
      where: { id: testimonialId },
      data: updateData
    })

    if (Array.isArray(translations)) {
      for (const t of translations) {
        if (!t.locale) continue
        await prisma.testimonialTranslation.upsert({
          where: { testimonialId_locale: { testimonialId: testimonialId, locale: t.locale } },
          create: {
            testimonialId: testimonialId,
            locale: t.locale,
            quote: t.quote ?? '',
            role: t.role ?? null,
            company: t.company ?? null
          },
          update: {
            quote: t.quote ?? '',
            role: t.role ?? null,
            company: t.company ?? null
          }
        })
      }
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Error updating testimonial:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    if (!await checkAdmin(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const testimonialId = params.id
    await prisma.testimonial.delete({
      where: { id: testimonialId }
    })

    return NextResponse.json({ success: true, message: 'Testimonial deleted' })
  } catch (error) {
    console.error('Error deleting testimonial:', error)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
