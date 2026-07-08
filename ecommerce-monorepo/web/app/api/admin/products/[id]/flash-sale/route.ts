import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await req.json()
    const { 
      isFlashSale, 
      flashSalePrice, 
      flashSaleStart, 
      flashSaleEnd, 
      flashSaleStock 
    } = body

    // Validate flash sale data only if configuration details are provided
    const isConfigUpdate = flashSalePrice !== undefined || flashSaleStart !== undefined || flashSaleEnd !== undefined;

    if (isFlashSale && isConfigUpdate) {
      if (!flashSalePrice || parseFloat(flashSalePrice) <= 0) {
        return NextResponse.json(
          { success: false, error: 'Flash sale price is required and must be greater than 0' },
          { status: 400 }
        )
      }
      if (!flashSaleStart || !flashSaleEnd) {
        return NextResponse.json(
          { success: false, error: 'Flash sale start and end dates are required' },
          { status: 400 }
        )
      }
      if (new Date(flashSaleStart) >= new Date(flashSaleEnd)) {
        return NextResponse.json(
          { success: false, error: 'Flash sale end date must be after start date' },
          { status: 400 }
        )
      }
      if (flashSaleStock !== undefined && flashSaleStock !== null && parseInt(flashSaleStock) < 0) {
        return NextResponse.json(
          { success: false, error: 'Flash sale stock cannot be negative' },
          { status: 400 }
        )
      }
    }

    const updateData: any = {
      isFlashSale,
    }

    if (isFlashSale) {
      if (flashSalePrice !== undefined) updateData.flashSalePrice = parseFloat(flashSalePrice)
      if (flashSaleStart !== undefined) updateData.flashSaleStart = new Date(flashSaleStart)
      if (flashSaleEnd !== undefined) updateData.flashSaleEnd = new Date(flashSaleEnd)
      if (flashSaleStock !== undefined) updateData.flashSaleStock = flashSaleStock ? parseInt(flashSaleStock) : null
    } else {
      // Clear flash sale data when disabled
      updateData.flashSalePrice = null
      updateData.flashSaleStart = null
      updateData.flashSaleEnd = null
      updateData.flashSaleStock = null
    }

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: product,
    })
  } catch (error) {
    console.error('Error updating flash sale status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update flash sale status' },
      { status: 500 }
    )
  }
}
