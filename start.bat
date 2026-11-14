@echo off
start "Backend" cmd /k "cd /d %~dp0backend && npm run dev"
start "Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"
timeout /t 6 >nul
start http://localhost:5173
