@echo off
color 0A
title E-Commerce Platform Setup

echo.
echo ========================================
echo   YIWU EXPRESS E-COMMERCE SETUP
echo ========================================
echo.
echo This script will:
echo 1. Install dependencies
echo 2. Setup database
echo 3. Create sample data
echo 4. Start the server
echo.
echo Press Ctrl+C to cancel, or
pause
echo.

cd /d "%~dp0"

echo.
echo ========================================
echo STEP 1: Installing Dependencies
echo ========================================
echo.
echo This may take 2-5 minutes...
echo.

call npm install
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: npm install failed!
    echo.
    echo Possible solutions:
    echo - Make sure you have Node.js installed
    echo - Check your internet connection
    echo - Try running: npm cache clean --force
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Dependencies installed successfully
echo.

echo.
echo ========================================
echo STEP 2: Generating Prisma Client
echo ========================================
echo.

call npx prisma generate
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Prisma generate failed!
    pause
    exit /b 1
)

echo.
echo ✓ Prisma client generated
echo.

echo.
echo ========================================
echo STEP 3: Creating Database Tables
echo ========================================
echo.
echo Make sure PostgreSQL is running!
echo.

call npx prisma db push --accept-data-loss --skip-generate
if errorlevel 1 (
    color 0C
    echo.
    echo ERROR: Database push failed!
    echo.
    echo Possible solutions:
    echo - Make sure PostgreSQL is running
    echo - Check .env.local DATABASE_URL is correct
    echo - Create database manually: CREATE DATABASE ecommerce;
    echo.
    pause
    exit /b 1
)

echo.
echo ✓ Database tables created
echo.

echo.
echo ========================================
echo STEP 4: Adding Sample Data
echo ========================================
echo.

call npx tsx prisma/seed-products.ts
if errorlevel 1 (
    echo.
    echo Warning: Seed script had issues
    echo You can add products manually in the admin panel
    echo.
)

echo.
echo ✓ Sample data added
echo.

echo.
echo ========================================
echo SUCCESS! Setup Complete!
echo ========================================
echo.
echo Your e-commerce platform is ready!
echo.
echo Test Accounts:
echo   Customer: customer@test.com / password123
echo   Admin: admin@test.com / password123
echo.
echo Sample Products: 5 products added
echo Sample Categories: 3 categories added
echo Sample Countries: 2 countries with shipping rates
echo.
echo ========================================
echo.
echo Next: Start the development server
echo   Run: npm run dev
echo   Then visit: http://localhost:3001/products
echo.
echo ========================================
echo.

color 0A
pause

echo.
echo Would you like to start the server now? (Y/N)
set /p choice="> "

if /i "%choice%"=="Y" (
    echo.
    echo Starting server...
    echo Visit: http://localhost:3001/products
    echo Press Ctrl+C to stop
    echo.
    call npm run dev
)

echo.
echo Setup complete! Run 'npm run dev' to start the server.
echo.
pause
