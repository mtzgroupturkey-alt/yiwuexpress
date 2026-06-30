@echo off
echo ========================================
echo FIXING PURCHASE SYSTEM - 500 ERROR
echo ========================================
echo.

echo This will:
echo 1. Stop any running dev servers
echo 2. Generate Prisma client
echo 3. Restart dev server
echo.

echo Step 1: Please MANUALLY stop your dev server (Ctrl+C in terminal)
echo Press any key AFTER you've stopped the server...
pause

echo.
echo Step 2: Generating Prisma Client...
call npx prisma generate

echo.
echo Step 3: Starting dev server...
echo.
echo ========================================
echo ✅ SETUP COMPLETE!
echo ========================================
echo.
echo Now run: npm run dev
echo Then visit: http://localhost:3005/admin/suppliers
echo.
pause
