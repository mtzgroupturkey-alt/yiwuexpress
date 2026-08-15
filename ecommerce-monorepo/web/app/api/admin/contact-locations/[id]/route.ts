export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await req.json()
    const { type, city, address, phone, email, hours, sortOrder, isActive, translations } = body

    if (!city) {
      return NextResponse.json({ error: 'City is required' }, { status: 400 })
    }

    const en = Array.isArray(translations)
      ? translations.find((t: any) => t.locale === 'en')
      : undefined

    const location = await prisma.contactLocation.update({
      where: { id },
      data: {
        type: type || 'HUB',
        city: en?.city ?? city,
        address: address === '' ? null : (en?.address ?? address) ?? undefined,
        phone: phone === '' ? null : phone ?? undefined,
        email: email === '' ? null : email ?? undefined,
        hours: hours === '' ? null : (en?.hours ?? hours) ?? undefined,
        sortOrder: sortOrder ?? undefined,
        isActive: isActive ?? undefined,
      },
    })

    if (Array.isArray(translations)) {
      for (const t of translations) {
        if (!t.locale) continue
        await prisma.contactLocationTranslation.upsert({
          where: { contactLocationId_locale: { contactLocationId: id, locale: t.locale } },
          create: {
            contactLocationId: id,
            locale: t.locale,
            city: t.city ?? location.city,
            address: t.address ?? null,
            hours: t.hours ?? null,
          },
          update: { city: t.city ?? location.city, address: t.address ?? null, hours: t.hours ?? null },
        })
      }
    }

    return NextResponse.json({ data: location })
  } catch (error) {
    console.error('Error updating contact location:', error)
    return NextResponse.json({ error: 'Failed to update contact location' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    await prisma.contactLocation.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting contact location:', error)
    return NextResponse.json({ error: 'Failed to delete contact location' }, { status: 500 })
  }
}
