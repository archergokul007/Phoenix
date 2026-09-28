@echo off
title Phoenix Elite Sports Academy (Flask & SQLite Server)
echo ===================================================
echo   Starting Phoenix Elite Sports Academy Server...
echo   SQLite Database: academy.db
echo ===================================================
echo.
echo Opening http://127.0.0.1:5500 in your browser...
start http://127.0.0.1:5500
echo.
echo Server running on http://127.0.0.1:5500
echo Press Ctrl+C in this window to stop the server.
echo.
python server.py --port 5500 --host 127.0.0.1
pause
