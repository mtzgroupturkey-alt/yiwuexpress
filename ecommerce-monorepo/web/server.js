#!/usr/bin/env node
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Load environment variables
require('dotenv').config({ path: '.env.local' })

const dev = process.env.NODE_ENV !== 'production'
const hostname = process.env.HOSTNAME || 'localhost'
const port = parseInt(process.env.PORT || '3001', 10)

// Validate port configuration
if (!port || isNaN(port)) {
  console.error('❌ ERROR: Invalid PORT configuration')
  console.error('Please check your .env.local file')
  process.exit(1)
}

// Create Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
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
   netstat -ano | findstr :${port}
   taskkill /PID [PID] /F

2. Or change the port in .env.local

Current configuration:
- PORT: ${port}
- Check: .env.local file
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
