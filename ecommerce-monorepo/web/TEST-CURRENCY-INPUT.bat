@echo off
echo.
echo ========================================
echo   TESTING MULTI-CURRENCY INPUT
echo ========================================
echo.
echo This will test the new CurrencyInput component
echo.
echo Step 1: Checking if currencies exist in database...
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.currency.findMany().then(currencies => { console.log('Found currencies:', currencies.length); currencies.forEach(c => console.log('  -', c.code, c.name, c.exchangeRate)); prisma.$disconnect(); });"

echo.
echo Step 2: Test exchange rate API
echo Opening browser to test API endpoint...
start http://localhost:3000/api/currency/rate?from=CNY^&to=USD

echo.
echo Step 3: Open Purchase Order form
echo Opening browser to test CurrencyInput component...
start http://localhost:3000/admin/purchase-orders/new

echo.
echo ========================================
echo   MANUAL TEST CHECKLIST
echo ========================================
echo.
echo [ ] 1. Can you see the currency dropdown?
echo [ ] 2. Does it show active currencies from database?
echo [ ] 3. Can you select different currencies?
echo [ ] 4. Does exchange rate update automatically?
echo [ ] 5. Can you toggle manual rate override?
echo [ ] 6. Can you enter a custom rate?
echo [ ] 7. Does the refresh button work?
echo [ ] 8. Are totals displayed in both currencies?
echo [ ] 9. Does base conversion show correctly?
echo [ ] 10. Does USD currency hide the rate section?
echo.
echo ========================================
echo.
pause
