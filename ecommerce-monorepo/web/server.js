#!/usr/bin/env node
const { createServer } = require('http')
const { parse } = require('url')
const fs = require('fs')
const path = require('path')
const next = require('next')

// Serve user-uploaded files from disk at request time.
// Next.js `next start` only serves files that existed in `public/` at build
// time, so post-build uploads (categories, products, favicons) 404. This
// handler reads them straight from disk instead.
const UPLOADS_DIR = path.join(process.cwd(), 'public', 'uploads')

const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.bmp': 'image/bmp',
  '.avif': 'image/avif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
  '.mkv': 'video/x-matroska',
}

function findUploadFile(relative) {
  const candidates = [
    path.join(process.cwd(), 'public', 'uploads', relative),
    path.join(process.cwd(), 'web', 'public', 'uploads', relative),
    path.join('/www', 'wwwroot', 'www.dromkok.com', 'web', 'public', 'uploads', relative),
    path.join('/var', 'www', 'dromkok', 'ecommerce-monorepo', 'web', 'public', 'uploads', relative),
  ]
  for (const c of candidates) {
    try {
      if (fs.existsSync(c) && fs.statSync(c).isFile()) {
        return c
      }
    } catch {}
  }

  // Self-healing fallback
  const lower = relative.toLowerCase()
  if (lower.includes('logo')) {
    const logoFallbacks = [
      path.join(process.cwd(), 'public', 'logo.png'),
      path.join(process.cwd(), 'web', 'public', 'logo.png'),
      path.join(process.cwd(), 'public', 'uploads', 'general', '1789563604789-1787644810312-logo_pixian_ai.png'),
      path.join(process.cwd(), 'web', 'public', 'uploads', 'general', '1789563604789-1787644810312-logo_pixian_ai.png'),
      '/www/wwwroot/www.dromkok.com/web/public/logo.png',
      '/www/wwwroot/www.dromkok.com/web/public/uploads/general/1789563604789-1787644810312-logo_pixian_ai.png',
      path.join(process.cwd(), 'public', 'logo.svg'),
      path.join(process.cwd(), 'web', 'public', 'logo.svg'),
    ]
    for (const lf of logoFallbacks) {
      try {
        if (fs.existsSync(lf) && fs.statSync(lf).isFile()) {
          return lf
        }
      } catch {}
    }
  }

  if (lower.includes('favicon')) {
    const favFallbacks = [
      path.join(process.cwd(), 'public', 'favicon.ico'),
      path.join(process.cwd(), 'web', 'public', 'favicon.ico'),
      path.join(process.cwd(), 'public', 'uploads', 'favicons', 'favicon-1789563607224.png'),
      path.join(process.cwd(), 'web', 'public', 'uploads', 'favicons', 'favicon-1789563607224.png'),
    ]
    for (const ff of favFallbacks) {
      try {
        if (fs.existsSync(ff) && fs.statSync(ff).isFile()) {
          return ff
        }
      } catch {}
    }
  }

  return null
}

function serveUpload(req, res, pathname) {
  const relative = decodeURIComponent(pathname.replace(/^\/uploads\/?/, ''))
  const foundFile = findUploadFile(relative)

  if (!foundFile) {
    res.statusCode = 404
    res.end('not found')
    return
  }

  fs.stat(foundFile, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404
      res.end('not found')
      return
    }

    const ext = path.extname(foundFile).toLowerCase()
    res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream')
    res.setHeader('Content-Length', stats.size)
    res.setHeader('Cache-Control', 'public, max-age=2592000')
    res.setHeader('Access-Control-Allow-Origin', '*')

    if (req.method === 'HEAD') {
      res.statusCode = 200
      res.end()
      return
    }

    const stream = fs.createReadStream(foundFile)
    stream.on('error', () => {
      res.statusCode = 500
      res.end('internal server error')
    })
    stream.pipe(res)
  })
}

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  if (fs.existsSync('.env.production')) {
    require('dotenv').config({ path: '.env.production' })
  } else if (fs.existsSync('.env')) {
    require('dotenv').config({ path: '.env' })
  } else {
    require('dotenv').config()
  }
} else {
  if (fs.existsSync('.env.local')) {
    require('dotenv').config({ path: '.env.local' })
  } else if (fs.existsSync('.env')) {
    require('dotenv').config({ path: '.env' })
  } else {
    require('dotenv').config()
  }
}

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || (dev ? 'localhost' : '0.0.0.0')
const port = parseInt(process.env.PORT || '3001', 10)

// Validate port configuration
if (!port || isNaN(port)) {
  console.error('❌ ERROR: Invalid PORT configuration')
  console.error('Please check your environment configuration')
  process.exit(1)
}

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      if (parsedUrl.pathname && parsedUrl.pathname.startsWith('/uploads/')) {
        if (req.method === 'GET' || req.method === 'HEAD') {
          serveUpload(req, res, parsedUrl.pathname)
          return
        }
      }
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`
❌ ERROR: Port ${port} is already in use!

To fix this:
1. Stop any process using port ${port}:
   - Linux: fuser -k ${port}/tcp  or  lsof -ti :${port} | xargs kill -9
   - Windows: netstat -ano | findstr :${port}

2. Or configure PORT in environment (.env / .env.production / .env.local)

Current configuration:
- PORT: ${port}
- NODE_ENV: ${process.env.NODE_ENV || 'not set'}
        `)
        process.exit(1)
      }
      console.error(err)
      process.exit(1)
    })
    .listen(port, () => {
      console.log(`
┌─────────────────────────────────────────────────┐
│                                                 │
│   ✓ Next.js Server Ready                       │
│                                                 │
│   Local:    http://${hostname}:${port}${' '.repeat(Math.max(0, 9 - port.toString().length))}│
│   Network:  http://${hostname}:${port}${' '.repeat(Math.max(0, 9 - port.toString().length))}│
│                                                 │
│   API:      http://${hostname}:${port}/api${' '.repeat(Math.max(0, 5 - port.toString().length))}│
│                                                 │
│   Press Ctrl+C to stop                          │
│                                                 │
└─────────────────────────────────────────────────┘

📋 Configuration:
   - Static Port: ${port} (configured in .env.local)
   - Environment: ${dev ? 'development' : 'production'}
   - CORS Enabled for Expo (port 8081)
      `)
    })
})
