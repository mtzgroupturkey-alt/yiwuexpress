# 🔧 FIX: Layout Syntax Error

## Error
```
layout.js:367 Uncaught SyntaxError: Invalid or unexpected token (at layout.js:367:29)
```

## Root Cause
This error typically occurs when:
1. The build cache is corrupted
2. Special characters in source files
3. Next.js compilation issues

## Solution

### Quick Fix (Recommended)

Run these commands in the web directory:

```bash
cd web

# Delete Next.js cache and build folders
rmdir /s /q .next
rmdir /s /q node_modules\.cache

# Restart the development server
npm run dev
```

### If Quick Fix Doesn't Work

Try a full clean rebuild:

```bash
cd web

# Stop the server (Ctrl+C)

# Clean everything
rmdir /s /q .next
rmdir /s /q node_modules\.cache
del /f /q package-lock.json

# Reinstall dependencies
npm install

# Start fresh
npm run dev
```

### Alternative: Clear Browser Cache

Sometimes the error is cached in the browser:

1. Open browser DevTools (F12)
2. Right-click the refresh button
3. Select **"Empty Cache and Hard Reload"**
4. Or use Ctrl+Shift+R (force refresh)

### Check for Special Characters

The layout files look clean, but if the error persists, check for:
- Hidden Unicode characters
- Copy-paste artifacts
- Emoji or special symbols causing encoding issues

## Files Checked

✅ `web/app/layout.tsx` - No syntax errors  
✅ `web/app/admin/layout.tsx` - No syntax errors  
✅ `web/app/dashboard/layout.tsx` - No syntax errors

All source files are syntactically correct. The error is in the compiled JavaScript.

## Status

**Action Required:** Clear Next.js cache and restart dev server

```bash
cd web
rmdir /s /q .next
npm run dev
```

