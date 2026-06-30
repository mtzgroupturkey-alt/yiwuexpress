@echo off
echo ========================================
echo PURCHASE MANAGEMENT SYSTEM SETUP
echo ========================================
echo.

echo Step 1: Running Prisma Migration...
npx prisma migrate dev --name add_purchase_management_system

echo.
echo Step 2: Generating Prisma Client...
npx prisma generate

echo.
echo ========================================
echo ✅ PURCHASE MANAGEMENT SYSTEM READY!
echo ========================================
echo.
echo Access the new features:
echo - Suppliers: http://localhost:3000/admin/suppliers
echo - Purchase Orders: http://localhost:3000/admin/purchase-orders
echo - Create PO: http://localhost:3000/admin/purchase-orders/new
echo.
echo See PURCHASE_MANAGEMENT_SYSTEM.md for complete documentation
echo.
pause
