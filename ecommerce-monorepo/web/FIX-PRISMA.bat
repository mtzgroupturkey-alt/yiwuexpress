@echo off
echo ====================================
echo FIXING PRISMA CLIENT GENERATION
echo ====================================
echo.
echo This will regenerate the Prisma Client with BreadcrumbSetting model
echo.
echo IMPORTANT: Make sure to STOP the dev server first (Ctrl+C)
echo.
pause

echo.
echo Step 1: Generating Prisma Client...
echo ====================================
call npx prisma generate
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Prisma generation failed!
    echo Make sure the dev server is STOPPED.
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Verifying schema sync...
echo ====================================
call npx prisma migrate status
echo.

echo.
echo ====================================
echo SUCCESS! Prisma Client regenerated
echo ====================================
echo.
echo Now you can restart the dev server with:
echo npm run dev
echo.
pause
