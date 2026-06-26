import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// POST /api/shipping/calculate - Calculate shipping cost
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { countryCode, weightKg, serviceType } = body

    // Validation
    if (!countryCode || !weightKg) {
      return NextResponse.json(
        { success: false, error: 'Country code and weight are required' },
        { status: 400 }
      )
    }

    if (weightKg <= 0) {
      return NextResponse.json(
        { success: false, error: 'Weight must be greater than 0' },
        { status: 400 }
      )
    }

    // Get country
    const country = await prisma.country.findUnique({
      where: { code: countryCode.toUpperCase() }
    })

    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country not found' },
        { status: 404 }
      )
    }

    if (!country.isActive) {
      return NextResponse.json(
        { success: false, error: 'Shipping to this country is not available' },
        { status: 400 }
      )
    }

    // Get shipping rates for this country
    const whereClause: any = {
      countryId: country.id,
      isActive: true,
    }

    // Filter by service type if specified
    if (serviceType) {
      whereClause.serviceType = serviceType
    }

    const shippingRates = await prisma.shippingRate.findMany({
      where: whereClause,
      orderBy: {
        baseRate: 'asc'
      }
    })

    if (shippingRates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No shipping rates available for this country' },
        { status: 404 }
      )
    }

    // Calculate costs for each available shipping option
    const options = shippingRates.map(rate => {
      // Check weight constraints
      if (rate.minWeight && weightKg < rate.minWeight) {
        return null
      }
      if (rate.maxWeight && weightKg > rate.maxWeight) {
        return null
      }

      const cost = rate.baseRate + (weightKg * rate.ratePerKg)

      return {
        carrier: rate.carrier,
        serviceType: rate.serviceType,
        cost: parseFloat(cost.toFixed(2)),
        estimatedDays: rate.estimatedDays,
        baseRate: rate.baseRate,
        ratePerKg: rate.ratePerKg
      }
    }).filter(option => option !== null)

    if (options.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No shipping options available for this weight' },
        { status: 400 }
      )
    }

    // Get customs info
    const customsInfo = country.customsRules as any

    return NextResponse.json({
      success: true,
      data: {
        country: {
          code: country.code,
          name: country.name,
          currency: country.currency,
          currencySymbol: country.currencySymbol
        },
        weight: weightKg,
        shippingOptions: options,
        customsInfo: {
          dutyRate: customsInfo.dutyRate,
          vatRate: customsInfo.vatRate,
          thresholdUSD: customsInfo.thresholdUSD,
          documentRequirements: customsInfo.documentRequirements
        },
        estimatedCustomsDuty: null // Can be calculated based on declared value
      }
    })
  } catch (error) {
    console.error('Error calculating shipping:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate shipping cost' },
      { status: 500 }
    )
  }
}
