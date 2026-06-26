@echo off
echo ========================================
echo HERO SLIDER MOTION TYPES SETUP
echo ========================================
echo.

echo Step 1: Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Prisma generate failed!
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo Step 2: Pushing schema to database...
call npx prisma db push
if errorlevel 1 (
    echo ERROR: Database push failed!
    pause
    exit /b 1
)
echo ✓ Schema pushed to database
echo.

echo ========================================
echo ✓ SETUP COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Start dev server: npm run dev
echo 2. Open admin: http://localhost:3001/admin/settings/hero-slider
echo 3. Edit a slide and select Motion Type
echo 4. View on homepage!
echo.
pause
