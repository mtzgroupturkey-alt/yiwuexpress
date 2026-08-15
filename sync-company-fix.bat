@echo off
echo ========================================
echo Syncing Company Settings Cache Fix
echo ========================================
echo.

echo [1/3] Syncing admin layout...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\layout.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/

echo.
echo [2/3] Syncing settings layout...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\app\admin\settings\layout.tsx" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/app/admin/settings/

echo.
echo [3/3] Syncing next.config.js...
scp "C:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\next.config.js" djdn@39.175.57.2:/www/wwwroot/www.dromkok.com/web/

echo.
echo ========================================
echo Sync completed!
echo ========================================
echo.
echo Now run these commands on the server:
echo.
echo   cd /www/wwwroot/www.dromkok.com/web
echo   rm -rf .next
echo   npm run build
echo   pm2 restart dromkok-web --update-env
echo   sudo rm -rf /var/cache/nginx/* /tmp/nginx/*
echo   sudo /etc/init.d/nginx restart
echo.
echo ========================================
pause
