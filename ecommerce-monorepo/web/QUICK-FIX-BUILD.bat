@echo off
cls
echo.
echo ========================================
echo   QUICK FIX - REBUILD NEXT.JS
echo ========================================
echo.

cd /d "%~dp0"

echo Stopping dev server...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul
echo.

echo Cleaning .next directory...
if exist ".next\" (
    rmdir /s /q ".next"
    echo ✓ Removed .next
)
echo.

echo Cleaning cache...
if exist "node_modules\.cache\" (
    rmdir /s /q "node_modules\.cache"
    echo ✓ Removed cache
)
echo.

echo Starting fresh dev server...
echo.
start http://localhost:3000/admin/purchase-orders/new

npm run dev
