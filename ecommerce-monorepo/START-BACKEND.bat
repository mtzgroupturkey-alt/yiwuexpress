@echo off
echo ========================================
echo STARTING BACKEND API ON PORT 3005
echo ========================================
echo.
echo This will start the Next.js server with API routes.
echo.
echo API will be available at: http://localhost:3005/api
echo.
echo Starting server...
echo.

cd /d "%~dp0web"
npm run dev

pause
