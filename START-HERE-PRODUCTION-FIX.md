# 🚀 START HERE - Production Error Fix

## ⚡ Quick Start (5 Minutes)

Your production server has errors. Here's how to fix them:

```powershell
# Step 1: Check what's wrong (30 seconds)
.\check-production-env.ps1

# Step 2: Fix everything automatically (2-3 minutes)
.\quick-fix-production.ps1

# Done! ✅
```

## 📋 What You'll Fix

| Problem | Status | Fix |
|---------|--------|-----|
| API returns 500 errors | ❌ Broken | ✅ Auto-fixed |
| Favicon 404 error | ❌ Missing | ✅ Auto-fixed |
| Database schema outdated | ⚠️ Out of sync | ✅ Auto-fixed |
| Prisma Client (Windows→Linux) | ⚠️ Wrong platform | ✅ Auto-fixed |

## 📁 Files You Have

### 🔧 Fix Scripts (Run These)

1. **`check-production-env.ps1`** ⭐ Start here
   - Shows what's wrong
   - Checks environment variables
   - Tests database connection
   - **Run this first!**

2. **`quick-fix-production.ps1`** ⭐ Recommended
   - Fixes most issues automatically
   - Creates favicon
   - Fixes Prisma Client
   - Rebuilds and restarts
   - **Takes 2-3 minutes**

3. **`diagnose-and-fix-production.ps1`** 🔍 Advanced
   - Full diagnostic
   - Manual verification steps
   - Detailed troubleshooting
   - **Use if quick fix fails**

### 📖 Documentation

1. **`README-PRODUCTION-FIX.md`** - Quick overview (read this for context)
2. **`PRODUCTION-FIX-SUMMARY.md`** - Complete summary with all details
3. **`PRODUCTION-ERRORS-FIX-GUIDE.md`** - Step-by-step manual fix guide

## 🎯 Recommended Workflow

### For Quick Fix (Most Cases)

```powershell
# 1. Diagnose
.\check-production-env.ps1

# 2. Fix
.\quick-fix-production.ps1

# 3. Done!
```

### For Manual Fix (If Needed)

```powershell
# 1. Read the guide
notepad PRODUCTION-ERRORS-FIX-GUIDE.md

# 2. Follow manual steps
# (SSH to server, edit .env.production, etc.)

# 3. Verify
.\check-production-env.ps1
```

## 🔍 What Each Script Does

### `check-production-env.ps1`

**What it checks:**
- ✅ `.env.production` exists
- ✅ DATABASE_URL is set
- ✅ JWT_SECRET is set (64+ chars)
- ✅ NEXT_PUBLIC_API_URL is correct
- ✅ Database connection works
- ✅ Prisma Client installed
- ✅ PM2 process running

**Output example:**
```
=== ENVIRONMENT FILE ===
✓ .env.production exists

=== CRITICAL VARIABLES ===
✓ DATABASE_URL: SET
✓ JWT_SECRET: SET (length OK)
✓ NEXT_PUBLIC_API_URL: SET
✓ NODE_ENV: SET

=== DATABASE CONNECTION ===
✓ Database connection successful
✓ SystemSettings table accessible
```

### `quick-fix-production.ps1`

**What it fixes:**
1. Creates `favicon.ico` from `favicon.svg`
2. Uploads favicon to production
3. Regenerates Prisma Client with Linux binary
4. Syncs database schema
5. Clears build cache
6. Rebuilds application
7. Restarts PM2
8. Tests all endpoints

**Output example:**
```
FIX 1: Creating and uploading favicon.ico...
  ✓ Created favicon.ico locally
  ✓ Uploaded favicon.ico to production

FIX 2: Fixing Prisma Client and Database...
  → Generating Prisma Client with Linux binary...
  → Pushing database schema...
  ✓ Database fixed

FIX 3: Checking critical environment variables...
  ✓ .env.production exists
  ✓ DATABASE_URL is set
  ✓ JWT_SECRET is set

FIX 4: Rebuilding and restarting...
  → Clearing build cache...
  → Building application...
  → Restarting PM2...
  ✓ Restart complete

VERIFICATION: Testing endpoints...
  /api/settings/public: ✓ 200 OK
  /api/admin/settings/company: ✓ 200 OK
  /favicon.ico: ✓ 200 OK

✓ ALL ISSUES FIXED!
```

