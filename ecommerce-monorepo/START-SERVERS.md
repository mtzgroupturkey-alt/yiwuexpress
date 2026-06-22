# 🚀 Starting the Development Servers

This guide will help you start both the Next.js backend and React Native mobile app.

## Prerequisites

Make sure you have installed dependencies in both projects:

```bash
# Install backend dependencies
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm install

# Install mobile dependencies
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npm install
```

## Starting the Backend (Next.js on Port 3001)

### Option 1: Using the Custom Server (Recommended)

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

This will start Next.js on port 3001 with proper CORS configuration.

### Option 2: Using Default Next.js Server

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev:default
```

## Starting the Mobile App (Expo on Port 8081)

Open a **new terminal** and run:

```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile
npm start
```

Then press `w` to open in web browser.

## Verify the Setup

1. **Backend:** Open http://localhost:3001 in your browser
2. **Mobile:** The Expo dev server should open at http://localhost:8081
3. **Test API:** Try http://localhost:3001/api/services in your browser

## Troubleshooting CORS Errors

If you still see CORS errors:

1. **Verify the backend is running on port 3001:**
   - Check the terminal output for "Next.js Server Ready"
   - The URL should show `http://localhost:3001`

2. **Check if port 3001 is available:**
   ```bash
   netstat -ano | findstr :3001
   ```
   If something else is using port 3001, kill that process or change the port in `.env.local`

3. **Restart both servers:**
   - Stop both servers (Ctrl+C)
   - Start the backend first
   - Then start the mobile app

4. **Clear browser cache:**
   - Press Ctrl+Shift+R in your browser to hard refresh

## Changing the API Port

To change the backend port from 3001 to something else:

1. **Edit `.env.local` in the web folder:**
   ```
   PORT=3002
   ```

2. **Edit `mobile/src/api/client.ts`:**
   ```typescript
   return 'http://localhost:3002/api'  // Change 3001 to 3002
   ```

3. **Restart both servers**

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Start backend | `cd web && npm run dev` |
| Start mobile | `cd mobile && npm start` |
| Database setup | `cd web && npm run db:push` |
| Database studio | `cd web && npm run db:studio` |
| Seed database | `cd web && npm run db:seed` |

## Common Issues

### "Port 3001 already in use"
Kill the process using the port or change the port in `.env.local`

### "Cannot connect to API"
Make sure the backend is running BEFORE starting the mobile app

### "CORS policy error"
The backend must be running on the exact port configured in the mobile app's API client (default: 3001)
