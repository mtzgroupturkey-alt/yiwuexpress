# 🔧 Troubleshooting Guide - YIWU EXPRESS

## 🚨 Common Issues and Solutions

### Issue 1: 500 Internal Server Error on Login

**Symptoms:**
```
POST http://localhost:3001/api/auth/login 500 (Internal Server Error)
```

**Root Cause:** Database not initialized

**Solution:**
1. **Stop the backend server** (Ctrl+C in the terminal)
2. **Run the database fix script:**
   ```bash
   # Double-click this file:
   FIX-DATABASE.bat
   ```
3. **Restart the backend:**
   ```bash
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
   npm run dev
   ```

**Test Login:**
- Email: `admin@yiwuexpress.com`
- Password: `admin123`

---

### Issue 2: EPERM Error (Operation Not Permitted)

**Symptoms:**
```
EPERM: operation not permitted, rename 'query_engine-windows.dll.node.tmp' -> 'query_engine-windows.dll.node'
```

**Root Cause:** Files are locked by running Node processes or VS Code

**Solution:**

**Option A: Complete Stop and Restart**
1. Close ALL terminal windows
2. Close VS Code completely
3. Open CMD as Administrator:
   ```bash
   taskkill /F /IM node.exe
   ```
4. Wait 5 seconds
5. Open VS Code and run `FIX-DATABASE.bat`

**Option B: Restart Computer**
If Option A doesn't work, restart your computer and try again.

---

### Issue 3: CORS Policy Errors

**Symptoms:**
```
Access to XMLHttpRequest at 'http://localhost:3001/api/auth/login' from origin 'http://localhost:8081' has been blocked by CORS policy
```

**Root Cause:** Backend not running or CORS not configured

**Solution:**
1. **Ensure backend is running FIRST:**
   ```bash
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
   npm run dev
   ```
   Wait until you see: `✓ Ready on http://localhost:3001`

2. **Then start mobile app:**
   ```bash
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
   npm start
   ```

3. **Verify CORS configuration in `web/.env.local`:**
   ```env
   ALLOWED_ORIGINS=http://localhost:8081,http://localhost:3000,http://localhost:19006
   ```

---

### Issue 4: Port Already in Use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3001
```

**Solution:**

**For Backend (Port 3001):**
```bash
# Find the process
netstat -ano | findstr :3001

# Kill the process (replace [PID] with the actual number)
taskkill /PID [PID] /F
```

**For Mobile (Port 8081):**
```bash
# Find the process
netstat -ano | findstr :8081

# Kill the process
taskkill /PID [PID] /F
```

**Or use the check script:**
```bash
# Double-click this file:
CHECK-PORTS.bat
```

---

### Issue 5: Prisma Client Not Generated

**Symptoms:**
```
Error: @prisma/client did not initialize yet
```

**Solution:**
1. Stop all Node processes
2. Run:
   ```bash
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
   npm run db:generate
   ```

---

### Issue 6: Database Schema Mismatch

**Symptoms:**
```
Error: Invalid `prisma.user.findUnique()` invocation
```

**Root Cause:** Database schema doesn't match Prisma schema

**Solution:**
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run db:push
```

---

### Issue 7: JWT Secret Missing

**Symptoms:**
```
Error: JWT_SECRET is not defined
```

**Solution:**
Check `web/.env.local` has:
```env
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-use-at-least-32-characters"
```

---

### Issue 8: Module Not Found Errors

**Symptoms:**
```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
# Reinstall dependencies
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm install

cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npm install
```

---

### Issue 9: Mobile App Can't Connect to Backend

**Checklist:**
- ✅ Backend is running on port 3001
- ✅ Mobile app is running on port 8081
- ✅ No CORS errors in browser console
- ✅ `mobile/src/config/api.config.ts` has correct `BACKEND_PORT: 3001`
- ✅ Test backend URL directly: http://localhost:3001/api/services

**Verify API Configuration:**
```typescript
// mobile/src/config/api.config.ts
export const API_CONFIG = {
  BACKEND_PORT: 3001,
  EXPO_PORT: 8081,
  HOSTNAME: 'localhost',
  // ...
}
```

---

### Issue 10: Changes Not Reflecting

**Solution:**
1. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Or open in Incognito mode

2. **Restart development servers:**
   ```bash
   # Stop both terminals (Ctrl+C)
   # Then restart
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
   npm run dev
   
   # In another terminal
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
   npm start
   ```

---

## 🔍 Debugging Tips

### Check Backend Logs
Look at the terminal where `npm run dev` is running. The login route logs errors:
```typescript
console.error('Login error:', error)
```

### Check Database File
Database location: `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db`

Verify it exists:
```bash
dir c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db
```

### Test API Endpoints Directly
```bash
# Test services endpoint
curl http://localhost:3001/api/services

# Test login endpoint
curl -X POST http://localhost:3001/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"admin@yiwuexpress.com\",\"password\":\"admin123\"}"
```

### View Database Content
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run db:studio
```
This opens Prisma Studio at http://localhost:5555

---

## 📞 Still Having Issues?

### Before Asking for Help:
1. ✅ Read this entire troubleshooting guide
2. ✅ Check both terminal outputs (backend and mobile)
3. ✅ Check browser console for errors
4. ✅ Verify ports with `CHECK-PORTS.bat`
5. ✅ Try restarting everything with `QUICK-START.bat`

### What to Include:
- Exact error message (copy/paste)
- Which terminal/browser it appeared in
- Steps you took before the error
- Output from `CHECK-PORTS.bat`
- Screenshot if applicable

---

## 🚀 Quick Recovery Commands

### Nuclear Option (Fresh Start)
```bash
# 1. Stop everything
taskkill /F /IM node.exe

# 2. Backup and delete database
del c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db

# 3. Reinstall dependencies
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
rmdir /s /q node_modules
npm install

# 4. Setup database
npm run db:generate
npm run db:push
npm run db:seed

# 5. Start fresh
# Use QUICK-START.bat
```

---

## ✅ Verification Checklist

After fixing issues, verify:
- [ ] Backend starts without errors: `npm run dev` in web folder
- [ ] Backend accessible at: http://localhost:3001
- [ ] Mobile app starts: `npm start` in mobile folder  
- [ ] Mobile app accessible at: http://localhost:8081
- [ ] Login works with test credentials
- [ ] No CORS errors in console
- [ ] Database file exists: `web\prisma\dev.db`

---

## 📚 Related Documentation
- [SETUP-AND-START.md](SETUP-AND-START.md) - Setup guide
- [PORT-CONFIG.md](PORT-CONFIG.md) - Port configuration
- [DATABASE_SETUP.md](DATABASE_SETUP.md) - Database details
