@echo off
echo ========================================
echo  YIWU EXPRESS - Globe Component Setup
echo ========================================
echo.

echo [1/3] Installing cobe dependency...
call npm install cobe

echo.
echo [2/3] Component files created:
echo   - components/ui/cobe-globe-interactive.tsx
echo   - app/demo-globe/page.tsx

echo.
echo [3/3] Integration complete!
echo   Globe added to footer component

echo.
echo ========================================
echo  SETUP COMPLETE!
echo ========================================
echo.
echo  The interactive globe is now:
echo  - Integrated into the footer (right side)
echo  - Available at: http://localhost:3001/demo-globe
echo.
echo  To test:
echo  1. Run: npm run dev
echo  2. Visit: http://localhost:3001
echo  3. Scroll to footer to see the globe
echo.
echo  Features:
echo  - Smooth rotation animation
echo  - Interactive markers for global offices
echo  - Drag to rotate manually
echo  - Responsive design
echo.
pause
