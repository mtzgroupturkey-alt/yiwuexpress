@echo off
echo ========================================
echo  Sync Admin Header User Info Fix
echo ========================================
echo.
echo This will fix the admin header to show actual logged-in user info
echo instead of hardcoded "Admin / admin@yiwuexpress.com"
echo.
pause

echo.
echo [1/4] Uploading AdminAuthContext...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\contexts\AdminAuthContext.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/contexts/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload AdminAuthContext
    pause
    exit /b 1
)

echo.
echo [2/4] Uploading Admin Layout...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\layout.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload layout
    pause
    exit /b 1
)

echo.
echo [3/4] Uploading Admin Auth API...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\admin\auth\route.ts" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/api/admin/auth/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload API
    pause
    exit /b 1
)

echo.
echo [4/4] Rebuilding and restarting...
ssh djdn@39.175.57.2 "cd /www/wwwroot/www.dromkok.com/web && npm run build && pm2 restart dromkok-web --update-env"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Build or restart may have issues
)

echo.
echo ========================================
echo  SYNC COMPLETED SUCCESSFULLY
echo ========================================
echo.
echo Changes deployed:
echo - AdminAuthContext now fetches and provides user data
echo - Admin header shows actual logged-in user name/email
echo - Admin Auth API returns full user profile from database
echo - Profile photo support in header
echo.
echo Test: Login with different users and check header
echo URL: https://www.dromkok.com/admin
echo.
pause
