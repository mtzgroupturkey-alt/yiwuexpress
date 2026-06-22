@echo off
echo ====================================
echo YIWU EXPRESS - Database Fix Script
echo ====================================
echo.
echo This script will:
echo 1. Stop all Node processes
echo 2. Generate Prisma client
echo 3. Create database schema
echo 4. Seed sample data
echo.
pause

echo.
echo [1/4] Stopping all Node.js processes...
taskkill /F /IM node.exe 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✓ Node processes stopped
    timeout /t 2 /nobreak >nul
) else (
    echo ! No Node processes were running
)

echo.
echo [2/4] Generating Prisma Client...
cd c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
call npm run db:generate
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to generate Prisma client
    echo.
    echo TROUBLESHOOTING:
    echo - Close VS Code completely
    echo - Run this script again as Administrator
    echo - Restart your computer if the issue persists
    pause
    exit /b 1
)
echo ✓ Prisma client generated

echo.
echo [3/4] Creating database schema...
call npm run db:push
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to push database schema
    pause
    exit /b 1
)
echo ✓ Database schema created

echo.
echo [4/4] Seeding database with sample data...
call npm run db:seed
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Failed to seed database
    pause
    exit /b 1
)
echo ✓ Database seeded successfully

echo.
echo ====================================
echo ✅ DATABASE SETUP COMPLETE!
echo ====================================
echo.
echo Test credentials:
echo - Admin: admin@yiwuexpress.com / admin123
echo - User: user@example.com / password123
echo.
echo Database location: web\prisma\dev.db
echo.
echo You can now start the server with QUICK-START.bat
echo.
pause
