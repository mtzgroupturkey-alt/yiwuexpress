# 🚀 YIWU EXPRESS - LOCALHOST SETUP GUIDE

## Quick Start (2 minutes)

```bash
# 1. Navigate to web directory
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# 2. Install dependencies (if not done)
npm install

# 3. Verify configuration
node scripts/verify-localhost-config.js

# 4. Start development server
npm run dev

# 5. Open browser
# Visit: http://localhost:3005
```

---

## ✅ Prerequisites Checklist

Before starting, ensure you have:

- [ ] **Node.js** 18+ installed
- [ ] **PostgreSQL** running on localhost:5432
- [ ] **Database** `ecommerce` created
- [ ] **Git** for version control
- [ ] **VS Code** (recommended) or any code editor

---

## 📋 Configuration Files

### 1. Environment Variables (`.env.local`)
Already configured with:
- ✅ PORT=3005
- ✅ Database connection
- ✅ JWT secrets
- ✅ Image configuration
- ✅ CORS settings

**Location:** `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\.env.local`

### 2. Next.js Config (`next.config.js`)
Already configured with:
- ✅ Localhost image domains
- ✅ HTTP protocol support
- ✅ Port 3005 configuration
- ✅ CORS headers
- ✅ Security headers

---

## 🎯 Development Workflow

### Daily Startup:
```bash
# 1. Start PostgreSQL (if not running)
# Check Windows Services or use pg_ctl

# 2. Navigate to project
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# 3. Start dev server
npm run dev
```

### Common Commands:
```bash
# Development server
npm run dev

# Database management
npm run db:studio        # Open Prisma Studio
npm run db:push          # Push schema changes
npm run db:seed          # Seed sample data

# Build for production
npm run build
npm start

# Linting
npm run lint
```

---

## 🖼️ Image Handling

### Uploaded Images:
- **Location:** `public/uploads/`
- **URL Pattern:** `http://localhost:3005/uploads/filename.jpg`
- **Optimization:** Automatic via Next.js Image

### Static Images:
- **Location:** `public/images/`
- **URL Pattern:** `http://localhost:3005/images/filename.jpg`

### Using Images in Code:
```tsx
import Image from 'next/image'
import { getImageUrl } from '@/lib/image-utils'

// For uploaded images
<Image 
  src={getImageUrl(product.thumbnail)} 
  alt={product.name}
  width={400}
  height={400}
/>

// For static images
<Image 
  src="/images/logo.png" 
  alt="Logo"
  width={200}
  height={50}
/>
```

---

## 🔍 Troubleshooting

### Problem: Port 3005 already in use
**Solution:**
```bash
netstat -ano | findstr :3005
taskkill /PID [PID_NUMBER] /F
```

### Problem: Images not loading
**Check:**
1. Server running? → `http://localhost:3005`
2. Image path correct? → Check `/uploads/` folder
3. Console errors? → Open browser DevTools (F12)

**Fix:**
```bash
# Clear Next.js cache
rmdir /s /q .next
npm run dev
```

### Problem: Database connection error
**Check:**
1. PostgreSQL running?
2. Database exists? → `psql -l`
3. Credentials correct? → Check `.env.local`

**Fix:**
```bash
# Create database if missing
createdb ecommerce

# Push schema
npm run db:push
```

### Problem: Module not found
**Fix:**
```bash
# Clear node_modules and reinstall
rmdir /s /q node_modules
npm install
```

---

## 🎨 Development URLs

| Resource | URL |
|----------|-----|
| Homepage | http://localhost:3005 |
| Products | http://localhost:3005/products |
| Cart | http://localhost:3005/cart |
| Checkout | http://localhost:3005/checkout |
| Admin Panel | http://localhost:3005/admin |
| API Docs | http://localhost:3005/api |
| Database Studio | http://localhost:5555 (run `npm run db:studio`) |

---

## 📊 Performance Tips

### 1. Image Optimization
- Use Next.js `<Image>` component (already implemented)
- Images auto-convert to WebP/AVIF
- Lazy loading enabled by default

### 2. Development Speed
```bash
# Use turbo mode (if installed)
npm run dev --turbo

# Clear cache if slow
rmdir /s /q .next
```

### 3. Database Performance
```bash
# Check connection pool
npm run db:studio

# Optimize queries (if needed)
# Add indexes in schema.prisma
```

---

## 🧪 Testing the Setup

### Automated Verification:
```bash
node scripts/verify-localhost-config.js
```

**Expected Output:**
```
✓ .env.local file exists
✓ Port is set to 3005
✓ Next.js configured correctly
✓ 5 components using Next.js Image
✓ Image utility functions created

Score: 27/28 checks passed (96%)
```

### Manual Testing:
1. [ ] Server starts without errors
2. [ ] Homepage loads
3. [ ] Images display correctly
4. [ ] Navigation works
5. [ ] Product pages load
6. [ ] Cart functions
7. [ ] Admin panel accessible

---

## 📁 Project Structure

```
web/
├── app/                    # Next.js 14 App Router
│   ├── (pages)/           # Public pages
│   ├── admin/             # Admin panel
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   ├── home/              # Homepage components
│   ├── products/          # Product components
│   └── layout/            # Layout components
├── lib/                   # Utility functions
│   ├── api.ts             # API client
│   ├── image-utils.ts     # Image helpers (NEW)
│   └── utils.ts           # General utilities
├── public/                # Static assets
│   ├── uploads/           # Uploaded files
│   └── images/            # Static images
├── scripts/               # Build & utility scripts
│   └── verify-localhost-config.js  # Config verification
├── .env.local             # Environment variables
├── next.config.js         # Next.js configuration
├── server.js              # Custom server (port 3005)
└── package.json           # Dependencies
```

---

## 🔐 Security Notes

### Development Environment:
- ✅ HTTP allowed (localhost only)
- ✅ CORS enabled for Expo mobile app
- ✅ JWT secrets configured
- ⚠️ Security headers active (may need adjustment for dev)

### Production Checklist:
- [ ] Change to HTTPS
- [ ] Update CORS origins
- [ ] Rotate JWT secrets
- [ ] Enable rate limiting
- [ ] Add authentication middleware

---

## 📞 Getting Help

### Documentation:
- **Next.js:** https://nextjs.org/docs
- **Prisma:** https://www.prisma.io/docs
- **Tailwind CSS:** https://tailwindcss.com/docs

### Common Issues:
1. **Port conflict** → Kill process using port 3005
2. **Image errors** → Check `next.config.js` configuration
3. **Database errors** → Verify PostgreSQL is running
4. **Module errors** → Delete `node_modules` and reinstall

### Debug Mode:
```bash
# Enable verbose logging
DEBUG=* npm run dev

# Check Next.js info
npm run dev -- --info
```

---

## ✅ Health Check Commands

```bash
# Check if server is running
curl http://localhost:3005

# Check API health
curl http://localhost:3005/api/health

# Check database connection
npm run db:studio

# Verify configuration
node scripts/verify-localhost-config.js
```

---

## 🎯 Next Steps After Setup

1. **Test the application** - Click through all pages
2. **Check browser console** - Look for errors (F12)
3. **Test image uploads** - Try admin panel
4. **Review logs** - Check terminal for warnings
5. **Run verification** - Execute verify script
6. **Start coding!** 🚀

---

**Last Updated:** January 2025  
**Status:** ✅ Ready for Development  
**Port:** 3005  
**Environment:** Development
