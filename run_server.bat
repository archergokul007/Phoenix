@echo off
title Phoenix Archery Academy - Server
color 0A
cls

echo.
echo  ============================================================
echo    PHOENIX ELITE SPORTS ACADEMY
echo    Starting Flask + MySQL Server...
echo  ============================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Python not found. Please install Python 3.8+
    pause
    exit /b 1
)

if not exist ".env" (
    echo  [WARNING] .env file not found!
    if exist ".env.example" (
        copy ".env.example" ".env" >nul
        echo  [WARNING] Copied .env.example to .env
        echo  [WARNING] Edit .env with your MySQL credentials then re-run.
    )
    pause
    exit /b 1
)

echo  [*] Installing / checking dependencies...
pip install flask mysql-connector-python python-dotenv werkzeug --quiet --disable-pip-version-check

echo  [*] Starting server...
echo  [*] Web App  : http://127.0.0.1:5500
echo  [*] API      : http://127.0.0.1:5500/api/health
echo.

start "" "http://127.0.0.1:5500"

python server.py --port 5500 --host 127.0.0.1

echo.
echo  [*] Server stopped.
pause
