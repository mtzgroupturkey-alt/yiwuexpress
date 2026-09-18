export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// GET /api/admin/inventory/movements - Query stock movement ledger
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN'])

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const warehouseParam = searchParams.get('warehouseId') || searchParams.get('warehouse')
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    const where: any = {}

    if (warehouseParam && warehouseParam !== 'all') {
      const p = warehouseParam.toLowerCase();
      if (p === 'cn' || p === 'by') {
        const matchingWhs = await prisma.warehouse.findMany({
          where: {
            OR: [
              ...(p === 'cn'
                ? [
                    { code: { contains: 'CN', mode: 'insensitive' as const } },
                    { country: { contains: 'China', mode: 'insensitive' as const } },
                  ]
                : [
                    { code: { contains: 'BY', mode: 'insensitive' as const } },
                    { country: { contains: 'Belarus', mode: 'insensitive' as const } },
                  ]),
            ],
          },
          select: { id: true },
        });
        if (matchingWhs.length > 0) {
          where.warehouseId = { in: matchingWhs.map((w) => w.id) };
        }
      } else {
        const targetWh = await prisma.warehouse.findFirst({
          where: {
            OR: [
              { id: warehouseParam },
              { code: { equals: warehouseParam, mode: 'insensitive' } },
            ],
          },
        });
        if (targetWh) {
          where.warehouseId = targetWh.id;
        } else {
          where.warehouseId = warehouseParam;
        }
      }
    }

    if (type) {
      where.type = type
    }
    if (productId) {
      where.productId = productId
    }
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { product: { sku: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [movements, total] = await Promise.all([
      prisma.stockMovement.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          warehouse: {
            select: {
              id: true,
              name: true,
              code: true,
              country: true,
            },
          },
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              stock: true,
              thumbnail: true,
            }
          },
          variant: {
            select: {
              id: true,
              sku: true,
              stock: true,
              attributes: true,
            }
          }
        }
      }),
      prisma.stockMovement.count({ where })
    ])

    return NextResponse.json({
      success: true,
      movements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching stock movements:', error)
    return createAuthErrorResponse(error as Error)
  }
}
