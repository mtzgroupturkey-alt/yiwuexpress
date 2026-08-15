# Database Connection Leak Fix

## Issue Encountered

When visiting `http://localhost:3005/admin` and `http://localhost:3005/admin/products`, you saw:
- "Failed to fetch admin statistics"
- "No products found - Get started by adding your first product"

## Root Cause

**Database Connection Leak** - Too many PostgreSQL connections were opened and not closed.

Error message from PostgreSQL:
```
FATAL: sorry, too many clients already
```

This happened because the `/api/admin/products` route was creating a NEW `PrismaClient` instance on every API call:

```typescript
// ❌ WRONG - Creates new connection each time
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
```

Each new `PrismaClient()` opens a connection pool, and in development with hot reloading, these connections never got cleaned up properly.

## Solution Applied

### 1. Fixed Prisma Client Import

Changed the API route to use the **singleton Prisma client** from `lib/db.ts`:

```typescript
// ✅ CORRECT - Uses singleton connection
import { prisma } from '@/lib/db'
```

The singleton pattern ensures:
- Only ONE Prisma client instance across the entire app
- Connection pooling is managed properly
- Hot reloads in development reuse the same client
- Connections are closed gracefully

### 2. Restart Dev Server Required

After fixing the code, the dev server **must be restarted** to:
- Close all leaked database connections
- Apply the code fix
- Start with a clean connection pool

## Files Fixed

1. **API Route:**
   - `c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\admin\products\route.ts`
   - Changed from `new PrismaClient()` to `import { prisma } from '@/lib/db'`

## How to Restart Dev Server

### Option 1: Use Restart Script (Recommended)
```cmd
c:\wamp64\www\yiwuexpress\restart-dev-server.bat
```

This will:
1. Kill the existing dev server on port 3005
2. Close all leaked connections
3. Start a fresh dev server in a new window

### Option 2: Manual Restart

**Kill the server:**
1. Find the terminal window running `npm run dev`
2. Press `Ctrl+C` to stop it
3. Close the terminal

**Or kill by PID:**
```cmd
netstat -ano | findstr :3005
taskkill /F /PID <PID_NUMBER>
```

**Start fresh:**
```cmd
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npm run dev
```

## After Restart - Testing

Wait 10-15 seconds for the dev server to compile, then test:

1. **Admin Dashboard:**
   ```
   http://localhost:3005/admin
   ```
   Should show: Admin statistics (users, products, orders, revenue)

2. **Admin Products:**
   ```
   http://localhost:3005/admin/products
   ```
   Should show: Product list with the new Status Filter dropdown

## Prevention

This issue won't happen in production because:
- Production doesn't have hot reloading
- The singleton pattern is already in place
- PM2 manages the process lifecycle properly

## Technical Details

### The Singleton Pattern in `lib/db.ts`

```typescript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });

// Preserve across hot reloads in development
if (environment === 'development') {
  globalForPrisma.prisma = prisma;
}
```

This ensures:
- First import creates the client
- Subsequent imports reuse it
- Hot reloads preserve the same instance
- No connection leaks

### Why New PrismaClient() is Bad

```typescript
// ❌ This creates a new connection pool every time:
const prisma = new PrismaClient()
```

In a Next.js API route:
- Each API call creates a new `PrismaClient`
- Each client opens ~10 connections (default pool size)
- Hot reload in dev multiplies this
- PostgreSQL hits connection limit (100 default)
- Result: "too many clients already"

### Why Singleton is Good

```typescript
// ✅ This reuses the same connection pool:
import { prisma } from '@/lib/db'
```

- One client for the entire app
- One connection pool shared across all routes
- Properly cleaned up on process exit
- Works correctly with hot reload

## Summary

✅ **Fixed:** Changed from `new PrismaClient()` to singleton import
✅ **Action Required:** Restart dev server to close leaked connections
✅ **Prevention:** Always import `{ prisma } from '@/lib/db'`, never create new instances
✅ **Production:** Not affected, singleton already used correctly elsewhere

After restarting the dev server, the admin panel should work normally.
