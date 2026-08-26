Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "                     SecureGRC Enterprise Platform                    " -ForegroundColor Cyan
Write-Host "           Governance, Risk and Compliance Management Console         " -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

$rootDir = $PSScriptRoot

Write-Host "[1/3] Starting FastAPI Backend on port 8000..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$rootDir\backend`" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

Write-Host "[2/3] Starting Vite Frontend on port 5173..." -ForegroundColor Yellow
Start-Process cmd -ArgumentList "/k", "cd /d `"$rootDir\frontend`" && npm run dev"

Write-Host "[3/3] Waiting for servers to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host "Launching web browser to http://localhost:5173/ ..." -ForegroundColor Green
Start-Process "http://localhost:5173/"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host " SecureGRC is now running!" -ForegroundColor Green
Write-Host ""
Write-Host " - Frontend Web UI:  http://localhost:5173/"
Write-Host " - Backend REST API: http://localhost:8000/api/v1"
Write-Host " - API Swagger Docs: http://localhost:8000/api/v1/docs"
Write-Host ""
Write-Host " Demo Credentials:"
Write-Host "   * CISO Account:    ciso@cybercorp.com   / SecurePass2026!"
Write-Host "   * Auditor Account: admin@securegrc.io   / AdminPass2026!"
Write-Host "======================================================================" -ForegroundColor Green
