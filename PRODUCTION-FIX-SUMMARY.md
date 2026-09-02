# Production Server Error Fix - Summary

## Problem Overview

**Server**: 39.175.57.2 (user: djdn, port: 22)  
**Path**: `/www/wwwroot/www.dromkok.com/web`  
**Domain**: dromkok.com  
**PM2 Process**: dromkok-web

### Errors Found

1. ❌ `/api/settings/public` → 500 Internal Server Error
2. ❌ `/api/admin/settings/company` → 500 Internal Server Error
3. ❌ `/favicon.ico` → 404 Not Found

## Root Causes Identified

### 1. API 500 Errors

The API routes are failing because:

- **Missing/incorrect environment variables** in `.env.production`
  - `DATABASE_URL` - PostgreSQL connection string
  - `JWT_SECRET` - Authentication secret (must be 64+ characters)
  - `NEXT_PUBLIC_API_URL` - Should be `https://dromkok.com`

- **Prisma Client mismatch**
  - Prisma Client was generated on Windows (your local machine)
  - Production server runs Linux (Ubuntu 24.04)
  - Need to regenerate with `debian-openssl-3.0.x` binary

- **Database schema not synced**
  - Recent schema changes (SystemSettings, translations) not pushed

### 2. Favicon 404 Error

- File `public/favicon.ico` doesn't exist
- Only `public/favicon.svg` exists
- Browsers request `.ico` format

## Fix Scripts Created

### 1. Quick Fix (Recommended)

```powershell
.\quick-fix-production.ps1
```

**What it does:**
- ✅ Creates and uploads `favicon.ico`
- ✅ Regenerates Prisma Client with Linux binary
- ✅ Syncs database schema
- ✅ Rebuilds application
- ✅ Restarts PM2
- ✅ Tests all endpoints

**Time**: ~2-3 minutes

### 2. Environment Check

```powershell
.\check-production-env.ps1
```

**What it does:**
- ✅ Checks if `.env.production` exists
- ✅ Validates critical environment variables
- ✅ Tests database connection
- ✅ Verifies Prisma Client installation
- ✅ Checks PM2 process status

**Use this first** to diagnose the exact issue.

### 3. Full Diagnostic

```powershell
.\diagnose-and-fix-production.ps1
```

**What it does:**
- ✅ Complete environment diagnostics
- ✅ PM2 logs analysis
- ✅ Database connectivity test
- ✅ All fixes from quick-fix script
- ✅ Detailed verification
- ✅ Troubleshooting guide

**Time**: ~5-10 minutes (includes manual steps)

## Quick Start Guide

### Step 1: Check Environment

```powershell
.\check-production-env.ps1
```

This will tell you exactly what's missing.

### Step 2: Run Quick Fix

```powershell
.\quick-fix-production.ps1
```

This fixes most issues automatically.

### Step 3: Verify

The script will test:
- ✅ `/api/settings/public` → Should return 200
- ✅ `/api/admin/settings/company` → Should return 200
- ✅ `/favicon.ico` → Should return 200

## Manual Fix (If Scripts Fail)

### Fix Environment Variables

SSH to server:
```bash
ssh -p 22 djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
nano .env.production
```

Required variables:
```env
DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"
JWT_SECRET="<your-64-character-secret-here>"
NEXT_PUBLIC_API_URL=https://dromkok.com
NODE_ENV=production
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Fix Prisma Client

```bash
cd /www/wwwroot/www.dromkok.com/web
npx prisma generate
npx prisma db push --accept-data-loss
```

### Fix Favicon

On local machine:
```powershell
Copy-Item "ecommerce-monorepo\web\public\favicon.svg" "ecommerce-monorepo\web\public\favicon.ico"
scp -P 22 "ecommerce-monorepo\web\public\favicon.ico" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/public/
```

### Rebuild & Restart

On server:
```bash
cd /www/wwwroot/www.dromkok.com/web
rm -rf .next
NODE_ENV=production npm run build
pm2 restart dromkok-web
pm2 save
```

## Expected Results

After running the fix:

```
Testing API endpoints...
  /api/settings/public: ✓ 200 OK
  /api/admin/settings/company: ✓ 200 OK
  /favicon.ico: ✓ 200 OK

✓ ALL ISSUES FIXED!
```

## Troubleshooting

### If API still returns 500

**Check PM2 logs:**
```bash
ssh -p 22 djdn@39.175.57.2 'pm2 logs dromkok-web --lines 100'
```

**Common errors and fixes:**

1. **"Cannot find module '@prisma/client'"**
   ```bash
   npm install @prisma/client
   npx prisma generate
   ```

2. **"JWT_SECRET is not defined"**
   - Add to `.env.production`
   - Must be 64+ characters
   - Restart PM2

3. **"Database connection error"**
   - Check PostgreSQL is running
   - Verify DATABASE_URL
   - Test connection manually

4. **"Invalid prisma.systemSettings.findFirst()"**
   - Database schema out of sync
   - Run: `npx prisma db push --accept-data-loss`

### If favicon still returns 404

**Manual upload:**
```powershell
scp -P 22 "ecommerce-monorepo\web\public\favicon.svg" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/public/favicon.ico
```

**Verify on server:**
```bash
ssh -p 22 djdn@39.175.57.2 'ls -la /www/wwwroot/www.dromkok.com/web/public/favicon.*'
```

## Files Created

1. **`check-production-env.ps1`** - Diagnostic script (run first)
2. **`quick-fix-production.ps1`** - Automated fix (recommended)
3. **`diagnose-and-fix-production.ps1`** - Full diagnostic and fix
4. **`PRODUCTION-ERRORS-FIX-GUIDE.md`** - Detailed manual guide
5. **`PRODUCTION-FIX-SUMMARY.md`** - This file (quick reference)

## Prevention

To prevent future issues:

1. **Always test locally first**
   ```bash
   cd ecommerce-monorepo\web
   npm run build
   ```

2. **Keep `.env.example` updated**
   - Document all required variables
   - Keep production template in comments

3. **Verify Prisma binary targets**
   - Check `schema.prisma` has: `binaryTargets = ["native", "debian-openssl-3.0.x"]`
   - This ensures Linux binary is always generated

4. **Use deployment scripts**
   - They handle platform differences automatically
   - Test environment before deploying

5. **Monitor PM2 logs**
   ```bash
   pm2 logs dromkok-web
   ```

## Need Help?

1. **Run diagnostics**: `.\check-production-env.ps1`
2. **Read full guide**: `PRODUCTION-ERRORS-FIX-GUIDE.md`
3. **Check PM2 logs**: `ssh djdn@39.175.57.2 'pm2 logs dromkok-web'`
4. **Test manually**: Follow manual fix steps in guide

## Success Criteria

✅ All APIs return 200 OK  
✅ Favicon loads correctly  
✅ No errors in PM2 logs  
✅ Database connection works  
✅ Site accessible at https://dromkok.com  

---

**Quick Start**: Run `.\check-production-env.ps1` to see what's wrong, then run `.\quick-fix-production.ps1` to fix it automatically.
