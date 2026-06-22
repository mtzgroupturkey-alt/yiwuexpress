# 🎯 START HERE - YIWU EXPRESS Setup

## 🔍 What Was the Problem?

You were getting a **500 Internal Server Error** when trying to login:
```
POST http://localhost:3001/api/auth/login 500 (Internal Server Error)
```

## 🐛 Root Causes Found & Fixed

### 1. ❌ Database Mismatch (FIXED)
- **Problem:** Prisma schema was set to PostgreSQL but `.env.local` pointed to SQLite
- **Fix:** Changed `prisma/schema.prisma` from `provider = "postgresql"` to `provider = "sqlite"`

### 2. ❌ Database Not Initialized
- **Problem:** Database file `web/prisma/dev.db` doesn't exist
- **Fix:** Created `FIX-DATABASE.bat` script to initialize it

### 3. ✅ CORS Already Fixed (Previous Session)
- CORS headers configured for mobile app access
- Ports static: Backend 3001, Mobile 8081

---

## ✅ What You Need to Do Now

### Step 1: Fix the EPERM Error and Setup Database

**You have 2 options:**

**Option A: Close Everything First (RECOMMENDED)**
1. **Stop the backend server** in VS Code terminal (press Ctrl+C)
2. **Close VS Code completely** (important to release file locks)
3. **Open Command Prompt as Administrator**
4. Run:
   ```bash
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo
   FIX-DATABASE.bat
   ```
5. Wait for completion (should take 30 seconds)

**Option B: Kill All Node Processes**
1. Open Command Prompt as Administrator
2. Run:
   ```bash
   taskkill /F /IM node.exe
   ```
3. Wait 5 seconds
4. Run:
   ```bash
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo
   FIX-DATABASE.bat
   ```

### Step 2: Start the Servers

After the database is set up successfully, start your servers:

```bash
# Double-click this file:
QUICK-START.bat
```

This will open 2 terminal windows automatically.

### Step 3: Test Login

Open your mobile app at http://localhost:8081 and login with:

**Admin Account:**
- Email: `admin@yiwuexpress.com`
- Password: `admin123`

**OR Customer Account:**
- Email: `user@example.com`
- Password: `password123`

---

## 📋 Quick Reference

### Important Files Created/Updated

| File | What It Does |
|------|--------------|
| `FIX-DATABASE.bat` | **NEW** - Stops Node, generates Prisma client, creates & seeds database |
| `QUICK-START.bat` | **UPDATED** - Now checks if database exists before starting |
| `TROUBLESHOOTING.md` | **NEW** - Comprehensive troubleshooting guide |
| `README.md` | **NEW** - Complete project documentation |
| `prisma/schema.prisma` | **FIXED** - Changed from PostgreSQL to SQLite |

### What Should Exist After Setup

- ✅ `web/prisma/dev.db` - SQLite database file
- ✅ `web/node_modules/.prisma/client/` - Generated Prisma client
- ✅ Backend running on port 3001
- ✅ Mobile app running on port 8081

---

## 🔍 How to Verify Everything Works

### 1. Check Database Exists
```bash
dir c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db
```
You should see the file with a size (not 0 bytes).

### 2. Test Backend API Directly
Open browser: http://localhost:3001/api/services

You should see a JSON array of services.

### 3. Test Login from Mobile App
- Open http://localhost:8081
- Enter: `admin@yiwuexpress.com` / `admin123`
- Click Login
- Should redirect to dashboard (no 500 error!)

---

## 🐛 If You Still Get Errors

### Error: EPERM (operation not permitted)
**Solution:** You need to close VS Code and stop all Node processes
```bash
taskkill /F /IM node.exe
```
Then run `FIX-DATABASE.bat` again.

### Error: "Port 3001 already in use"
**Solution:** Kill the process using the port
```bash
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

### Error: Still 500 on Login
**Solution:** Check the backend terminal output for the actual error:
```
console.error('Login error:', error)
```
Copy that error message and we can debug further.

### Error: CORS Issues
**Solution:** Make sure you start backend FIRST, wait for "Ready", then start mobile.

---

## 📞 Need Help?

**Before asking:**
1. ✅ Did you run `FIX-DATABASE.bat` successfully?
2. ✅ Does `web/prisma/dev.db` exist?
3. ✅ Did you start backend before mobile?
4. ✅ Check backend terminal for error messages

**When asking for help, provide:**
- Exact error message
- Output from `FIX-DATABASE.bat`
- Backend terminal output
- Screenshot of browser console errors

---

## 🎉 Expected Result

After following the steps above:

1. ✅ Database initialized with test data
2. ✅ Backend API running on port 3001
3. ✅ Mobile app running on port 8081
4. ✅ Login works with test credentials
5. ✅ No 500 errors
6. ✅ No CORS errors

---

## 📚 Next Steps

Once everything is working:

1. **Explore the app** - Browse services, quotes, shipments
2. **View database** - Run `npm run db:studio` in web folder
3. **Read documentation:**
   - [README.md](README.md) - Full project overview
   - [TROUBLESHOOTING.md](TROUBLESHOOTING.md) - All solutions
   - [SETUP-AND-START.md](SETUP-AND-START.md) - Detailed setup
   - [PORT-CONFIG.md](PORT-CONFIG.md) - Port configuration

---

**🚀 Ready? Run `FIX-DATABASE.bat` now!**
