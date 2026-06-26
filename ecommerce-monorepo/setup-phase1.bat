@echo off
REM YIWU EXPRESS - Phase 1 Setup Script
REM This script automates the Phase 1 database migration and setup

echo ========================================
echo YIWU EXPRESS - Phase 1 Setup
echo ========================================
echo.

REM Check if Docker is running
echo [1/6] Checking Docker...
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)
echo ✓ Docker is running
echo.

REM Start PostgreSQL container
echo [2/6] Starting PostgreSQL container...
cd docker
docker-compose up -d
if errorlevel 1 (
    echo ERROR: Failed to start PostgreSQL container
    pause
    exit /b 1
)
echo ✓ PostgreSQL container started
echo.

REM Wait for PostgreSQL to be ready
echo [3/6] Waiting for PostgreSQL to be ready...
timeout /t 10 /nobreak >nul
echo ✓ PostgreSQL is ready
echo.

REM Install dependencies and setup Prisma
echo [4/6] Installing dependencies...
cd ..\web
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    pause
    exit /b 1
)
echo ✓ Dependencies installed
echo.

REM Generate Prisma Client
echo [5/6] Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated
echo.

REM Push schema to database
echo [5.5/6] Pushing schema to PostgreSQL...
call npx prisma db push
if errorlevel 1 (
    echo ERROR: Failed to push schema
    pause
    exit /b 1
)
echo ✓ Schema pushed to database
echo.

REM Seed database
echo [6/6] Seeding database...
call npm run db:seed
if errorlevel 1 (
    echo ERROR: Failed to seed database
    pause
    exit /b 1
)
echo ✓ Database seeded
echo.

echo ========================================
echo Phase 1 Setup Complete! ✓
echo ========================================
echo.
echo Login Credentials:
echo   Admin:    admin@yiwuexpress.com / admin123
echo   Customer: user@example.com / password123
echo.
echo Next Steps:
echo   1. Start the dev server: cd web ^&^& npm run dev
echo   2. Visit: http://localhost:3001
echo   3. Open Prisma Studio: npx prisma studio
echo.
echo API Endpoints Available:
echo   - GET  /api/countries
echo   - POST /api/shipping/calculate
echo   - GET  /api/products
echo   - GET  /api/categories
echo   - POST /api/orders
echo   - GET  /api/cart
echo   - POST /api/wholesale
echo.
echo For full documentation, see:
echo   - MIGRATION_GUIDE.md
echo   - PHASE_1_COMPLETE.md
echo.
pause
