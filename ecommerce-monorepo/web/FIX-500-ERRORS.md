# Fix 500 Errors - Database Already Created ✅

## Status
✅ Database tables created  
✅ Permissions data seeded  
❌ Prisma Client not regenerated (causing 500 errors)

## The Problem
The database schema was updated and migrated successfully, and default permission roles were seeded. However, the **Prisma Client TypeScript types** haven't been regenerated yet, causing the API routes to fail with 500 errors when trying to access the new permission models.

## The Solution
You need to **restart the Next.js server** to regenerate the Prisma Client.

---

## Quick Fix (Easiest Method)

### Option 1: Run the Batch File
**Double-click this file:**
```
RESTART-SERVER.bat
```

This will:
1. Stop all Node.js processes
2. Regenerate Prisma Client
3. Restart the development server

---

### Option 2: Run PowerShell Script
**Right-click and "Run with PowerShell":**
```
restart-server.ps1
```

---

### Option 3: Manual Steps

**Step 1:** Find your terminal running the Next.js dev server and press `Ctrl + C`

**Step 2:** Run these commands:
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma generate
npm run dev
```

---

### Option 4: Force Restart (If terminal is lost)

**Run in PowerShell as Administrator:**
```powershell
# Stop all Node processes
Stop-Process -Name node -Force

# Navigate to project
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Regenerate Prisma Client
npx prisma generate

# Start server
npm run dev
```

---

## After Restarting

1. Navigate to: `http://localhost:3001/admin/settings/permissions`

2. You should see the permissions management page with:
   - **Permission Roles Tab**: Shows the 4 default roles (Administrator, Manager, Staff, Viewer)
   - **User Permissions Tab**: Shows admin users with their assigned roles

3. Try creating a new role to verify everything works!

---

## What's Already in the Database

### Tables Created ✅
- `PermissionRole` - Defines permission roles
- `RolePermission` - Stores permissions per role per resource
- `UserPermission` - Custom user-specific permission overrides
- `User` table updated with `roleId` field

### Default Roles Seeded ✅

**Administrator**
- Full access to all 14 resources

**Manager**  
- Manage quotes (with approval), shipments, settings
- No permissions management

**Staff**
- Handle quotes (no approval) and shipments
- View-only elsewhere

**Viewer**
- Read-only access to main sections

### Resources Available ✅
```
📊 Dashboard
👥 Users Management
📦 Services
📂 Quotes Management
   └─ View Quotes
   └─ Approve/Reject Quotes
📂 Shipments
   └─ Tracking Management
📂 System Settings
   └─ Company Info
   └─ General Settings
   └─ Email Configuration
🔐 Permissions
💾 Backup & Export
```

---

## Verify It's Fixed

After restarting, check the browser console. The errors should be gone and you should see:

✅ Roles loaded successfully  
✅ Users loaded successfully  
✅ No 500 errors

---

## If Problems Persist

1. **Check Prisma Client was generated:**
   ```bash
   ls node_modules/.prisma/client
   ```
   You should see `index.d.ts` and other files

2. **Check database has tables:**
   ```bash
   npx prisma studio
   ```
   Open and verify `PermissionRole`, `RolePermission`, and `UserPermission` tables exist

3. **Check for TypeScript errors:**
   ```bash
   npm run build
   ```

4. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

---

## Technical Details

### Why This Happened
1. ✅ Prisma schema was updated with new models
2. ✅ Database migration was run (`prisma migrate dev`)
3. ✅ Seed script created default roles
4. ❌ Dev server wasn't restarted to regenerate client

### What Happens When You Restart
- Next.js detects schema changes
- Prisma generates new TypeScript types
- API routes can now access `prisma.permissionRole`, `prisma.rolePermission`, etc.
- 500 errors disappear

---

## Need Help?

If you're still seeing 500 errors after following these steps:

1. Check the terminal output for specific error messages
2. Look at the browser console for detailed error info
3. Verify the database file exists: `web/dev.db`
4. Ensure `.env` file has `DATABASE_URL="file:./dev.db"`
