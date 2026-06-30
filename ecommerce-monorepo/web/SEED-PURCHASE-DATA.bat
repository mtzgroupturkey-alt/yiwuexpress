@echo off
echo ========================================
echo SEED PURCHASE MANAGEMENT SAMPLE DATA
echo ========================================
echo.

echo This will create:
echo - 3 Sample Suppliers
echo - 5 Sample Purchase Orders (various statuses)
echo - 10 Purchase Order Items
echo - 1 Supplier Payment
echo - Product-Supplier links
echo.

set /p confirm="Continue? (Y/N): "
if /i not "%confirm%"=="Y" goto :end

echo.
echo Running seed script...
npx tsx prisma/seed-purchase-data.ts

echo.
echo ========================================
echo ✅ SAMPLE DATA SEEDED!
echo ========================================
echo.
echo View the data at:
echo - http://localhost:3000/admin/suppliers
echo - http://localhost:3000/admin/purchase-orders
echo.

:end
pause
