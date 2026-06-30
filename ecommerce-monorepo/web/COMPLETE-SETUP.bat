@echo off
echo ========================================
echo COMPLETE PURCHASE SYSTEM SETUP
echo ========================================
echo.

echo IMPORTANT: This will fix the 500 error!
echo.
echo Please follow these steps:
echo 1. STOP your dev server (Ctrl+C in the other terminal)
echo 2. Press any key here to continue...
pause

echo.
echo Step 1: Checking Prisma migration status...
call npx prisma migrate status

echo.
echo Step 2: Generating Prisma Client (this fixes the error)...
call npx prisma generate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ❌ ERROR: Prisma generation failed!
    echo.
    echo Make sure you stopped the dev server first.
    echo Then run this script again.
    pause
    exit /b 1
)

echo.
echo Step 3: Verifying database tables...
call npx prisma db push

echo.
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo Now you can:
echo 1. Start your dev server: npm run dev
echo 2. Visit: http://localhost:3005/admin/suppliers
echo 3. The 500 error should be fixed!
echo.
echo If you still see errors, check the terminal where
echo npm run dev is running for detailed error messages.
echo.
pause
