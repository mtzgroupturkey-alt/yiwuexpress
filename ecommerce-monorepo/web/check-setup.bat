@echo off
echo ========================================
echo Checking E-Commerce Setup
echo ========================================
echo.

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js not found
    pause
    exit /b 1
)
echo ✓ Node.js installed
echo.

echo Checking npm...
npm --version
if errorlevel 1 (
    echo ERROR: npm not found
    pause
    exit /b 1
)
echo ✓ npm installed
echo.

echo Checking if node_modules exists...
if exist node_modules (
    echo ✓ node_modules found
) else (
    echo ✗ node_modules NOT found
    echo Run: npm install
)
echo.

echo Checking .env.local...
if exist .env.local (
    echo ✓ .env.local exists
    type .env.local | findstr "DATABASE_URL"
) else (
    echo ✗ .env.local NOT found
)
echo.

echo Checking Prisma client...
if exist node_modules\.prisma (
    echo ✓ Prisma client generated
) else (
    echo ✗ Prisma client NOT generated
    echo Run: npx prisma generate
)
echo.

echo Checking if PostgreSQL is running...
pg_isready -h localhost -p 5432
if errorlevel 1 (
    echo ✗ PostgreSQL may not be running
    echo Please start PostgreSQL service
) else (
    echo ✓ PostgreSQL is running
)
echo.

echo ========================================
echo Setup Check Complete
echo ========================================
echo.
echo If any checks failed, follow the suggestions above.
echo.
pause
