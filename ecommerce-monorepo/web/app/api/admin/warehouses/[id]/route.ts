export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

// GET /api/admin/warehouses/[id] - Warehouse detail with full location hierarchy
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const warehouse = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        zones: {
          include: {
            bays: {
              include: {
                slots: {
                  include: {
                    stocks: {
                      include: {
                        product: {
                          select: { id: true, name: true, sku: true, thumbnail: true },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { code: 'asc' },
        },
        _count: {
          select: {
            stocks: true,
            sourceContainers: true,
            destContainers: true,
            orders: true,
            purchaseOrders: true,
          },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: warehouse });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// PUT /api/admin/warehouses/[id] - Update warehouse
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const body = await request.json();
    const {
      name,
      type,
      country,
      city,
      address,
      contactPerson,
      contactPhone,
      contactEmail,
      isActive,
      isDefaultProcurement,
      isDefaultSales,
      notes,
    } = body;

    const updated = await prisma.$transaction(async (tx) => {
      if (isDefaultProcurement) {
        await tx.warehouse.updateMany({
          where: { isDefaultProcurement: true, NOT: { id: params.id } },
          data: { isDefaultProcurement: false },
        });
      }

      if (isDefaultSales) {
        await tx.warehouse.updateMany({
          where: { isDefaultSales: true, NOT: { id: params.id } },
          data: { isDefaultSales: false },
        });
      }

      const data: any = {};
      if (name !== undefined) data.name = name;
      if (type !== undefined) data.type = type;
      if (country !== undefined) data.country = country;
      if (city !== undefined) data.city = city;
      if (address !== undefined) data.address = address;
      if (contactPerson !== undefined) data.contactPerson = contactPerson;
      if (contactPhone !== undefined) data.contactPhone = contactPhone;
      if (contactEmail !== undefined) data.contactEmail = contactEmail;
      if (isActive !== undefined) data.isActive = Boolean(isActive);
      if (isDefaultProcurement !== undefined) data.isDefaultProcurement = Boolean(isDefaultProcurement);
      if (isDefaultSales !== undefined) data.isDefaultSales = Boolean(isDefaultSales);
      if (notes !== undefined) data.notes = notes;

      return await tx.warehouse.update({
        where: { id: params.id },
        data,
      });
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}

// DELETE /api/admin/warehouses/[id] - Remove warehouse
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireRole(request, ['ADMIN']);

    const existing = await prisma.warehouse.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: {
            stocks: true,
            orders: true,
            purchaseOrders: true,
            sourceContainers: true,
            destContainers: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 });
    }

    if (
      existing._count.stocks > 0 ||
      existing._count.orders > 0 ||
      existing._count.purchaseOrders > 0 ||
      existing._count.sourceContainers > 0 ||
      existing._count.destContainers > 0
    ) {
      return NextResponse.json(
        {
          error:
            'Cannot delete warehouse with active stock, orders, or container records. Deactivate it instead.',
        },
        { status: 400 }
      );
    }

    await prisma.warehouse.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true, message: 'Warehouse deleted successfully' });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
