export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    let settings: any = null
    try {
      settings = await prisma.systemSettings.findFirst({
        select: { companyFavicon: true },
      })
    } catch {
      try {
        const rows: any[] = await prisma.$queryRawUnsafe(`SELECT "companyFavicon" FROM "system_settings" LIMIT 1`)
        if (rows && rows.length > 0) settings = rows[0]
      } catch {}
    }

    const faviconUrl = settings?.companyFavicon
    if (faviconUrl) {
      let clean = faviconUrl.trim()
      if (clean.startsWith('/api/')) {
        clean = clean.replace('/api/', '/')
      }
      if (clean.startsWith('/')) {
        clean = clean.slice(1)
      }

      const candidatePaths = [
        path.join(process.cwd(), clean),
        path.join(process.cwd(), 'public', clean),
        path.join(process.cwd(), 'web', 'public', clean),
        path.join('/www', 'wwwroot', 'www.dromkok.com', clean),
        path.join('/www', 'wwwroot', 'www.dromkok.com', 'public', clean),
        path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', clean),
      ]

      for (const p of candidatePaths) {
        try {
          if (fs.existsSync(p) && fs.statSync(p).isFile()) {
            const buffer = fs.readFileSync(p)
            const ext = path.extname(p).toLowerCase()
            const mimeType = ext === '.svg' ? 'image/svg+xml' : ext === '.ico' ? 'image/x-icon' : 'image/png'
            return new NextResponse(buffer, {
              headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
              },
            })
          }
        } catch {}
      }

      const redirectPath = faviconUrl.startsWith('/uploads/') ? `/api${faviconUrl}` : faviconUrl
      return NextResponse.redirect(new URL(redirectPath, 'https://dromkok.com'), { status: 302 })
    }
  } catch (err) {
    console.error('Error serving /favicon.ico:', err)
  }

  // Fallback to static favicon.ico in public
  try {
    const fallbackPath = path.join(process.cwd(), 'public', 'favicon.ico')
    if (fs.existsSync(fallbackPath)) {
      const buffer = fs.readFileSync(fallbackPath)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=86400',
        },
      })
    }
  } catch {}

  return new NextResponse(null, { status: 404 })
}
