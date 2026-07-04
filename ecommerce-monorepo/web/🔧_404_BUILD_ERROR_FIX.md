# 🔧 404 BUILD ERROR FIX

## 🐛 PROBLEM
Pages showing 404 errors for Next.js build assets:
```
GET http://localhost:3005/_next/static/css/app/layout.css net::ERR_ABORTED 404 (Not Found)
GET http://localhost:3005/_next/static/chunks/main-app.js net::ERR_ABORTED 404 (Not Found)
GET http://localhost:3005/_next/static/chunks/app-pages-internals.js net::ERR_ABORTED 404 (Not Found)
```

## 🔍 ROOT CAUSE
After installing `zustand`, Next.js needs to rebuild the application. The old build cache is invalid because:
1. New dependency (`zustand`) was added
2. Build manifests changed
3. Chunk hashes are different

## ✅ SOLUTION

### Quick Fix (Recommended)
```bash
# 1. Stop the dev server (if running)
# Press Ctrl+C in the terminal running "npm run dev"

# 2. Clear build cache
cd ecommerce-monorepo/web
rm -rf .next

# OR on Windows PowerShell:
Remove-Item -Recurse -Force .next

# 3. Restart dev server
npm run dev
```

### Alternative Fix
If Quick Fix doesn't work:
```bash
# 1. Stop dev server (Ctrl+C)

# 2. Clean everything
rm -rf .next
rm -rf node_modules/.cache

# 3. Restart
npm run dev
```

### Nuclear Option
If nothing else works:
```bash
# 1. Stop dev server (Ctrl+C)

# 2. Full clean
rm -rf .next
rm -rf node_modules

# 3. Reinstall
npm install

# 4. Start fresh
npm run dev
```

## 🚀 STEP-BY-STEP INSTRUCTIONS

### For Windows (PowerShell)
```powershell
# Navigate to web directory
cd C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

# Stop any running dev server (Ctrl+C)

# Remove build cache
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue

# Start dev server
npm run dev
```

### For Linux/Mac (Bash)
```bash
# Navigate to web directory
cd /path/to/yiwuexpress/ecommerce-monorepo/web

# Stop any running dev server (Ctrl+C)

# Remove build cache
rm -rf .next

# Start dev server
npm run dev
```

## 🧪 VERIFICATION

After restarting, verify:

### 1. Server Started Successfully
```
▲ Next.js 14.x.x
- Local:        http://localhost:3005
- Network:      http://192.168.x.x:3005

✓ Ready in X.Xs
```

### 2. No Build Errors
Should see:
```
✓ Compiled successfully
```

Should NOT see:
```
✗ Failed to compile
Module not found
```

### 3. Pages Load
Open browser to:
- http://localhost:3005/login - Should load
- http://localhost:3005/register - Should load
- http://localhost:3005 - Should load

### 4. No Console Errors
Browser console should be clean (no 404 errors for static assets)

## 🔍 TROUBLESHOOTING

### Issue: Port 3005 Already in Use
```
Error: listen EADDRINUSE: address already in use :::3005
```

**Fix:**
```bash
# Find process using port 3005
netstat -ano | findstr :3005

# Kill the process (replace PID)
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3006
```

### Issue: Module Not Found After Restart
```
Module not found: Can't resolve 'some-package'
```

**Fix:**
```bash
# Verify package is installed
npm list <package-name>

# If not installed
npm install <package-name>

# If installed but not working
rm -rf node_modules
npm install
```

### Issue: Still Getting 404s
```
GET /_next/static/... 404
```

**Fix:**
```bash
# Full rebuild
rm -rf .next
rm -rf node_modules/.cache
npm run dev
```

### Issue: Zustand Still Not Found
```
Module not found: Can't resolve 'zustand'
```

**Fix:**
```bash
# Verify installation
npm list zustand

# If not shown, reinstall
npm install zustand

# Restart server
npm run dev
```

## 📋 CHECKLIST

Before reporting issues, verify:

- [ ] Dev server was stopped before clearing cache
- [ ] `.next` folder was deleted
- [ ] `zustand` is installed (`npm list zustand`)
- [ ] No errors during `npm run dev` startup
- [ ] Port 3005 is not blocked by firewall
- [ ] No other process using port 3005
- [ ] Browser cache cleared (Ctrl+Shift+R)
- [ ] Tried hard refresh (Ctrl+F5)
- [ ] No antivirus blocking Node.js

## 🎯 EXPECTED OUTCOME

After following these steps:

✅ Dev server starts without errors  
✅ Pages load successfully  
✅ No 404 errors for static assets  
✅ Login page works  
✅ Register page works  
✅ Authentication flows work  

## 🔄 WHEN TO CLEAR BUILD CACHE

Clear `.next` folder when:
- Installing new packages
- Updating dependencies
- Weird build errors appear
- 404 errors for static assets
- Hot reload stops working
- After git pull with dependency changes

## 💡 PRO TIPS

### 1. Always Stop Server First
```bash
# Before clearing cache, always:
Ctrl+C  # Stop dev server
```

### 2. Clear Browser Cache Too
```
Ctrl+Shift+R  # Hard refresh (Chrome/Firefox)
Ctrl+F5       # Hard refresh (Windows)
Cmd+Shift+R   # Hard refresh (Mac)
```

### 3. Watch for Compilation Messages
```
✓ Compiled /login in 1.2s        # Good
✗ Failed to compile               # Bad - check errors
⚠ Compiled with warnings          # Check warnings
```

### 4. Monitor Terminal Output
Watch for:
- Compilation errors
- Missing modules
- Port conflicts
- File system errors

## 📚 RELATED DOCS

- `✅_ZUSTAND_INSTALLED.md` - Why zustand was installed
- `📊_CURRENT_STATUS.md` - Current system status
- `🚀_QUICK_START.md` - Quick start guide

## 🆘 STILL NOT WORKING?

If the issue persists after trying all fixes:

1. **Check Node.js version:**
   ```bash
   node --version  # Should be 18.x or higher
   ```

2. **Check npm version:**
   ```bash
   npm --version   # Should be 9.x or higher
   ```

3. **Check disk space:**
   - Ensure sufficient disk space for build
   - `.next` folder can be several hundred MB

4. **Check file permissions:**
   - Ensure you can write to project directory
   - Run terminal as administrator if needed

5. **Try different terminal:**
   - Close and reopen terminal
   - Try different terminal (CMD vs PowerShell)

6. **Check logs:**
   - Look for errors in terminal output
   - Check Windows Event Viewer for crashes

---

**Quick Command Reference:**
```bash
# Stop server: Ctrl+C
# Clear cache: rm -rf .next
# Start server: npm run dev
# Hard refresh: Ctrl+Shift+R
```

**Status:** After clearing `.next`, restart dev server and try again!
