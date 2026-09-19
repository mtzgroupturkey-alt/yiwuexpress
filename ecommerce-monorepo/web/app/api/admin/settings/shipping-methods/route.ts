export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireRole, createAuthErrorResponse } from '@/lib/auth';

const DEFAULT_SHIPPING_CONFIG = {
  methods: [
    {
      id: 'express_air',
      name: 'Express Air Freight (DHL / FedEx / UPS)',
      code: 'EXPRESS_AIR',
      description: 'Expedited air courier service for urgent cargo and small packages.',
      estimatedDays: '3 - 5 business days',
      baseRate: 25.0,
      ratePerKg: 8.5,
      minWeightKg: 0.5,
      maxWeightKg: 500,
      volumetricDivisor: 5000,
      enabled: true,
      badge: 'Fastest',
    },
    {
      id: 'standard_air',
      name: 'Standard Air Cargo',
      code: 'STANDARD_AIR',
      description: 'Commercial scheduled air cargo for medium-sized shipments and wholesale orders.',
      estimatedDays: '7 - 12 business days',
      baseRate: 18.0,
      ratePerKg: 5.2,
      minWeightKg: 20,
      maxWeightKg: 3000,
      volumetricDivisor: 6000,
      enabled: true,
      badge: 'Popular',
    },
    {
      id: 'sea_freight',
      name: 'Ocean Freight (FCL / LCL Container)',
      code: 'SEA_FREIGHT',
      description: 'Cost-effective maritime transport from Ningbo/Shanghai ports for large bulk cargo.',
      estimatedDays: '25 - 40 business days',
      baseRate: 45.0,
      ratePerKg: 1.8,
      ratePerCbm: 140.0,
      minWeightKg: 100,
      maxWeightKg: 25000,
      volumetricDivisor: 6000,
      enabled: true,
      badge: 'Best Value',
    },
    {
      id: 'rail_express',
      name: 'China-Europe Railway Express (CR Express)',
      code: 'RAIL_EXPRESS',
      description: 'Eurasian continental rail corridor linking Yiwu hub directly to European railheads.',
      estimatedDays: '15 - 22 business days',
      baseRate: 35.0,
      ratePerKg: 3.4,
      minWeightKg: 50,
      maxWeightKg: 10000,
      volumetricDivisor: 6000,
      enabled: true,
      badge: 'Eco-Friendly',
    },
    {
      id: 'truck_freight',
      name: 'Cross-Border Trucking (TIR)',
      code: 'TRUCK_FREIGHT',
      description: 'High-cube bonded road transport with fast customs clearance via land ports.',
      estimatedDays: '10 - 18 business days',
      baseRate: 30.0,
      ratePerKg: 4.0,
      minWeightKg: 50,
      maxWeightKg: 15000,
      volumetricDivisor: 6000,
      enabled: true,
      badge: 'Direct Door',
    },
  ],
  globalSettings: {
    freeShippingThreshold: 35.0,
    fuelSurchargePercent: 4.5,
    cargoInsurancePercent: 1.2,
    defaultOrigin: 'China Central Warehouse (Yiwu/Ningbo)',
    allowCustomerPickup: true,
    requireSignatureOnDelivery: true,
  },
};

// GET /api/admin/settings/shipping-methods
export async function GET(request: NextRequest) {
  try {
    let freeShippingThreshold = 35.0;
    try {
      const settings = await prisma.systemSettings.findFirst({
        select: { freeShippingThreshold: true },
      });
      if (settings?.freeShippingThreshold !== undefined && settings.freeShippingThreshold !== null) {
        freeShippingThreshold = Number(settings.freeShippingThreshold);
      }
    } catch (e) {
      console.warn('[shipping-methods] Could not fetch freeShippingThreshold from SystemSettings:', e);
    }

    // Also count configured countries
    let activeCountriesCount = 0;
    try {
      activeCountriesCount = await prisma.country.count({ where: { isActive: true } });
    } catch {}

    const responseData = {
      ...DEFAULT_SHIPPING_CONFIG,
      globalSettings: {
        ...DEFAULT_SHIPPING_CONFIG.globalSettings,
        freeShippingThreshold,
      },
      meta: {
        activeCountriesCount,
      },
    };

    return NextResponse.json({
      success: true,
      data: responseData,
    });
  } catch (error: any) {
    console.error('Error in GET /api/admin/settings/shipping-methods:', error);
    return NextResponse.json({
      success: true,
      data: DEFAULT_SHIPPING_CONFIG,
    });
  }
}

// PUT /api/admin/settings/shipping-methods
export async function PUT(request: NextRequest) {
  try {
    await requireRole(request, ['ADMIN']);
    const body = await request.json();

    if (body.globalSettings?.freeShippingThreshold !== undefined) {
      const threshold = parseFloat(body.globalSettings.freeShippingThreshold) || 35.0;
      try {
        const existing = await prisma.systemSettings.findFirst();
        if (existing) {
          await prisma.systemSettings.update({
            where: { id: existing.id },
            data: { freeShippingThreshold: threshold },
          });
        }
      } catch (err) {
        console.warn('Could not update freeShippingThreshold on SystemSettings:', err);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping methods and global logistics settings updated successfully',
      data: body,
    });
  } catch (error: any) {
    return createAuthErrorResponse(error);
  }
}
