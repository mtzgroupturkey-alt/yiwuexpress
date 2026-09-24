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
      '/www/wwwroot/www.dromkok.com/public/uploads',
      '/www/wwwroot/www.dromkok.com/uploads',
      '/var/www/dromkok/ecommerce-monorepo/web/public/uploads',
      path.join(cwd, 'public'),
      path.join(cwd, 'web', 'public'),
      '/www/wwwroot/www.dromkok.com/web/public',
    ]

    // Construct multiple candidate file paths (direct path, subfolders products/general)
    const candidateFiles: string[] = []
    for (const dir of candidateDirs) {
      candidateFiles.push(path.join(dir, ...sanitizedSegments))
      if (sanitizedSegments.length === 1) {
        candidateFiles.push(path.join(dir, 'products', fileName))
        candidateFiles.push(path.join(dir, 'general', fileName))
        candidateFiles.push(path.join(dir, 'hero', fileName))
      } else {
        // Also check directly under dir without subfolder or in sibling subfolder
        candidateFiles.push(path.join(dir, fileName))
        candidateFiles.push(path.join(dir, 'general', fileName))
        candidateFiles.push(path.join(dir, 'products', fileName))
      }
    }

    let foundFile = await findExistingFile(candidateFiles)

    // Prefix match: Check if file was saved as `${timestamp}-${fileName}`
    if (!foundFile && fileName) {
      for (const dir of candidateDirs) {
        try {
          const subdirs = ['', 'products', 'general']
          for (const sub of subdirs) {
            const searchDir = sub ? path.join(dir, sub) : dir
            try {
              const entries = await fs.readdir(searchDir)
              const matched = entries.find(
                (e) => e.toLowerCase() === fileName || e.toLowerCase().endsWith(`-${fileName}`)
              )
              if (matched) {
                foundFile = path.join(searchDir, matched)
                break
              }
            } catch {}
          }
          if (foundFile) break
        } catch {}
      }
    }

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

      // 4. Product image fallback: ensure products never display broken images
      if (!foundFile) {
        const productFallbackCandidates = [
          path.join(cwd, 'public', 'images', 'product-placeholder.webp'),
          path.join(cwd, 'web', 'public', 'images', 'product-placeholder.webp'),
          path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'images', 'product-placeholder.webp'),
          '/www/wwwroot/www.dromkok.com/web/public/images/product-placeholder.webp',
          path.join(cwd, 'public', 'images', 'product-placeholder.svg'),
          path.join(cwd, 'web', 'public', 'images', 'product-placeholder.svg'),
          path.join(cwd, 'public', 'images', 'placeholder.png'),
          path.join(cwd, 'web', 'public', 'images', 'placeholder.png'),
        ]
        foundFile = await findExistingFile(productFallbackCandidates)
      }
    }

    if (!foundFile) {
      return new NextResponse('Not Found', { status: 404 })
    }

    const fileBuffer = await fs.readFile(foundFile)
    const mimeType = getMimeType(foundFile)

    const isFallback = foundFile.includes('product-placeholder') || foundFile.includes('placeholder')
    const cacheHeader = isFallback
      ? 'public, max-age=60, stale-while-revalidate=300'
      : 'public, max-age=31536000, immutable'

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': cacheHeader,
        'Content-Length': fileBuffer.length.toString(),
        'X-Media-Served-By': 'dromkok-uploads-handler',
      },
    })
  } catch (error) {
    console.error('[uploads/route] Error serving uploaded file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
