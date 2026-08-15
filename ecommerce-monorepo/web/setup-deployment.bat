@echo off
REM ============================================================================
REM YIWU EXPRESS - Deployment Setup Script for Windows
REM 
REM This script helps you prepare and commit deployment files
REM ============================================================================

echo.
echo ============================================================
echo   YIWU EXPRESS - Deployment Pipeline Setup
echo ============================================================
echo.

cd /d "%~dp0"

echo [1/4] Checking Git installation...
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Git is not installed or not in PATH
    echo Please install Git from: https://git-scm.com/download/win
    pause
    exit /b 1
)
echo     OK - Git is installed

echo.
echo [2/4] Checking files...
if not exist "deploy.sh" (
    echo ERROR: deploy.sh not found
    pause
    exit /b 1
)
if not exist "ecosystem.config.js" (
    echo ERROR: ecosystem.config.js not found
    pause
    exit /b 1
)
if not exist "webhook-server.js" (
    echo ERROR: webhook-server.js not found
    pause
    exit /b 1
)
echo     OK - All deployment files exist

echo.
echo [3/4] Files to be committed:
echo     - deploy.sh
echo     - ecosystem.config.js
echo     - webhook-server.js
echo     - prisma/migrations/backup.sh
echo     - prisma/migrations/restore.sh
echo     - .github/workflows/deploy.yml
echo     - DEPLOYMENT_GUIDE.md
echo     - TEST_DEPLOYMENT.md
echo     - .env.example
echo     - .gitignore

echo.
echo [4/4] Ready to commit to Git
echo.
set /p CONTINUE="Do you want to commit these files? (yes/no): "
if /i not "%CONTINUE%"=="yes" (
    echo Cancelled by user
    pause
    exit /b 0
)

echo.
echo Adding files to Git...
git add deploy.sh
git add ecosystem.config.js
git add webhook-server.js
git add prisma/migrations/backup.sh
git add prisma/migrations/restore.sh
git add .github/workflows/deploy.yml
git add DEPLOYMENT_GUIDE.md
git add TEST_DEPLOYMENT.md
git add .env.example
git add .gitignore

echo.
echo Committing files...
git commit -m "Add automated deployment pipeline with database backup and rollback"

if %errorlevel% neq 0 (
    echo ERROR: Git commit failed
    echo Maybe files are already committed?
    pause
    exit /b 1
)

echo.
echo ============================================================
echo   Deployment files committed successfully!
echo ============================================================
echo.
echo Next steps:
echo.
echo 1. Push to GitHub:
echo    git push origin main
echo.
echo 2. Set up production server (see DEPLOYMENT_GUIDE.md)
echo.
echo 3. Test deployment:
echo    - SSH to server
echo    - Run: bash deploy.sh
echo.
echo 4. Configure GitHub Actions:
echo    - Add SSH_PRIVATE_KEY secret
echo    - Add SERVER_HOST secret
echo    - Add SSH_USER secret
echo.
echo 5. Test automated deployment:
echo    - Make a small change
echo    - Push to main branch
echo    - Watch GitHub Actions tab
echo.
echo ============================================================
echo   Read DEPLOYMENT_GUIDE.md for complete instructions
echo ============================================================
echo.

pause
