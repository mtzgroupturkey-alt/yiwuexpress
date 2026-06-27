@echo off
echo ========================================
echo  🌍 TESTING GLOBE INTEGRATION
echo ========================================
echo.

echo Starting development server...
echo.
echo Once server starts:
echo.
echo  ✅ Homepage with Globe: http://localhost:3001
echo  ✅ Demo Page: http://localhost:3001/demo-globe
echo.
echo Look for the globe in the footer (right side, desktop only)
echo.
echo ========================================
echo.

start http://localhost:3001
start http://localhost:3001/demo-globe

npm run dev
