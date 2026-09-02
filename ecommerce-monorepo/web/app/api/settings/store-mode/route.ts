export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireRole, createAuthErrorResponse } from '@/lib/auth'

// GET /api/settings/store-mode - Get current store mode
export async function GET(request: Request) {
  try {
    const settings = await prisma.systemSettings.findUnique({
      where: { singletonKey: 'SINGLETON' },
    })

    if (!settings) {
      // Return default if no settings exist
      return NextResponse.json({
        success: true,
        storeMode: 'WHOLESALE', // Default to wholesale
        settings: {
          storeMode: 'WHOLESALE'
        }
      })
    }

    return NextResponse.json({
      success: true,
      storeMode: settings.storeMode,
      settings: {
        storeMode: settings.storeMode
      }
    })
  } catch (error) {
    console.error('Error fetching store mode:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch store mode' },
      { status: 500 }
    )
  }
}

// PUT /api/settings/store-mode - Update store mode (Admin only)
export async function PUT(request: Request) {
  try {
    // Authorization: only ADMIN may change store mode.
    await requireRole(request, ['ADMIN'])

    const body = await request.json()
    const { storeMode } = body

    // Validate store mode
    if (!['WHOLESALE', 'RETAIL', 'BOTH'].includes(storeMode)) {
      return NextResponse.json(
        { success: false, error: 'Invalid store mode. Must be WHOLESALE, RETAIL, or BOTH' },
        { status: 400 }
      )
    }

    // Atomic upsert against the DB-enforced singleton row (unique singletonKey).
    const settings = await prisma.systemSettings.upsert({
      where: { singletonKey: 'SINGLETON' },
      update: { storeMode },
      create: { singletonKey: 'SINGLETON', storeMode },
    })

    return NextResponse.json({
      success: true,
      storeMode: settings.storeMode,
      settings: settings,
      message: 'Store mode updated successfully'
    })
  } catch (error) {
    if (error instanceof Error && (error.message === 'Unauthorized' || error.message === 'Forbidden' || error.message === 'Account is disabled')) {
      return createAuthErrorResponse(error)
    }
    console.error('Error updating store mode:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update store mode' },
      { status: 500 }
    )
  }
}
