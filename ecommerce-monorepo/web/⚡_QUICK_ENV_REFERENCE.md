# ⚡ ENVIRONMENT AUTO-DETECTION - QUICK REFERENCE

## 🎯 WHAT WAS CREATED

Your app now **automatically switches** between local and production databases!

---

## 📁 FILES CREATED

```
✅ .env.example          - Template (safe to commit)
✅ .env.local           - Local settings (your config)
✅ .env.production      - Production settings (dromkok.com)
✅ lib/config.ts        - Auto-detection system
✅ lib/db-detector.ts   - Database switcher
✅ lib/db.ts            - Updated Prisma (auto-configured)
✅ api/test-db/route.ts - Test endpoint
```

---

## 🚀 HOW TO USE

### LOCAL DEVELOPMENT:

```bash
npm run dev
```
**Automatically uses:** `postgresql://postgres:balkhi123@localhost:5432/ecommerce`

### PRODUCTION (dromkok.com):

```bash
npm run build
npm start
```
**Automatically uses:** `postgresql://root:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce`

---

## 🔍 TEST IT

### Local:
```
http://localhost:3001/api/test-db
```

### Production:
```
https://dromkok.com/api/test-db
```

Should show which environment and database it's using!

---

## 📦 PRODUCTION DEPLOYMENT

### 1. Upload .env.production to server:
```bash
# Copy to: /var/www/dromkok.com/web/.env.production
# Or rename to .env
```

### 2. Generate secure JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Replace `JWT_SECRET` in `.env.production`

### 3. Build & Start:
```bash
npm install
npx prisma generate
npm run build
npm start
```

---

## ⚙️ CONFIGURATION IN CODE

```typescript
import { config } from '@/lib/config';

// Check environment
if (config.environment.isProduction) {
  // Production logic
}

// Use database (automatic!)
import { prisma } from '@/lib/db';
const products = await prisma.product.findMany();

// Get config values
const apiUrl = config.api.baseUrl;
const dbHost = config.database.host;
```

---

## 🔒 SECURITY

### ✅ PROTECTED:
- `.env.local` → Never committed (in .gitignore)
- `.env.production` → Never committed (in .gitignore)
- Passwords masked in logs
- Environment validation on startup

### ✅ SAFE TO COMMIT:
- `.env.example` → Template only

---

## 🐛 TROUBLESHOOTING

### Can't connect to database?

1. Check `/api/test-db` endpoint
2. Verify database is running
3. Check `.env` file exists
4. Restart server after changing `.env`

### Using wrong database?

1. Check logs when starting server
2. Visit `/api/test-db` to see environment
3. Verify `NODE_ENV` variable
4. Check domain name

---

## 📊 ENVIRONMENT DETECTION

**Detects production if:**
- Domain is `dromkok.com` or `www.dromkok.com`
- `NODE_ENV=production`
- API URL contains `dromkok.com`

**Otherwise uses development (local) settings**

---

## ⚡ QUICK COMMANDS

### Test local connection:
```bash
curl http://localhost:3001/api/test-db
```

### Test production connection:
```bash
curl https://dromkok.com/api/test-db
```

### Check environment in code:
```typescript
console.log(process.env.NODE_ENV);
```

### Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## ✅ CHECKLIST

### Local Setup:
- [ ] `.env.local` exists
- [ ] Local PostgreSQL running
- [ ] Can start with `npm run dev`
- [ ] `/api/test-db` returns "development"

### Production Setup:
- [ ] `.env.production` on server
- [ ] JWT_SECRET changed
- [ ] Production PostgreSQL running
- [ ] Built with `npm run build`
- [ ] `/api/test-db` returns "production"

---

## 📚 FULL DOCUMENTATION

See: `🔧_AUTO_ENVIRONMENT_SETUP.md`

---

## 🎉 DONE!

**No manual switching needed!**

Run locally → Uses local DB  
Deploy to dromkok.com → Uses production DB

**Automatically!** ✨
