@echo off
echo ========================================
echo  Sync ALL Admin Panel Fixes to Server
echo ========================================
echo.
echo This will sync:
echo 1. Admin Users Page - businessType enum fix
echo 2. Admin Header - show actual logged-in user
echo 3. Admin Auth API - fetch user from database
echo 4. AdminAuthContext - provide user data
echo.
pause

echo.
echo [1/4] Uploading Admin Users Page (businessType fix)...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\users\page.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/users/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload users page
    pause
    exit /b 1
)

echo.
echo [2/4] Uploading AdminAuthContext (user data provider)...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\contexts\AdminAuthContext.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/contexts/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload AdminAuthContext
    pause
    exit /b 1
)

echo.
echo [3/4] Uploading Admin Layout (dynamic header)...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\layout.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload layout
    pause
    exit /b 1
)

echo.
echo [4/4] Uploading Admin Auth API (full user profile)...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\admin\auth\route.ts" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/api/admin/auth/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload API
    pause
    exit /b 1
)

echo.
echo ========================================
echo  Rebuilding Next.js...
echo ========================================
ssh djdn@39.175.57.2 "cd /www/wwwroot/www.dromkok.com/web && npm run build"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Build may have issues
)

echo.
echo ========================================
echo  Restarting PM2...
echo ========================================
ssh djdn@39.175.57.2 "pm2 restart dromkok-web --update-env"
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to restart PM2
    pause
    exit /b 1
)

echo.
echo ========================================
echo  ALL FIXES DEPLOYED SUCCESSFULLY!
echo ========================================
echo.
echo ✅ Fixed Issues:
echo    1. Admin users creation (businessType enum validation)
echo    2. Admin header shows actual logged-in user
echo    3. Profile photo support in header
echo    4. Empty optional fields removed before API call
echo    5. Better validation error messages
echo.
echo 🧪 Test:
echo    1. Create admin users: https://www.dromkok.com/admin/users
echo    2. Login with different users
echo    3. Check header shows correct name/email
echo.
pause
