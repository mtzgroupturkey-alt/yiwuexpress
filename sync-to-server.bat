@echo off
REM ==========================================
REM Sync Local to Server - Yiwu Express (Windows)
REM ==========================================
REM This script helps you sync your localhost to dromkok.com server
REM Usage: sync-to-server.bat [option]
REM Options: --full, --quick, --db, --env, --help

setlocal enabledelayedexpansion

REM ==========================================
REM Configuration
REM ==========================================
set SERVER_IP=39.175.57.2
set SERVER_USER=root
set SERVER_PATH=/www/wwwroot/www.dromkok.com/web
set LOCAL_PATH=%~dp0ecommerce-monorepo\web

REM Colors (using PowerShell)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "NC=[0m"

REM ==========================================
REM Parse Arguments
REM ==========================================
if "%1"=="" goto :menu
if "%1"=="--full" goto :sync_full
if "%1"=="--quick" goto :sync_quick
if "%1"=="--db" goto :sync_db
if "%1"=="--env" goto :sync_env
if "%1"=="--help" goto :show_help
echo Unknown option: %1
goto :show_help

REM ==========================================
REM Show Help
REM ==========================================
:show_help
echo.
echo YIWU EXPRESS - Sync to Server
echo ================================
echo.
echo Usage: sync-to-server.bat [option]
echo.
echo Options:
echo   --full      Full sync (build and sync all files)
echo   --quick     Quick sync (only changed files)
echo   --db        Sync database schema
echo   --env       Sync environment files
echo   --help      Show this help message
echo.
echo Interactive mode: Run without arguments
echo.
pause
exit /b 0

REM ==========================================
REM Menu
REM ==========================================
:menu
cls
echo.
echo ========================================
echo   YIWU EXPRESS - Sync to Server
echo ========================================
echo.
echo Server: %SERVER_IP%
echo Path:   %SERVER_PATH%
echo.
echo Options:
echo   1. Full sync     - Build and sync everything
echo   2. Quick sync    - Only changed files
echo   3. Database sync - Sync database schema
echo   4. Env sync      - Sync environment files
echo   5. Restart app   - Restart application only
echo   6. SSH to server - Open SSH connection
echo   7. View logs     - View server logs
echo   8. Exit
echo.
set /p choice="Select option (1-8): "

if "%choice%"=="1" goto :sync_full
if "%choice%"=="2" goto :sync_quick
if "%choice%"=="3" goto :sync_db
if "%choice%"=="4" goto :sync_env
if "%choice%"=="5" goto :restart_app
if "%choice%"=="6" goto :ssh_connect
if "%choice%"=="7" goto :view_logs
if "%choice%"=="8" goto :end
echo Invalid option
timeout /t 2 >nul
goto :menu

REM ==========================================
REM Preflight Checks
REM ==========================================
:preflight
echo.
echo [%GREEN%INFO%NC%] Running pre-flight checks...
echo.

REM Check if SSH is available
where ssh >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [%RED%ERROR%NC%] SSH not found. Please install OpenSSH or Git Bash.
    echo Download from: https://git-scm.com/downloads
    pause
    exit /b 1
)
echo [%GREEN%OK%NC%] SSH is available

REM Check if rsync is available (via Git Bash or WSL)
where rsync >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [%YELLOW%WARN%NC%] rsync not found. Will use SCP instead.
    echo For better performance, install rsync via Git Bash or WSL
    set USE_SCP=1
) else (
    echo [%GREEN%OK%NC%] rsync is available
    set USE_SCP=0
)

REM Check local path
if not exist "%LOCAL_PATH%" (
    echo [%RED%ERROR%NC%] Local path not found: %LOCAL_PATH%
    pause
    exit /b 1
)
echo [%GREEN%OK%NC%] Local path exists

REM Test SSH connection
echo [%GREEN%INFO%NC%] Testing SSH connection to %SERVER_IP%...
ssh -o ConnectTimeout=5 -o BatchMode=yes %SERVER_USER%@%SERVER_IP% "echo 'Connection successful'" 2>nul
if %ERRORLEVEL% neq 0 (
    echo.
    echo [%RED%ERROR%NC%] Cannot connect to server via SSH
    echo.
    echo Please check:
    echo   1. SSH key is configured
    echo      Run: ssh-copy-id %SERVER_USER%@%SERVER_IP%
    echo.
    echo   2. Server is accessible
    echo      Run: ping %SERVER_IP%
    echo.
    echo   3. SSH service is running on server
    echo.
    pause
    exit /b 1
)
echo [%GREEN%OK%NC%] SSH connection successful
echo.
exit /b 0

REM ==========================================
REM Full Sync
REM ==========================================
:sync_full
call :preflight
if %ERRORLEVEL% neq 0 exit /b 1

echo.
echo [%GREEN%INFO%NC%] Starting FULL sync to server...
echo.

REM Build Next.js application
echo [%GREEN%INFO%NC%] Building Next.js application...
cd /d "%LOCAL_PATH%"
call npm run build
if %ERRORLEVEL% neq 0 (
    echo [%RED%ERROR%NC%] Build failed
    pause
    exit /b 1
)
echo [%GREEN%OK%NC%] Build completed
echo.

REM Sync files
echo [%GREEN%INFO%NC%] Syncing files to server...
echo This may take a few minutes...
echo.

