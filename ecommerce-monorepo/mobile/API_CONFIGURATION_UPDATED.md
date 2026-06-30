# ✅ API Configuration Updated - Port 3005

## 🔧 WHAT WAS CHANGED

The mobile app API configuration has been updated to use **port 3005** instead of **port 3001** to match your backend server.

---

## 📂 FILES UPDATED

### **1. Mobile API Config** ✅
**File:** `mobile/src/config/api.config.ts`

**Changed:**
```typescript
// Before
BACKEND_PORT: 3001,

// After
BACKEND_PORT: 3005,
```

**Result:** API calls will now go to `http://localhost:3005/api`

---

### **2. Mobile Environment File** ✅
**File:** `mobile/.env`

**Changed:**
```env
# Before
EXPO_PUBLIC_API_PORT=3001
EXPO_PUBLIC_API_URL=http://localhost:3001/api

# After
EXPO_PUBLIC_API_PORT=3005
EXPO_PUBLIC_API_URL=http://localhost:3005/api
```

---

## 🚀 HOW TO APPLY CHANGES

### **Step 1: Restart Mobile App**

If your mobile app is currently running, you need to restart it:

```bash
# Stop current server (Ctrl+C)

# Clear cache and restart
npx expo start -c
```

Or just restart:
```bash
cd mobile
npm start
```

---

### **Step 2: Verify Backend is Running on Port 3005**

Make sure your backend API server is running on port **3005**:

```bash
cd api
npm run dev
```

Check the console output - it should say:
```
Server running on http://localhost:3005
```

---

### **Step 3: Test API Connection**

Once the mobile app restarts, you should see in the console:

```
🔧 Mobile API Config: Using port 3005
📡 API URL: http://localhost:3005/api
```

Then when you navigate to the Home screen, it should successfully fetch services without CORS errors.

---

## 🐛 TROUBLESHOOTING

### **If you still see CORS errors:**

#### **1. Check Backend CORS Configuration**

Your backend API (port 3005) needs to allow requests from `http://localhost:8081` (Expo's web platform).

**File:** `api/src/index.ts` or `api/src/server.ts`

Make sure CORS is configured like this:

```typescript
import cors from 'cors'

app.use(cors({
  origin: [
    'http://localhost:3000',  // Web app (Next.js)
    'http://localhost:8081',  // Mobile app (Expo web)
    'http://localhost:19006', // Alternative Expo web port
  ],
  credentials: true
}))
```

#### **2. Restart Backend Server**

After changing CORS config:
```bash
cd api
# Stop server (Ctrl+C)
npm run dev
```

#### **3. Clear All Caches**

```bash
# Clear mobile cache
cd mobile
npx expo start -c

# Clear browser cache
# In browser: Ctrl+Shift+Delete → Clear cache
```

---

## 📊 VERIFICATION CHECKLIST

- [ ] Backend running on port 3005
- [ ] Mobile app restarted with clear cache
- [ ] Console shows "Using port 3005"
- [ ] No CORS errors in browser console
- [ ] Services load successfully on Home screen
- [ ] Images display (if using backend for images)

---

## 🔍 DEBUGGING TIPS

### **Check what port your backend is actually using:**

Look at your backend's `.env` or config file:

```env
PORT=3005
```

Or check the console when you start the backend:
```
Server running on http://localhost:3005
```

### **Check mobile API requests:**

Open browser console (F12) when running mobile app on web:
- You should see: `http://localhost:3005/api/services`
- NOT: `http://localhost:3001/api/services`

### **Test backend directly:**

Open browser and go to:
```
http://localhost:3005/api/services?page=1&limit=10
```

You should see JSON response (or CORS error if CORS is not configured).

---

## 🎯 QUICK FIX COMMANDS

```bash
# 1. Make sure backend is on port 3005
cd api
npm run dev

# 2. Restart mobile app with clear cache
cd mobile
npx expo start -c

# 3. Press 'w' to open in web browser
# Or scan QR to open on device
```

---

## 📝 NOTES

### **Why Port 3005?**
You mentioned you changed the web app to use port 3005, so the backend must be running on that port. This update ensures the mobile app connects to the same backend.

### **Development vs Production**
These settings are for **local development only**. For production:
- Backend will have a real domain (e.g., `https://api.yiwuexpress.com`)
- You'll need to update the API URL in production builds
- CORS will be configured for your production domains

### **Expo Web Platform**
When running mobile app on web (`npm run web`), it uses port 8081 by default. This is why you're seeing CORS errors - the backend needs to allow requests from `http://localhost:8081`.

---

## ✅ VERIFICATION

After following these steps, your mobile app should:

1. ✅ Connect to `http://localhost:3005/api`
2. ✅ No CORS errors in console
3. ✅ Services load on Home screen
4. ✅ All API calls work properly

---

## 🚨 IF STILL NOT WORKING

### **Double-check these:**

1. **Backend is running:** Check console, should see port 3005
2. **Backend CORS configured:** Should allow localhost:8081
3. **Mobile app restarted:** With clear cache (`npx expo start -c`)
4. **Correct URL in console:** Should see port 3005, not 3001
5. **No typos in .env:** Check EXPO_PUBLIC_API_PORT=3005

### **Quick backend CORS fix:**

If your backend doesn't have CORS configured, add this:

```typescript
// In your backend main file (e.g., api/src/index.ts)
import cors from 'cors'

// Add this BEFORE your routes
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true
}))

// Or more strict:
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8081'],
  credentials: true
}))
```

---

**CONFIGURATION UPDATED ✅**

Your mobile app is now configured to connect to port **3005**.

**Next:** Restart the mobile app and test!
