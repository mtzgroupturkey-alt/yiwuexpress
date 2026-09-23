export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

const MIME_MAP: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.pdf': 'application/pdf',
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME_MAP[ext] || 'application/octet-stream'
}

/**
 * Checks a list of candidate absolute paths and returns the first one that exists on disk.
 */
async function findExistingFile(candidates: string[]): Promise<string | null> {
  for (const c of candidates) {
    try {
      const stat = await fs.stat(c)
      if (stat.isFile()) {
        return c
      }
    } catch {
      // Continue checking next candidate
    }
  }
  return null
}

export async function GET(
  request: NextRequest,
  { params }: { params: { path?: string[] } }
) {
  try {
    const rawSegments = params.path || []
    if (!rawSegments.length) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    // Security: sanitize segments to prevent path traversal attacks
    const sanitizedSegments = rawSegments.map((s) => s.replace(/\.\./g, '').replace(/[/\\]/g, ''))
    const relativeSubPath = sanitizedSegments.join('/')
    const fileName = sanitizedSegments[sanitizedSegments.length - 1]?.toLowerCase() || ''
    const cwd = process.cwd()

    // Build potential absolute root paths for the uploads directory
    const candidateDirs = [
      path.join(cwd, 'public', 'uploads'),
      path.join(cwd, 'web', 'public', 'uploads'),
      path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'uploads'),
      '/www/wwwroot/www.dromkok.com/web/public/uploads',
      '/var/www/dromkok/ecommerce-monorepo/web/public/uploads',
    ]

    const candidateFiles = candidateDirs.map((dir) => path.join(dir, ...sanitizedSegments))
    let foundFile = await findExistingFile(candidateFiles)

    // Self-healing fallback if requested file is missing from disk
    if (!foundFile) {
      // 1. Logo fallback: if requested file is a logo
      if (fileName.includes('logo') || relativeSubPath.includes('logo')) {
        const logoCandidates = [
          path.join(cwd, 'public', 'logo.png'),
          path.join(cwd, 'web', 'public', 'logo.png'),
          path.join(cwd, 'public', 'uploads', 'general', '1789563604789-1787644810312-logo_pixian_ai.png'),
          path.join(cwd, 'web', 'public', 'uploads', 'general', '1789563604789-1787644810312-logo_pixian_ai.png'),
          '/www/wwwroot/www.dromkok.com/web/public/logo.png',
          '/www/wwwroot/www.dromkok.com/web/public/uploads/general/1789563604789-1787644810312-logo_pixian_ai.png',
          path.join(cwd, 'public', 'logo.svg'),
          path.join(cwd, 'web', 'public', 'logo.svg'),
        ]
        foundFile = await findExistingFile(logoCandidates)
      }

      // 2. Favicon fallback: if requested file is a favicon
      if (!foundFile && (fileName.includes('favicon') || relativeSubPath.includes('favicon'))) {
        const faviconCandidates = [
          path.join(cwd, 'public', 'favicon.ico'),
          path.join(cwd, 'web', 'public', 'favicon.ico'),
          path.join(cwd, 'public', 'uploads', 'favicons', 'favicon-1789563607224.png'),
          path.join(cwd, 'web', 'public', 'uploads', 'favicons', 'favicon-1789563607224.png'),
          '/www/wwwroot/www.dromkok.com/web/public/uploads/favicons/favicon-1789563607224.png',
        ]
        foundFile = await findExistingFile(faviconCandidates)
      }

      // 3. Hero fallback: if requested file is a hero banner
      if (!foundFile && (fileName.includes('hero') || relativeSubPath.includes('hero'))) {
        const heroCandidates = [
          path.join(cwd, 'public', 'images', 'hero', 'hero-1.jpg'),
          path.join(cwd, 'web', 'public', 'images', 'hero', 'hero-1.jpg'),
          '/www/wwwroot/www.dromkok.com/web/public/images/hero/hero-1.jpg',
        ]
        foundFile = await findExistingFile(heroCandidates)
      }
    }

    if (!foundFile) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const fileBuffer = await fs.readFile(foundFile)
    const mimeType = getMimeType(foundFile)

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Length': fileBuffer.length.toString(),
        'X-Media-Served-By': 'dromkok-uploads-handler',
      },
    })
  } catch (error) {
    console.error('[uploads/route] Error serving uploaded file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
