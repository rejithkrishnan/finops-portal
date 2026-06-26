@echo off
SETLOCAL EnableDelayedExpansion
title FinOps Portal Management Console

:: Handle command-line arguments if provided
if "%~1" neq "" (
    set "ACTION=%~1"
    if /I "!ACTION!"=="start" goto :start_services
    if /I "!ACTION!"=="stop" goto :stop_services
    if /I "!ACTION!"=="restart" goto :restart_services
    if /I "!ACTION!"=="status" goto :monitor_services
    if /I "!ACTION!"=="monitor" goto :monitor_services
    if /I "!ACTION!"=="db-start" goto :db_start
    if /I "!ACTION!"=="db-stop" goto :db_stop
    echo [ERROR] Unknown argument: !ACTION!
    echo Usage: %~0 [start | stop | restart | status | db-start | db-stop]
    exit /b 1
)

:menu
cls
echo ===================================================
echo 🔱 FinOps Portal Management Console
echo ===================================================
echo  1. Start All Services (DB, Backend, Frontend)
echo  2. Stop All Services
echo  3. Restart All Services
echo  4. Monitor / Check Status
echo  5. Start Database Only
echo  6. Stop Database Only
echo  7. Database Logs
echo  8. Exit
echo ===================================================
set /p "choice=Enter choice (1-8): "

if "%choice%"=="1" goto :start_services
if "%choice%"=="2" goto :stop_services
if "%choice%"=="3" goto :restart_services
if "%choice%"=="4" goto :monitor_services
if "%choice%"=="5" goto :db_start
if "%choice%"=="6" goto :db_stop
if "%choice%"=="7" goto :db_logs
if "%choice%"=="8" exit /b 0
goto :menu

:start_services
echo.
echo ===================================================
echo 🚀 Launching FinOps Portal Services
echo ===================================================
call :start_services_core
if %errorlevel% neq 0 (
    pause
    goto :menu
)
echo.
echo ===================================================
echo [SUCCESS] All services initiated!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:3001
echo ===================================================
pause
goto :menu

:stop_services
echo.
echo ===================================================
echo 🛑 Stopping All FinOps Portal Services
echo ===================================================
call :stop_services_core
echo.
echo ===================================================
echo [SUCCESS] All services successfully stopped!
echo ===================================================
pause
goto :menu

:restart_services
echo.
echo ===================================================
echo 🔄 Restarting All FinOps Portal Services
echo ===================================================
call :stop_services_core
echo.
echo Waiting 2 seconds before starting up...
timeout /t 2 /nobreak >nul
echo.
call :start_services_core
if %errorlevel% neq 0 (
    pause
    goto :menu
)
echo.
echo ===================================================
echo [SUCCESS] All services restarted!
echo  - Frontend: http://localhost:5173
echo  - Backend:  http://localhost:3001
echo ===================================================
pause
goto :menu

:start_services_core
:: Check docker info
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    exit /b 1
)

echo [1/3] Starting database container...
cd db
docker compose up -d
cd ..
if %errorlevel% neq 0 (
    echo [ERROR] Failed to start database container.
    exit /b 1
)

echo Waiting 5 seconds for database to initialize...
timeout /t 5 /nobreak >nul

echo [2/3] Starting backend server in a new window...
cd backend
if not exist node_modules (
    echo [INFO] node_modules not found in backend. Installing dependencies...
    call npm install
)
call npm run db:generate
start "FinOps Backend Server" cmd /k "npm run dev"
cd ..

echo [3/3] Starting frontend server in a new window...
cd frontend
if not exist node_modules (
    echo [INFO] node_modules not found in frontend. Installing dependencies...
    call npm install
)
start "FinOps Frontend Web" cmd /k "npm run dev"
cd ..
exit /b 0

:stop_services_core
echo [1/3] Closing Frontend Web Server...
taskkill /F /FI "WINDOWTITLE eq FinOps Frontend Web" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq select FinOps Frontend Web" /T >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo [2/3] Closing Backend API Server...
taskkill /F /FI "WINDOWTITLE eq FinOps Backend Server" /T >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq select FinOps Backend Server" /T >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001" ^| findstr "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo [3/3] Stopping Database Container...
cd db
docker compose down
cd ..
exit /b 0

:monitor_services
echo.
echo ===================================================
echo 🔍 Service Monitoring & Status Check
echo ===================================================

:: 1. Database Check
set "DB_STATUS=[ STOPPED ]"
docker ps --filter "name=finops-postgres" --filter "status=running" | findstr "finops-postgres" >nul 2>&1
if %errorlevel% equ 0 (
    set "DB_STATUS=[ RUNNING (Port 54332) ]"
)

:: 2. Backend Check
set "BE_STATUS=[ OFFLINE ]"
netstat -ano | findstr "LISTENING" | findstr ":3001" >nul 2>&1
if %errorlevel% equ 0 (
    set "BE_STATUS=[ ONLINE (Port 3001) ]"
)

:: 3. Frontend Check
set "FE_STATUS=[ OFFLINE ]"
netstat -ano | findstr "LISTENING" | findstr ":5173" >nul 2>&1
if %errorlevel% equ 0 (
    set "FE_STATUS=[ ONLINE (Port 5173) ]"
)

echo.
echo  - Database Status: !DB_STATUS!
echo  - Backend Status:  !BE_STATUS!
echo  - Frontend Status: !FE_STATUS!
echo.
echo ===================================================
pause
goto :menu

:db_start
echo.
echo ===================================================
echo 🐘 Starting FinOps Portal PostgreSQL Database...
echo ===================================================
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    goto :menu
)
cd db
docker compose up -d
cd ..
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Database container started successfully on port 54332.
) else (
    echo.
    echo [ERROR] Failed to start database container.
)
pause
goto :menu

:db_stop
echo.
echo ===================================================
echo 🐘 Stopping FinOps Portal PostgreSQL Database...
echo ===================================================
cd db
docker compose down
cd ..
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Database container stopped successfully.
) else (
    echo.
    echo [ERROR] Failed to stop database container.
)
pause
goto :menu

:db_logs
echo.
echo ===================================================
echo 📋 PostgreSQL Container Logs
echo ===================================================
cd db
docker compose logs --tail=50
cd ..
pause
goto :menu
