import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

// PUT /api/admin/currencies/[id] - Update currency
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { name, symbol, symbolPosition, decimalPlaces, exchangeRate, isActive } = body

    // Get existing currency
    const existing = await prisma.currency.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Currency not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      name,
      symbol,
      symbolPosition,
      decimalPlaces,
      isActive,
      updatedAt: new Date()
    }

    // Only update exchange rate if it's not the base currency and rate changed
    if (!existing.isBase && exchangeRate && exchangeRate !== existing.exchangeRate) {
      updateData.exchangeRate = exchangeRate
      updateData.exchangeRateUpdatedAt = new Date()

      // Log rate change to history
      const baseCurrency = await prisma.currency.findFirst({
        where: { isBase: true }
      })

      if (baseCurrency) {
        await prisma.exchangeRateHistory.create({
          data: {
            fromCurrency: existing.code,
            toCurrency: baseCurrency.code,
            rate: exchangeRate,
            source: 'manual',
            notes: `Rate updated via currency edit`
          }
        })
      }
    }

    // Update currency
    const currency = await prisma.currency.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      success: true,
      message: 'Currency updated successfully',
      data: currency
    })
  } catch (error) {
    console.error('Update currency error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update currency' },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/currencies/[id] - Delete currency
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Get existing currency
    const existing = await prisma.currency.findUnique({
      where: { id }
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Currency not found' },
        { status: 404 }
      )
    }

    // Cannot delete base currency
    if (existing.isBase) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete base currency' },
        { status: 400 }
      )
    }

    // Check if currency is used in orders
    const ordersCount = await prisma.order.count({
      where: { currency: existing.code }
    })

    if (ordersCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete currency. It is used in ${ordersCount} order(s)` 
        },
        { status: 400 }
      )
    }

    // Check if currency is used in purchase orders
    const purchaseOrdersCount = await prisma.purchaseOrder.count({
      where: { currency: existing.code }
    })

    if (purchaseOrdersCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete currency. It is used in ${purchaseOrdersCount} purchase order(s)` 
        },
        { status: 400 }
      )
    }

    // Check if currency is used in products
    const productsCount = await prisma.product.count({
      where: { purchaseCurrency: existing.code }
    })

    if (productsCount > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot delete currency. It is used in ${productsCount} product(s)` 
        },
        { status: 400 }
      )
    }

    // Delete currency
    await prisma.currency.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      message: 'Currency deleted successfully'
    })
  } catch (error) {
    console.error('Delete currency error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete currency' },
      { status: 500 }
    )
  }
}
