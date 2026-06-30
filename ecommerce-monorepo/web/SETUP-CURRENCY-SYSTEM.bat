@echo off
echo ========================================
echo MULTI-CURRENCY SYSTEM SETUP
echo ========================================
echo.

echo [Step 1/3] Running database migration...
echo.
call npx prisma migrate dev --name add-multi-currency

if errorlevel 1 (
    echo.
    echo [ERROR] Migration failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [Step 2/3] Generating Prisma client...
echo.
call npx prisma generate

if errorlevel 1 (
    echo.
    echo [ERROR] Prisma generate failed!
    echo.
    pause
    exit /b 1
)

echo.
echo [Step 3/3] Seeding currencies...
echo.
call npx ts-node prisma/seed-currencies.ts

if errorlevel 1 (
    echo.
    echo [ERROR] Currency seeding failed!
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo   MULTI-CURRENCY SYSTEM READY!
echo ========================================
echo.
echo ✅ Database migrated
echo ✅ Prisma client generated
echo ✅ Currencies seeded:
echo    - USD (Base Currency)
echo    - CNY (Chinese Yuan)
echo    - EUR (Euro)
echo    - RUB (Russian Ruble)
echo    - GBP (British Pound)
echo    - JPY (Japanese Yen)
echo.
echo 🎯 Features Available:
echo    - Multi-currency support
echo    - Exchange rate management
echo    - Profit calculation in base currency
echo    - Currency conversion API
echo.
echo 📝 Next Steps:
echo    1. npm run dev (start server)
echo    2. Visit: /admin/settings/currencies
echo    3. Update exchange rates if needed
echo.
pause
