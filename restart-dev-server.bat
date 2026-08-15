@echo off
echo ========================================
echo Restarting Dev Server (Port 3005)
echo ========================================
echo.
echo This will:
echo 1. Kill existing Node.js dev server
echo 2. Close leaked database connections
echo 3. Start fresh dev server
echo.
pause

echo.
echo [1/2] Killing Node.js processes on port 3005...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005 ^| findstr LISTENING') do (
    echo Killing PID: %%a
    taskkill /F /PID %%a
)

echo.
echo [2/2] Starting dev server...
echo.
cd /d c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web
start cmd /k "npm run dev"

echo.
echo ========================================
echo Dev Server Restart Complete!
echo ========================================
echo.
echo A new window has opened with the dev server.
echo Wait 10-15 seconds for it to compile, then visit:
echo http://localhost:3005/admin/products
echo.
pause
