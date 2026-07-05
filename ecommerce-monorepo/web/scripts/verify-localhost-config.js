#!/usr/bin/env node
/**
 * PHASE 1 VERIFICATION SCRIPT
 * Verifies localhost configuration is correct
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 PHASE 1: LOCALHOST CONFIGURATION VERIFICATION\n')
console.log('=' .repeat(60))

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
}

const { green, red, yellow, blue, reset, bright } = colors

let totalChecks = 0
let passedChecks = 0
let criticalIssues = []
let warnings = []

function checkPassed(message) {
  console.log(`${green}✓${reset} ${message}`)
  passedChecks++
  totalChecks++
}

function checkFailed(message, isCritical = true) {
  console.log(`${red}✗${reset} ${message}`)
  if (isCritical) {
    criticalIssues.push(message)
  } else {
    warnings.push(message)
  }
  totalChecks++
}

function sectionHeader(title) {
  console.log(`\n${bright}${blue}${title}${reset}`)
  console.log('-'.repeat(60))
}

// 1. Check .env.local exists
sectionHeader('1. Environment Configuration')

const envPath = path.join(__dirname, '..', '.env.local')
if (fs.existsSync(envPath)) {
  checkPassed('.env.local file exists')
  
  // Read and parse .env.local
  const envContent = fs.readFileSync(envPath, 'utf-8')
  const envVars = {}
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) {
      envVars[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '')
    }
  })
  
  // Check critical variables
  const requiredVars = [
    'PORT',
    'HOSTNAME',
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_APP_URL',
    'NEXT_PUBLIC_BASE_URL',
    'DATABASE_URL',
    'JWT_SECRET'
  ]
  
  requiredVars.forEach(varName => {
    if (envVars[varName]) {
      checkPassed(`${varName} is set`)
    } else {
      checkFailed(`${varName} is missing`, true)
    }
  })
  
  // Verify port consistency
  const port = envVars.PORT
  if (port === '3005') {
    checkPassed(`Port is set to ${port}`)
  } else {
    checkFailed(`Port should be 3005, but is ${port}`, false)
  }
  
  // Check image configuration
  const imageVars = [
    'NEXT_PUBLIC_IMAGE_DOMAINS',
    'NEXT_PUBLIC_IMAGE_BASE_URL',
    'NEXT_PUBLIC_UPLOAD_URL'
  ]
  
  imageVars.forEach(varName => {
    if (envVars[varName]) {
      checkPassed(`${varName} is configured`)
    } else {
      checkFailed(`${varName} is missing`, false)
    }
  })
  
} else {
  checkFailed('.env.local file is missing', true)
}

// 2. Check next.config.js
sectionHeader('2. Next.js Configuration')

const nextConfigPath = path.join(__dirname, '..', 'next.config.js')
if (fs.existsSync(nextConfigPath)) {
  checkPassed('next.config.js exists')
  
  const configContent = fs.readFileSync(nextConfigPath, 'utf-8')
  
  // Check for localhost image configuration
  if (configContent.includes("hostname: 'localhost'")) {
    checkPassed('Localhost hostname configured in images.remotePatterns')
  } else {
    checkFailed('Localhost not configured in images.remotePatterns', true)
  }
  
  if (configContent.includes("port: '3005'")) {
    checkPassed('Port 3005 configured in images.remotePatterns')
  } else {
    checkFailed('Port 3005 not in images.remotePatterns', false)
  }
  
  if (configContent.includes("protocol: 'http'")) {
    checkPassed('HTTP protocol configured for localhost')
  } else {
    checkFailed('HTTP protocol not configured', true)
  }
  
  if (configContent.includes("domains:")) {
    checkPassed('Image domains array present')
  } else {
    checkFailed('Image domains array missing', false)
  }
  
} else {
  checkFailed('next.config.js is missing', true)
}

// 3. Check server.js
sectionHeader('3. Custom Server Configuration')

const serverPath = path.join(__dirname, '..', 'server.js')
if (fs.existsSync(serverPath)) {
  checkPassed('server.js exists')
  
  const serverContent = fs.readFileSync(serverPath, 'utf-8')
  
  if (serverContent.includes('.env.local')) {
    checkPassed('server.js loads .env.local')
  } else {
    checkFailed('server.js not loading .env.local', false)
  }
  
  if (serverContent.includes('process.env.PORT')) {
    checkPassed('server.js uses PORT from environment')
  } else {
    checkFailed('server.js not using PORT variable', true)
  }
  
} else {
  checkFailed('server.js is missing', true)
}

// 4. Check image components
sectionHeader('4. Image Component Usage')

const componentsToCheck = [
  'components/MegaMenu.tsx',
  'components/home/HeroSlider.tsx',
  'app/checkout/page.tsx',
  'app/admin/layout.tsx',
  'app/admin/users/page.tsx',
  'app/admin/settings/hero-slider/page.tsx',
]

let rawImgCount = 0
let nextImageCount = 0

componentsToCheck.forEach(componentPath => {
  const fullPath = path.join(__dirname, '..', componentPath)
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf-8')
    
    // Count Next.js Image imports
    if (content.includes("import Image from 'next/image'")) {
      nextImageCount++
    }
    
    // Count raw img tags (excluding comments and mobile directory)
    if (!componentPath.includes('mobile')) {
      const imgMatches = content.match(/<img\s+src=/g)
      if (imgMatches) {
        rawImgCount += imgMatches.length
      }
    }
  }
})

if (nextImageCount > 0) {
  checkPassed(`${nextImageCount} components using Next.js Image`)
} else {
  checkFailed('No components using Next.js Image', true)
}

if (rawImgCount === 0) {
  checkPassed('No raw <img> tags found in checked components')
} else {
  checkFailed(`${rawImgCount} raw <img> tags still present`, false)
}

// 5. Check lib/image-utils.ts
sectionHeader('5. Image Utility Functions')

const imageUtilsPath = path.join(__dirname, '..', 'lib', 'image-utils.ts')
if (fs.existsSync(imageUtilsPath)) {
  checkPassed('lib/image-utils.ts created')
  
  const utilsContent = fs.readFileSync(imageUtilsPath, 'utf-8')
  
  if (utilsContent.includes('getImageUrl')) {
    checkPassed('getImageUrl function exists')
  }
  
  if (utilsContent.includes('NEXT_PUBLIC_BASE_URL')) {
    checkPassed('Uses NEXT_PUBLIC_BASE_URL environment variable')
  }
  
} else {
  checkFailed('lib/image-utils.ts is missing', false)
}

// 6. Check public directory
sectionHeader('6. Static Assets Directory')

const publicPath = path.join(__dirname, '..', 'public')
if (fs.existsSync(publicPath)) {
  checkPassed('public directory exists')
  
  const uploadsPath = path.join(publicPath, 'uploads')
  if (fs.existsSync(uploadsPath)) {
    checkPassed('public/uploads directory exists')
  } else {
    checkFailed('public/uploads directory missing', false)
  }
  
  const imagesPath = path.join(publicPath, 'images')
  if (fs.existsSync(imagesPath)) {
    checkPassed('public/images directory exists')
  } else {
    checkFailed('public/images directory missing', false)
  }
  
} else {
  checkFailed('public directory is missing', true)
}

// SUMMARY
console.log('\n' + '='.repeat(60))
console.log(`${bright}VERIFICATION SUMMARY${reset}\n`)

const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0
const scoreColor = score >= 80 ? green : score >= 60 ? yellow : red

console.log(`${bright}Score: ${scoreColor}${passedChecks}/${totalChecks}${reset} checks passed (${scoreColor}${score}%${reset})`)

if (criticalIssues.length > 0) {
  console.log(`\n${bright}${red}CRITICAL ISSUES (${criticalIssues.length}):${reset}`)
  criticalIssues.forEach((issue, i) => {
    console.log(`  ${i + 1}. ${issue}`)
  })
}

if (warnings.length > 0) {
  console.log(`\n${bright}${yellow}WARNINGS (${warnings.length}):${reset}`)
  warnings.forEach((warning, i) => {
    console.log(`  ${i + 1}. ${warning}`)
  })
}

if (criticalIssues.length === 0 && warnings.length === 0) {
  console.log(`\n${bright}${green}✓ ALL CHECKS PASSED!${reset}`)
  console.log(`\n${bright}Next Steps:${reset}`)
  console.log(`  1. Run: ${blue}npm run dev${reset}`)
  console.log(`  2. Visit: ${blue}http://localhost:3005${reset}`)
  console.log(`  3. Check browser console for errors`)
  console.log(`  4. Verify images load correctly\n`)
} else {
  console.log(`\n${bright}${yellow}ACTION REQUIRED:${reset}`)
  console.log(`  Fix the issues above before starting the server.\n`)
  process.exit(1)
}
