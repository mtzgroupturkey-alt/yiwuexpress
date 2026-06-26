@echo off
echo ========================================
echo FEATURED PRODUCTS & NEW ARRIVALS SETUP
echo ========================================
echo.
echo This script will:
echo 1. Run database migration
echo 2. Regenerate Prisma client
echo 3. Restart development server
echo.
pause

cd /d "%~dp0"

echo.
echo [1/3] Running database migration...
echo ========================================
call npx prisma migrate dev --name add_featured_new_arrival_fields
if errorlevel 1 (
    echo.
    echo ERROR: Migration failed!
    echo.
    echo Try running manually:
    echo   cd web
    echo   npx prisma migrate dev --name add_featured_new_arrival_fields
    echo.
    pause
    exit /b 1
)

echo.
echo [2/3] Regenerating Prisma client...
echo ========================================
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: Prisma generate failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo New features are now available:
echo.
echo 1. Admin Products Page (with toggles):
echo    http://localhost:3000/admin/products
echo.
echo 2. Featured Products Management:
echo    http://localhost:3000/admin/settings/featured-products
echo.
echo 3. New Arrivals Management:
echo    http://localhost:3000/admin/settings/new-arrivals
echo.
echo 4. Homepage (public view):
echo    http://localhost:3000/
echo.
echo ========================================
echo.
echo [3/3] Ready to start development server!
echo.
echo Press any key to start the server, or Ctrl+C to exit.
pause

echo.
echo Starting development server...
echo ========================================
npm run dev

pause
