import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findFirst({
      select: {
        companyName: true,
        companyLogo: true,
        companyPhone: true,
        companyEmail: true,
        companyAddress: true,
        companyWebsite: true,
        primaryColor: true,
        accentColor: true,
        currency: true,
        timezone: true,
        language: true,
      }
    })

    if (!settings) {
      // Default settings fallback
      settings = {
        companyName: 'YIWU EXPRESS',
        companyLogo: '',
        companyPhone: '+86 579 8555 1234',
        companyEmail: 'info@yiwuexpress.com',
        companyAddress: 'Yiwu International Trade City, Yiwu, Zhejiang, China',
        companyWebsite: 'https://yiwuexpress.com',
        primaryColor: '#1a3a5c',
        accentColor: '#c9a84c',
        currency: 'USD',
        timezone: 'Asia/Shanghai',
        language: 'en',
      }
    }

    return NextResponse.json({ settings })
  } catch (error) {
    console.error('Get public settings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
