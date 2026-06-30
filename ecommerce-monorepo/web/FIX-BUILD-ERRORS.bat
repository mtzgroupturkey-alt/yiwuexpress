@echo off
cls
echo.
echo ========================================
echo   FIX NEXT.JS BUILD ERRORS
echo ========================================
echo.
echo This will clean and rebuild the Next.js cache
echo.

cd /d "%~dp0"

echo Step 1: Stopping any running dev servers...
taskkill /F /IM node.exe 2>nul
echo Done.
echo.

echo Step 2: Removing .next directory...
if exist ".next\" (
    rmdir /s /q ".next"
    echo Removed .next directory
) else (
    echo .next directory not found
)
echo.

echo Step 3: Removing node_modules/.cache...
if exist "node_modules\.cache\" (
    rmdir /s /q "node_modules\.cache"
    echo Removed node_modules cache
) else (
    echo Cache directory not found
)
echo.

echo Step 4: Clearing npm cache...
call npm cache clean --force
echo.

echo Step 5: Reinstalling dependencies...
echo This may take a few minutes...
call npm install
echo.

echo Step 6: Starting development server...
echo.
echo Server will start at: http://localhost:3000
echo.
echo Press Ctrl+C to stop the server
echo.

start http://localhost:3000/admin/purchase-orders/new

npm run dev
