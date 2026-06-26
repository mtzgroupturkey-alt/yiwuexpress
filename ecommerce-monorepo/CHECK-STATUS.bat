@echo off
echo ========================================
echo YIWU EXPRESS - System Status Check
echo ========================================
echo.

echo [1/4] Checking PostgreSQL...
docker ps | findstr yiwu-express-db
if errorlevel 1 (
    echo ❌ PostgreSQL is NOT running
    echo    Start it with: cd docker ^&^& docker-compose up -d
) else (
    echo ✓ PostgreSQL is running
)
echo.

echo [2/4] Checking if dev server is running...
netstat -ano | findstr :3001
if errorlevel 1 (
    echo ❌ Dev server is NOT running on port 3001
    echo    Start it with: cd web ^&^& npm run dev
) else (
    echo ✓ Something is running on port 3001
)
echo.

echo [3/4] Checking Prisma Client...
if exist "web\node_modules\.prisma\client" (
    echo ✓ Prisma Client directory exists
) else (
    echo ❌ Prisma Client NOT found
    echo    Generate it with: cd web ^&^& npx prisma generate
)
echo.

echo [4/4] Checking API route files...
if exist "web\app\api\settings\route.ts" (
    echo ✓ /api/settings route exists
) else (
    echo ❌ /api/settings route NOT found
)

if exist "web\app\api\admin\stats\route.ts" (
    echo ✓ /api/admin/stats route exists
) else (
    echo ❌ /api/admin/stats route NOT found
)
echo.

echo ========================================
echo Status Check Complete
echo ========================================
echo.
echo If everything shows ✓, try:
echo 1. Stop the dev server (Ctrl+C)
echo 2. Run: FIX-API-ERRORS.bat
echo 3. Restart dev server: cd web ^&^& npm run dev
echo.
pause
