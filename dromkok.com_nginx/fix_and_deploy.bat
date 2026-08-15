@echo off
REM ==========================================
REM Fix and Deploy Nginx Configuration (Windows)
REM ==========================================
REM This script will upload the fixed nginx config
REM and apply it on the server via SSH

echo.
echo ================================================================
echo.
echo    Fix Nginx Port Mismatch - dromkok.com
echo.
echo ================================================================
echo.

REM Check if we're in the right directory
if not exist "nginx_ssl_config.conf" (
    echo ERROR: nginx_ssl_config.conf not found
    echo Make sure you're running this from the dromkok.com_nginx directory
    pause
    exit /b 1
)

set SERVER=root@dromkok.com
set LOCAL_CONF=nginx_ssl_config.conf
set REMOTE_CONF=/etc/nginx/sites-available/www.dromkok.com

echo Step 1: Upload nginx configuration
echo ----------------------------------------------------------------
echo.
scp "%LOCAL_CONF%" "%SERVER%:/tmp/nginx_ssl_config.conf"
if errorlevel 1 (
    echo ERROR: Failed to upload configuration
    echo Check your SSH connection and try again
    pause
    exit /b 1
)
echo.
echo Configuration uploaded successfully!
echo.

echo Step 2: Apply configuration on server
echo ----------------------------------------------------------------
echo.
echo This will:
echo   - Backup current config
echo   - Install new config
echo   - Test config
echo   - Reload nginx
echo   - Verify app is running
echo.
pause

REM Create a temporary script file
set SCRIPT_FILE=%TEMP%\fix_nginx.sh
(
echo #!/bin/bash
echo set -e
echo.
echo NGINX_CONF="/etc/nginx/sites-available/www.dromkok.com"
echo BACKUP_FILE="${NGINX_CONF}.backup.$(date +%%Y%%m%%d_%%H%%M%%S)"
echo.
echo echo "Creating backup: $BACKUP_FILE"
echo if [ -f "$NGINX_CONF" ]; then
echo     cp "$NGINX_CONF" "$BACKUP_FILE"
echo fi
echo.
echo echo "Installing new configuration..."
echo cp /tmp/nginx_ssl_config.conf "$NGINX_CONF"
echo chmod 644 "$NGINX_CONF"
echo.
echo echo "Testing nginx configuration..."
echo nginx -t ^|^| exit 1
echo.
echo echo "Reloading nginx..."
echo systemctl reload nginx
echo.
echo echo "Checking if app is running on port 3001..."
echo if curl -f -s http://localhost:3001 ^> /dev/null; then
echo     echo "App is running on port 3001"
echo else
echo     echo "WARNING: App not responding on port 3001"
echo     echo "Checking PM2 status..."
echo     pm2 status
echo     echo "Attempting to restart..."
echo     cd /www/wwwroot/www.dromkok.com/web
echo     pm2 restart dromkok-web --update-env ^|^| pm2 start server.js --name dromkok-web --env production
echo     pm2 save
echo     sleep 3
echo     if curl -f -s http://localhost:3001 ^> /dev/null; then
echo         echo "App is now running"
echo     else
echo         echo "ERROR: App still not responding"
echo         pm2 logs dromkok-web --lines 20 --nostream
echo         exit 1
echo     fi
echo fi
echo.
echo echo "Testing HTTPS endpoint..."
echo curl -f -I https://www.dromkok.com ^|^| echo "HTTPS not responding yet"
echo.
echo echo "Configuration applied successfully!"
) > "%SCRIPT_FILE%"

REM Upload and execute script
scp "%SCRIPT_FILE%" "%SERVER%:/tmp/fix_nginx.sh"
ssh "%SERVER%" "bash /tmp/fix_nginx.sh"

if errorlevel 1 (
    echo.
    echo ERROR: Configuration failed to apply
    echo Check the error messages above
    pause
    exit /b 1
)

REM Cleanup
del "%SCRIPT_FILE%"

echo.
echo ================================================================
echo.
echo    Configuration Applied Successfully!
echo.
echo ================================================================
echo.
echo What was done:
echo   * Nginx config updated (port 3000 -^> 3001^)
echo   * Backup created on server
echo   * Nginx reloaded
echo   * App verified on port 3001
echo.
echo Next steps:
echo   1. Clear your browser cache (Ctrl+Shift+Del^)
echo   2. Visit https://www.dromkok.com
echo   3. Check browser console - errors should be gone!
echo.
echo If you still see issues:
echo   - Try incognito/private browsing mode
echo   - Check server logs: ssh %SERVER% "pm2 logs dromkok-web"
echo.
pause
