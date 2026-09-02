# ⚡ EXECUTE FIX NOW - Step-by-Step

## 🎯 Your Goal
Fix production server errors in 5 minutes.

## 📍 Current Status

**Your Production Server:**
- Server: `39.175.57.2`
- User: `djdn`
- Port: `22`
- Path: `/www/wwwroot/www.dromkok.com/web`
- Domain: `dromkok.com`

**Current Errors:**
```
❌ /api/settings/public → 500 Internal Server Error
❌ /api/admin/settings/company → 500 Internal Server Error
❌ /favicon.ico → 404 Not Found
```

## 🚀 Execute Fix (5 Minutes)

### STEP 1: Open PowerShell (10 seconds)

1. Press `Windows + X`
2. Select "Windows PowerShell" or "Terminal"
3. Navigate to project:
   ```powershell
   cd C:\wamp64\www\yiwuexpress
   ```

### STEP 2: Run Diagnostic (30 seconds)

```powershell
.\check-production-env.ps1
```

**What to look for:**
- ✅ Green checkmarks = Good
- ❌ Red X marks = Problem found
- ⚠️ Yellow warnings = Needs attention

**Common outputs:**

**If everything looks good:**
```
✓ .env.production exists
✓ DATABASE_URL: SET
✓ JWT_SECRET: SET (length OK)
✓ Database connection successful
```
→ Skip to STEP 3

**If critical variables missing:**
```
✗ .env.production DOES NOT EXIST!
✗ DATABASE_URL: MISSING
✗ JWT_SECRET: MISSING
```
→ Go to "Fix Environment Variables" below

### STEP 3: Run Automatic Fix (2-3 minutes)

```powershell
.\quick-fix-production.ps1
```

**This will:**
1. Create and upload favicon.ico
2. Regenerate Prisma Client (Linux binary)
3. Sync database schema
4. Rebuild application
5. Restart PM2
6. Test all endpoints

**Wait for completion.** You'll see progress updates.

### STEP 4: Verify Success (30 seconds)

**Check the output at the end:**

**SUCCESS:**
```
Testing API endpoints...
  /api/settings/public: ✓ 200 OK
  /api/admin/settings/company: ✓ 200 OK
  /favicon.ico: ✓ 200 OK

✓ ALL ISSUES FIXED!
```
✅ **You're done!** Open https://dromkok.com

**PARTIAL SUCCESS:**
```
⚠ SOME ISSUES REMAIN
```
→ Check the suggestions in the output
→ Or follow "Manual Fixes" below

## 🔧 Manual Fixes (If Needed)

### Fix Environment Variables

**If diagnostic shows `.env.production` missing:**

1. **Connect to server:**
   ```powershell
   ssh -p 22 djdn@39.175.57.2
   ```

2. **Navigate to web directory:**
   ```bash
   cd /www/wwwroot/www.dromkok.com/web
   ```

3. **Create .env.production:**
   ```bash
   nano .env.production
   ```

4. **Add these variables:**
   ```env
   # Database (CRITICAL)
   DATABASE_URL="postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce"
   
   # JWT Authentication (CRITICAL)
   JWT_SECRET="REPLACE_WITH_64_CHAR_SECRET"
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

5. **Generate JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
   Copy the output and replace `REPLACE_WITH_64_CHAR_SECRET`

6. **Save and exit:**
   - Press `Ctrl+O` (save)
   - Press `Enter` (confirm)
   - Press `Ctrl+X` (exit)

7. **Restart PM2:**
   ```bash
   pm2 restart dromkok-web
   pm2 save
   ```

8. **Exit SSH:**
   ```bash
   exit
   ```

9. **Re-run the fix:**
   ```powershell
   .\quick-fix-production.ps1
   ```

### Fix Database Connection

**If diagnostic shows database error:**

1. **Connect to server:**
   ```powershell
   ssh -p 22 djdn@39.175.57.2
   ```

2. **Check PostgreSQL status:**
   ```bash
   sudo systemctl status postgresql
   ```
   
   **If not running:**
   ```bash
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

3. **Test connection manually:**
   ```bash
   psql "postgresql://ecommerce:LzZH5p5SnRtNKfMy@localhost:5432/ecommerce" -c "\l"
   ```
   
   **If fails:**
   - Password might be wrong
   - Database might not exist
   - PostgreSQL might not be configured

