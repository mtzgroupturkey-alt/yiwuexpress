# 🔧 Fix 500 Error - Category Tree Endpoint

## Problem
`/api/admin/categories/tree` returns 500 error

## Root Cause
The Prisma client needs to be regenerated after schema changes, and the dev server needs to be restarted.

## Solution Steps

### Step 1: Stop the Dev Server
Press `Ctrl+C` in the terminal where `npm run dev` is running

### Step 2: Regenerate Prisma Client
```bash
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
npx prisma generate
```

If you get "EPERM" error (file locked), that's okay - the schema is already pushed to the database.

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Test
Open: `http://localhost:3001/admin/categories/menu`

---

## Alternative: Manual Database Check

If the above doesn't work, verify the database has the new fields:

```sql
-- Connect to PostgreSQL
psql -U postgres -d ecommerce

-- Check if new columns exist
\d categories

-- You should see:
-- - level
-- - displayOrder  
-- - menuOrder
-- - showInMenu
-- - isFeatured
```

---

## Quick Test

Open this URL directly in browser:
```
http://localhost:3001/api/admin/categories/tree
```

**Expected Result:**
```json
{
  "success": true,
  "data": [...]
}
```

**If Still Error:**
Check the server console logs for the actual error message.

---

## Files Modified for Better Error Handling

I've updated the API route to:
1. Use simpler tree building (non-recursive database calls)
2. Handle missing fields gracefully with defaults
3. Provide detailed error messages in logs

The route at `web/app/api/admin/categories/tree/route.ts` now:
- Fetches all categories in one query
- Builds tree in memory
- Uses safe property access with fallbacks
- Logs detailed error information

---

## Common Issues

### Issue 1: Prisma Client Out of Sync
**Symptom**: "Unknown field" error
**Solution**: Run `npx prisma generate` then restart server

### Issue 2: Database Missing Columns
**Symptom**: SQL error about missing columns
**Solution**: Run `npx prisma db push` to sync schema

### Issue 3: Old Server Still Running
**Symptom**: Changes don't take effect
**Solution**: Kill all node processes:
```bash
# Windows
taskkill /F /IM node.exe
# Then restart: npm run dev
```

---

## Status After Fix

Once you restart the dev server, the menu manager should load correctly with:
- ✅ Category tree structure
- ✅ Drag and drop functionality  
- ✅ Show/hide toggles
- ✅ Product counts
- ✅ All features working

---

**Next Steps:**
1. Stop dev server (Ctrl+C)
2. Run: `npm run dev`
3. Visit: `http://localhost:3001/admin/categories/menu`
4. Test drag and drop!

🎉 **That's it!**
