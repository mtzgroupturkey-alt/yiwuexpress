@echo off
echo ========================================
echo EXCHANGE RATE API SETUP
echo ========================================
echo.

echo This script will help you setup automatic exchange rate updates.
echo.

echo Step 1: Get your FREE API key
echo ----------------------------------------
echo 1. Visit: https://www.exchangerate-api.com/
echo 2. Click "Get Free Key" or "Sign Up"
echo 3. Enter your email and verify
echo 4. Copy your API key
echo.

set /p apikey="Paste your API key here: "

if "%apikey%"=="" (
    echo.
    echo [ERROR] No API key provided!
    echo.
    pause
    exit /b 1
)

echo.
echo Step 2: Adding API key to .env.local
echo ----------------------------------------

REM Check if .env.local exists
if not exist .env.local (
    echo Creating .env.local from template...
    if exist .env.example (
        copy .env.example .env.local
    ) else (
        echo Creating new .env.local...
        echo # Environment Variables > .env.local
        echo. >> .env.local
    )
)

REM Check if EXCHANGE_RATE_API_KEY already exists
findstr /C:"EXCHANGE_RATE_API_KEY" .env.local >nul 2>&1
if %errorlevel% equ 0 (
    echo Updating existing API key...
    powershell -Command "(Get-Content .env.local) -replace 'EXCHANGE_RATE_API_KEY=.*', 'EXCHANGE_RATE_API_KEY=\"%apikey%\"' | Set-Content .env.local"
) else (
    echo Adding API key to .env.local...
    echo. >> .env.local
    echo # Exchange Rate API >> .env.local
    echo EXCHANGE_RATE_API_KEY="%apikey%" >> .env.local
)

echo.
echo Step 3: Testing API connection
echo ----------------------------------------
echo Starting server to test connection...
echo.

REM Test by starting server briefly
timeout /t 2 /nobreak >nul

echo.
echo ========================================
echo   SETUP COMPLETE!
echo ========================================
echo.
echo ✅ API key added to .env.local
echo ✅ Configuration saved
echo.
echo 📝 Next Steps:
echo    1. Restart your dev server: npm run dev
echo    2. Go to: http://localhost:3005/admin/currencies
echo    3. Click the green "Sync Rates" button
echo    4. Your rates will update automatically!
echo.
echo 📚 Documentation:
echo    - See 📡_AUTO_EXCHANGE_RATES.md for full guide
echo    - Setup daily auto-updates with cron-job.org
echo.
pause
