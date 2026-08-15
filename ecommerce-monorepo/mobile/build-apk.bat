@echo off
REM =========================================
REM DROMKOK Mobile APK Build Script
REM =========================================
REM This script automates the APK build process using Expo EAS
REM Build will be processed on Expo's cloud servers

echo.
echo ========================================
echo   DROMKOK Mobile APK Build
echo ========================================
echo.

REM Navigate to mobile directory
cd /d "%~dp0"

echo [1/5] Checking EAS CLI installation...
call eas --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo ERROR: EAS CLI is not installed!
    echo.
    echo Installing EAS CLI globally...
    call npm install -g eas-cli
    if errorlevel 1 (
        echo.
        echo ERROR: Failed to install EAS CLI
        echo Please run manually: npm install -g eas-cli
        pause
        exit /b 1
    )
    echo EAS CLI installed successfully!
) else (
    echo EAS CLI is installed.
)

echo.
echo [2/5] Checking login status...
call eas whoami >nul 2>&1
if errorlevel 1 (
    echo.
    echo You are not logged in to Expo.
    echo Please login with your Expo account.
    echo.
    call eas login
    if errorlevel 1 (
        echo.
        echo ERROR: Login failed
        pause
        exit /b 1
    )
) else (
    echo You are logged in to Expo.
)

echo.
echo [3/5] Checking project configuration...
if not exist "eas.json" (
    echo.
    echo Project not configured for EAS.
    echo Running configuration wizard...
    echo.
    call eas build:configure
    if errorlevel 1 (
        echo.
        echo ERROR: Configuration failed
        pause
        exit /b 1
    )
) else (
    echo Project is configured.
)

echo.
echo [4/5] Starting APK build...
echo.
echo Build Profile: PREVIEW (APK for testing)
echo Platform: Android
echo API URL: https://www.dromkok.com
echo.
echo This will take approximately 10-15 minutes.
echo You can close this window - build will continue on Expo servers.
echo.
pause

call eas build --platform android --profile preview
if errorlevel 1 (
    echo.
    echo ERROR: Build submission failed
    echo.
    echo Troubleshooting steps:
    echo 1. Check your internet connection
    echo 2. Verify Expo account status
    echo 3. Check build logs for errors
    echo.
    pause
    exit /b 1
)

echo.
echo [5/5] Build submitted successfully!
echo.
echo ========================================
echo   Build Status
echo ========================================
echo.
echo Your build is now processing on Expo servers.
echo.
echo To check build status:
echo   - Visit: https://expo.dev
echo   - Or run: eas build:list
echo.
echo When complete, you'll receive a download link.
echo The APK will be available in your Expo dashboard.
echo.
echo ========================================
pause
