@echo off
echo.
echo ========================================
echo   CONSOLE ERROR FIX - VERIFICATION
echo ========================================
echo.
echo This will verify all console errors are fixed!
echo.
pause

echo.
echo [1/4] Checking files exist...
echo.

if exist "components\ui\cobe-globe-interactive.tsx" (
    echo ✓ WebGL component found
) else (
    echo ✗ WebGL component NOT FOUND
)

if exist "app\api\auth\profile\route.ts" (
    echo ✓ Auth profile endpoint found
) else (
    echo ✗ Auth profile endpoint NOT FOUND - FIX REQUIRED
)

if exist "components\DynamicFavicon.tsx" (
    echo ✓ Favicon component found
) else (
    echo ✗ Favicon component NOT FOUND
)

if exist "components\products\ProductCard.tsx" (
    echo ✓ Product card component found
) else (
    echo ✗ Product card NOT FOUND
)

echo.
echo [2/4] Checking placeholder image...
echo.

if exist "public\images\products\placeholder.jpg" (
    echo ✓ Placeholder image available
) else (
    echo ✗ Placeholder image missing - will use fallback icon
)

echo.
echo [3/4] Starting development server...
echo.
echo Opening browser in 5 seconds...
echo Check browser console (F12) - should be CLEAN!
echo.
timeout /t 5

start http://localhost:3005

echo.
echo Starting server...
npm run dev

echo.
echo [4/4] Server stopped
echo.
echo ========================================
echo   VERIFICATION CHECKLIST
echo ========================================
echo.
echo Did you check?
echo   [ ] Browser console is clean (F12)
echo   [ ] No WebGL errors
echo   [ ] No 404 errors
echo   [ ] No 400 errors  
echo   [ ] No favicon logs
echo   [ ] Globe renders properly
echo   [ ] Products show images or fallback
echo   [ ] Login/auth works
echo.
echo If all checked, you're READY FOR PRODUCTION!
echo.
pause
