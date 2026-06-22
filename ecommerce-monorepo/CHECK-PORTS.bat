@echo off
echo ========================================
echo   Port Status Check
echo ========================================
echo.
echo Checking if ports are in use...
echo.

echo Backend API (Port 3001):
netstat -ano | findstr :3001
if %errorlevel% equ 0 (
    echo   ✓ Port 3001 is IN USE
) else (
    echo   ✗ Port 3001 is FREE
)
echo.

echo Mobile Expo (Port 8081):
netstat -ano | findstr :8081
if %errorlevel% equ 0 (
    echo   ✓ Port 8081 is IN USE
) else (
    echo   ✗ Port 8081 is FREE
)
echo.

echo ========================================
echo   Configuration Check
echo ========================================
echo.

echo Backend .env.local:
if exist "web\.env.local" (
    echo   ✓ File exists
    findstr /C:"PORT=3001" "web\.env.local" >nul
    if %errorlevel% equ 0 (
        echo   ✓ PORT=3001 configured
    ) else (
        echo   ✗ PORT not set to 3001
    )
) else (
    echo   ✗ File missing!
)
echo.

echo Mobile .env:
if exist "mobile\.env" (
    echo   ✓ File exists
) else (
    echo   ✗ File missing!
)
echo.

echo ========================================
pause