if "%USE_SCP%"=="1" (
    REM Use SCP (slower but more compatible)
    echo Using SCP for file transfer...
    
    REM Create directory structure on server
    ssh %SERVER_USER%@%SERVER_IP% "mkdir -p %SERVER_PATH%"
    
    REM Sync .next folder
    echo Uploading .next folder...
    scp -r "%LOCAL_PATH%\.next" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
    REM Sync public folder
    echo Uploading public folder...
    scp -r "%LOCAL_PATH%\public" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
    REM Sync app, components, lib
    echo Uploading app folder...
    scp -r "%LOCAL_PATH%\app" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
    echo Uploading components folder...
    scp -r "%LOCAL_PATH%\components" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
    echo Uploading lib folder...
    scp -r "%LOCAL_PATH%\lib" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
    REM Sync config files
    echo Uploading config files...
    scp "%LOCAL_PATH%\package.json" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    scp "%LOCAL_PATH%\package-lock.json" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    scp "%LOCAL_PATH%\next.config.js" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    scp "%LOCAL_PATH%\server.js" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
) else (
    REM Use rsync (faster)
    echo Using rsync for file transfer...
    
    rsync -avz --progress ^
        --exclude 'node_modules' ^
        --exclude '.next/cache' ^
        --exclude '.env.local' ^
        --exclude '.env.development' ^
        --exclude 'coverage' ^
        --exclude '.git' ^
        --exclude 'logs' ^
        --exclude '*.log' ^
        "%LOCAL_PATH%/" ^
        %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
)

echo.
echo [%GREEN%OK%NC%] Files synced successfully
echo.

REM Install dependencies
echo [%GREEN%INFO%NC%] Installing dependencies on server...
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && npm install --production"
echo [%GREEN%OK%NC%] Dependencies installed
echo.

REM Restart application
call :restart_app

echo.
echo ========================================
echo [%GREEN%SUCCESS%NC%] Full sync completed!
echo ========================================
echo.
pause
exit /b 0

REM ==========================================
REM Quick Sync
REM ==========================================
:sync_quick
call :preflight
if %ERRORLEVEL% neq 0 exit /b 1

echo.
echo [%GREEN%INFO%NC%] Starting QUICK sync...
echo.

REM Quick sync - only essential folders
echo Syncing essential folders...

if "%USE_SCP%"=="1" (
    echo Uploading app folder...
    scp -r "%LOCAL_PATH%\app" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
    echo Uploading components folder...
    scp -r "%LOCAL_PATH%\components" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
    
    echo Uploading lib folder...
    scp -r "%LOCAL_PATH%\lib" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/
) else (
    rsync -avz --progress "%LOCAL_PATH%\app/" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/app/
    rsync -avz --progress "%LOCAL_PATH%\components/" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/components/
    rsync -avz --progress "%LOCAL_PATH%\lib/" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/lib/
)

call :restart_app

echo.
echo ========================================
echo [%GREEN%SUCCESS%NC%] Quick sync completed!
echo ========================================
echo.
pause
exit /b 0

REM ==========================================
REM Database Sync
REM ==========================================
:sync_db
call :preflight
if %ERRORLEVEL% neq 0 exit /b 1

echo.
echo [%GREEN%INFO%NC%] Starting DATABASE sync...
echo.

cd /d "%LOCAL_PATH%"

echo Exporting database schema...
npx prisma db push --help >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [%RED%ERROR%NC%] Prisma CLI not found
    pause
    exit /b 1
)

echo Syncing database to server...
ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && npx prisma db push --accept-data-loss"

echo.
echo ========================================
echo [%GREEN%SUCCESS%NC%] Database sync completed!
echo ========================================
echo.
pause
exit /b 0

REM ==========================================
REM Environment Sync
REM ==========================================
:sync_env
call :preflight
if %ERRORLEVEL% neq 0 exit /b 1

echo.
echo [%YELLOW%WARN%NC%] This will overwrite production .env files!
echo.
set /p confirm="Are you sure? (yes/no): "
if not "%confirm%"=="yes" (
    echo Aborted
    pause
    exit /b 0
)

if exist "%LOCAL_PATH%\.env.production" (
    echo Syncing .env.production...
    scp "%LOCAL_PATH%\.env.production" %SERVER_USER%@%SERVER_IP:%SERVER_PATH%/.env.production
    echo [%GREEN%OK%NC%] .env.production synced
) else (
    echo [%YELLOW%WARN%NC%] .env.production not found
)

echo.
echo ========================================
echo [%GREEN%SUCCESS%NC%] Environment sync completed!
echo ========================================
echo.
pause
exit /b 0

REM ==========================================
REM Restart Application
REM ==========================================
:restart_app
echo.
echo [%GREEN%INFO%NC%] Restarting application on server...
echo.

ssh %SERVER_USER%@%SERVER_IP% "cd %SERVER_PATH% && if command -v pm2 > /dev/null 2>&1; then pm2 restart all; elif systemctl is-active --quiet nginx; then sudo systemctl restart nginx; else echo 'No process manager found'; fi"

echo [%GREEN%OK%NC%] Application restarted
exit /b 0

REM ==========================================
REM SSH Connect
REM ==========================================
:ssh_connect
echo.
echo [%GREEN%INFO%NC%] Opening SSH connection to %SERVER_IP%...
echo Type 'exit' to disconnect
echo.
ssh %SERVER_USER%@%SERVER_IP%
goto :menu

REM ==========================================
REM View Logs
REM ==========================================
:view_logs
echo.
echo [%GREEN%INFO%NC%] Viewing server logs...
echo Press Ctrl+C to exit
echo.
ssh %SERVER_USER%@%SERVER_IP% "tail -f /var/log/nginx/www.dromkok.com_*.log"
goto :menu

REM ==========================================
REM End
REM ==========================================
:end
echo.
echo Goodbye!
exit /b 0
