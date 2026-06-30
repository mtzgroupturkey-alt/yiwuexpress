@echo off
echo ========================================
echo TESTING SCROLL AND PAGINATION
echo ========================================
echo.
echo This will restart the mobile app with cache cleared.
echo.
echo WHAT TO TEST:
echo 1. Products show in 2-column grid
echo 2. Scroll down smoothly
echo 3. More products load at bottom
echo 4. "Loading more..." indicator appears
echo 5. Tap categories to filter
echo 6. Type to search
echo.
echo Starting mobile app...
echo.

cd /d "%~dp0"
npx expo start -c

pause
