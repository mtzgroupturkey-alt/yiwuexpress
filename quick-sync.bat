@echo off
REM ==========================================
REM Quick Sync Shortcut - One-click deploy
REM ==========================================
REM This script quickly syncs your changes to production
REM Usage: Double-click or run: quick-sync.bat

setlocal

set SERVER_IP=39.175.57.2
set SERVER_USER=root
set SERVER_PATH=/www/wwwroot/www.dromkok.com/web
set LOCAL_PATH=%~dp0ecommerce-monorepo\web

echo.
echo ========================================
echo   Quick Sync to dromkok.com
echo ========================================
echo.
echo Syncing files to: %SERVER_IP%
echo.

REM Check if SSH is available
where ssh >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] SSH not found. Please install Git for Windows or OpenSSH.
    pause
    exit /b 1
)

REM Quick sync essential folders
echo [1/4] Syncing app folder...
scp -r "%LOCAL_PATH%\app" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/ 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to sync app folder
    pause
    exit /b 1
)

echo [2/4] Syncing components folder...
scp -r "%LOCAL_PATH%\components" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/ 2>nul

echo [3/4] Syncing lib folder...
scp -r "%LOCAL_PATH%\lib" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/ 2>nul

echo [4/4] Restarting application...
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && if command -v pm2 > /dev/null 2>&1; then pm2 restart all; else systemctl restart nginx; fi" 2>nul

echo.
echo ========================================
echo   ✓ Quick Sync Complete!
echo ========================================
echo.
echo Check your site: https://www.dromkok.com
echo.
pause
