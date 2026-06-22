# Fix 500 Errors - Restart Instructions

## Problem
The Prisma schema was updated with new permission models, but the Prisma client hasn't been regenerated yet.

## Solution
You need to **restart the Next.js development server** to regenerate the Prisma client.

## Steps:

### 1. Stop the current dev server
- Find the terminal running `npm run dev` or `yarn dev`
- Press `Ctrl + C` to stop it

### 2. Regenerate Prisma Client
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma generate
```

### 3. Restart the dev server
```bash
npm run dev
# or
yarn dev
```

## Alternative: Quick Restart (PowerShell)
```powershell
# Stop all node processes (careful - this stops ALL Node.js processes)
Stop-Process -Name node -Force

# Navigate to web directory
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Generate Prisma client
npx prisma generate

# Start dev server
npm run dev
```

## Verify It Works
After restarting, navigate to:
```
http://localhost:3001/admin/settings/permissions
```

You should see the permissions management page load without 500 errors.

## What Changed
The database schema now includes:
- ✅ PermissionRole table
- ✅ RolePermission table  
- ✅ UserPermission table
- ✅ Updated User table with roleId field

The Prisma client needs to be regenerated to include the TypeScript types and database queries for these new models.
