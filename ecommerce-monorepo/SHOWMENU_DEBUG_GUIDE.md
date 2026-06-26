# Show in Menu - Debugging Guide

## Issue
The `showInMenu` field is not persisting after page refresh when toggled in the admin panel.

## Changes Made

### 1. Added `icon` Field to Database Schema
**File**: `web/prisma/schema.prisma`
- Added `icon String?` field to Category model
- Migration created: `20260625234259_add_icon_to_category`

### 2. Added Comprehensive Logging

#### Admin Form (`web/app/admin/categories/page.tsx`)
- Logs when fetching categories (shows showInMenu status for each)
- Logs when submitting form (shows all field values being sent)
- Added "In Menu" badge to category list for visual confirmation

#### API Route (`web/app/api/admin/categories/[id]/route.ts`)
- Logs incoming request body
- Logs update data being sent to database
- Logs updated category from database

### 3. Updated API Routes
- Added `icon` field support in create and update operations
- All existing `showInMenu` logic is correct and present

## Testing Steps

### Step 1: Restart Development Server
**IMPORTANT**: The Prisma client needs to be regenerated after the schema change.

1. Stop the development server (Ctrl+C in terminal)
2. Run: `npx prisma generate`
3. Run: `npm run dev`
4. Wait for server to start on port 3001

### Step 2: Test Category Update

1. Open browser to: `http://localhost:3001/admin/categories`

2. Open **Browser Console** (F12 → Console tab)

3. Open **Server Terminal** to see API logs

4. Edit a category:
   - Click the Edit button on any category
   - Check the "Show in Menu" checkbox state
   - Toggle it (check or uncheck)
   - Click "Update" or "Create"

5. Check the logs:

   **Browser Console should show:**
   ```
   [Admin Form] Submitting category data: {...}
   [Admin Form] showInMenu value: true/false
   [Admin Form] Request URL: /api/admin/categories/{id}
   [Admin Form] Request method: PUT
   [Admin Form] Response: {...}
   ```

   **Server Terminal should show:**
   ```
   [API] PUT /api/admin/categories/{id}
   [API] Request body: {...}
   [API] Update data being sent to database: {...}
   [API] Updated category: {...}
   ```

6. Look for the `showInMenu` field in all these logs - it should show the value you selected

7. Refresh the page (F5)

8. Check if the category still shows the "In Menu" badge (green badge)

9. Check Browser Console for:
   ```
   [Admin Categories] Fetched categories: {...}
   [Admin Categories] {CategoryName}: showInMenu=true/false
   ```

### Step 3: Check Navigation Menu

1. Go to: `http://localhost:3001`

2. Open **Browser Console**

3. Hover over "Shop" in the navigation menu

4. Check Console logs:
   ```
   [MegaMenu] Fetching categories...
   [MegaMenu] API Response: {...}
   [MegaMenu] Total categories: X
   [MegaMenu] {CategoryName}: showInMenu=true, shouldShow=true
   [MegaMenu] Filtered menu categories: X
   ```

5. Categories with `showInMenu=true` should appear in the menu

## Expected Behavior

### If Working Correctly:
- ✅ Category shows "In Menu" badge after update
- ✅ Badge persists after refresh
- ✅ Category appears in navigation menu when `showInMenu=true`
- ✅ Logs show `showInMenu` value is consistent throughout

### If Still Broken:
Check the logs to identify where the issue occurs:

1. **Form not sending correct value**:
   - Check `[Admin Form] Submitting category data` log
   - Verify `showInMenu` field is present and correct

2. **API not receiving correct value**:
   - Check `[API] Request body` log
   - Verify `showInMenu` field is present

3. **Database not updating**:
   - Check `[API] Updated category` log
   - Verify `showInMenu` field shows updated value

4. **Database not persisting**:
   - Check `[Admin Categories] {CategoryName}: showInMenu=` log after refresh
   - If value reverts, there's a database issue

## Common Issues

### Issue: Prisma Client Not Generated
**Symptoms**: TypeScript errors about missing `icon` field
**Solution**: 
```bash
cd web
npx prisma generate
```

### Issue: Migration Not Applied
**Symptoms**: Database errors about `icon` column
**Solution**:
```bash
cd web
npx prisma migrate deploy
```

### Issue: File Lock on Windows
**Symptoms**: `EPERM: operation not permitted` when generating Prisma client
**Solution**:
1. Stop development server
2. Close any database GUI tools
3. Run `npx prisma generate`
4. Restart server

## Next Steps

After testing, report back with:
1. Screenshots of the console logs (both browser and server)
2. Whether the "In Menu" badge appears and persists
3. Whether categories appear in the navigation menu
4. Any error messages

This will help identify exactly where the data is being lost.
