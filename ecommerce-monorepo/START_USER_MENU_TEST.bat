@echo off
echo ========================================
echo USER MENU & DASHBOARD - QUICK START
echo ========================================
echo.
echo Starting development server...
echo Server will be available at: http://localhost:3005
echo.
echo Test URLs:
echo   - Dashboard:   http://localhost:3005/dashboard
echo   - Orders:      http://localhost:3005/dashboard/orders
echo   - Wishlist:    http://localhost:3005/dashboard/wishlist
echo   - Profile:     http://localhost:3005/dashboard/profile
echo   - Addresses:   http://localhost:3005/dashboard/addresses
echo   - Settings:    http://localhost:3005/dashboard/settings
echo.
echo ========================================
echo.

cd web
npm run dev
