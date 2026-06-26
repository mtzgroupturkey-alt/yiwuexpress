@echo off
echo.
echo ====================================
echo   SEED DATABASE WITH TEST ORDERS
echo ====================================
echo.

cd /d %~dp0

echo Running database seed script...
echo.

npx ts-node --compiler-options {\"module\":\"commonjs\"} scripts/seed-orders.ts

echo.
echo ====================================
echo Done! Check the output above.
echo ====================================
echo.
pause
