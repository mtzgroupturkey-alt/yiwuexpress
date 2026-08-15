@echo off
setlocal enabledelayedexpansion
cd /d C:\wamp64\www\yiwuexpress\ecommerce-monorepo

echo [%date% %time%] Starting upload... >> upload.log

git add -A
git diff --cached --quiet
if %errorlevel%==0 (
    echo No changes to upload. >> upload.log
) else (
    git commit -m "Daily auto-upload %date% %time%" >> upload.log 2>&1
    git push origin main >> upload.log 2>&1
    echo Upload complete. >> upload.log
)

echo Done.
endlocal
