@echo off
echo ========================================
echo CURRENCY SYSTEM TEST
echo ========================================
echo.

echo Testing currency system setup...
echo.

echo [1/3] Checking database connection...
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.currency.count().then(c => {console.log('Currencies in database:', c); if(c === 0) console.log('⚠️  No currencies found. Run SETUP-CURRENCY-SYSTEM.bat'); process.exit(0);}).catch(e => {console.error('❌ Database error:', e.message); process.exit(1);})"

echo.
echo [2/3] Checking for base currency...
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.currency.findFirst({where: {isBase: true}}).then(c => {if(c) console.log('✅ Base currency:', c.code, '-', c.name); else console.log('⚠️  No base currency set'); process.exit(0);}).catch(e => {console.error('❌ Error:', e.message); process.exit(1);})"

echo.
echo [3/3] Listing all currencies...
node -e "const {PrismaClient} = require('@prisma/client'); const p = new PrismaClient(); p.currency.findMany({where: {isActive: true}, orderBy: {code: 'asc'}}).then(currencies => {console.log(''); currencies.forEach(c => {console.log(`  ${c.code.padEnd(5)} ${c.symbol.padEnd(3)} ${c.name.padEnd(20)} Rate: ${c.exchangeRate} ${c.isBase ? '(BASE)' : ''}`)}); process.exit(0);}).catch(e => {console.error('❌ Error:', e.message); process.exit(1);})"

echo.
echo ========================================
echo   TEST COMPLETE
echo ========================================
echo.
echo If currencies are showing above, the system is ready!
echo.
echo Next steps:
echo   1. Start server: npm run dev
echo   2. Test API: http://localhost:3005/api/currencies
echo   3. Convert: POST http://localhost:3005/api/currency/convert
echo.
pause
