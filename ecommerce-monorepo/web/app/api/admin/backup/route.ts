import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { verifyToken } from '@/lib/auth'

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null
  if (!token) return null
  return verifyToken(token)
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req)
    
    // Check if user is admin
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    // Fetch all data from database
    const [users, services, quotes, shipments, companyInfo, systemSettings] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          companyName: true,
          businessType: true,
          taxId: true,
          country: true,
          phone: true,
          createdAt: true,
          updatedAt: true,
        }
      }),
      prisma.service.findMany(),
      prisma.quote.findMany({
        include: {
          service: true,
          user: {
            select: {
              email: true,
              name: true,
              companyName: true,
            }
          }
        }
      }),
      prisma.shipment.findMany({
        include: {
          service: true,
          user: {
            select: {
              email: true,
              name: true,
              companyName: true,
            }
          }
        }
      }),
      prisma.companyInfo.findMany(),
      prisma.systemSettings.findMany()
    ])

    // Create backup data object
    const backupData = {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      statistics: {
        users: users.length,
        services: services.length,
        quotes: quotes.length,
        shipments: shipments.length,
        companyInfo: companyInfo.length,
        systemSettings: systemSettings.length,
      },
      data: {
        users,
        services,
        quotes,
        shipments,
        companyInfo,
        systemSettings,
      }
    }

    // Return as downloadable JSON
    const filename = `yiwuexpress-backup-${new Date().toISOString().split('T')[0]}.json`
    
    return new NextResponse(JSON.stringify(backupData, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Backup export error:', error)
    return NextResponse.json({ error: 'Failed to export backup' }, { status: 500 })
  }
}

// POST endpoint for importing backup data
export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req)
    
    // Check if user is admin
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { data, clearExisting } = body

    if (!data) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 })
    }

    // If clearExisting is true, delete existing data first (except users and system settings)
    if (clearExisting) {
      await prisma.shipment.deleteMany()
      await prisma.quote.deleteMany()
      await prisma.service.deleteMany()
      await prisma.companyInfo.deleteMany()
      // Don't delete users to preserve admin access
      // Don't delete system settings to preserve configuration
    }

    let imported = {
      services: 0,
      quotes: 0,
      shipments: 0,
      companyInfo: 0,
      systemSettings: 0,
    }

    // Import services first (no dependencies)
    if (data.services && data.services.length > 0) {
      for (const service of data.services) {
        try {
          await prisma.service.upsert({
            where: { id: service.id },
            update: {
              name: service.name,
              slug: service.slug,
              description: service.description,
              price: service.price,
              duration: service.duration,
              coverage: service.coverage,
              type: service.type,
              image: service.image,
              isActive: service.isActive ?? true,
            },
            create: service,
          })
          imported.services++
        } catch (err) {
          console.warn(`Skipped service ${service.id}:`, err)
        }
      }
    }

    // Import quotes (depends on services and users)
    if (data.quotes && data.quotes.length > 0) {
      for (const quote of data.quotes) {
        try {
          await prisma.quote.create({
            data: {
              id: quote.id,
              userId: quote.userId,
              serviceId: quote.serviceId,
              serviceType: quote.serviceType,
              weight: quote.weight,
              dimensions: quote.dimensions,
              origin: quote.origin,
              destination: quote.destination,
              description: quote.description,
              price: quote.price,
              validUntil: quote.validUntil ? new Date(quote.validUntil) : null,
              status: quote.status,
              createdAt: quote.createdAt ? new Date(quote.createdAt) : undefined,
              updatedAt: quote.updatedAt ? new Date(quote.updatedAt) : undefined,
            }
          })
          imported.quotes++
        } catch (err) {
          console.warn(`Skipped quote ${quote.id}:`, err)
        }
      }
    }

    // Import shipments (depends on services and users)
    if (data.shipments && data.shipments.length > 0) {
      for (const shipment of data.shipments) {
        try {
          await prisma.shipment.create({
            data: {
              id: shipment.id,
              trackingNumber: shipment.trackingNumber,
              userId: shipment.userId,
              serviceId: shipment.serviceId,
              origin: shipment.origin,
              destination: shipment.destination,
              status: shipment.status,
              estimatedDelivery: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery) : null,
              actualDelivery: shipment.actualDelivery ? new Date(shipment.actualDelivery) : null,
              carrier: shipment.carrier,
              notes: shipment.notes,
              createdAt: shipment.createdAt ? new Date(shipment.createdAt) : undefined,
              updatedAt: shipment.updatedAt ? new Date(shipment.updatedAt) : undefined,
            }
          })
          imported.shipments++
        } catch (err) {
          console.warn(`Skipped shipment ${shipment.id}:`, err)
        }
      }
    }

    // Import company info (depends on users)
    if (data.companyInfo && data.companyInfo.length > 0) {
      for (const company of data.companyInfo) {
        try {
          await prisma.companyInfo.upsert({
            where: { id: company.id },
            update: {
              name: company.name,
              address: company.address,
              phone: company.phone,
              email: company.email,
              licenseNumber: company.licenseNumber,
              taxId: company.taxId,
              description: company.description,
            },
            create: company,
          })
          imported.companyInfo++
        } catch (err) {
          console.warn(`Skipped company info ${company.id}:`, err)
        }
      }
    }

    // Import system settings (independent)
    if (data.systemSettings && data.systemSettings.length > 0) {
      for (const settings of data.systemSettings) {
        try {
          await prisma.systemSettings.upsert({
            where: { id: settings.id },
            update: settings,
            create: settings,
          })
          imported.systemSettings++
        } catch (err) {
          console.warn(`Skipped system settings ${settings.id}:`, err)
        }
      }
    }

    return NextResponse.json({
      message: 'Backup imported successfully',
      imported,
    })
  } catch (error) {
    console.error('Backup import error:', error)
    return NextResponse.json({ error: 'Failed to import backup' }, { status: 500 })
  }
}
