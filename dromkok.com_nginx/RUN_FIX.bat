@echo off
REM ==========================================
REM ONE-CLICK FIX for dromkok.com
REM ==========================================

echo.
echo ================================================================
echo.
echo    dromkok.com - One-Click Fix
echo.
echo    This will fix the "Loading..." issue by updating nginx
echo    to proxy to the correct port (3001 instead of 3000)
echo.
echo ================================================================
echo.

cd /d "%~dp0"

if exist "fix_and_deploy.bat" (
    call fix_and_deploy.bat
) else (
    echo ERROR: fix_and_deploy.bat not found
    echo Please run this from the dromkok.com_nginx directory
    pause
)
