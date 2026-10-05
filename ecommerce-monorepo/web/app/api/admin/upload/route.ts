export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request)

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const payload = verifyToken(token)
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = (formData.get('type') as string) || 'general'
    const mediaType = (formData.get('mediaType') as string) || 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // Size limits
    let maxSize: number
    if (mediaType === 'video') {
      maxSize = 100 * 1024 * 1024 // 100MB
    } else if (uploadType === 'favicon') {
      maxSize = 1024 * 1024 // 1MB
    } else {
      maxSize = 5 * 1024 * 1024 // 5MB
    }

    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Sanitize extension and base filename to eliminate path traversal
    const baseName = path.basename(file.name).replace(/[^a-zA-Z0-9._-]/g, '_')
    const ext = path.extname(baseName).toLowerCase()

    // Strict MIME & extension whitelisting
    if (mediaType === 'video') {
      const validVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska'
      ]
      const validVideoExts = ['.mp4', '.webm', '.mov', '.avi', '.mkv']
      if (!validVideoTypes.includes(file.type) || !validVideoExts.includes(ext)) {
        return NextResponse.json({ 
          error: 'Invalid video format. Supported: MP4, WebM, MOV, AVI, MKV' 
        }, { status: 400 })
      }
    } else if (uploadType === 'favicon') {
      const validFaviconTypes = [
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/png',
        'image/svg+xml'
      ]
      const validFaviconExts = ['.ico', '.png', '.svg']
      if (!validFaviconTypes.includes(file.type) || !validFaviconExts.includes(ext)) {
        return NextResponse.json({ 
          error: 'Invalid favicon format. Supported: .ico, .png, .svg' 
        }, { status: 400 })
      }
    } else {
      // General and product images
      const validImageTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/avif',
      ]
      const validImageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif']
      if (!validImageTypes.includes(file.type) || !validImageExts.includes(ext)) {
        return NextResponse.json({ 
          error: 'Invalid image format. Supported: JPG, PNG, WebP, GIF, AVIF' 
        }, { status: 400 })
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Subdirectory mapping (strictly sanitized)
    let subDir = 'general'
    if (uploadType === 'favicon') {
      subDir = 'favicons'
    } else if (uploadType === 'breadcrumb') {
      subDir = 'breadcrumb'
    } else if (uploadType === 'products') {
      subDir = 'products'
    }

    const targetDirs: string[] = [
      path.join(process.cwd(), 'public', 'uploads', subDir),
      path.join(process.cwd(), 'web', 'public', 'uploads', subDir),
      path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', 'uploads', subDir),
    ]

    // Cryptographically random unique filename to prevent overwrites and collision
    const randomSuffix = crypto.randomBytes(8).toString('hex')
    const filename = `${Date.now()}-${randomSuffix}${ext}`

    for (const dir of targetDirs) {
      try {
        await mkdir(dir, { recursive: true })
        await writeFile(path.join(dir, filename), buffer)
      } catch {
        // Silently skip non-existent production paths on local dev
      }
    }

    return NextResponse.json({ 
      success: true,
      url: `/uploads/${subDir}/${filename}`,
      message: 'File uploaded successfully' 
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
