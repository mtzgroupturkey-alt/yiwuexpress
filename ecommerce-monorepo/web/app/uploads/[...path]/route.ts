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
      // 1. Logo fallback: if requested file is a logo or WeChat or photoroom image
      if (fileName.includes('logo') || relativeSubPath.includes('logo') || fileName.includes('wechat') || fileName.includes('photoroom')) {
        const logoCandidates = [
          path.join(cwd, 'public', 'logo.png'),
          path.join(cwd, 'public', 'logo.svg'),
          path.join(cwd, 'public', 'uploads', 'general', '1789807106178-1787644810312-logo_pixian_ai.png'),
          path.join(cwd, 'public', 'uploads', 'general', 'logo_pixian_ai.png'),
          path.join(cwd, 'public', 'uploads', 'general', 'logo-login.png'),
          path.join(cwd, 'public', 'uploads', 'general', 'logo.svg'),
          path.join(cwd, 'web', 'public', 'logo.png'),
          path.join(cwd, 'web', 'public', 'logo.svg'),
          '/www/wwwroot/www.dromkok.com/web/public/logo.png',
          '/www/wwwroot/www.dromkok.com/web/public/logo.svg',
          '/www/wwwroot/www.dromkok.com/web/public/uploads/general/logo_pixian_ai.png',
          path.join(cwd, 'public', 'uploads', 'general', '1789563604789-1787644810312-logo_pixian_ai.png'),
          path.join(cwd, 'web', 'public', 'uploads', 'general', '1789563604789-1787644810312-logo_pixian_ai.png'),
          '/www/wwwroot/www.dromkok.com/web/public/uploads/general/1789563604789-1787644810312-logo_pixian_ai.png',
        ]
        foundFile = await findExistingFile(logoCandidates)
      }

      // 2. Favicon fallback: if requested file is a favicon
      if (!foundFile && (fileName.includes('favicon') || relativeSubPath.includes('favicon'))) {
        const faviconCandidates = [
          path.join(cwd, 'public', 'favicon.ico'),
          path.join(cwd, 'public', 'favicon.png'),
          path.join(cwd, 'public', 'favicon.svg'),
          path.join(cwd, 'web', 'public', 'favicon.ico'),
          path.join(cwd, 'web', 'public', 'favicon.png'),
          path.join(cwd, 'public', 'uploads', 'favicons', 'favicon-1789563607224.png'),
          path.join(cwd, 'web', 'public', 'uploads', 'favicons', 'favicon-1789563607224.png'),
          '/www/wwwroot/www.dromkok.com/web/public/favicon.ico',
          '/www/wwwroot/www.dromkok.com/web/public/uploads/favicons/favicon-1789563607224.png',
        ]
        foundFile = await findExistingFile(faviconCandidates)
      }

      // 3. Hero & Ad/Banner fallback: if requested file is a hero banner or ad
      if (!foundFile && (fileName.includes('hero') || relativeSubPath.includes('hero') || fileName.includes('ad') || fileName.includes('serving') || fileName.includes('banner'))) {
        const heroCandidates = [
          path.join(cwd, 'public', 'images', 'hero', 'hero-1.jpg'),
          path.join(cwd, 'public', 'images', 'hero', 'hero-2.jpg'),
          path.join(cwd, 'public', 'uploads', 'hero', 'hero-1.jpg'),
          path.join(cwd, 'public', 'uploads', 'general', 'Gemini_Generated_Image_8e9wy08e9wy08e9w.jpg'),
          path.join(cwd, 'web', 'public', 'images', 'hero', 'hero-1.jpg'),
          '/www/wwwroot/www.dromkok.com/web/public/images/hero/hero-1.jpg',
        ]
        foundFile = await findExistingFile(heroCandidates)
      }

      // 4. Product image fallback: ensure products never display broken images
      if (!foundFile) {
        const productFallbackCandidates = [
          path.join(cwd, 'public', 'images', 'product-placeholder.webp'),
          path.join(cwd, 'public', 'images', 'products', 'placeholder.jpg'),
          path.join(cwd, 'public', 'images', 'placeholder.png'),
          path.join(cwd, 'web', 'public', 'images', 'product-placeholder.webp'),
          path.join(cwd, 'web', 'public', 'images', 'products', 'placeholder.jpg'),
          path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'images', 'product-placeholder.webp'),
          path.join(cwd, 'ecommerce-monorepo', 'web', 'public', 'images', 'products', 'placeholder.jpg'),
          '/www/wwwroot/www.dromkok.com/web/public/images/product-placeholder.webp',
          '/www/wwwroot/www.dromkok.com/web/public/images/products/placeholder.jpg',
          '/www/wwwroot/dromkok.com/web/public/images/product-placeholder.webp',
        ]
        foundFile = await findExistingFile(productFallbackCandidates)
      }
    }

    if (!foundFile) {
      // Clean SVG fallback returned with 200 OK so images never break or cause layout shifts
      const svgFallback = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" fill="none"><rect width="400" height="400" fill="#f8fafc"/><path d="M160 180a20 20 0 100-40 20 20 0 000 40zm80 70H160l40-50 25 31 15-18 40 37z" fill="#cbd5e1"/><text x="200" y="290" text-anchor="middle" fill="#94a3b8" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="500">Global Trade</text></svg>`
      return new NextResponse(svgFallback, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'X-Media-Served-By': 'dromkok-uploads-fallback-svg',
        },
      })
    }

    const fileBuffer = await fs.readFile(foundFile)
    let mimeType = getMimeType(foundFile)

    // Bulletproof Content-Type Sniffing:
    const headText = fileBuffer.slice(0, 100).toString('utf8').trim().toLowerCase()
    if (headText.startsWith('<svg') || headText.startsWith('<?xml')) {
      mimeType = 'image/svg+xml; charset=utf-8'
    } else if (fileBuffer.length >= 3 && fileBuffer[0] === 0xff && fileBuffer[1] === 0xd8 && fileBuffer[2] === 0xff) {
      mimeType = 'image/jpeg'
    } else if (fileBuffer.length >= 8 && fileBuffer[0] === 0x89 && fileBuffer[1] === 0x50 && fileBuffer[2] === 0x4e && fileBuffer[3] === 0x47) {
      mimeType = 'image/png'
    } else if (fileBuffer.length >= 12 && fileBuffer.slice(0, 4).toString('ascii') === 'RIFF' && fileBuffer.slice(8, 12).toString('ascii') === 'WEBP') {
      mimeType = 'image/webp'
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Content-Length': fileBuffer.length.toString(),
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
        'X-Media-Served-By': 'dromkok-uploads-api',
      },
    })
  } catch (error) {
    console.error('[uploads/route] Error serving uploaded file:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Accept, Range',
    },
  })
}
