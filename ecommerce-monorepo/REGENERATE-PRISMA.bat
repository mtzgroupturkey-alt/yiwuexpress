@echo off
echo ========================================
echo Regenerating Prisma Client
echo ========================================
echo.

cd web

echo Step 1: Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo ERROR: Failed to generate Prisma Client
    pause
    exit /b 1
)
echo ✓ Prisma Client generated successfully
echo.

echo Step 2: Pushing schema to database...
call npx prisma db push
if errorlevel 1 (
    echo.
    echo ERROR: Failed to push schema
    pause
    exit /b 1
)
echo ✓ Database schema updated
echo.

echo ========================================
echo ✓ Prisma Regeneration Complete!
echo ========================================
echo.
echo Now start the server:
echo    npm run dev
echo.
pause
