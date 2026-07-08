@echo off
REM ============================================
REM YIWU EXPRESS - Push to Both GitHub Accounts
REM ============================================

cd /d "c:\wamp64\www\yiwuexpress"

REM Get current date and time
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c-%%a-%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a:%%b)

set timestamp=%mydate% %mytime%

REM ============================================
REM ADD AND COMMIT
REM ============================================
echo.
echo 📦 Adding changes...
git add .

echo.
echo 📝 Committing: %timestamp%
git commit -m "Daily backup: %timestamp%"

REM ============================================
REM PUSH TO BOTH REMOTES
REM ============================================
echo.
echo 🚀 Pushing to GitHub...

REM Push to origin (mtzgroupturkey-alt)
echo.
echo 📤 Pushing to origin (mtzgroupturkey-alt)...
git push origin main
if %errorlevel% neq 0 (
    echo ❌ Failed to push to origin
) else (
    echo ✅ Successfully pushed to origin
)

REM Push to backup (abbasbalkhi2010)
echo.
echo 📤 Pushing to backup (abbasbalkhi2010)...
git push backup main
if %errorlevel% neq 0 (
    echo ❌ Failed to push to backup
) else (
    echo ✅ Successfully pushed to backup
)

REM ============================================
REM LOGGING
REM ============================================
echo.
echo ============================================
if %errorlevel% == 0 (
    echo ✅ Backup completed successfully! %mydate% %mytime%
    echo %mydate% %mytime% - Backup completed successfully. >> backup_log.txt
) else (
    echo ⚠️  Backup completed with issues. Check above for details.
    echo %mydate% %mytime% - Backup completed with errors. >> backup_log.txt
)

echo.
echo 📊 Current status:
git status --short

echo.
pause
