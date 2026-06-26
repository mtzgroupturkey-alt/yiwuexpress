@echo off
echo ========================================
echo YIWU EXPRESS - Restart Development Server
echo ========================================
echo.
echo This will restart the Next.js development server
echo to pick up new API routes.
echo.
echo Press Ctrl+C in the server terminal first, then run this script.
echo.
pause

cd web
echo Starting development server...
npm run dev
