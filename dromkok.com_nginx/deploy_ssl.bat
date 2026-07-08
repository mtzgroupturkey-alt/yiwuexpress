@echo off
REM ==========================================
REM SSL Deployment Helper Script for Windows
REM ==========================================
REM This script helps copy SSL certificates to Ubuntu server
REM Prerequisites: PuTTY or OpenSSH installed, or use WinSCP

echo.
echo ==========================================
echo SSL Deployment Helper - www.dromkok.com
echo ==========================================
echo.

set SERVER_IP=39.175.57.2
set CERT_DIR=c:\wamp64\www\yiwuexpress\dromkok.com_nginx\dromkok.com_nginx
set REMOTE_PATH=/etc/nginx/ssl/dromkok.com

echo Configuration:
echo  Server IP: %SERVER_IP%
echo  Local Cert Directory: %CERT_DIR%
echo  Remote Path: %REMOTE_PATH%
echo.

REM Check if certificate files exist
echo Checking certificate files...
if not exist "%CERT_DIR%\dromkok.com_bundle.crt" (
    echo Error: dromkok.com_bundle.crt not found!
    pause
    exit /b 1
)
if not exist "%CERT_DIR%\dromkok.com.key" (
    echo Error: dromkok.com.key not found!
    pause
    exit /b 1
)

echo ^✅ Certificate files found
echo.

REM Copy files using SSH/SCP
echo Choose deployment method:
echo.
echo 1. Use SCP (if OpenSSH is installed)
echo 2. Use WinSCP GUI
echo 3. Show SCP command (copy-paste to terminal)
echo 4. Show SFTP instructions (manual upload)
echo.

choice /C 1234 /N /M "Select option (1-4): "

if "%ERRORLEVEL%"=="1" (
    echo.
    echo Attempting to deploy using SCP...
    echo.
    echo Run this command from PowerShell or Command Prompt:
    echo.
    echo scp -r "%CERT_DIR%\*" root@%SERVER_IP%:%REMOTE_PATH%/
    echo.
    powershell -Command "Write-Host 'Attempting SCP...'; scp -r '%CERT_DIR%\*' root@%SERVER_IP%:%REMOTE_PATH%/ 2>&1"
    if %ERRORLEVEL% equ 0 (
        echo Success!
    ) else (
        echo SCP failed. Please ensure OpenSSH is installed and SSH access is configured.
    )
)

if "%ERRORLEVEL%"=="2" (
    echo.
    echo Instructions for WinSCP:
    echo.
    echo 1. Open WinSCP
    echo 2. Create new site:
    echo    - Host: %SERVER_IP%
    echo    - Username: root
    echo    - Password: [your SSH password]
    echo 3. Connect
    echo 4. Navigate to: %REMOTE_PATH%
    echo 5. Drag and drop files from: %CERT_DIR%
    echo 6. Close connection
    echo.
    echo Files to upload:
    echo   - dromkok.com_bundle.crt
    echo   - dromkok.com.key
    echo   - dromkok.com_bundle.pem
    echo.
    echo Download WinSCP if needed: https://winscp.net/
    pause
)

if "%ERRORLEVEL%"=="3" (
    echo.
    echo Copy and run this command in PowerShell or Command Prompt:
    echo.
    echo scp -r "%CERT_DIR%\*" root@%SERVER_IP%:%REMOTE_PATH%/
    echo.
    echo Then SSH into your server:
    echo ssh root@%SERVER_IP%
    echo.
    echo And run the deployment script:
    echo bash /root/deploy_ssl.sh
    echo.
    pause
)

if "%ERRORLEVEL%"=="4" (
    echo.
    echo Manual SFTP Upload Instructions:
    echo.
    echo 1. Download and install WinSCP or FileZilla
    echo.
    echo 2. Connect to: %SERVER_IP%
    echo    - Protocol: SFTP
    echo    - Port: 22
    echo    - Username: root
    echo    - Password: [your SSH password]
    echo.
    echo 3. On remote server, create directory:
    echo    mkdir -p %REMOTE_PATH%
    echo.
    echo 4. Upload these files from:
    echo    %CERT_DIR%
    echo.
    echo    To (remote):
    echo    %REMOTE_PATH%/
    echo.
    echo 5. Files to upload:
    echo    - dromkok.com_bundle.crt
    echo    - dromkok.com.key
    echo    - dromkok.com_bundle.pem
    echo.
    echo 6. After upload, SSH to server and run:
    echo    bash /root/deploy_ssl.sh
    echo.
    pause
)

echo.
echo ==========================================
echo Next Steps on Ubuntu Server:
echo ==========================================
echo.
echo 1. SSH into your server:
echo    ssh root@%SERVER_IP%
echo.
echo 2. Upload the deploy script:
echo    scp "%~dp0deploy_ssl.sh" root@%SERVER_IP%:/root/
echo.
echo 3. Run the deployment script:
echo    bash /root/deploy_ssl.sh
echo.
echo 4. Upload nginx configuration:
echo    scp "%~dp0nginx_ssl_config.conf" root@%SERVER_IP%:/etc/nginx/sites-available/dromkok.com
echo.
echo 5. Enable the site:
echo    ssh root@%SERVER_IP% "ln -sf /etc/nginx/sites-available/dromkok.com /etc/nginx/sites-enabled/; systemctl reload nginx"
echo.
echo 6. Verify deployment:
echo    Check: https://www.dromkok.com
echo.
echo For detailed instructions, see: SSL_DEPLOYMENT_GUIDE.md
echo.
pause
