import { NextRequest, NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check admin auth using the same method as other admin endpoints
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
    const uploadType = formData.get('type') as string || 'general'
    const mediaType = formData.get('mediaType') as string || 'image'

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // File size limit: Different for videos and images
    let maxSize: number
    if (mediaType === 'video') {
      maxSize = 100 * 1024 * 1024 // 100MB for videos
    } else if (uploadType === 'favicon') {
      maxSize = 1024 * 1024 // 1MB for favicons
    } else {
      maxSize = 5 * 1024 * 1024 // 5MB for images
    }
    
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Validate file type
    if (mediaType === 'video') {
      const validVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska'
      ]
      if (!validVideoTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: 'Invalid video format. Please upload MP4, WebM, MOV, AVI, or MKV files' 
        }, { status: 400 })
      }
    } else if (uploadType === 'favicon') {
      const validFaviconTypes = [
        'image/x-icon',
        'image/vnd.microsoft.icon',
        'image/png',
        'image/svg+xml'
      ]
      if (!validFaviconTypes.includes(file.type)) {
        return NextResponse.json({ 
          error: 'Invalid favicon format. Please upload .ico, .png, or .svg files' 
        }, { status: 400 })
      }
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Create subdirectory based on upload type
    let subDir: string
    if (uploadType === 'favicon') {
      subDir = 'favicons'
    } else if (uploadType === 'breadcrumb' || uploadType === 'breadcrumb/mobile') {
      subDir = uploadType
    } else if (uploadType === 'products') {
      subDir = 'products'
    } else {
      subDir = 'general'
    }
    
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', subDir)
    
    // Ensure directory exists
    await mkdir(uploadDir, { recursive: true })

    // Special handling for favicon naming
    let filename: string
    if (uploadType === 'favicon') {
      const ext = path.extname(file.name)
      filename = `favicon-${Date.now()}${ext}`
    } else {
      filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`
    }

    const filepath = path.join(uploadDir, filename)
    
    await writeFile(filepath, buffer)

    return NextResponse.json({ 
      url: `/uploads/${subDir}/${filename}`,
      message: `${uploadType === 'favicon' ? 'Favicon' : 'File'} uploaded successfully` 
    })
  } catch (error) {
    console.error('File upload error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
