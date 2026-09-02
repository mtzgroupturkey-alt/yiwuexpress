# Production Server Error Fix Guide

## Current Errors

1. **API Error**: `/api/settings/public` returns 500 (Internal Server Error)
2. **API Error**: `/api/admin/settings/company` returns 500 (Internal Server Error)
3. **Asset Error**: `/favicon.ico` returns 404 (Not Found)

## Root Causes

### 1. API 500 Errors - Likely Causes

- **Missing or incorrect `.env.production`** - Critical environment variables not set
- **Database connection failure** - `DATABASE_URL` incorrect or PostgreSQL not accessible
- **Prisma Client mismatch** - Windows-generated Prisma Client doesn't work on Linux server
- **Missing dependencies** - `node_modules/@prisma/client` not properly installed
- **Database schema out of sync** - Recent schema changes not pushed to production

### 2. Favicon 404 Error

- **Missing file** - `favicon.ico` doesn't exist in `/public/` directory (only `favicon.svg` exists)

## Quick Fix (Automated)

Run the automated fix script:

```powershell
.\quick-fix-production.ps1
```

This will:
1. Create and upload `favicon.ico`
2. Regenerate Prisma Client with Linux binary
3. Push database schema
4. Rebuild application
5. Restart PM2
6. Verify all endpoints

## Manual Fix (Step-by-Step)

### Step 1: Fix Environment Variables

SSH to the server:
```bash
ssh -p 22 djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
```

Create or edit `.env.production`:
```bash
nano .env.production
```

Ensure these critical variables are set:

```env
# Database (CRITICAL)
DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"

# JWT Authentication (CRITICAL)
JWT_SECRET="your_64_character_secret_here_generate_with_crypto_randomBytes"
JWT_EXPIRES_IN="7d"

# Server
NODE_ENV="production"
PORT=3001
HOSTNAME="0.0.0.0"

# Domain & CORS (CRITICAL)
NEXT_PUBLIC_API_URL=https://dromkok.com
ALLOWED_ORIGINS=https://dromkok.com,https://www.dromkok.com

# AI Translation (Optional)
OPENROUTER_API_KEY=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
```

**Generate JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 2: Fix Prisma Client

```bash
# Generate Prisma Client with Linux binary
npx prisma generate

# Push database schema
npx prisma db push --accept-data-loss

# Verify Prisma Client exists
ls -la node_modules/@prisma/client
ls -la node_modules/.prisma/client
```

### Step 3: Fix Favicon

On your local machine:
```powershell
# Copy SVG as ICO (modern browsers support this)
Copy-Item "ecommerce-monorepo\web\public\favicon.svg" "ecommerce-monorepo\web\public\favicon.ico"

# Upload to production
scp -P 22 "ecommerce-monorepo\web\public\favicon.ico" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/public/
```

### Step 4: Rebuild & Restart

On the server:
```bash
cd /www/wwwroot/www.dromkok.com/web

# Clear build cache
rm -rf .next

# Install dependencies (if needed)
npm install

# Build
NODE_ENV=production npm run build

# Restart PM2
pm2 restart dromkok-web
pm2 save

# Verify
pm2 status
```

### Step 5: Verify Fixes

Test the endpoints:
```bash
# Test public settings API
curl -i https://dromkok.com/api/settings/public

# Test admin settings API
curl -i https://dromkok.com/api/admin/settings/company

# Test favicon
curl -I https://dromkok.com/favicon.ico
```

All should return **200 OK**.

## Troubleshooting

### If API still returns 500

**Check database connection:**
```bash
# On server
psql postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce -c "\l"
```

**Check PM2 logs:**
```bash
pm2 logs dromkok-web --lines 100
pm2 logs dromkok-web --err --lines 50
```

**Test database in Node:**
```bash
cd /www/wwwroot/www.dromkok.com/web
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.\$connect().then(() => { console.log('Connected'); prisma.\$disconnect(); }).catch(err => console.error(err));"
```

**Common errors:**

1. **"Cannot find module '@prisma/client'"**
   ```bash
   npm install @prisma/client
   npx prisma generate
   ```

2. **"Invalid `prisma.systemSettings.findFirst()` invocation"**
   ```bash
   npx prisma db push --accept-data-loss
   npx prisma generate
   ```

3. **"JWT_SECRET is not defined"**
   - Add `JWT_SECRET` to `.env.production`
   - Restart PM2: `pm2 restart dromkok-web`

4. **"DATABASE_URL is not defined"**
   - Add `DATABASE_URL` to `.env.production`
   - Restart PM2: `pm2 restart dromkok-web`

### If database schema is outdated

```bash
# Reset database (CAUTION: deletes data)
npx prisma migrate reset --force

# Or push schema without reset
npx prisma db push --accept-data-loss

# Seed sample data
npm run db:seed
```

### Check Prisma schema binary targets

Your `schema.prisma` should have:
```prisma
generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "debian-openssl-3.0.x"]
}
```

This ensures the Linux binary is generated even when you run `prisma generate` on Windows.

## Verification Checklist

- [ ] `.env.production` exists with all required variables
- [ ] `DATABASE_URL` is correct and PostgreSQL is accessible
- [ ] `JWT_SECRET` is set (64+ characters)
- [ ] `NEXT_PUBLIC_API_URL=https://dromkok.com`
- [ ] Prisma Client generated: `ls node_modules/@prisma/client`
- [ ] Database schema synced: `npx prisma db push` completed
- [ ] `favicon.ico` exists in `public/` directory
- [ ] Application built: `.next/` directory exists
- [ ] PM2 process running: `pm2 status | grep dromkok`
- [ ] API endpoints return 200: `/api/settings/public`
- [ ] Favicon loads: `/favicon.ico` returns 200

## Prevention

To prevent this in the future:

1. **Always use deployment scripts** - They handle environment differences
2. **Test locally first** - Run `npm run build` before deploying
3. **Verify Prisma binary targets** - Keep `debian-openssl-3.0.x` in `schema.prisma`
4. **Document environment variables** - Keep `.env.example` up to date
5. **Use Git for .env templates** - Commit `.env.example`, never commit `.env.production`

## Need More Help?

Run the diagnostic script:
```powershell
.\diagnose-and-fix-production.ps1
```

Or contact the development team with:
- PM2 logs: `pm2 logs dromkok-web --lines 200`
- Error screenshots from browser console
- Server specs: `uname -a && node -v && npm -v && psql --version`
