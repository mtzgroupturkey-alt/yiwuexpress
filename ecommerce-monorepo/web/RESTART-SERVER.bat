@echo off
echo.
echo ========================================
echo  Restarting Next.js Server
echo ========================================
echo.

echo Step 1: Stopping Node.js processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul
echo [OK] Processes stopped
echo.

echo Step 2: Navigating to web directory...
cd /d c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
echo [OK] Current directory: %CD%
echo.

echo Step 3: Regenerating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo [ERROR] Failed to generate Prisma Client
    pause
    exit /b 1
)
echo [OK] Prisma Client generated
echo.

echo Step 4: Starting development server...
echo Press Ctrl+C to stop the server when needed
echo.
call npm run dev

pause
