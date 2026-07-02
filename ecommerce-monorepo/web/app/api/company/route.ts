import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const settings = await prisma.systemSettings.findFirst()

    if (settings) {
      return NextResponse.json({
        data: {
          name: settings.companyName,
          logo: settings.companyLogo,
          description: settings.companyDescription,
          phone: settings.companyPhone,
          email: settings.companyEmail,
          address: settings.companyAddress,
        }
      })
    }
    
    // Fallback if system settings not found
    return NextResponse.json({
      data: {
        name: 'YIWU EXPRESS',
        logo: null
      }
    })
  } catch (error) {
    console.error("API Company Error:", error)
    return NextResponse.json({ error: 'Failed to fetch company info' }, { status: 500 })
  }
}