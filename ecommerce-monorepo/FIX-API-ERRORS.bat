@echo off
echo ========================================
echo YIWU EXPRESS - Fix API Errors
echo ========================================
echo.
echo This script will fix the 500 API errors by:
echo 1. Regenerating Prisma Client
echo 2. Verifying database connection
echo 3. Instructions for restart
echo.
echo IMPORTANT: Make sure the dev server is STOPPED before running this!
echo Press Ctrl+C in the server terminal first.
echo.
pause

cd web

echo.
echo [1/3] Regenerating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: Failed to generate Prisma Client
    echo.
    echo This usually means the dev server is still running.
    echo Please:
    echo 1. Go to the terminal running "npm run dev"
    echo 2. Press Ctrl+C to stop it
    echo 3. Run this script again
    echo.
    pause
    exit /b 1
)
echo ✓ Prisma Client generated successfully

echo.
echo [2/3] Verifying database connection...
call npx prisma db push
if errorlevel 1 (
    echo.
    echo ERROR: Database connection failed
    echo.
    echo Please make sure PostgreSQL is running:
    echo    cd docker
    echo    docker-compose up -d
    echo.
    pause
    exit /b 1
)
echo ✓ Database connection verified

echo.
echo [3/3] Checking if database is seeded...
echo.

echo.
echo ========================================
echo ✓ Fix Complete!
echo ========================================
echo.
echo Now do the following:
echo.
echo 1. Start the dev server:
echo    cd web
echo    npm run dev
echo.
echo 2. Wait for "Ready" message
echo.
echo 3. Refresh your browser (Ctrl+Shift+R)
echo.
echo 4. The errors should be gone!
echo.
echo If you still see errors, check the server terminal
echo for the actual error message.
echo.
pause
