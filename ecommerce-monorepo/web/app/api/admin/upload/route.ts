import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const authHeader = request.headers.get('authorization')
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

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

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
    }

    // File size limit: 2MB for general files, 1MB for favicons
    const maxSize = uploadType === 'favicon' ? 1024 * 1024 : 2 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB` 
      }, { status: 400 })
    }

    // Validate file type for favicon
    if (uploadType === 'favicon') {
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
    const subDir = uploadType === 'favicon' ? 'favicons' : 'general'
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
