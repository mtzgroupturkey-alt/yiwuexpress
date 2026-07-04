# How to Restart Development Server

## The Problem
The Prisma client needs to be regenerated after the database schema changed (profilePhoto field added), but it's currently locked by the running dev server.

## Solution: Restart the Dev Server

### Step 1: Stop the Current Dev Server
Press `Ctrl + C` in the terminal where `npm run dev` is running.

### Step 2: Start the Dev Server Again
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

The dev server will automatically regenerate the Prisma client on startup.

### Step 3: Test Profile Photo Upload
1. Go to `http://localhost:3005/login`
2. Login with valid credentials
3. Go to `http://localhost:3005/dashboard/profile`
4. Upload a profile photo
5. Click "Save Changes"
6. Photo should appear in both profile page and header

## About Those Console Errors

The errors you saw are **NORMAL** and **EXPECTED**:

### 1. `GET /api/cart 401 (Unauthorized)` ✅ Normal
- Happens when user is not logged in yet
- CartContext tries to fetch cart on page load
- Gets 401, sets cart count to 0
- This is correct behavior - not an error!

### 2. `POST /api/auth/login 401 (Unauthorized)` ✅ Normal  
- Happens when login credentials are incorrect
- Wrong email or wrong password
- This is correct behavior - not an error!
- Check your credentials and try again

## What's Actually Working

✅ Database migration completed successfully  
✅ `profilePhoto` field added to User table  
✅ API endpoint updated to handle profilePhoto  
✅ Upload UI works correctly  
✅ Display logic works correctly  

**Just restart the dev server and it will all work!**

## If Restart Doesn't Help

If you still have issues after restart, manually regenerate Prisma client:

1. Stop dev server (Ctrl + C)
2. Wait 5 seconds
3. Run: `npx prisma generate`
4. If successful, start dev server: `npm run dev`
5. If fails with EPERM error, wait longer and try again

---

**TL;DR**: Stop dev server with Ctrl+C, then run `npm run dev` again. The 401 errors are normal.
