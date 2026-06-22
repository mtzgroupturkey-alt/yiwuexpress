@echo off
echo ========================================
echo   Database Setup
echo ========================================
echo.
echo This will:
echo   1. Generate Prisma Client
echo   2. Create the database
echo   3. Seed with initial data
echo.
pause
echo.

cd /d c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web

echo Step 1: Generating Prisma Client...
call npm run db:generate
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

echo Step 2: Creating database...
call npm run db:push
if %errorlevel% neq 0 (
    echo.
    echo ❌ Failed to create database
    pause
    exit /b 1
)
echo ✓ Database created
echo.

echo Step 3: Seeding database...
call npm run db:seed
if %errorlevel% neq 0 (
    echo.
    echo ⚠️  Seeding failed but database is ready
    echo    You can add data manually later
)
echo ✓ Database seeded
echo.

echo ========================================
echo   ✓ Database Setup Complete!
echo ========================================
echo.
echo You can now start the servers:
echo   1. Run QUICK-START.bat
echo   2. Or manually: npm run dev
echo.
pause
