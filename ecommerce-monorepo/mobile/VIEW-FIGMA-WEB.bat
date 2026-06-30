@echo off
echo ========================================
echo  VIEW FIGMA DESIGN ON WEB
echo ========================================
echo.
echo This will open the Figma design in your browser
echo URL: http://localhost:8081
echo.
echo The web version now matches the Figma design EXACTLY:
echo - ShopHub branding
echo - Orange FAB button
echo - Flash Sales section
echo - 2-column product grid
echo - Exact colors and spacing
echo.
pause

cd /d "%~dp0"

echo.
echo Starting web server...
echo.

call npm run web

pause
