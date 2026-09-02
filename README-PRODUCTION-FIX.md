# 🚨 Production Server Error Fix

**Quick Fix**: Your production server has API 500 errors and a missing favicon. Run this to fix everything automatically:

```powershell
.\quick-fix-production.ps1
```

## What's Wrong?

Your production server (dromkok.com) has these errors:

- ❌ `/api/settings` → 500 Internal Server Error
- ❌ `/api/admin/settings/company` → 500 Internal Server Error  
- ❌ `/favicon.ico` → 404 Not Found

**Why?**
1. Prisma Client was generated on Windows but server runs Linux
2. Database schema not synced with recent changes
3. Environment variables may be missing
4. Favicon.ico file doesn't exist (only .svg)

## 3-Step Fix

### Step 1: Check What's Wrong

```powershell
.\check-production-env.ps1
```

This shows you exactly what's missing.

### Step 2: Fix Everything Automatically

```powershell
.\quick-fix-production.ps1
```

This fixes:
- ✅ Favicon (creates and uploads .ico file)
- ✅ Prisma Client (regenerates with Linux binary)
- ✅ Database schema (syncs latest changes)
- ✅ Application (rebuilds and restarts)

**Time**: 2-3 minutes

### Step 3: Verify

The script will test all endpoints. You should see:

```
Testing API endpoints...
  /api/settings/public: ✓ 200 OK
  /api/admin/settings/company: ✓ 200 OK
  /favicon.ico: ✓ 200 OK

✓ ALL ISSUES FIXED!
```

## Files Included

| File | Purpose | When to Use |
|------|---------|-------------|
| **check-production-env.ps1** | Diagnose issues | Run first to see what's wrong |
| **quick-fix-production.ps1** | Auto-fix (recommended) | Fix most issues automatically |
| **diagnose-and-fix-production.ps1** | Full diagnostic | When quick fix doesn't work |
| **PRODUCTION-FIX-SUMMARY.md** | Quick reference | Overview and commands |
| **PRODUCTION-ERRORS-FIX-GUIDE.md** | Detailed guide | Manual fix instructions |

## If Auto-Fix Doesn't Work

### Missing Environment Variables

SSH to server and create `.env.production`:

```bash
ssh -p 22 djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
nano .env.production
```

Required variables:
```env
DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"
JWT_SECRET="<generate-64-char-secret>"
NEXT_PUBLIC_API_URL=https://dromkok.com
NODE_ENV=production
```

Generate JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Then restart:
```bash
pm2 restart dromkok-web
```

### Database Connection Failed

Test connection:
```bash
ssh -p 22 djdn@39.175.57.2
psql postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce -c "\l"
```

If fails:
1. Check PostgreSQL is running: `sudo systemctl status postgresql`
2. Check DATABASE_URL in `.env.production`
3. Verify password: `LzZH5p5SnRtNKfMy`

### Prisma Client Issues

Regenerate on server:
```bash
ssh -p 22 djdn@39.175.57.2
cd /www/wwwroot/www.dromkok.com/web
npx prisma generate
npx prisma db push --accept-data-loss
pm2 restart dromkok-web
```

## Check Logs

If errors persist, check PM2 logs:
```bash
ssh -p 22 djdn@39.175.57.2 'pm2 logs dromkok-web --lines 100'
```

## Why This Happened

**Cross-Platform Issue:**
- Your local machine: Windows (C:\wamp64\...)
- Production server: Linux (Ubuntu 24.04)
- Prisma generates platform-specific binaries

**Solution:**
- Your `schema.prisma` includes: `binaryTargets = ["native", "debian-openssl-3.0.x"]`
- This ensures Linux binary is generated
- But you must run `npx prisma generate` on the server after changes

## Prevention

1. **Always test builds locally:**
   ```bash
   cd ecommerce-monorepo\web
   npm run build
   ```

2. **Use deployment scripts** - They handle platform differences

3. **Verify environment** before deploying:
   ```powershell
   .\check-production-env.ps1
   ```

4. **Monitor PM2:**
   ```bash
   pm2 logs dromkok-web
   ```

## Need More Help?

1. **Run diagnostics**: `.\check-production-env.ps1`
2. **Read detailed guide**: `PRODUCTION-ERRORS-FIX-GUIDE.md`
3. **View summary**: `PRODUCTION-FIX-SUMMARY.md`
4. **Check logs**: `ssh djdn@39.175.57.2 'pm2 logs dromkok-web'`

---

## TL;DR

```powershell
# Fix everything:
.\quick-fix-production.ps1

# Then check:
# https://dromkok.com → Should work
# https://dromkok.com/api/settings/public → Should return 200
```

**That's it!** 🎉