4. **Check database exists:**
   ```bash
   sudo -u postgres psql -c "\l" | grep ecommerce
   ```

5. **Exit SSH:**
   ```bash
   exit
   ```

6. **Re-run the fix:**
   ```powershell
   .\quick-fix-production.ps1
   ```

### Fix Prisma Client

**If you see Prisma errors in logs:**

1. **Connect to server:**
   ```powershell
   ssh -p 22 djdn@39.175.57.2
   ```

2. **Navigate and regenerate:**
   ```bash
   cd /www/wwwroot/www.dromkok.com/web
   npx prisma generate
   npx prisma db push --accept-data-loss
   ```

3. **Rebuild and restart:**
   ```bash
   rm -rf .next
   NODE_ENV=production npm run build
   pm2 restart dromkok-web
   pm2 save
   ```

4. **Exit SSH:**
   ```bash
   exit
   ```

## 📊 Verification Checklist

After running the fix, verify each item:

```
□ Open PowerShell in C:\wamp64\www\yiwuexpress
□ Run: .\check-production-env.ps1
□ All checks show ✓ green
□ Run: .\quick-fix-production.ps1
□ All endpoints return 200 OK
□ Visit https://dromkok.com - site loads
□ Check https://dromkok.com/api/settings/public - returns JSON
□ Check browser console - no 500 errors
□ Favicon appears in browser tab
```

## 🎓 Understanding the Fix

**Why do we need to do this?**

1. **Cross-Platform Issue:**
   - Your computer: Windows
   - Production server: Linux
   - Prisma needs different binaries for each

2. **Database Schema:**
   - Recent changes added new tables/columns
   - Production database needs to be updated

3. **Environment Variables:**
   - Production needs different settings than local
   - Security keys must be configured

4. **Favicon:**
   - Browsers request `.ico` format
   - You only had `.svg` format

## 🆘 Troubleshooting

### Script Won't Run

**Error: "cannot be loaded because running scripts is disabled"**

**Fix:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

Then try again.

### SSH Connection Failed

**Error: "Connection refused" or "Permission denied"**

**Check:**
1. Server IP correct: `39.175.57.2`
2. Port correct: `22`
3. Username correct: `djdn`
4. You have SSH access

**Test connection:**
```powershell
ssh -p 22 djdn@39.175.57.2 "echo Connected"
```

### Still Getting 500 Errors

**Get detailed logs:**
```powershell
ssh -p 22 djdn@39.175.57.2 'pm2 logs dromkok-web --err --lines 100'
```

Look for:
- `Cannot find module` → Missing dependencies
- `JWT_SECRET` → Environment variable issue
- `Database` → Connection or schema issue
- `Prisma` → Client generation issue

## 📞 Quick Commands

```powershell
# Check what's wrong
.\check-production-env.ps1

# Fix everything
.\quick-fix-production.ps1

# View logs
ssh -p 22 djdn@39.175.57.2 'pm2 logs dromkok-web'

# Restart server
ssh -p 22 djdn@39.175.57.2 'pm2 restart dromkok-web'

# Connect to server
ssh -p 22 djdn@39.175.57.2

# Test API
curl https://dromkok.com/api/settings/public
```

## ✅ Success Indicators

**Your site is fixed when:**

1. **No errors in browser console**
   - Open https://dromkok.com
   - Press F12 → Console tab
   - Should see no red errors

2. **APIs return data**
   - https://dromkok.com/api/settings/public
   - Should return JSON with `companyName`, `currency`, etc.

3. **Favicon appears**
   - Browser tab shows favicon
   - https://dromkok.com/favicon.ico loads

4. **PM2 shows online**
   ```bash
   ssh djdn@39.175.57.2 'pm2 status'
   ```
   Status should be "online" not "errored"

---

## 🎯 Action Plan

**Right now, do this:**

1. Open PowerShell
2. Run `.\check-production-env.ps1`
3. Run `.\quick-fix-production.ps1`
4. Check https://dromkok.com
5. Done! ✅

**Total time: 5 minutes**

---

**Questions?** Check `PRODUCTION-ERRORS-FIX-GUIDE.md` for detailed explanations.

**Need help?** Run `.\diagnose-and-fix-production.ps1` for full diagnostic.
