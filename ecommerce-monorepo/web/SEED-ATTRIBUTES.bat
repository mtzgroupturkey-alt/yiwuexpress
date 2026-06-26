@echo off
echo ========================================
echo  Seeding Product Attributes
echo ========================================
echo.

echo Compiling TypeScript seed file...
npx tsx prisma/seed-attributes.ts

echo.
echo ========================================
echo Done! Check the output above.
echo ========================================
pause
