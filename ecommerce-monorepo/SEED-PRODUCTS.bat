@echo off
echo 🌱 YIWU EXPRESS - Comprehensive Product Seeding
echo =============================================
echo.
echo This will add realistic sample products with:
echo - High-quality product photos
echo - Product variants (sizes, colors, materials)
echo - Wholesale and retail pricing
echo - Complete product attributes
echo - SKU codes and HS codes for international shipping
echo.
pause

cd /d "c:\wamp64\www\yiwuexpress\ecommerce-monorepo\web"

echo 📦 Installing dependencies...
npm install

echo 🔄 Generating Prisma client...
npx prisma generate

echo 🗄️ Running database migrations...
npx prisma db push

echo 🌱 Seeding comprehensive product data...
npx ts-node prisma/seed-comprehensive-products.ts

echo.
echo ✅ Product seeding completed!
echo 🌐 You can now view your products at: http://localhost:3001/products
echo 👩‍💼 Admin panel: http://localhost:3001/admin/products
echo.
pause