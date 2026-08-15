@echo off
REM ==========================================
REM Quick SSH Connection to Server
REM ==========================================
REM Usage: Double-click or run: connect-server.bat

set SERVER_IP=39.175.57.2
set SERVER_USER=root

echo.
echo ========================================
echo   SSH Connection to dromkok.com
echo ========================================
echo.
echo Server: %SERVER_IP%
echo User:   %SERVER_USER%
echo.
echo Type 'exit' to disconnect.
echo.

ssh %SERVER_USER%@%SERVER_IP%
