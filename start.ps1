# start.ps1 — One-command launcher for Phoenix Elite Sports Academy
# Usage (from project folder):  .\start.ps1
# Or from anywhere:             powershell -ExecutionPolicy Bypass -File "d:\archeryacademymanagement\start.ps1"

$Host.UI.RawUI.WindowTitle = "Phoenix Elite Sports Academy"
$projectDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $projectDir

Write-Host ""
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host "    PHOENIX ELITE SPORTS ACADEMY" -ForegroundColor Yellow
Write-Host "    Starting Server (Backend + Frontend)..." -ForegroundColor White
Write-Host "  ============================================================" -ForegroundColor Cyan
Write-Host ""

# Check Python
if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "  [ERROR] Python not found. Install Python 3.8+ and try again." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check .env
if (-not (Test-Path ".env")) {
    Write-Host "  [WARNING] .env file missing. Copying from .env.example..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host "  [ACTION]  Edit .env with your MySQL credentials, then re-run." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Install / verify dependencies
Write-Host "  [*] Checking dependencies..." -ForegroundColor Gray
pip install flask mysql-connector-python python-dotenv --quiet --disable-pip-version-check
Write-Host "  [*] Dependencies OK" -ForegroundColor Green
Write-Host ""
Write-Host "  [*] Web App  : http://127.0.0.1:5500" -ForegroundColor Green
Write-Host "  [*] REST API : http://127.0.0.1:5500/api/health" -ForegroundColor Green
Write-Host "  [*] Press Ctrl+C to stop the server." -ForegroundColor Gray
Write-Host ""

# Open browser after short delay
Start-Job -ScriptBlock {
    Start-Sleep -Seconds 2
    Start-Process "http://127.0.0.1:5500"
} | Out-Null

# Start the server — Flask serves BOTH frontend HTML/CSS/JS + backend REST API
python server.py --port 5500 --host 127.0.0.1
