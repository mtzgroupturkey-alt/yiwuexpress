@echo off
echo ========================================
echo  YIWU EXPRESS MOBILE - RESTART & CLEAR
echo ========================================
echo.
echo API Configuration Updated:
echo - Port changed: 3001 -^> 3005
echo - Backend URL: http://localhost:3005/api
echo.
echo This script will:
echo 1. Clear Expo cache
echo 2. Restart development server
echo.
pause

cd /d "%~dp0"

echo.
echo Clearing Expo cache...
echo.

call npx expo start -c

pause
