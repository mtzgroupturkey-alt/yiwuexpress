@echo off
echo ========================================
echo   YIWU EXPRESS - Quick Start
echo ========================================
echo.

REM Check if database exists
if not exist "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web\prisma\dev.db" (
    echo ========================================
    echo   ⚠️  DATABASE NOT FOUND!
    echo ========================================
    echo.
    echo The database has not been initialized yet.
    echo Please run FIX-DATABASE.bat first to set up the database.
    echo.
    echo Steps:
    echo 1. Close this window
    echo 2. Double-click FIX-DATABASE.bat
    echo 3. Run QUICK-START.bat again
    echo.
    echo ========================================
    pause
    exit /b 1
)

echo This script will start both servers:
echo   - Backend API on port 3001
echo   - Mobile App on port 8081
echo.
echo Press Ctrl+C in each window to stop
echo ========================================
echo.

REM Start Backend
echo Starting Backend Server (port 3001)...
start cmd /k "cd /d c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web && npm run dev"

REM Wait a bit for backend to start
timeout /t 5 /nobreak >nul

REM Start Mobile
echo Starting Mobile App (port 8081)...
start cmd /k "cd /d c:\wamp64\www\yiwuexpress\ecommerce-monorepo\mobile && npm start"

echo.
echo ========================================
echo   Servers Starting!
echo ========================================
echo.
echo Backend API: http://localhost:3001
echo Mobile App:  http://localhost:8081
echo.
echo Test Credentials:
echo - Admin: admin@yiwuexpress.com / admin123
echo - User: user@example.com / password123
echo.
echo Check the opened terminal windows for status
echo ========================================
pause
