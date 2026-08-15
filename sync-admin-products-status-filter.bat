@echo off
echo ========================================
echo Syncing Admin Products Status Filter Fix
echo ========================================
echo.
echo This will upload:
echo 1. Admin products page (status filter UI)
echo 2. Admin products API (status filter logic + connection fix)
echo.
echo IMPORTANT FIX INCLUDED:
echo - Fixed database connection leak (changed to singleton prisma client)
echo.
echo Target: djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/
echo.
pause

echo.
echo [1/2] Uploading admin products page...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\products\page.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/products/

echo.
echo [2/2] Uploading admin products API...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\api\admin\products\route.ts" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/api/admin/products/

echo.
echo ========================================
echo Upload Complete!
echo ========================================
echo.
echo Next steps on SERVER:
echo 1. cd /www/wwwroot/www.dromkok.com/web
echo 2. rm -rf .next
echo 3. npm run build
echo 4. pm2 restart dromkok-web --update-env
echo.
echo After rebuild, test at: https://www.dromkok.com/admin/products
echo - Select "New Arrivals Only" from Status Filter dropdown
echo - Should show ONLY products marked as New Arrivals
echo.
pause
