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

    const discounts = await prisma.discount.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: discounts })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await checkAdmin(request)
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const {
      code,
      description,
      discountType = 'PERCENTAGE',
      value,
      targetMode = 'BOTH',
      minSpend,
      minQuantity,
      maxDiscountAmount,
      usageLimit,
      startDate,
      endDate,
      isActive = true,
    } = body

    if (!code || value === undefined) {
      return NextResponse.json({ error: 'Code and value are required' }, { status: 400 })
    }

    const discount = await prisma.discount.create({
      data: {
        code: code.trim().toUpperCase(),
        description: description || null,
        discountType,
        value: parseFloat(value.toString()),
        targetMode,
        minSpend: minSpend ? parseFloat(minSpend.toString()) : null,
        minQuantity: minQuantity ? parseInt(minQuantity.toString()) : null,
        maxDiscountAmount: maxDiscountAmount ? parseFloat(maxDiscountAmount.toString()) : null,
        usageLimit: usageLimit ? parseInt(usageLimit.toString()) : null,
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
        isActive,
      },
    })

    return NextResponse.json({ success: true, data: discount })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
