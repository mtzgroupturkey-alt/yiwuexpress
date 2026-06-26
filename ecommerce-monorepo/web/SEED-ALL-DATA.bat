@echo off
echo ========================================
echo  Seeding ALL Sample Data
echo ========================================
echo.

echo [1/2] Seeding Categories...
echo ----------------------------------------
npx tsx prisma/seed-categories.ts

echo.
echo.
echo [2/2] Seeding Attributes...
echo ----------------------------------------
npx tsx prisma/seed-attributes.ts

echo.
echo.
echo ========================================
echo  ALL DATA SEEDED SUCCESSFULLY!
echo ========================================
echo.
echo You now have:
echo   - 10 Main Categories
echo   - 20 Subcategories
echo   - 27 Product Attributes
echo.
echo Next: Visit http://localhost:3001/admin/attributes
echo.
pause
