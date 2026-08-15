import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GET system settings
export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst();
    
    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: {
          companyName: 'Global Trade',
          timezone: 'Asia/Shanghai',
          language: 'en',
          currency: 'USD',
          storeMode: 'WHOLESALE',
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching system settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch system settings' },
      { status: 500 }
    );
  }
}

// PUT/POST update system settings
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Get existing settings or create new
    let settings = await prisma.systemSettings.findFirst();
    
    if (settings) {
      // Update existing
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: body,
      });
    } else {
      // Create new
      settings = await prisma.systemSettings.create({
        data: body,
      });
    }

    return NextResponse.json({
      success: true,
      data: settings,
      message: 'System settings updated successfully',
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    return NextResponse.json(
      { error: 'Failed to update system settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return PUT(request);
}
