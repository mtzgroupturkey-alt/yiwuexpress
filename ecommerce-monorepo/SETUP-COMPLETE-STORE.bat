@echo off
echo.
echo ============================================================
echo    YIWU EXPRESS - Complete Store Setup with Sample Data
echo ============================================================
echo.
echo This will set up your complete YIWU EXPRESS store with:
echo   ✓ 29+ Professional Products with Photos
echo   ✓ 174+ Product Variants (sizes, colors, materials)
echo   ✓ Complete Product Attributes System
echo   ✓ 5 Hero Slides for Homepage
echo   ✓ Categories and Subcategories
echo   ✓ International Shipping Data (HS Codes, Weights)
echo   ✓ Wholesale and Retail Pricing
echo.
pause

cd /d "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web"

echo.
echo [1/5] Installing dependencies...
echo ----------------------------------------
call npm install
if %errorlevel% neq 0 (
    echo ❌ Error installing dependencies
    pause
    exit /b 1
)

echo.
echo [2/5] Generating Prisma client...
echo ----------------------------------------
call npx prisma generate
if %errorlevel% neq 0 (
    echo ❌ Error generating Prisma client
    pause
    exit /b 1
)

echo.
echo [3/5] Setting up database...
echo ----------------------------------------
call npx prisma db push
if %errorlevel% neq 0 (
    echo ❌ Error setting up database
    pause
    exit /b 1
)

echo.
echo [4/5] Seeding comprehensive product data...
echo ----------------------------------------
call npm run db:seed:products
if %errorlevel% neq 0 (
    echo ❌ Error seeding products
    pause
    exit /b 1
)

echo.
echo [5/5] Seeding hero slides...
echo ----------------------------------------
call npm run db:seed:hero
if %errorlevel% neq 0 (
    echo ❌ Error seeding hero slides
    pause
    exit /b 1
)

echo.
echo ============================================================
echo                    ✅ SETUP COMPLETE!
echo ============================================================
echo.
echo Your YIWU EXPRESS store is ready!
echo.
echo 📊 Sample Data Created:
echo    - 29 Products across 8 categories
echo    - 174+ Product Variants
echo    - 5 Hero Slides
echo    - Complete Attributes System
echo.
echo 🌐 Access Your Store:
echo    Frontend:  http://localhost:3005
echo    Products:  http://localhost:3005/products
echo    Admin:     http://localhost:3005/admin
echo.
echo 🚀 Start Development Server:
echo    npm run dev
echo.
echo 📖 Read full documentation:
echo    SAMPLE_DATA_COMPLETE.md
echo.
pause
