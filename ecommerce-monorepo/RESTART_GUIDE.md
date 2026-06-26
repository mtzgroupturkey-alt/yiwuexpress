# 🚀 QUICK RESTART GUIDE

## CORS Error Fixed - Apply Changes Now!

---

## ⚠️ WHY YOU NEED TO RESTART

The CORS error fix was implemented in `next.config.js`, which requires a **server restart** to take effect. Without restarting, the mobile app will still get CORS errors.

---

## 🔧 HOW TO RESTART

### Step 1: Stop Current Server

Find the terminal where `npm run dev` is running for the web app, and press:

```
Ctrl + C
```

This stops the current Next.js server.

---

### Step 2: Restart Backend

```powershell
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

**Wait for:**
```
✓ Ready in X.Xs
○ Local: http://localhost:3001
```

---

### Step 3: Restart Mobile App

```powershell
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npx expo start --clear
```

**The `--clear` flag** clears Metro bundler cache.

---

## ✅ VERIFY FIX WORKED

### Test 1: Check Backend Headers

Open browser DevTools (F12), go to Network tab, and check API response headers:

```
Access-Control-Allow-Origin: *
```

Should show **only ONE value**, not multiple!

### Test 2: Check Mobile Console

Mobile app should load without CORS errors. No more:
```
❌ Access-Control-Allow-Origin header contains multiple values
```

### Test 3: Test API Call

In mobile app, try:
- Logging in
- Fetching services
- Any API endpoint

Should work without errors!

---

## 🎯 EXPECTED RESULTS

After restart:

✅ Next.js server runs on `http://localhost:3001`  
✅ Expo mobile runs on `http://localhost:8081` (or `8082`)  
✅ API calls work from mobile  
✅ No CORS errors in console  
✅ Single `Access-Control-Allow-Origin` header  

---

## 🐛 IF PROBLEMS PERSIST

### Problem: Still getting CORS errors

**Solution:**
1. Check `next.config.js` has the `headers()` function
2. Verify server restarted (check terminal timestamp)
3. Clear browser cache (Ctrl + Shift + Delete)
4. Clear mobile cache (`npx expo start --clear`)

### Problem: Can't find running server

**Solution:**
Check what's using the port:

```powershell
netstat -ano | findstr :3001
```

Kill process if needed:
```powershell
taskkill /PID <process_id> /F
```

---

## 📚 WHAT WAS FIXED

**Before:**
- `middleware.ts` set CORS headers
- Individual routes also set CORS headers
- Result: **Duplicate headers** ❌

**After:**
- `middleware.ts` disabled
- `next.config.js` sets CORS globally
- Result: **Single header** ✅

---

## ⏭️ NEXT STEPS AFTER RESTART

1. ✅ Verify mobile app loads
2. ✅ Test API endpoints
3. ✅ Test authentication
4. ✅ Test all mobile features
5. 🎉 Deploy if everything works!

---

## 📞 QUICK REFERENCE

**Backend Port:** 3001  
**Mobile Port:** 8081 (or 8082, 19006, 19000)  
**CORS Config:** `next.config.js`  
**Middleware:** `middleware.ts` (CORS disabled)

---

**Ready to restart? Let's do this!** 🚀

```powershell
# In terminal 1 (Backend)
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev

# In terminal 2 (Mobile)
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npx expo start --clear
```

**Then test the mobile app!** ✅
