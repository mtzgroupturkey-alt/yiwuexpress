@echo off
echo ========================================
echo BREADCRUMB BACKGROUND SETUP
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] Running Prisma Migration...
call npx prisma migrate dev --name add_breadcrumb_settings
if errorlevel 1 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)
echo ✓ Migration completed
echo.

echo [2/3] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Prisma generate failed
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo [3/3] Creating uploads directory...
if not exist "public\uploads\breadcrumb" mkdir "public\uploads\breadcrumb"
if not exist "public\uploads\breadcrumb\mobile" mkdir "public\uploads\breadcrumb\mobile"
echo ✓ Directories created
echo.

echo ========================================
echo ✓ BREADCRUMB SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Start dev server: npm run dev
echo 2. Visit: http://localhost:3000/admin/settings/breadcrumb
echo 3. Add your first breadcrumb background!
echo.
echo Press any key to exit...
pause >nul
