@echo off
echo ========================================
echo Setting up Database for E-Commerce
echo ========================================
echo.

echo Step 1: Generating Prisma Client...
call npx prisma generate
if errorlevel 1 (
    echo ERROR: Failed to generate Prisma client
    pause
    exit /b 1
)
echo ✓ Prisma client generated
echo.

echo Step 2: Pushing schema to database...
call npx prisma db push --accept-data-loss
if errorlevel 1 (
    echo ERROR: Failed to push schema to database
    echo Make sure PostgreSQL is running and connection details are correct
    pause
    exit /b 1
)
echo ✓ Database schema updated
echo.

echo Step 3: Creating seed data...
call npx tsx prisma/seed-products.ts
if errorlevel 1 (
    echo Warning: Seed script failed or doesn't exist yet
    echo You can add products manually through the admin panel
)
echo.

echo ========================================
echo Database setup complete!
echo ========================================
echo.
echo Next steps:
echo 1. Run: npm run dev
echo 2. Visit: http://localhost:3001/products
echo 3. Admin: http://localhost:3001/admin/products
echo.
pause
