# 🚀 Complete Setup and Start Guide

## ✅ What Has Been Configured

**Static Port Configuration:**
- Backend API: **Port 3001** (configured in `web/.env.local`)
- Mobile Expo: **Port 8081** (configured in `mobile/package.json`)
- CORS: Enabled for port 8081

## 🎯 Quick Start (Use This!)

### Option 1: Double-Click Quick Start (Easiest)
1. Double-click `QUICK-START.bat` in the root folder
2. Two terminal windows will open automatically
3. Wait for "Next.js Server Ready" message
4. Your browser will open automatically for the mobile app

### Option 2: Manual Start
**Terminal 1 - Backend:**
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

**Terminal 2 - Mobile:**
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npm start
```
Then press `w` for web

## 🔧 First Time Setup

If this is your first time, run these commands ONCE:

### 1. Install Dependencies
```bash
# Backend
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm install

# Mobile
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npm install
```

### 2. Setup Database

**IMPORTANT:** Stop all Node processes before setting up the database!

**Option A: Easy Way (Recommended)**
```bash
# Double-click this file:
FIX-DATABASE.bat
```

**Option B: Manual Way**
```bash
# Stop the backend server if it's running (Ctrl+C in the terminal)
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run db:generate
npm run db:push
npm run db:seed
```

**Test Credentials After Setup:**
- Admin: `admin@yiwuexpress.com` / `admin123`
- Customer: `user@example.com` / `password123`

## ✅ Verify Everything Works

1. **Backend Running**: http://localhost:3001
2. **Mobile App**: http://localhost:8081
3. **API Test**: http://localhost:3001/api/services

## 🐛 Troubleshooting

### Issue: "Port 3001 already in use"
```bash
# Find and kill the process
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

### Issue: "Port 8081 already in use"
```bash
# Find and kill the process
netstat -ano | findstr :8081
taskkill /PID [PID_NUMBER] /F
```

### Issue: CORS Errors
1. Ensure backend is running FIRST (port 3001)
2. Then start mobile app (port 8081)
3. Check `web/.env.local` has `ALLOWED_ORIGINS=http://localhost:8081`

### Issue: Database Errors or EPERM Errors
**Solution 1: Use the Fix Script**
```bash
# Double-click this file:
FIX-DATABASE.bat
```

**Solution 2: Manual Fix**
1. Stop ALL Node processes:
   - Press Ctrl+C in all terminal windows
   - OR run: `taskkill /F /IM node.exe`
2. Close VS Code (file locks can cause EPERM errors)
3. Run database setup:
   ```bash
   cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```
4. Restart VS Code and servers

### Issue: JWT Errors
Check `web/.env.local` has a valid `JWT_SECRET` (should be a long random string)

## 📁 Important Configuration Files

| File | Purpose |
|------|---------|
| `web/.env.local` | Backend port, JWT secret, database |
| `mobile/.env` | Mobile API configuration |
| `mobile/src/config/api.config.ts` | Centralized API config |
| `web/server.js` | Custom server with port validation |
| `PORT-CONFIG.md` | Detailed port documentation |

## 🔄 Changing Ports

If you ever need to change ports:

1. **Backend Port**: Edit `web/.env.local` → `PORT=NEW_PORT`
2. **Update Mobile**: Edit `mobile/src/config/api.config.ts` → `BACKEND_PORT: NEW_PORT`
3. **Restart both servers**

## 📝 Environment Variables

### Backend (`web/.env.local`)
```env
PORT=3001
HOSTNAME=localhost
DATABASE_URL="file:./dev.db"
JWT_SECRET="[your-secret-key]"
JWT_EXPIRES_IN="7d"
ALLOWED_ORIGINS=http://localhost:8081,...
```

### Mobile (`mobile/.env`)
```env
EXPO_PUBLIC_API_PORT=3001
EXPO_PORT=8081
```

## ✨ Features

- ✅ **Static Ports**: No more random port assignments
- ✅ **CORS Configured**: Mobile can access backend API
- ✅ **Error Detection**: Server checks if ports are in use
- ✅ **Quick Start**: One-click batch file to start everything
- ✅ **Documentation**: Complete guides for setup and troubleshooting
