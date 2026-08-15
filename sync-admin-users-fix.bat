@echo off
echo ========================================
echo  Sync Admin Users Page Fix to Server
echo ========================================
echo.
echo This will upload the fixed admin users page to production server.
echo Bug Fixed: businessType enum mismatch (lowercase to UPPERCASE)
echo.
pause

echo.
echo [1/3] Uploading admin users page...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\users\page.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/users/
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to upload file
    pause
    exit /b 1
)

echo.
echo [2/3] Rebuilding Next.js on server...
ssh djdn@39.175.57.2 "cd /www/wwwroot/www.dromkok.com/web && npm run build"
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Build may have issues
)

echo.
echo [3/3] Restarting PM2 application...
ssh djdn@39.175.57.2 "pm2 restart dromkok-web --update-env"
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to restart PM2
    pause
    exit /b 1
)

echo.
echo ========================================
echo  SYNC COMPLETED SUCCESSFULLY
echo ========================================
echo.
echo Changes deployed:
echo - Fixed businessType dropdown values (UPPERCASE)
echo - Removed invalid "retailer" option
echo - Improved validation error messages
echo.
echo Test at: https://www.dromkok.com/admin/users
echo.
pause
