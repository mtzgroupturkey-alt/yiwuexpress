@echo off
REM ==========================================
REM Manual Sync Helper - Yiwu Express
REM ==========================================
REM Run specific sync commands as directed
REM Usage: manual-sync.bat [component]

setlocal

set SERVER_IP=39.175.57.2
set SERVER_USER=root
set SERVER_PATH=/www/wwwroot/www.dromkok.com/web
set LOCAL_PATH=%~dp0ecommerce-monorepo\web

if "%1"=="" goto :show_help

REM ==========================================
REM Component Sync Options
REM ==========================================

if "%1"=="app" goto :sync_app
if "%1"=="components" goto :sync_components
if "%1"=="lib" goto :sync_lib
if "%1"=="public" goto :sync_public
if "%1"=="prisma" goto :sync_prisma
if "%1"=="styles" goto :sync_styles
if "%1"=="config" goto :sync_config
if "%1"=="env" goto :sync_env
if "%1"=="build" goto :sync_build
if "%1"=="single" goto :sync_single
goto :show_help

REM ==========================================
REM Sync Functions
REM ==========================================

:sync_app
echo Syncing app folder...
scp -r "%LOCAL_PATH%\app" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo Done!
goto :restart

:sync_components
echo Syncing components folder...
scp -r "%LOCAL_PATH%\components" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo Done!
goto :restart

:sync_lib
echo Syncing lib folder...
scp -r "%LOCAL_PATH%\lib" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo Done!
goto :restart

:sync_public
echo Syncing public folder...
scp -r "%LOCAL_PATH%\public" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo Done!
goto :end

:sync_prisma
echo Syncing prisma folder...
scp -r "%LOCAL_PATH%\prisma" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo Generating Prisma client on server...
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && npx prisma generate"
echo Done!
goto :end

:sync_styles
echo Syncing styles...
scp -r "%LOCAL_PATH%\styles" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp "%LOCAL_PATH%\app\globals.css" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/app/
echo Done!
goto :restart

:sync_config
echo Syncing config files...
scp "%LOCAL_PATH%\next.config.js" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp "%LOCAL_PATH%\tailwind.config.ts" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp "%LOCAL_PATH%\tsconfig.json" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
scp "%LOCAL_PATH%\postcss.config.js" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo Done!
goto :restart

:sync_env
echo Syncing environment file...
if exist "%LOCAL_PATH%\.env.production" (
    scp "%LOCAL_PATH%\.env.production" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
    echo Done!
) else (
    echo .env.production not found!
)
goto :restart

:sync_build
echo Syncing build folder (.next)...
scp -r "%LOCAL_PATH%\.next" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo Done!
goto :restart

:sync_single
if "%2"=="" (
    echo Error: Please specify file path
    echo Example: manual-sync.bat single app\page.tsx
    goto :end
)
echo Syncing single file: %2
scp "%LOCAL_PATH%\%2" %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/%2
echo Done!
goto :restart

REM ==========================================
REM Restart Application
REM ==========================================
:restart
set /p restart="Restart application? (y/n): "
if /i "%restart%"=="y" (
    echo Restarting application...
    ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && if command -v pm2 > /dev/null 2>&1; then pm2 restart all; else systemctl restart nginx; fi"
    echo Application restarted!
)
goto :end

REM ==========================================
REM Help
REM ==========================================
:show_help
echo.
echo ========================================
echo   Manual Sync Helper
echo ========================================
echo.
echo Usage: manual-sync.bat [component]
echo.
echo Components:
echo   app          - Sync app folder (pages/routes)
echo   components   - Sync components folder
echo   lib          - Sync lib folder (utilities)
echo   public       - Sync public folder (static files)
echo   prisma       - Sync prisma folder (database schema)
echo   styles       - Sync styles/CSS files
echo   config       - Sync config files (next.config.js, etc.)
echo   env          - Sync .env.production
echo   build        - Sync .next build folder
echo   single       - Sync single file
echo.
echo Examples:
echo   manual-sync.bat app
echo   manual-sync.bat components
echo   manual-sync.bat single app\page.tsx
echo.
echo For full deployment, use: sync-to-server.bat
echo.
goto :end

:end
pause
