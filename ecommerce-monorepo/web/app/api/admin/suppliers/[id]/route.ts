export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// GET /api/admin/suppliers/[id] - Get single supplier
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        purchaseOrders: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
        translations: true,
      },
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json({ supplier })
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json({ error: 'Failed to fetch supplier' }, { status: 500 })
  }
}

// PUT /api/admin/suppliers/[id] - Update supplier
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        name: body.name,
        companyName: body.companyName,
        email: body.email,
        phone: body.phone,
        address: body.address,
        contactPerson: body.contactPerson,
        taxId: body.taxId,
        paymentTerms: body.paymentTerms,
        currency: body.currency,
        notes: body.notes,
        isActive: body.isActive,
      },
    })

    // Dual-write: upsert per-locale supplier translations, keep legacy `en` synced.
    if (Array.isArray(body.translations)) {
      await prisma.$transaction(
        body.translations
          .filter((t: any) => t && t.locale && (t.name ?? '').trim())
          .map((t: any) =>
            prisma.supplierTranslation.upsert({
              where: { supplierId_locale: { supplierId: params.id, locale: t.locale } },
              create: {
                supplierId: params.id,
                locale: t.locale,
                name: t.name.trim(),
                description: (t.description ?? '').trim() || null,
                profileText: (t.profileText ?? '').trim() || null,
              },
              update: {
                name: t.name.trim(),
                description: (t.description ?? '').trim() || null,
                profileText: (t.profileText ?? '').trim() || null,
              },
            })
          )
      )
      const en = body.translations.find((t: any) => t.locale === 'en' && (t.name ?? '').trim())
      if (en) {
        await prisma.supplier.update({
          where: { id: params.id },
          data: {
            name: en.name.trim(),
            notes: (en.description ?? '').trim() || body.notes,
          },
        })
      }
    }

    const withTranslations = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: { translations: true },
    })

    return NextResponse.json({ supplier: withTranslations })
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json({ error: 'Failed to update supplier' }, { status: 500 })
  }
}

// DELETE /api/admin/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if supplier has purchase orders
    const supplierWithOrders = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            purchaseOrders: true,
          },
        },
      },
    })

    if (supplierWithOrders && supplierWithOrders._count.purchaseOrders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete supplier with existing purchase orders' },
        { status: 400 }
      )
    }

    await prisma.supplier.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json({ error: 'Failed to delete supplier' }, { status: 500 })
  }
}
