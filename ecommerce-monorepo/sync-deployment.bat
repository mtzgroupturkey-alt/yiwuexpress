@echo off
REM sync-deployment.bat - Sync deployment files to Git

echo =====================================
echo Syncing Deployment Pipeline Files
echo =====================================
echo.

echo [1/3] Adding files to Git...
git add web/deploy.sh
git add web/ecosystem.config.js
git add web/prisma/migrations/backup.sh
git add web/scripts/rollback.sh
git add web/test-deployment.sh
git add web/DEPLOYMENT_SETUP.md
git add web/QUICK_REFERENCE.md
git add .github/workflows/deploy.yml
git add webhook-config.json

echo.
echo [2/3] Committing changes...
git commit -m "Add automated deployment pipeline"

echo.
echo [3/3] Pushing to GitHub...
git push origin main

echo.
echo =====================================
echo SUCCESS! Files synced to GitHub
echo =====================================
echo.
echo Next: SSH to server and run:
echo   cd /www/wwwroot/www.dromkok.com/web
echo   git pull
echo   chmod +x deploy.sh prisma/migrations/backup.sh scripts/rollback.sh
echo.
pause
