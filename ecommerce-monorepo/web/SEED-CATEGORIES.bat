@echo off
echo ========================================
echo  Seeding Sample Categories
echo ========================================
echo.

echo Creating main categories and subcategories...
npx tsx prisma/seed-categories.ts

echo.
echo ========================================
echo Done! Check the output above.
echo ========================================
echo.
echo Next step: Run SEED-ATTRIBUTES.bat to add attributes
echo.
pause
