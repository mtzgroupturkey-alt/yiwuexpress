@echo off
cls
echo.
echo ========================================
echo  MULTI-CURRENCY INPUT - QUICK START
echo ========================================
echo.
echo Starting development server...
echo.

cd /d "%~dp0"

echo Testing if node_modules exists...
if not exist "node_modules\" (
    echo.
    echo WARNING: node_modules not found!
    echo Please run: npm install
    echo.
    pause
    exit /b 1
)

echo.
echo Starting Next.js development server...
echo Server will be available at: http://localhost:3000
echo.
echo Test Pages:
echo   - Purchase Orders: http://localhost:3000/admin/purchase-orders/new
echo   - API Test: http://localhost:3000/api/currency/rate?from=CNY^&to=USD
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:3000/admin/purchase-orders/new

npm run dev
