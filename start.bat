@echo off
title SecureGRC Launcher
cls

echo ======================================================================
echo                      SecureGRC Enterprise Platform                    
echo            Governance, Risk and Compliance Management Console         
echo ======================================================================
echo.

set ROOT_DIR=%~dp0

echo [0/3] Clearing any previous instances on ports 8000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":8000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a 2>nul
)

echo [1/3] Starting FastAPI Backend on port 8000...
start "SecureGRC-Backend-8000" cmd /k "cd /d ""%ROOT_DIR%backend"" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/3] Starting Vite Frontend on port 5173...
start "SecureGRC-Frontend-5173" cmd /k "cd /d ""%ROOT_DIR%frontend"" && npm run dev"

echo [3/3] Waiting for servers to initialize...
timeout /t 4 /nobreak >nul

echo.
echo Launching browser to http://localhost:5173/ ...
if exist "C:\Program Files\Google\Chrome\Application\chrome.exe" (
    start "" "C:\Program Files\Google\Chrome\Application\chrome.exe" "http://localhost:5173/"
) else if exist "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" (
    start "" "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" "http://localhost:5173/"
) else (
    start http://localhost:5173/
)

echo.
echo ======================================================================
echo  SecureGRC is now running!
echo.
echo  - Frontend Web UI:  http://localhost:5173/
echo  - Backend REST API: http://localhost:8000/api/v1
echo  - API Swagger Docs: http://localhost:8000/api/v1/docs
echo.
echo  Demo Credentials:
echo    * CISO Account:    ciso@cybercorp.com   / SecurePass2026!
echo    * Auditor Account: admin@securegrc.io   / AdminPass2026!
echo ======================================================================
echo.
pause