## 🚨 Common Issues & Solutions

### Issue 1: ".env.production does not exist"

**Fix:**
```bash
ssh -p 22 djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
nano .env.production
```

Add:
```env
DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"
JWT_SECRET="<your-64-character-secret>"
NEXT_PUBLIC_API_URL=https://dromkok.com
NODE_ENV=production
```

Generate JWT_SECRET:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Issue 2: "Database connection error"

**Check:**
```bash
ssh -p 22 djdn@39.175.57.2
sudo systemctl status postgresql
```

**Test connection:**
```bash
psql postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce -c "\l"
```

### Issue 3: "Prisma Client error"

**Fix:**
```bash
ssh -p 22 djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
npx prisma generate
npx prisma db push --accept-data-loss
pm2 restart dromkok-web
```

### Issue 4: "PM2 not running"

**Check & restart:**
```bash
ssh -p 22 djdn@39.175.57.2
pm2 status
pm2 restart dromkok-web
pm2 save
```

## 📊 Success Criteria

After running the fix, you should see:

✅ **APIs work:**
- https://dromkok.com/api/settings/public → 200 OK
- https://dromkok.com/api/admin/settings/company → 200 OK

✅ **Favicon loads:**
- https://dromkok.com/favicon.ico → 200 OK

✅ **No errors in logs:**
```bash
ssh djdn@39.175.57.2 'pm2 logs dromkok-web --lines 20'
```

✅ **Site accessible:**
- https://dromkok.com → Homepage loads

## 🎓 Why This Happened

**The Issue:**
- You develop on **Windows** (C:\wamp64\...)
- Production runs on **Linux** (Ubuntu 24.04)
- Prisma generates **platform-specific binaries**

**The Fix:**
- `schema.prisma` has: `binaryTargets = ["native", "debian-openssl-3.0.x"]`
- This tells Prisma to generate **both** Windows and Linux binaries
- But you must **regenerate on server** after schema changes

**Prevention:**
1. Always run `npx prisma generate` on production after schema changes
2. Use deployment scripts (they handle this automatically)
3. Test builds locally: `npm run build`

## 🆘 Need Help?

### If Quick Fix Fails

1. **Read detailed guide:**
   ```powershell
   notepad PRODUCTION-ERRORS-FIX-GUIDE.md
   ```

2. **Check logs:**
   ```bash
   ssh djdn@39.175.57.2 'pm2 logs dromkok-web --lines 100'
   ```

3. **Run full diagnostic:**
   ```powershell
   .\diagnose-and-fix-production.ps1
   ```

### If API Still Returns 500

**Get error details:**
```bash
ssh djdn@39.175.57.2 'pm2 logs dromkok-web --err --lines 50'
```

**Common errors:**
- "Cannot find module" → Run `npm install`
- "JWT_SECRET is not defined" → Add to `.env.production`
- "Database error" → Check DATABASE_URL
- "Prisma error" → Run `npx prisma generate`

### If You're Stuck

**Verify everything manually:**
```bash
ssh -p 22 djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web

# Check files
ls -la .env.production
ls -la public/favicon.ico
ls -la node_modules/@prisma/client

# Check process
pm2 status
pm2 logs dromkok-web --lines 50

# Check database
psql postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce -c "\l"
```

## ✨ After Fix

Your site should be working perfectly:

🌐 **Visit**: https://dromkok.com  
🔧 **Admin**: https://dromkok.com/admin  
⚙️ **Settings**: https://dromkok.com/admin/settings/system  

---

## 🚀 Quick Commands Reference

```powershell
# Diagnose issues
.\check-production-env.ps1

# Auto-fix everything
.\quick-fix-production.ps1

# Check logs
ssh djdn@39.175.57.2 'pm2 logs dromkok-web'

# Restart PM2
ssh djdn@39.175.57.2 'pm2 restart dromkok-web'

# Connect to server
ssh -p 22 djdn@39.175.57.2
```

---

**Start here**: Run `.\check-production-env.ps1` to see what needs fixing! 🎯
