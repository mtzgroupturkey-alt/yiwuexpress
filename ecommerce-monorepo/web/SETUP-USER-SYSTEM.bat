@echo off
echo ============================================
echo  USER SYSTEM SETUP - 3 ROLES
echo ============================================
echo.
echo This script will:
echo 1. Run Prisma migration
echo 2. Generate Prisma client
echo 3. Show you what to do next
echo.
pause

echo.
echo [1/2] Running Prisma Migration...
echo.
call npx prisma migrate dev --name add-user-roles-supplier-profile

echo.
echo [2/2] Generating Prisma Client...
echo.
call npx prisma generate

echo.
echo ============================================
echo  SETUP COMPLETE!
echo ============================================
echo.
echo Your 3-role user system is now ready:
echo.
echo - CUSTOMER (USER): Public registration
echo - SUPPLIER: Admin creates in admin panel
echo - ADMIN: Admin creates in admin panel
echo.
echo Next Steps:
echo 1. Start dev server: npm run dev
echo 2. Visit /register to create a customer account
echo 3. Login to admin panel to create suppliers/admins
echo.
echo See 🎯_USER_SYSTEM_IMPLEMENTATION_COMPLETE.md for details
echo.
pause
