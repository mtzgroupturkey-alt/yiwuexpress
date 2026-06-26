# 🔧 How to Fix the 500 API Errors

## The Problem

You're getting these errors:
```
GET http://localhost:3001/api/settings 500 (Internal Server Error)
GET http://localhost:3001/api/admin/stats 500 (Internal Server Error)
```

This is happening because **Prisma Client needs to be regenerated** after adding new API routes, but it's locked by the running dev server.

---

## ✅ The Solution (Step-by-Step)

### Step 1: Stop the Development Server

In the terminal where you ran `npm run dev`, press:
```
Ctrl + C
```

**Wait for it to fully stop** (you should see your command prompt again).

### Step 2: Regenerate Prisma Client

```bash
cd web
npx prisma generate
```

This should complete without errors now.

### Step 3: Verify Database

```bash
npx prisma db push
```

This ensures all tables exist.

### Step 4: Restart the Server

```bash
npm run dev
```

Wait for the "Ready" message.

### Step 5: Hard Refresh Browser

```
Ctrl + Shift + R
```

---

## 🎯 Quick Script Method

**Option A: Run the fix script**

1. Stop the dev server (Ctrl+C)
2. Run: `FIX-API-ERRORS.bat`
3. Follow the instructions
4. Restart server: `cd web && npm run dev`

**Option B: Check status first**

Run `CHECK-STATUS.bat` to see what's wrong.

---

## 🐛 If Errors Still Persist

### Check the Server Terminal

After starting `npm run dev`, look for error messages like:

**Common errors:**
```
PrismaClientInitializationError: Prisma Client could not locate...
```
**Fix:** Run `npx prisma generate`

```
Can't reach database server at `localhost:5432`
```
**Fix:** Start PostgreSQL: `cd docker && docker-compose up -d`

```
relation "system_settings" does not exist
```
**Fix:** Run `npx prisma db push` and `npm run db:seed`

### Test API Manually

Open Command Prompt and test:

```bash
# Test if server is running
curl http://localhost:3001

# Test specific API
curl http://localhost:3001/api/settings
```

If you get HTML back, the server is running but the API route is failing.
If you get `Connection refused`, the server isn't running.

### Check Browser Network Tab

1. Open DevTools (F12)
2. Go to Network tab
3. Refresh the page
4. Click on the failed request (`settings`)
5. Look at the "Response" or "Preview" tab

This will show you the actual error message.

---

## 📋 Complete Reset (Nuclear Option)

If nothing works, do a complete reset:

```bash
# 1. Stop server (Ctrl+C)

# 2. Stop PostgreSQL
cd docker
docker-compose down

# 3. Clean Prisma
cd ../web
rmdir /s /q node_modules\.prisma

# 4. Reinstall dependencies
npm install

# 5. Start PostgreSQL
cd ../docker
docker-compose up -d

# 6. Wait 10 seconds
timeout /t 10 /nobreak

# 7. Regenerate everything
cd ../web
npx prisma generate
npx prisma db push --force-reset
npm run db:seed

# 8. Start server
npm run dev
```

---

## 🔍 Diagnostic Checklist

Before asking for help, verify:

- [ ] PostgreSQL is running (`docker ps`)
- [ ] Dev server is stopped before running `prisma generate`
- [ ] `npx prisma generate` completed successfully
- [ ] `npx prisma db push` succeeded
- [ ] Database is seeded (`npm run db:seed`)
- [ ] Dev server restarted after Prisma changes
- [ ] Browser was hard-refreshed (Ctrl+Shift+R)
- [ ] You're accessing http://localhost:3001 (not 3000)

---

## 💡 Why This Happens

**The Issue:** When you add new API routes that use Prisma, the Prisma Client needs to be regenerated. However, if the dev server is running, it locks the Prisma files and prevents regeneration.

**The Fix:** Stop the server → Regenerate Prisma → Restart server

**Prevention:** Always stop the dev server before running `npx prisma generate` or `npx prisma db push`.

---

## ✅ Expected Outcome

After following these steps, you should see:

**Browser Console:**
- No errors
- Application loads normally

**API Tests:**
```bash
curl http://localhost:3001/api/settings
# Returns: {"success":true,"data":{...}}

curl http://localhost:3001/api/admin/stats
# Returns: {"success":true,"data":{...}}
```

**Server Terminal:**
```
○ Compiling /api/settings ...
✓ Compiled /api/settings in XXXms
○ Compiling /api/admin/stats ...
✓ Compiled /api/admin/stats in XXXms
```

---

## 🆘 Still Need Help?

Share the following information:

1. **Output of:** `CHECK-STATUS.bat`
2. **Server terminal output** after `npm run dev`
3. **Browser console** full error message
4. **API response** from: `curl http://localhost:3001/api/settings`

This will help diagnose the exact issue.

---

**TL;DR:**
1. Stop server (Ctrl+C)
2. `cd web && npx prisma generate`
3. `npm run dev`
4. Refresh browser (Ctrl+Shift+R)
