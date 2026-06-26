# 🔧 Troubleshooting Guide - YIWU EXPRESS

## 🐛 Issue: Still Getting 500 Errors

If you're still seeing errors like:
```
GET http://localhost:3001/api/settings 500 (Internal Server Error)
GET http://localhost:3001/api/admin/stats 500 (Internal Server Error)
```

### ✅ Solution: Restart the Development Server

**The Problem:** Next.js development server doesn't always hot-reload new API route files. You need to restart it.

### Steps to Fix:

#### 1. Stop the Current Server
In your terminal where the server is running, press:
```
Ctrl + C
```

#### 2. Start the Server Again
```bash
cd web
npm run dev
```

#### 3. Refresh Your Browser
Hard refresh with:
```
Ctrl + Shift + R  (Windows/Linux)
Cmd + Shift + R   (Mac)
```

---

## 📋 All Missing Endpoints Now Created

I've created these additional API endpoints:

### 1. System Settings API ✅
**File:** `web/app/api/settings/route.ts`
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

### 2. Company Settings API ✅
**File:** `web/app/api/admin/settings/company/route.ts`
- `GET /api/admin/settings/company` - Get company settings
- `PUT /api/admin/settings/company` - Update company settings

### 3. Admin Stats API ✅ NEW!
**File:** `web/app/api/admin/stats/route.ts`
- `GET /api/admin/stats` - Get dashboard statistics

Returns:
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 2,
      "totalOrders": 0,
      "totalProducts": 4,
      "revenue": 0,
      "pendingQuotes": 1,
      "activeShipments": 2,
      "lowStockProducts": 0
    },
    "ordersByStatus": [...],
    "wholesaleByStatus": [...],
    "recentOrders": [...]
  }
}
```

---

## 🧪 Quick Test After Restart

After restarting the server, test these endpoints:

```bash
# Test 1: System Settings
curl http://localhost:3001/api/settings

# Test 2: Company Settings
curl http://localhost:3001/api/admin/settings/company

# Test 3: Admin Stats
curl http://localhost:3001/api/admin/stats

# Test 4: Countries
curl http://localhost:3001/api/countries

# Test 5: Products
curl http://localhost:3001/api/products
```

All should return JSON with `"success": true`.

---

## 🔍 Common Issues & Solutions

### Issue 1: Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
```bash
# Check if PostgreSQL is running
docker ps | grep yiwu-express-db

# If not running, start it
cd docker
docker-compose up -d

# Wait 10 seconds for it to start
timeout /t 10 /nobreak
```

### Issue 2: Prisma Client Not Generated

**Error:** `@prisma/client did not initialize yet`

**Solution:**
```bash
cd web
npx prisma generate
```

### Issue 3: Tables Don't Exist

**Error:** `relation "system_settings" does not exist`

**Solution:**
```bash
cd web
npx prisma db push
npm run db:seed
```

### Issue 4: Port Already in Use

**Error:** `Port 3001 is already in use`

**Solution:**
```bash
# Find and kill the process using port 3001
netstat -ano | findstr :3001
# Note the PID, then:
taskkill /PID <PID> /F

# Or use a different port
set PORT=3002
npm run dev
```

### Issue 5: Module Not Found Errors

**Error:** `Cannot find module '@prisma/client'`

**Solution:**
```bash
cd web
npm install
npx prisma generate
```

---

## 🚀 Complete Reset (Nuclear Option)

If nothing else works, do a complete reset:

```bash
# 1. Stop the server (Ctrl+C)

# 2. Stop PostgreSQL
cd docker
docker-compose down

# 3. Remove node_modules
cd ../web
rmdir /s /q node_modules

# 4. Clean install
npm install

# 5. Start PostgreSQL
cd ../docker
docker-compose up -d

# 6. Wait for PostgreSQL
timeout /t 10 /nobreak

# 7. Setup database
cd ../web
npx prisma generate
npx prisma db push --force-reset
npm run db:seed

# 8. Start server
npm run dev
```

---

## ✅ Verification Checklist

After restart, verify:

- [ ] Server starts without errors
- [ ] Browser console is clear (no 500 errors)
- [ ] Can access http://localhost:3001
- [ ] Admin dashboard loads
- [ ] Settings page loads
- [ ] Products page works
- [ ] No red errors in browser console

---

## 📊 Expected API Response Format

All APIs should return this format:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

## 🆘 Still Having Issues?

### Check Server Terminal Output

Look for errors in the terminal where you ran `npm run dev`:

**Common errors:**
- `ECONNREFUSED` - Database not running
- `Module not found` - Need to run `npm install`
- `Prisma Client` - Need to run `npx prisma generate`
- `relation does not exist` - Need to run `npx prisma db push`

### Check Browser Console

Look for:
- Network errors (500, 404, etc.)
- CORS errors
- JavaScript errors

### Check Database with Prisma Studio

```bash
cd web
npx prisma studio
```

Open http://localhost:5555 and verify:
- `system_settings` table exists and has 1 row
- `countries` table has 8 rows
- `products` table has 4 rows
- `users` table has 2 rows

---

## 📝 Quick Reference

### Restart Everything
```bash
# Ctrl+C to stop server
cd web
npm run dev
```

### Reset Database
```bash
cd web
npx prisma db push --force-reset
npm run db:seed
```

### Check Logs
```bash
# PostgreSQL logs
docker logs yiwu-express-db

# Next.js logs
# In the terminal where server is running
```

### Test API
```bash
curl http://localhost:3001/api/settings
curl http://localhost:3001/api/admin/stats
curl http://localhost:3001/api/countries
```

---

## ✅ Final Checklist

Before reporting issues, ensure:

1. [ ] PostgreSQL container is running
2. [ ] Development server is running
3. [ ] Database is seeded
4. [ ] Prisma Client is generated
5. [ ] Browser was hard-refreshed
6. [ ] No other app is using port 3001
7. [ ] You're accessing http://localhost:3001 (not 3000)

---

**Most Common Fix:** Just restart the development server!

```bash
# Stop with Ctrl+C, then:
cd web
npm run dev
```

Then refresh your browser with `Ctrl+Shift+R`.

---

**Need more help?** Check the other documentation files:
- `README.md` - General setup
- `MIGRATION_GUIDE.md` - Database setup
- `TEST_APIS.md` - API testing
- `PHASE_1_FIXED.md` - Recent fixes
