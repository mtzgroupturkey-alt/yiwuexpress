@echo off
echo ========================================
echo  YIWU EXPRESS MOBILE APP - NEW DESIGN
echo ========================================
echo.
echo Starting development server...
echo.
echo Choose your platform:
echo [1] iOS Simulator
echo [2] Android Emulator  
echo [3] Web Browser (Quick Preview)
echo [4] Start server only (Scan QR with Expo Go)
echo.
echo Recommended: Option 4 + Expo Go app on your phone
echo.

cd /d "%~dp0"

set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" (
    echo.
    echo Starting iOS Simulator...
    echo.
    call npm run ios
) else if "%choice%"=="2" (
    echo.
    echo Starting Android Emulator...
    echo.
    call npm run android
) else if "%choice%"=="3" (
    echo.
    echo Starting Web Browser...
    echo This will open at http://localhost:8081
    echo.
    call npm run web
) else if "%choice%"=="4" (
    echo.
    echo Starting Development Server...
    echo.
    echo Instructions:
    echo 1. Install "Expo Go" app on your phone:
    echo    - iOS: https://apps.apple.com/app/expo-go/id982107779
    echo    - Android: https://play.google.com/store/apps/details?id=host.exp.exponent
    echo.
    echo 2. Scan the QR code that appears below
    echo 3. App will load on your device
    echo.
    echo Press Ctrl+C to stop the server
    echo.
    call npm start
) else (
    echo.
    echo Invalid choice. Please run again and choose 1-4.
    echo.
    pause
)

pause
